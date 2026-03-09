from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set, List
import json
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Maps user_id -> set of active WebSocket connections
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        logger.info(f"User {user_id} connected via WebSocket. Active sessions: {len(self.active_connections[user_id])}")

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
            logger.info(f"User {user_id} disconnected from WebSocket.")

    async def send_personal_message(self, message: dict, user_id: int):
        """Send a message to a specific user (across all their active connections)"""
        if user_id in self.active_connections:
            # We must handle cases where a socket might have closed unexpectedly before discard
            dead_sockets = set()
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Error sending msg to user {user_id} over WS: {e}")
                    dead_sockets.add(connection)
            
            # Clean up dead sockets
            for ds in dead_sockets:
                self.disconnect(ds, user_id)

    async def broadcast(self, message: str):
        """Send to all connected users (Optional/Admin use mostly)"""
        for user_id, connections in self.active_connections.items():
            for connection in connections:
                try:
                    await connection.send_text(message)
                except Exception:
                    pass

manager = ConnectionManager()
