"""WebSocket endpoint for real-time negotiation streaming."""

from __future__ import annotations

import logging
import time

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.agent_service import agent_service
from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self.active: dict[str, WebSocket] = {}
        self.cancelled: set[str] = set()

    async def connect(self, ws: WebSocket, session_id: str):
        await ws.accept()
        self.active[session_id] = ws
        self.cancelled.discard(session_id)

    def disconnect(self, session_id: str):
        self.active.pop(session_id, None)
        self.cancelled.discard(session_id)

    def cancel(self, session_id: str):
        self.cancelled.add(session_id)

    def is_cancelled(self, session_id: str) -> bool:
        return session_id in self.cancelled

    async def send(self, session_id: str, data: dict):
        ws = self.active.get(session_id)
        if ws:
            await ws.send_json(data)


def _extract_start_config(data: dict) -> dict:
    # Accept both legacy payload shape {command, config:{...}} and flat payload shape.
    cfg = data.get("config") if isinstance(data.get("config"), dict) else data
    return {
        "scenario_name": cfg.get("scenario", "Rush Delivery"),
        "strategy_name": cfg.get("strategy", "balanced"),
        "include_warehouse": cfg.get("include_warehouse", False),
        "max_turns": cfg.get("max_turns", 12),
        "custom_agents": cfg.get("custom_agents", []),
    }


manager = ConnectionManager()


@router.websocket("/ws/{session_id}")
async def negotiation_ws(websocket: WebSocket, session_id: str):
    """
    Bidirectional WebSocket for live negotiation.

    Client sends:  {"command": "start", "scenario": "...", "strategy": "...", "include_warehouse": false, "max_turns": 12}
                   {"command": "stop"}
    Server sends:  {"type": "message", "round": 1, "sender": "Shipper", "content": "...", "reasoning": "...", "price": null, "utility": null}
                   {"type": "completed", "success": true, ...}
    """
    await manager.connect(websocket, session_id)

    try:
        while True:
            data = await websocket.receive_json()
            command = data.get("command")

            if command == "start":
                manager.cancelled.discard(session_id)
                await manager.send(session_id, {"type": "status", "status": "negotiating"})
                config = _extract_start_config(data)

                try:
                    started_at = time.time()
                    async for msg in agent_service.run_stream(
                        scenario_name=config["scenario_name"],
                        strategy_name=config["strategy_name"],
                        include_warehouse=config["include_warehouse"],
                        max_turns=config["max_turns"],
                        custom_agents=config["custom_agents"],
                    ):
                        if time.time() - started_at > settings.NEGOTIATION_TIMEOUT:
                            await manager.send(session_id, {
                                "type": "error",
                                "message": "Negotiation timed out",
                            })
                            break

                        if manager.is_cancelled(session_id):
                            await manager.send(session_id, {"type": "stopped"})
                            break
                        await manager.send(session_id, {
                            "type": "message",
                            "round": msg.round,
                            "sender": msg.sender,
                            "content": msg.content,
                            "reasoning": msg.reasoning,
                            "price": msg.price_mentioned,
                            "utility": msg.utility,
                            "timestamp": msg.timestamp,
                        })
                    else:
                        await manager.send(session_id, {"type": "completed"})
                except Exception as e:
                    logger.exception("WebSocket negotiation failed for session %s", session_id)
                    await manager.send(session_id, {
                        "type": "error",
                        "message": str(e),
                    })

            elif command == "stop":
                manager.cancel(session_id)

            elif command == "ping":
                await manager.send(session_id, {"type": "pong"})

    except WebSocketDisconnect:
        manager.disconnect(session_id)
    except Exception:
        logger.exception("WebSocket connection crashed for session %s", session_id)
        manager.disconnect(session_id)

