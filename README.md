# 🏥 AI-First CRM – HCP Module (Log Interaction Screen)

> An intelligent Customer Relationship Management system for pharmaceutical sales representatives to manage Healthcare Professional (HCP) interactions using **LangGraph**, **Groq LLM (gemma2-9b-it)**, **React + Redux**, and **FastAPI**.

---

## 📸 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     REACT FRONTEND                          │
│  ┌──────────────┐        ┌───────────────────────────────┐  │
│  │  Form Mode   │        │       Chat Mode               │  │
│  │  (Structured │  ←→    │  (Conversational AI Chat)     │  │
│  │   Input)     │        │                               │  │
│  └──────────────┘        └───────────────────────────────┘  │
│           Redux Store (interactions + chat slices)          │
└─────────────────────┬───────────────────────────────────────┘
                      │  HTTP (Axios)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  FASTAPI BACKEND                             │
│   POST /log-interaction    PUT  /edit-interaction/:id       │
│   GET  /get-interactions   DELETE /delete-interaction/:id   │
│   POST /chat  ──────────────────────────────────────────┐   │
└────────────────────────────────────────────────┬────────┼───┘
                                                 │        │
                      ┌──────────────────────────┘        │
                      ▼                                    │
┌─────────────────────────────────────────────────────┐    │
│              LANGGRAPH AGENT                        │    │
│                                                     │    │
│  User Input → LLM (gemma2-9b-it) → Tool Decision   │    │
│                                                     │    │
│  ┌──────────────────────────────────────────────┐  │    │
│  │              5 TOOLS                         │  │    │
│  │  1. log_interaction    (Mandatory)           │  │    │
│  │  2. edit_interaction   (Mandatory)           │  │    │
│  │  3. get_interactions                         │  │    │
│  │  4. delete_interaction                       │  │    │
│  │  5. suggest_next_action                      │  │    │
│  └──────────────────────────────────────────────┘  │    │
└───────────────────────────┬─────────────────────────┘    │
                            │                               │
                            ▼                               │
