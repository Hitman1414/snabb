from fastapi import WebSocket
from typing import Dict, Set
import json
import logging
import asyncio
from .cache import cache_service

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
        """Send a message to a specific user (across all workers via Redis PubSub)"""
        # Publish to Redis so all workers see it. 
        # The listener will catch it and send to local sockets.
        if cache_service.enabled and cache_service.async_redis_client:
            try:
                payload = json.dumps({
                    "user_id": user_id,
                    "message": message
                })
                await cache_service.async_redis_client.publish("ws_messages", payload)
                return
            except Exception as e:
                logger.error(f"Redis publish failed: {e}")
                
        # Fallback: Just send locally
        await self._send_local(message, user_id)
        
    async def _send_local(self, message: dict, user_id: int):
        """Send directly to local connected sockets for a user"""
        if user_id in self.active_connections:
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

    async def listen_to_redis(self):
        """Background task to listen for PubSub messages from Redis"""
        if not cache_service.enabled or not cache_service.async_redis_client:
            return
            
        try:
            pubsub = cache_service.async_redis_client.pubsub()
            await pubsub.subscribe("ws_messages")
            logger.info("WebSocket manager subscribed to Redis 'ws_messages' channel")
            
            async for message in pubsub.listen():
                if message["type"] == "message":
                    try:
                        data = json.loads(message["data"])
                        target_user_id = data.get("user_id")
                        msg_payload = data.get("message")
                        if target_user_id and msg_payload:
                            await self._send_local(msg_payload, target_user_id)
                    except json.JSONDecodeError:
                        pass
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Redis PubSub listener error: {e}")

manager = ConnectionManager()
