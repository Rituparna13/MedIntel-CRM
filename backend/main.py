from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import date
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from models.database import get_db, engine
from models.interaction import Interaction, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI-First CRM HCP Module", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# Pydantic Schemas
# ─────────────────────────────────────────────
class InteractionCreate(BaseModel):
    doctor_name: str
    specialty: Optional[str] = None
    interaction_date: date
    interaction_type: Optional[str] = "In-Person"
    notes: Optional[str] = None
    summary: Optional[str] = None
    topics_discussed: Optional[str] = None
    sentiment: Optional[str] = "Neutral"
    follow_up_date: Optional[date] = None
    follow_up_action: Optional[str] = None
    product_discussed: Optional[str] = None

class InteractionUpdate(BaseModel):
    doctor_name: Optional[str] = None
    specialty: Optional[str] = None
    interaction_date: Optional[date] = None
    interaction_type: Optional[str] = None
    notes: Optional[str] = None
    summary: Optional[str] = None
    topics_discussed: Optional[str] = None
    sentiment: Optional[str] = None
    follow_up_date: Optional[date] = None
    follow_up_action: Optional[str] = None
    product_discussed: Optional[str] = None

class InteractionResponse(BaseModel):
    id: int
    doctor_name: str
    specialty: Optional[str]
    interaction_date: date
    interaction_type: Optional[str]
    notes: Optional[str]
    summary: Optional[str]
    topics_discussed: Optional[str]
    sentiment: Optional[str]
    follow_up_date: Optional[date]
    follow_up_action: Optional[str]
    product_discussed: Optional[str]

    class Config:
        from_attributes = True

class ChatMessage(BaseModel):
    message: str
    history: Optional[List[dict]] = []

class ChatResponse(BaseModel):
    response: str
    tool_used: Optional[str] = None


# ─────────────────────────────────────────────
# REST Endpoints
# ─────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "AI-First CRM HCP Module API", "status": "running"}


@app.post("/log-interaction", response_model=InteractionResponse)
def log_interaction(data: InteractionCreate, db: Session = Depends(get_db)):
    """Log a new HCP interaction via structured form."""
    interaction = Interaction(**data.dict())
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    return interaction


@app.put("/edit-interaction/{interaction_id}", response_model=InteractionResponse)
def edit_interaction(interaction_id: int, data: InteractionUpdate, db: Session = Depends(get_db)):
    """Edit an existing interaction."""
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(interaction, key, value)
    db.commit()
    db.refresh(interaction)
    return interaction


@app.get("/get-interactions", response_model=List[InteractionResponse])
def get_interactions(
    doctor_name: Optional[str] = None,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get all or filtered interactions."""
    query = db.query(Interaction)
    if doctor_name:
        query = query.filter(Interaction.doctor_name.ilike(f"%{doctor_name}%"))
    return query.order_by(Interaction.interaction_date.desc()).limit(limit).all()


@app.get("/get-interactions/{interaction_id}", response_model=InteractionResponse)
def get_interaction_by_id(interaction_id: int, db: Session = Depends(get_db)):
    """Get a single interaction by ID."""
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return interaction


@app.delete("/delete-interaction/{interaction_id}")
def delete_interaction(interaction_id: int, db: Session = Depends(get_db)):
    """Delete an interaction by ID."""
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    db.delete(interaction)
    db.commit()
    return {"message": f"Interaction {interaction_id} deleted successfully"}


@app.post("/chat", response_model=ChatResponse)
def chat(data: ChatMessage):
    """
    Chat endpoint - routes user message through LangGraph agent.
    The agent decides which tool to call based on the message.
    """
    try:
        # Import here to avoid circular imports on startup
        from agent.hcp_agent import run_agent
        result = run_agent(data.message, data.history)
        return ChatResponse(response=result["response"], tool_used=result.get("tool_used"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")
