"""External market/context data adapters for real-world negotiation signals."""

from __future__ import annotations

from typing import Any, Dict

import httpx


class MarketDataService:
    async def fetch_fx_rates(self, base: str = "USD") -> Dict[str, Any]:
        url = f"https://api.frankfurter.app/latest?from={base}&to=EUR,GBP,JPY,INR"
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(url)
            res.raise_for_status()
            return res.json()

    async def fetch_crypto_snapshot(self) -> Dict[str, Any]:
        url = (
            "https://api.coingecko.com/api/v3/simple/price"
            "?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true"
        )
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(url)
            res.raise_for_status()
            return res.json()

    async def fetch_weather_risk(self, latitude: float = 40.7128, longitude: float = -74.0060) -> Dict[str, Any]:
        url = (
            "https://api.open-meteo.com/v1/forecast"
            f"?latitude={latitude}&longitude={longitude}"
            "&current=temperature_2m,wind_speed_10m,precipitation"
        )
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(url)
            res.raise_for_status()
            return res.json()

    async def build_negotiation_context(self) -> Dict[str, Any]:
        fx = await self.fetch_fx_rates()
        crypto = await self.fetch_crypto_snapshot()
        weather = await self.fetch_weather_risk()

        return {
            "fx_rates": fx,
            "crypto": crypto,
            "weather": weather,
            "signals": {
                "fuel_proxy": weather.get("current", {}).get("wind_speed_10m", 0),
                "macro_volatility": crypto.get("bitcoin", {}).get("usd_24h_change", 0),
                "currency_pressure": fx.get("rates", {}).get("INR", 0),
            },
        }


market_data_service = MarketDataService()
