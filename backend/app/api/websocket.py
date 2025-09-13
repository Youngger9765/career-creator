"""
WebSocket endpoints for real-time communication
WebSocket 端點 - 即時通訊支援
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from fastapi.websockets import WebSocketState
from sqlmodel import Session
from uuid import UUID
from typing import Dict, List, Optional, Any
import json
import asyncio
from datetime import datetime

from app.core.database import get_session
from app.models.room import Room
from app.models.card_event import CardEvent, CardEventType

router = APIRouter()


# Connection manager for WebSocket connections
class ConnectionManager:
    def __init__(self):
        # room_id -> list of websocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # websocket -> connection info
        self.connection_info: Dict[WebSocket, Dict[str, Any]] = {}
    
    async def connect(self, websocket: WebSocket, room_id: str, user_info: Dict[str, Any]):
        """Connect user to room"""
        await websocket.accept()
        
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        
        self.active_connections[room_id].append(websocket)
        self.connection_info[websocket] = {
            "room_id": room_id,
            "user_id": user_info.get("user_id"),
            "user_name": user_info.get("user_name"),
            "user_type": user_info.get("user_type", "user"),
            "connected_at": datetime.utcnow()
        }
        
        # Notify others in room about new connection
        await self.broadcast_to_room(room_id, {
            "type": "user_joined",
            "data": {
                "user_name": user_info.get("user_name"),
                "user_type": user_info.get("user_type", "user"),
                "connected_at": datetime.utcnow().isoformat()
            }
        }, exclude=websocket)
    
    def disconnect(self, websocket: WebSocket):
        """Disconnect user from room"""
        if websocket in self.connection_info:
            info = self.connection_info[websocket]
            room_id = info["room_id"]
            
            # Remove from active connections
            if room_id in self.active_connections:
                if websocket in self.active_connections[room_id]:
                    self.active_connections[room_id].remove(websocket)
                
                # Clean up empty rooms
                if not self.active_connections[room_id]:
                    del self.active_connections[room_id]
            
            # Notify others about disconnection
            asyncio.create_task(self.broadcast_to_room(room_id, {
                "type": "user_left",
                "data": {
                    "user_name": info.get("user_name"),
                    "user_type": info.get("user_type"),
                    "disconnected_at": datetime.utcnow().isoformat()
                }
            }))
            
            # Clean up connection info
            del self.connection_info[websocket]
    
    async def send_personal_message(self, message: Dict[str, Any], websocket: WebSocket):
        """Send message to specific websocket"""
        if websocket.client_state == WebSocketState.CONNECTED:
            await websocket.send_text(json.dumps(message))
    
    async def broadcast_to_room(self, room_id: str, message: Dict[str, Any], exclude: Optional[WebSocket] = None):
        """Broadcast message to all connections in room"""
        if room_id in self.active_connections:
            dead_connections = []
            
            for connection in self.active_connections[room_id]:
                if connection == exclude:
                    continue
                    
                try:
                    if connection.client_state == WebSocketState.CONNECTED:
                        await connection.send_text(json.dumps(message))
                    else:
                        dead_connections.append(connection)
                except:
                    dead_connections.append(connection)
            
            # Clean up dead connections
            for dead_conn in dead_connections:
                self.disconnect(dead_conn)
    
    def get_room_connections(self, room_id: str) -> List[Dict[str, Any]]:
        """Get info about all connections in a room"""
        if room_id not in self.active_connections:
            return []
        
        connections = []
        for ws in self.active_connections[room_id]:
            if ws in self.connection_info:
                info = self.connection_info[ws]
                connections.append({
                    "user_id": info.get("user_id"),
                    "user_name": info.get("user_name"),
                    "user_type": info.get("user_type"),
                    "connected_at": info.get("connected_at").isoformat() if info.get("connected_at") else None
                })
        return connections


# Global connection manager instance
manager = ConnectionManager()


@router.websocket("/ws/room/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_id: UUID,
    user_id: Optional[str] = None,
    user_name: Optional[str] = None,
    user_type: str = "user",
    session: Session = Depends(get_session)
):
    """WebSocket endpoint for room real-time communication"""
    
    # Verify room exists
    room = session.get(Room, room_id)
    if not room or not room.is_active:
        await websocket.close(code=4004, reason="Room not found or inactive")
        return
    
    room_id_str = str(room_id)
    user_info = {
        "user_id": user_id,
        "user_name": user_name or f"Anonymous User",
        "user_type": user_type
    }
    
    try:
        # Connect to room
        await manager.connect(websocket, room_id_str, user_info)
        
        # Send welcome message with room info
        await manager.send_personal_message({
            "type": "connected",
            "data": {
                "room_id": room_id_str,
                "room_name": room.name,
                "connected_users": manager.get_room_connections(room_id_str),
                "message": f"Welcome to {room.name}!"
            }
        }, websocket)
        
        # Listen for messages
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle different message types
                await handle_websocket_message(message, websocket, room_id_str, session)
                
            except json.JSONDecodeError:
                await manager.send_personal_message({
                    "type": "error",
                    "data": {"message": "Invalid JSON format"}
                }, websocket)
            
    except WebSocketDisconnect:
        pass  # Normal disconnection
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        manager.disconnect(websocket)


async def handle_websocket_message(
    message: Dict[str, Any], 
    websocket: WebSocket, 
    room_id: str, 
    session: Session
):
    """Handle different types of WebSocket messages"""
    
    message_type = message.get("type")
    data = message.get("data", {})
    
    if message_type == "card_event":
        # Handle card event and broadcast to room
        await handle_card_event_message(data, websocket, room_id, session)
    
    elif message_type == "chat_message":
        # Handle chat message
        await handle_chat_message(data, websocket, room_id)
    
    elif message_type == "user_action":
        # Handle general user actions (cursor movement, selections, etc.)
        await handle_user_action_message(data, websocket, room_id)
    
    elif message_type == "heartbeat":
        # Handle heartbeat/ping
        await manager.send_personal_message({
            "type": "heartbeat_ack",
            "data": {"timestamp": datetime.utcnow().isoformat()}
        }, websocket)
    
    else:
        await manager.send_personal_message({
            "type": "error",
            "data": {"message": f"Unknown message type: {message_type}"}
        }, websocket)


async def handle_card_event_message(
    data: Dict[str, Any],
    websocket: WebSocket,
    room_id: str,
    session: Session
):
    """Handle card event and broadcast to room"""
    
    try:
        # Get user info from connection
        user_info = manager.connection_info.get(websocket, {})
        
        # Create card event in database
        card_event = CardEvent(
            room_id=UUID(room_id),
            event_type=CardEventType(data.get("event_type")),
            card_id=data.get("card_id"),
            event_data=data.get("event_data"),
            notes=data.get("notes"),
            performer_id=user_info.get("user_id"),
            performer_type=user_info.get("user_type", "user"),
            performer_name=user_info.get("user_name"),
            sequence_number=0  # Will be set by API logic
        )
        
        # Get next sequence number
        from sqlmodel import select, desc
        last_event = session.exec(
            select(CardEvent)
            .where(CardEvent.room_id == UUID(room_id))
            .order_by(desc(CardEvent.sequence_number))
        ).first()
        
        card_event.sequence_number = (last_event.sequence_number + 1) if last_event else 1
        
        session.add(card_event)
        session.commit()
        session.refresh(card_event)
        
        # Broadcast card event to all room members
        await manager.broadcast_to_room(room_id, {
            "type": "card_event_created",
            "data": {
                "id": str(card_event.id),
                "event_type": card_event.event_type,
                "card_id": card_event.card_id,
                "event_data": card_event.event_data,
                "notes": card_event.notes,
                "performer_id": card_event.performer_id,
                "performer_name": card_event.performer_name,
                "performer_type": card_event.performer_type,
                "created_at": card_event.created_at.isoformat(),
                "sequence_number": card_event.sequence_number
            }
        })
        
    except Exception as e:
        await manager.send_personal_message({
            "type": "error",
            "data": {"message": f"Failed to create card event: {str(e)}"}
        }, websocket)


async def handle_chat_message(
    data: Dict[str, Any],
    websocket: WebSocket,
    room_id: str
):
    """Handle chat message"""
    
    user_info = manager.connection_info.get(websocket, {})
    
    # Broadcast chat message to room
    await manager.broadcast_to_room(room_id, {
        "type": "chat_message",
        "data": {
            "message": data.get("message"),
            "user_name": user_info.get("user_name"),
            "user_type": user_info.get("user_type"),
            "timestamp": datetime.utcnow().isoformat()
        }
    })


async def handle_user_action_message(
    data: Dict[str, Any],
    websocket: WebSocket,
    room_id: str
):
    """Handle user action (cursor, selection, etc.)"""
    
    user_info = manager.connection_info.get(websocket, {})
    
    # Broadcast user action to room (excluding sender)
    await manager.broadcast_to_room(room_id, {
        "type": "user_action",
        "data": {
            **data,
            "user_name": user_info.get("user_name"),
            "user_id": user_info.get("user_id"),
            "timestamp": datetime.utcnow().isoformat()
        }
    }, exclude=websocket)


@router.get("/api/rooms/{room_id}/active-users")
def get_active_users(room_id: UUID):
    """Get list of currently active users in room"""
    room_id_str = str(room_id)
    return {
        "room_id": room_id_str,
        "active_users": manager.get_room_connections(room_id_str)
    }