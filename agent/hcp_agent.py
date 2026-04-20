"""
LangGraph AI Agent for HCP Interaction Management
Tools:
1. log_interaction    - Extract entities & summarize, save to DB
2. edit_interaction   - Update an existing interaction record
3. get_interactions   - Retrieve interaction records
4. delete_interaction - Remove an interaction record
5. suggest_next_action - AI suggests follow-up action for a doctor
"""

import os
import json
from datetime import date, datetime
from typing import Annotated, TypedDict, Any

from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage, SystemMessage
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

from sqlalchemy.orm import Session
from models.database import SessionLocal
from models.interaction import Interaction

load_dotenv()

# ─────────────────────────────────────────────
# LLM Setup
# ─────────────────────────────────────────────
llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="llama-3.3-70b-versatile",
    temperature=0.2,
)

# ─────────────────────────────────────────────
# Helper: DB session
# ─────────────────────────────────────────────
def get_db_session() -> Session:
    return SessionLocal()


# ─────────────────────────────────────────────
# Tool 1: Log Interaction
# ─────────────────────────────────────────────
@tool
def log_interaction(user_message: str) -> str:
    """
    Extracts HCP interaction details from natural language and saves to DB.
    Uses LLM to extract: doctor name, specialty, date, notes, summary, topics, sentiment, product.
    """
    extraction_prompt = f"""
You are an expert medical CRM assistant. Extract the following fields from the user message.
Return ONLY valid JSON, no markdown, no extra text.

Fields to extract:
- doctor_name (string, required)
- specialty (string or null)
- interaction_date (string YYYY-MM-DD, use today {date.today()} if not mentioned)
- interaction_type (string: "In-Person"/"Phone Call"/"Email"/"Virtual", default "In-Person")
- notes (string: verbatim notes)
- summary (string: 1-2 sentence summary)
- topics_discussed (string: comma-separated topics)
- sentiment (string: "Positive"/"Neutral"/"Negative")
- product_discussed (string or null)
- follow_up_action (string or null)

User message: "{user_message}"
"""
    response = llm.invoke([HumanMessage(content=extraction_prompt)])
    raw = response.content.strip()

    # Strip markdown fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return f"⚠️ Could not parse structured data from: {raw}"

    db = get_db_session()
    try:
        interaction_date = data.get("interaction_date", str(date.today()))
        if isinstance(interaction_date, str):
            try:
                interaction_date = datetime.strptime(interaction_date, "%Y-%m-%d").date()
            except ValueError:
                interaction_date = date.today()

        new_interaction = Interaction(
            doctor_name=data.get("doctor_name", "Unknown Doctor"),
            specialty=data.get("specialty"),
            interaction_date=interaction_date,
            interaction_type=data.get("interaction_type", "In-Person"),
            notes=data.get("notes", user_message),
            summary=data.get("summary"),
            topics_discussed=data.get("topics_discussed"),
            sentiment=data.get("sentiment", "Neutral"),
            product_discussed=data.get("product_discussed"),
            follow_up_action=data.get("follow_up_action"),
        )
        db.add(new_interaction)
        db.commit()
        db.refresh(new_interaction)
        return (
            f"✅ Interaction logged successfully!\n"
            f"ID: {new_interaction.id}\n"
            f"Doctor: {new_interaction.doctor_name}\n"
            f"Summary: {new_interaction.summary}\n"
            f"Sentiment: {new_interaction.sentiment}"
        )
    except Exception as e:
        db.rollback()
        return f"❌ DB Error: {str(e)}"
    finally:
        db.close()


# ─────────────────────────────────────────────
# Tool 2: Edit Interaction
# ─────────────────────────────────────────────
@tool
def edit_interaction(interaction_id, field: str, new_value: str) -> str:
    """
    Updates a specific field of an existing interaction record.
    """
    try:
        interaction_id = int(interaction_id)
    except:
        return "❌ Invalid interaction ID"
    db = get_db_session()
    try:
        interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
        if not interaction:
            return f"❌ No interaction found with ID {interaction_id}"

        allowed_fields = [
            "doctor_name", "specialty", "interaction_type", "notes",
            "summary", "topics_discussed", "sentiment", "follow_up_action",
            "product_discussed"
        ]
        if field not in allowed_fields:
            return f"❌ Cannot edit field '{field}'. Allowed: {', '.join(allowed_fields)}"

        setattr(interaction, field, new_value)
        db.commit()
        return f"✅ Interaction {interaction_id} updated: {field} → '{new_value}'"
    except Exception as e:
        db.rollback()
        return f"❌ Error updating interaction: {str(e)}"
    finally:
        db.close()


# ─────────────────────────────────────────────
# Tool 3: Get Interactions
# ─────────────────────────────────────────────
@tool
def get_interactions(doctor_name: str = "", limit: int = 10) -> str:
    """
    Retrieves past interaction records from the database.
    Args:
        doctor_name: Optional filter by doctor name (partial match)
        limit: Number of records to return (default 10)
    """
    db = get_db_session()
    try:
        query = db.query(Interaction)
        if doctor_name:
            query = query.filter(Interaction.doctor_name.ilike(f"%{doctor_name}%"))
        interactions = query.order_by(Interaction.interaction_date.desc()).limit(limit).all()

        if not interactions:
            return "📭 No interactions found."

        results = []
        for i in interactions:
            results.append(
                f"[ID:{i.id}] Dr. {i.doctor_name} | {i.interaction_date} | "
                f"{i.interaction_type} | {i.sentiment}\n"
                f"  Summary: {i.summary or i.notes[:80] if i.notes else 'N/A'}"
            )
        return f"📋 Found {len(interactions)} interaction(s):\n\n" + "\n\n".join(results)
    except Exception as e:
        return f"❌ Error fetching interactions: {str(e)}"
    finally:
        db.close()


