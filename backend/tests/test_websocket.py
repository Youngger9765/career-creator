"""
Test WebSocket endpoints
測試 WebSocket 端點
"""
import json
from uuid import uuid4
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models.room import Room
from app.models.card_event import CardEventType


class TestWebSocketConnection:
    """Test WebSocket connection and messaging"""
    
    def test_websocket_connect_to_valid_room(self, client: TestClient, test_room: Room):
        """Test connecting to a valid room via WebSocket"""
        room_id = str(test_room.id)
        
        with client.websocket_connect(f"/ws/room/{room_id}?user_name=TestUser") as websocket:
            # Should receive welcome message
            data = websocket.receive_json()
            assert data["type"] == "connected"
            assert data["data"]["room_id"] == room_id
            assert data["data"]["room_name"] == test_room.name
    
    def test_websocket_connect_to_invalid_room(self, client: TestClient):
        """Test connecting to non-existent room"""
        fake_room_id = str(uuid4())
        
        with client.websocket_connect(f"/ws/room/{fake_room_id}") as websocket:
            # Should be disconnected with error
            websocket.close()
    
    def test_websocket_heartbeat(self, client: TestClient, test_room: Room):
        """Test WebSocket heartbeat/ping mechanism"""
        room_id = str(test_room.id)
        
        with client.websocket_connect(f"/ws/room/{room_id}") as websocket:
            # Receive welcome message
            websocket.receive_json()
            
            # Send heartbeat
            websocket.send_json({
                "type": "heartbeat",
                "data": {}
            })
            
            # Should receive heartbeat acknowledgment
            response = websocket.receive_json()
            assert response["type"] == "heartbeat_ack"
            assert "timestamp" in response["data"]
    
    def test_websocket_card_event_message(self, client: TestClient, test_room: Room):
        """Test sending card event through WebSocket"""
        room_id = str(test_room.id)
        
        with client.websocket_connect(f"/ws/room/{room_id}?user_id=test123&user_name=TestUser") as websocket:
            # Receive welcome message
            websocket.receive_json()
            
            # Send card event
            websocket.send_json({
                "type": "card_event",
                "data": {
                    "event_type": CardEventType.CARD_FLIPPED.value,
                    "card_id": "card-1",
                    "event_data": {"test": True}
                }
            })
            
            # Should receive broadcast of created event
            response = websocket.receive_json()
            assert response["type"] == "card_event_created"
            assert response["data"]["event_type"] == CardEventType.CARD_FLIPPED.value
            assert response["data"]["card_id"] == "card-1"
    
    def test_websocket_invalid_message_format(self, client: TestClient, test_room: Room):
        """Test sending invalid message format"""
        room_id = str(test_room.id)
        
        with client.websocket_connect(f"/ws/room/{room_id}") as websocket:
            # Receive welcome message
            websocket.receive_json()
            
            # Send invalid JSON
            websocket.send_text("invalid json")
            
            # Should receive error message
            response = websocket.receive_json()
            assert response["type"] == "error"
            assert "Invalid JSON" in response["data"]["message"]
    
    def test_websocket_unknown_message_type(self, client: TestClient, test_room: Room):
        """Test sending unknown message type"""
        room_id = str(test_room.id)
        
        with client.websocket_connect(f"/ws/room/{room_id}") as websocket:
            # Receive welcome message
            websocket.receive_json()
            
            # Send unknown message type
            websocket.send_json({
                "type": "unknown_type",
                "data": {}
            })
            
            # Should receive error message
            response = websocket.receive_json()
            assert response["type"] == "error"
            assert "Unknown message type" in response["data"]["message"]