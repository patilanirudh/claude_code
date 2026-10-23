"""Redis layer: sliding-window velocity checks and pub/sub for flagged transactions."""
import os
import time
from typing import AsyncGenerator

import redis.asyncio as aioredis

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
FLAG_CHANNEL = "riskpulse:flags"

VELOCITY_WINDOW_SECONDS = 600  # 10 minutes

_redis: aioredis.Redis | None = None


def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(REDIS_URL, decode_responses=True)
    return _redis


async def record_and_check_velocity(account_id: str, is_new_payee: bool) -> int:
    """Record this transaction in the account's new-payee sliding window and
    return how many new-payee transfers have happened in the window so far."""
    if not is_new_payee:
        return 0

    r = get_redis()
    key = f"velocity:{account_id}:new_payee"
    now = time.time()

    pipe = r.pipeline()
    pipe.zadd(key, {str(now): now})
    pipe.zremrangebyscore(key, 0, now - VELOCITY_WINDOW_SECONDS)
    pipe.zcard(key)
    pipe.expire(key, VELOCITY_WINDOW_SECONDS)
    results = await pipe.execute()
    return results[2]


async def publish_flag(payload: str) -> None:
    r = get_redis()
    await r.publish(FLAG_CHANNEL, payload)


async def subscribe_flags() -> AsyncGenerator[str, None]:
    r = get_redis()
    pubsub = r.pubsub()
    await pubsub.subscribe(FLAG_CHANNEL)
    async for message in pubsub.listen():
        if message["type"] == "message":
            yield message["data"]
