import os
from fastapi import FastAPI
from pydantic import BaseModel

class Prompt(BaseModel):
    prompt: str

app = FastAPI()

@app.post("/ai/suggest")
async def suggest(p: Prompt):
    # placeholder response
    return {"suggestion": ""}

class Transaction(BaseModel):
    user_id: str
    amount: float
    type: str
    timestamp: str

@app.post("/ai/fraud-check")
async def fraud_check(tx: Transaction):
    # simple mock of AI-based anomaly detection
    # real implementation would score the transaction
    return {"suspicious": False, "score": 0.0}

@app.get("/health")
async def health():
    return {"status": "ok", "service": "ai-engine"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 3005))
    uvicorn.run(app, host="0.0.0.0", port=port)
