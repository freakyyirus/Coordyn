"""Mock blockchain service — logs deal hashes for demo credibility."""

import hashlib
import json
import time


class BlockchainService:
    """Simulated smart-contract logger.  Swap for real web3 in prod."""

    def __init__(self):
        self.ledger: list[dict] = []

    async def log_deal(self, terms: dict) -> str:
        payload = json.dumps(terms, sort_keys=True) + str(time.time())
        tx_hash = "0x" + hashlib.sha256(payload.encode()).hexdigest()[:40]
        self.ledger.append({"tx": tx_hash, "terms": terms, "ts": time.time()})
        return tx_hash

    def get_ledger(self) -> list[dict]:
        return self.ledger


blockchain_service = BlockchainService()