# ─────────────────────────────────────────────
# Tool 4: Delete Interaction
# ─────────────────────────────────────────────
@tool
def delete_interaction(interaction_id) -> str:
    """
    Deletes an interaction record by ID.
    Args:
        interaction_id: The ID of the interaction to delete
    """
    try:
        interaction_id = int(interaction_id)
    except:
        return "❌ Invalid interaction ID"
    db = get_db_session()
    try:
        interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
        if not interaction:
            return f"❌ No interaction found with ID {interaction_id}"

        doctor = interaction.doctor_name
        db.delete(interaction)
        db.commit()
        return f"🗑️ Interaction {interaction_id} with Dr. {doctor} has been deleted."
    except Exception as e:
        db.rollback()
        return f"❌ Error deleting interaction: {str(e)}"
    finally:
        db.close()


# ─────────────────────────────────────────────
# Tool 5: Suggest Next Action
# ─────────────────────────────────────────────
@tool
def suggest_next_action(doctor_name: str) -> str:
    """
    AI-powered suggestion for the next best action for a specific HCP.
    Analyzes past interactions and recommends follow-up strategy.
    Args:
        doctor_name: Name of the doctor to generate suggestions for
    """
    db = get_db_session()
    try:
        interactions = (
            db.query(Interaction)
            .filter(Interaction.doctor_name.ilike(f"%{doctor_name}%"))
            .order_by(Interaction.interaction_date.desc())
            .limit(5)
            .all()
        )

        if not interactions:
            return f"⚠️ No past interactions found for Dr. {doctor_name}. Suggest an introductory visit."

        history_text = "\n".join([
            f"- {i.interaction_date}: {i.summary or i.notes} (Sentiment: {i.sentiment})"
            for i in interactions
        ])

        prompt = f"""
You are a pharma sales strategy AI. Based on interaction history with Dr. {doctor_name}, suggest:
1. Best next action (visit, call, email, send samples)
2. Key talking points
3. Optimal timing
4. Risk factors to watch

Interaction History:
{history_text}

Be concise and practical. Format as a brief action plan.
"""
        response = llm.invoke([HumanMessage(content=prompt)])
        return f"🎯 Next Action Plan for Dr. {doctor_name}:\n\n{response.content}"
    except Exception as e:
        return f"❌ Error generating suggestion: {str(e)}"
    finally:
        db.close()


# ─────────────────────────────────────────────
# LangGraph State
# ─────────────────────────────────────────────
class AgentState(TypedDict):
    messages: Annotated[list, add_messages]


# ─────────────────────────────────────────────
# Build LangGraph
# ─────────────────────────────────────────────
tools = [log_interaction, edit_interaction, get_interactions, delete_interaction, suggest_next_action]
llm_with_tools = llm.bind_tools(tools)

SYSTEM_PROMPT = """You are an intelligent CRM assistant for pharmaceutical sales representatives managing Healthcare Professional (HCP) interactions.

You have access to these tools:
1. log_interaction - Log a new HCP meeting/call from natural language
2. edit_interaction - Edit an existing interaction (needs ID, field, new value)
3. get_interactions - Retrieve past interactions (optionally filter by doctor)
4. delete_interaction - Delete an interaction by ID
5. suggest_next_action - Get AI-powered next-step recommendations for a doctor

Always be helpful, professional, and use the appropriate tool based on the user's intent.
If logging an interaction, extract all relevant medical/pharma details.
If the user is unclear, ask a clarifying question."""


def call_model(state: AgentState):
    messages = [SystemMessage(content=SYSTEM_PROMPT)] + state["messages"]
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}


def should_continue(state: AgentState):
    messages = state["messages"]
    last_message = messages[-1]

    # If last message is from tool → STOP
    if isinstance(last_message, ToolMessage):
        return END

    # If model wants to call tool → go to tools
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"

    # Otherwise stop
    return END


tool_node = ToolNode(tools)

graph = StateGraph(AgentState)
graph.add_node("agent", call_model)
graph.add_node("tools", tool_node)
graph.set_entry_point("agent")
graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
graph.add_edge("tools", "agent")

agent_graph = graph.compile()


# ─────────────────────────────────────────────
# Public chat function
# ─────────────────────────────────────────────
def run_agent(user_message: str, conversation_history: list = None) -> dict:
    """
    Run the LangGraph agent with a user message.
    Returns the agent's final text response.
    """
    messages = []
    if conversation_history:
        for msg in conversation_history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["content"]))

    messages.append(HumanMessage(content=user_message))

    try:
        result = agent_graph.invoke(
            {"messages": messages},
            config={"recursion_limit": 5}  
        )
    except Exception:
        return {
            "response": "⚠️ Agent stopped due to loop. Please try again.",
            "tool_used": None
        }

    final_message = result["messages"][-1]
    return {
        "response": final_message.content,
        "tool_used": _get_tool_used(result["messages"]),
    }


def _get_tool_used(messages) -> str:
    for msg in reversed(messages):
        if isinstance(msg, ToolMessage):
            return msg.name if hasattr(msg, "name") else "unknown"
    return None
