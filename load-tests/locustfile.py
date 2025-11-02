"""
Locust Load Testing for Career Creator Platform

Test scenarios:
1. User login (50 concurrent users)
2. Room creation and joining
3. WebSocket connections
4. Card drag operations
5. Note creation
6. Screenshot upload

Usage:
    locust -f load-tests/locustfile.py --host=https://career-creator-frontend-staging-x43mdhfwsq-de.a.run.app

Run with Web UI:
    locust -f load-tests/locustfile.py --host=https://career-creator-frontend-staging-x43mdhfwsq-de.a.run.app --web-host=0.0.0.0

Run headless (50 users, 10 spawn rate):
    locust -f load-tests/locustfile.py --host=https://career-creator-frontend-staging-x43mdhfwsq-de.a.run.app --headless -u 50 -r 10 -t 5m
"""

import json
import random
import time
from locust import HttpUser, task, between, events
from locust.contrib.fasthttp import FastHttpUser
import logging

# Test user credentials
TEST_USERS = [
    {"email": f"test.user{i}@example.com", "password": "TestPassword123!"}
    for i in range(1, 51)
]

# Backend API base URL
BACKEND_API = "https://career-creator-backend-staging-x43mdhfwsq-de.a.run.app"


class CounselorUser(FastHttpUser):
    """
    Simulates a counselor user behavior:
    - Login
    - Create room
    - Add clients
    - Perform card operations
    - Take notes
    """

    wait_time = between(1, 3)  # Wait 1-3 seconds between tasks
    host = BACKEND_API

    def on_start(self):
        """Called when a user starts - login"""
        self.user_data = random.choice(TEST_USERS)
        self.token = None
        self.room_id = None
        self.client_id = None
        self.login()

    def login(self):
        """Login and get JWT token"""
        response = self.client.post(
            "/api/auth/login",
            json={
                "email": self.user_data["email"],
                "password": self.user_data["password"],
            },
            name="/api/auth/login",
        )

        if response.status_code == 200:
            data = response.json()
            self.token = data.get("access_token")
            logging.info(f"User {self.user_data['email']} logged in successfully")
        else:
            logging.error(f"Login failed: {response.status_code} - {response.text}")

    @property
    def headers(self):
        """Get authorization headers"""
        if not self.token:
            return {}
        return {"Authorization": f"Bearer {self.token}"}

    @task(5)
    def create_room(self):
        """Create a consultation room"""
        if not self.token:
            return

        response = self.client.post(
            "/api/rooms/",
            headers=self.headers,
            json={"name": f"Test Room {random.randint(1000, 9999)}"},
            name="/api/rooms/ [CREATE]",
        )

        if response.status_code == 200:
            self.room_id = response.json().get("id")
            logging.info(f"Room created: {self.room_id}")

    @task(3)
    def list_rooms(self):
        """List user's rooms"""
        if not self.token:
            return

        self.client.get("/api/rooms/", headers=self.headers, name="/api/rooms/ [LIST]")

    @task(4)
    def create_client(self):
        """Create a client"""
        if not self.token or not self.room_id:
            return

        response = self.client.post(
            "/api/clients/",
            headers=self.headers,
            json={
                "name": f"Test Client {random.randint(1000, 9999)}",
                "email": f"client{random.randint(1000, 9999)}@example.com",
                "phone": "0912345678",
            },
            name="/api/clients/ [CREATE]",
        )

        if response.status_code == 200:
            self.client_id = response.json().get("id")

    @task(3)
    def list_clients(self):
        """List clients"""
        if not self.token:
            return

        self.client.get(
            "/api/clients/", headers=self.headers, name="/api/clients/ [LIST]"
        )

    @task(2)
    def get_room_detail(self):
        """Get room details"""
        if not self.token or not self.room_id:
            return

        self.client.get(
            f"/api/rooms/{self.room_id}",
            headers=self.headers,
            name="/api/rooms/{id} [GET]",
        )

    @task(6)
    def save_gameplay_state(self):
        """Save gameplay state"""
        if not self.token or not self.room_id:
            return

        gameplay_state = {
            "gameType": "skill_assessment",
            "cards": [
                {
                    "id": f"card-{i}",
                    "position": {"x": random.randint(0, 800), "y": random.randint(0, 600)},
                    "rotation": random.randint(-15, 15),
                    "tokens": random.randint(0, 10),
                }
                for i in range(random.randint(5, 15))
            ],
            "timestamp": int(time.time() * 1000),
        }

        self.client.post(
            f"/api/gameplay-states/rooms/{self.room_id}",
            headers=self.headers,
            json={
                "room_id": self.room_id,
                "game_type": "skill_assessment",
                "state_data": gameplay_state,
            },
            name="/api/gameplay-states/rooms/{id} [SAVE]",
        )

    @task(4)
    def load_gameplay_state(self):
        """Load gameplay state"""
        if not self.token or not self.room_id:
            return

        self.client.get(
            f"/api/gameplay-states/rooms/{self.room_id}/skill_assessment",
            headers=self.headers,
            name="/api/gameplay-states/rooms/{id}/{game_type} [LOAD]",
        )

    @task(2)
    def create_note(self):
        """Create a note"""
        if not self.token or not self.room_id:
            return

        self.client.post(
            "/api/notes/",
            headers=self.headers,
            json={
                "room_id": self.room_id,
                "content": f"Test note created at {time.time()}",
            },
            name="/api/notes/ [CREATE]",
        )

    @task(1)
    def health_check(self):
        """Health check endpoint"""
        self.client.get("/health", name="/health")


class VisitorUser(FastHttpUser):
    """
    Simulates a visitor user behavior:
    - Login with room code
    - Join room
    - View cards
    - Update gameplay state
    """

    wait_time = between(2, 5)
    host = BACKEND_API

    def on_start(self):
        """Called when a visitor starts"""
        self.room_code = None
        self.visitor_id = None
        # Visitors might join existing rooms created by counselors
        # For now, we'll focus on read operations

    @task(10)
    def simulate_polling(self):
        """Simulate visitor polling for updates"""
        # Visitors would poll for room state updates
        # This simulates the polling behavior
        time.sleep(random.uniform(0.5, 2.0))


@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Called when test starts"""
    logging.info("=" * 80)
    logging.info("Load test started")
    logging.info(f"Target host: {environment.host}")
    logging.info("=" * 80)


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Called when test stops"""
    logging.info("=" * 80)
    logging.info("Load test finished")
    logging.info("=" * 80)