┌─────────────────────────────────────────────────────┐    │
│           GROQ LLM (gemma2-9b-it)                   │◄───┘
│   - Entity extraction (doctor, drug, sentiment)     │
│   - Summarization                                   │
│   - Next-action recommendations                     │
└─────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────┐
│         PostgreSQL / MySQL Database                 │
│   Table: interactions                               │
│   - id, doctor_name, specialty, interaction_date   │
│   - interaction_type, notes, summary               │
│   - topics_discussed, sentiment                    │
│   - follow_up_action, product_discussed            │
└─────────────────────────────────────────────────────┘
```

---

## 🗂️ Project Structure

```
ai-crm-hcp/
├── frontend/                    # React + Redux UI
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── LogInteractionForm.jsx  # Structured form input
│   │   │   ├── ChatInterface.jsx       # AI chat interface
│   │   │   └── InteractionsList.jsx    # Table with edit/delete
│   │   ├── store/
│   │   │   ├── index.js                # Redux store config
│   │   │   ├── interactionsSlice.js    # Interactions state
│   │   │   └── chatSlice.js            # Chat messages state
│   │   ├── api/
│   │   │   └── axiosConfig.js          # Axios base config
│   │   ├── styles/
│   │   │   └── global.css              # Inter font + theme
│   │   ├── App.jsx                     # Main app component
│   │   └── index.js                    # Entry point
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
│
├── backend/                     # FastAPI Python backend
│   ├── models/
│   │   ├── interaction.py       # SQLAlchemy ORM model
│   │   └── database.py          # DB engine + session
│   ├── main.py                  # FastAPI app + all routes
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
│
├── agent/                       # LangGraph AI Agent
│   ├── hcp_agent.py             # Agent + all 5 tools defined
│   └── __init__.py
│
├── database/
│   └── schema.sql               # DB schema (Postgres/MySQL)
│
├── docker-compose.yml           # One-command full stack setup
├── .gitignore
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+ (or MySQL 8+)
- [Groq API Key](https://console.groq.com) (free tier available)

---

### Option A: Manual Setup (Recommended for development)

#### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/ai-crm-hcp.git
cd ai-crm-hcp
```

#### 2. Database Setup

```bash
# Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE crm_hcp;"

# Run schema
psql -U postgres -d crm_hcp -f database/schema.sql
```

#### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env:
#   DATABASE_URL=postgresql://postgres:password@localhost:5432/crm_hcp
#   GROQ_API_KEY=your_groq_api_key_here

# Start backend (from project root so agent/ is importable)
cd ..
uvicorn backend.main:app --reload --port 8000
```

#### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env:
#   REACT_APP_API_URL=http://localhost:8000

# Start frontend
npm start
```

Frontend will be available at: **http://localhost:3000**  
Backend API docs at: **http://localhost:8000/docs**

---

### Option B: Docker Compose (One command)

```bash
# In project root, create a .env file:
echo "GROQ_API_KEY=your_groq_api_key_here" > .env

# Start everything
docker-compose up --build

# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
# API Docs: http://localhost:8000/docs
```

---

## 🤖 LangGraph Agent — 5 Tools Explained

The LangGraph agent acts as the **brain** of the chat interface. It receives user messages, uses the Groq LLM to understand intent, and calls the appropriate tool.

### Agent Flow

```
User Message
    ↓
LangGraph Agent (StateGraph)
    ↓
LLM (gemma2-9b-it) decides which tool to call
    ↓
Tool Executes (DB operation + LLM if needed)
    ↓
Response returned to user
```

---

### Tool 1: `log_interaction` ✅ (Mandatory)

**Purpose**: Converts natural language into a structured HCP interaction record.

**How it works**:
1. Receives raw user text (e.g., *"Met Dr. Sharma today, discussed Oncovax, he was very interested"*)
2. Sends to Groq LLM with a structured extraction prompt
3. LLM extracts: `doctor_name`, `specialty`, `date`, `sentiment`, `topics`, `product`, `summary`
4. Saves structured record to PostgreSQL

**Example**:
```
Input:  "Had a call with Dr. Priya Nair, oncologist, discussed Carditex dosage. She requested samples."
Output: Doctor: Dr. Priya Nair | Specialty: Oncology | Sentiment: Positive | Summary: Discussed Carditex dosage, doctor requested samples
```

---

### Tool 2: `edit_interaction` ✅ (Mandatory)

**Purpose**: Updates a specific field of an existing interaction.

**How it works**:
1. Takes `interaction_id`, `field`, and `new_value`
2. Validates that the field is an allowed editable column
3. Updates the database record

**Example**:
```
Input:  "Edit interaction 3 — change sentiment to Positive"
Output: ✅ Interaction 3 updated: sentiment → 'Positive'
```

---

### Tool 3: `get_interactions`

**Purpose**: Retrieves past interaction logs, optionally filtered by doctor name.

**Example**:
```
Input:  "Show me all interactions with Dr. Kapoor"
Output: 📋 Found 2 interaction(s): [ID:1] Dr. Kapoor | 2024-07-15 | ...
```

---

### Tool 4: `delete_interaction`

**Purpose**: Permanently deletes an interaction record by ID.

**Example**:
```
Input:  "Delete interaction 5"
Output: 🗑️ Interaction 5 with Dr. Mehta has been deleted.
```

---

### Tool 5: `suggest_next_action`

**Purpose**: AI-powered follow-up strategy based on past meetings with a specific HCP.

**How it works**:
1. Fetches last 5 interactions with the doctor
2. Sends interaction history to Groq LLM
3. LLM generates: best next action, key talking points, timing, risk factors

**Example**:
```
Input:  "What should I do next with Dr. Rao?"
Output: 🎯 Next Action Plan for Dr. Rao:
        1. Schedule an in-person visit within 7 days
        2. Bring updated efficacy data for Oncovax
        3. Address her concern about side effects from last meeting
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/log-interaction` | Log via structured form |
| `PUT` | `/edit-interaction/{id}` | Edit an interaction |
| `GET` | `/get-interactions` | Get all (filter: `?doctor_name=`) |
| `GET` | `/get-interactions/{id}` | Get single interaction |
| `DELETE` | `/delete-interaction/{id}` | Delete interaction |
| `POST` | `/chat` | Send message to LangGraph agent |

### Chat Endpoint Payload
```json
POST /chat
{
  "message": "Met Dr. Rao, discussed diabetes drug, positive response",
  "history": []
}
```

---

## 🎨 Frontend Features

### Form Mode
- Doctor Name, Specialty, Date, Interaction Type
- Product Discussed, Sentiment selector
- Topics, Notes, Follow-up Action
- Direct REST API call → saves to DB

### Chat Mode
- Conversational AI powered by LangGraph + Groq
- Auto-detects user intent (log / edit / fetch / delete / suggest)
- Shows which tool was used per message
- Suggestion chips for quick-start prompts
- Full conversation history sent per request

### Interactions Table
- Live data from DB
- Search by doctor name
- Inline edit form per row
- One-click delete with confirmation
- Sentiment badges (Positive/Neutral/Negative)

### Redux Store
- `interactions` slice: list, loading, error, success
- `chat` slice: messages array with role/content/toolUsed/timestamp

---

## 🛢️ Database Schema

```sql
CREATE TABLE interactions (
    id                SERIAL PRIMARY KEY,
    doctor_name       VARCHAR(255) NOT NULL,
    specialty         VARCHAR(255),
    interaction_date  DATE NOT NULL,
    interaction_type  VARCHAR(100) DEFAULT 'In-Person',
    notes             TEXT,
    summary           TEXT,
    topics_discussed  TEXT,
    sentiment         VARCHAR(50),
    follow_up_date    DATE,
    follow_up_action  TEXT,
    product_discussed VARCHAR(255),
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🧠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Redux Toolkit, Axios |
| Styling | CSS Variables, Google Inter font |
| Backend | Python 3.11, FastAPI, Uvicorn |
| AI Agent | LangGraph (StateGraph) |
| LLM | Groq — `gemma2-9b-it` |
| ORM | SQLAlchemy 2.0 |
| Database | PostgreSQL (MySQL compatible) |
| DevOps | Docker, Docker Compose |

---

## 📋 What I Understood from Task 1

### Why AI in CRM?
Traditional CRM systems require sales reps to manually fill structured forms — this is time-consuming and error-prone. An AI-first approach lets reps simply **describe what happened** in natural language, and the AI extracts all structured data automatically.

### Why LangGraph?
LangGraph provides a **stateful, graph-based agent framework**. Unlike simple LLM calls, LangGraph:
- Maintains conversation state across turns
- Routes messages to the correct tool based on intent
- Handles multi-step workflows (e.g., extract → save → respond)
- Is production-ready for complex agentic tasks

### Why Groq gemma2-9b-it?
Groq provides ultra-fast inference (hundreds of tokens/second) which is critical for a real-time chat CRM. The gemma2-9b-it model is optimized for instruction following and structured extraction tasks.

### Business Value
- **For Sales Reps**: Log meetings in seconds via voice-like chat
- **For Managers**: Full audit trail of all HCP interactions
- **For Strategy**: AI suggests next best actions based on interaction history
- **For Compliance**: Structured data enables regulatory reporting in Life Sciences

---

## 🎥 Video Walkthrough Guide

For the 10–15 minute submission video, demonstrate:

1. **Form Mode** — Fill out and submit a new interaction
2. **Chat Mode** — Type natural language, show AI logging it
3. **Tool 1** — `log_interaction`: Chat → "Met Dr. Kapoor, discussed Oncovax..."
4. **Tool 2** — `edit_interaction`: Chat → "Edit interaction 1, change sentiment to Positive"
5. **Tool 3** — `get_interactions`: Chat → "Show me all interactions"
6. **Tool 4** — `delete_interaction`: Chat → "Delete interaction 3"
7. **Tool 5** — `suggest_next_action`: Chat → "What should I do next with Dr. Kapoor?"
8. **Architecture** — Walk through: React → Redux → FastAPI → LangGraph → Groq → PostgreSQL

---

## 📄 License

MIT — Free to use for educational and commercial purposes.
