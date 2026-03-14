from fastapi import FastAPI, APIRouter, Request, Response, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import httpx
import random
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime, timezone, timedelta
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ─── Models ───
class ChatRequest(BaseModel):
    message: str
    personality: str = "friendly"

class AptitudeSubmit(BaseModel):
    topic_id: str
    question_id: str
    selected_answer: int

class SettingsUpdate(BaseModel):
    mentor_personality: Optional[str] = None
    mentor_voice: Optional[str] = None
    mentor_style: Optional[str] = None

class InterviewRequest(BaseModel):
    category: str = "hr"

class EvaluateRequest(BaseModel):
    question: str
    answer: str
    category: str = "hr"

class CareerRequest(BaseModel):
    field: str

class StartupRequest(BaseModel):
    idea: str

# ─── Plan Limits ───
PLAN_LIMITS = {"free": 10, "lite": 40, "pro": 80, "year": 999999}

# ─── Personality Prompts ───
PERSONALITIES = {
    "teacher": "You are XOVA, a knowledgeable and patient AI teacher. Explain concepts step by step with examples. Be thorough but clear. Use analogies to simplify complex topics.",
    "friendly": "You are XOVA, a friendly and approachable AI guide. Be warm, encouraging, and conversational. Use casual language while still being informative and helpful.",
    "motivator": "You are XOVA, an energetic and motivating AI mentor. Be enthusiastic, uplifting, and push users to achieve their goals. Celebrate their progress and encourage persistence.",
    "strict": "You are XOVA, a strict but fair AI trainer. Be direct, focused, and demanding of excellence. Give honest feedback and push users to improve. No sugarcoating.",
    "startup_coach": "You are XOVA, an experienced AI startup coach. Think like a venture capitalist. Focus on market fit, scalability, revenue models, and growth strategies.",
    "supportive": "You are XOVA, a supportive and empathetic AI mentor. Be understanding, patient, and validating. Recognize struggles and provide emotional support alongside guidance."
}

BASE_SYSTEM_PROMPT = """You are XOVA, an advanced AI mentor assistant designed to help students improve skills, prepare for interviews, practice aptitude, receive career guidance, and develop startup ideas.

Core rules:
- Be helpful, encouraging, and knowledgeable
- Provide clear, actionable advice
- If users send romantic or emotional messages, respond politely while maintaining your mentor role
- Keep responses concise but comprehensive
- Use examples when explaining concepts
"""

# ─── Auth Helper ───
async def get_current_user(request: Request) -> dict:
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def check_and_use_credit(user_id: str) -> bool:
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        return False
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if user.get("last_credit_reset", "") != today:
        await db.users.update_one({"user_id": user_id}, {"$set": {"credits_used_today": 0, "last_credit_reset": today}})
        user["credits_used_today"] = 0
    plan = user.get("plan", "free")
    max_credits = PLAN_LIMITS.get(plan, 10)
    if user.get("credits_used_today", 0) >= max_credits:
        return False
    await db.users.update_one({"user_id": user_id}, {"$inc": {"credits_used_today": 1}})
    return True

# ─── Chat Sessions ───
chat_sessions: Dict[str, LlmChat] = {}

def get_chat_session(user_id: str, personality: str = "friendly") -> LlmChat:
    key = f"{user_id}_{personality}"
    if key not in chat_sessions:
        system_msg = BASE_SYSTEM_PROMPT + "\n\n" + PERSONALITIES.get(personality, PERSONALITIES["friendly"])
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=key,
            system_message=system_msg
        )
        chat.with_model("openai", "gpt-5.2")
        chat_sessions[key] = chat
    return chat_sessions[key]

# ─── Aptitude Topics Seed Data ───
APTITUDE_TOPICS = [
    {"topic_id": "probability", "name": "Probability", "category": "Quantitative", "icon": "dice-multiple", "description": "Study of random events and their likelihood"},
    {"topic_id": "time_work", "name": "Time and Work", "category": "Quantitative", "icon": "clock-outline", "description": "Calculate work completion rates and time"},
    {"topic_id": "time_distance", "name": "Time and Distance", "category": "Quantitative", "icon": "speedometer", "description": "Speed, distance, and time relationships"},
    {"topic_id": "number_series", "name": "Number Series", "category": "Quantitative", "icon": "numeric", "description": "Find patterns in number sequences"},
    {"topic_id": "logical_reasoning", "name": "Logical Reasoning", "category": "Logical", "icon": "brain", "description": "Deductive and inductive reasoning problems"},
    {"topic_id": "coding_decoding", "name": "Coding Decoding", "category": "Logical", "icon": "lock-pattern", "description": "Encode and decode patterns in data"},
    {"topic_id": "puzzle_solving", "name": "Puzzle Solving", "category": "Logical", "icon": "puzzle", "description": "Solve complex logical puzzles"},
    {"topic_id": "data_interpretation", "name": "Data Interpretation", "category": "Quantitative", "icon": "chart-bar", "description": "Analyze and interpret data from charts and tables"},
    {"topic_id": "ratio_proportion", "name": "Ratio and Proportion", "category": "Quantitative", "icon": "scale-balance", "description": "Compare quantities using ratios"},
    {"topic_id": "percentages", "name": "Percentages", "category": "Quantitative", "icon": "percent", "description": "Calculate and compare percentages"},
    {"topic_id": "averages", "name": "Averages", "category": "Quantitative", "icon": "chart-line", "description": "Mean, median, mode calculations"},
    {"topic_id": "profit_loss", "name": "Profit and Loss", "category": "Quantitative", "icon": "cash-multiple", "description": "Business profit and loss calculations"},
    {"topic_id": "simple_interest", "name": "Simple Interest", "category": "Quantitative", "icon": "bank", "description": "Calculate simple interest on investments"},
    {"topic_id": "compound_interest", "name": "Compound Interest", "category": "Quantitative", "icon": "bank-plus", "description": "Compound interest and growth calculations"},
    {"topic_id": "permutation_combination", "name": "Permutation & Combination", "category": "Quantitative", "icon": "swap-horizontal", "description": "Counting principles and arrangements"},
    {"topic_id": "statistics", "name": "Statistics", "category": "Quantitative", "icon": "chart-box", "description": "Statistical measures and analysis"},
    {"topic_id": "geometry", "name": "Geometry Basics", "category": "Quantitative", "icon": "shape", "description": "Lines, angles, and geometric shapes"},
    {"topic_id": "algebra", "name": "Algebra Basics", "category": "Quantitative", "icon": "function-variant", "description": "Variables, equations, and expressions"},
    {"topic_id": "logical_sequences", "name": "Logical Sequences", "category": "Logical", "icon": "arrow-right-bold-box-outline", "description": "Find patterns in logical sequences"},
    {"topic_id": "pattern_recognition", "name": "Pattern Recognition", "category": "Logical", "icon": "eye", "description": "Identify patterns in visual and numeric data"},
    {"topic_id": "visual_reasoning", "name": "Visual Reasoning", "category": "Logical", "icon": "image-filter-hdr", "description": "Solve problems using visual patterns"},
    {"topic_id": "blood_relations", "name": "Blood Relations", "category": "Logical", "icon": "account-group", "description": "Family tree and relationship problems"},
    {"topic_id": "direction_sense", "name": "Direction Sense", "category": "Logical", "icon": "compass", "description": "Navigation and direction-based problems"},
    {"topic_id": "statement_conclusion", "name": "Statement & Conclusion", "category": "Verbal", "icon": "text-box-check", "description": "Draw conclusions from given statements"},
    {"topic_id": "syllogism", "name": "Syllogism", "category": "Verbal", "icon": "set-all", "description": "Logical deductions from given premises"},
    {"topic_id": "analogy", "name": "Analogy", "category": "Verbal", "icon": "link-variant", "description": "Find relationships between word pairs"},
    {"topic_id": "classification", "name": "Classification", "category": "Verbal", "icon": "format-list-group", "description": "Group items based on common properties"},
    {"topic_id": "calendar", "name": "Calendar Problems", "category": "Quantitative", "icon": "calendar", "description": "Day, date, and calendar calculations"},
    {"topic_id": "clock", "name": "Clock Problems", "category": "Quantitative", "icon": "clock-time-four", "description": "Clock angle and time calculations"},
    {"topic_id": "ranking", "name": "Ranking Problems", "category": "Logical", "icon": "sort-ascending", "description": "Order and rank-based reasoning"},
    {"topic_id": "venn_diagram", "name": "Venn Diagram", "category": "Logical", "icon": "set-center", "description": "Set theory and Venn diagram problems"},
    {"topic_id": "math_puzzles", "name": "Mathematical Puzzles", "category": "Quantitative", "icon": "puzzle-outline", "description": "Creative mathematical problem solving"},
    {"topic_id": "word_problems", "name": "Word Problems", "category": "Quantitative", "icon": "text", "description": "Translate word scenarios into equations"},
    {"topic_id": "speed_problems", "name": "Speed Problems", "category": "Quantitative", "icon": "flash", "description": "Speed, velocity, and rate problems"},
    {"topic_id": "mixture_problems", "name": "Mixture Problems", "category": "Quantitative", "icon": "flask", "description": "Mixing solutions and alligation"},
    {"topic_id": "inequalities", "name": "Inequalities", "category": "Quantitative", "icon": "greater-than-or-equal", "description": "Solve and compare inequalities"},
    {"topic_id": "critical_thinking", "name": "Critical Thinking", "category": "Logical", "icon": "lightbulb-on", "description": "Evaluate arguments and make judgments"},
    {"topic_id": "decision_making", "name": "Decision Making", "category": "Logical", "icon": "road-variant", "description": "Choose optimal solutions from options"},
    {"topic_id": "game_theory", "name": "Game Theory Basics", "category": "Logical", "icon": "gamepad-variant", "description": "Strategic thinking and game theory"},
    {"topic_id": "seating_arrangement", "name": "Seating Arrangement", "category": "Logical", "icon": "seat", "description": "Arrange people based on given conditions"},
]

SEED_QUESTIONS = [
    {"question_id": "prob_001", "topic_id": "probability", "difficulty": "beginner", "question": "A coin is tossed twice. What is the probability of getting at least one head?", "options": ["1/4", "1/2", "3/4", "1"], "correct_answer": 2, "explanation": "Total outcomes = 4 (HH, HT, TH, TT). Favorable outcomes = 3 (at least one H). P = 3/4."},
    {"question_id": "prob_002", "topic_id": "probability", "difficulty": "intermediate", "question": "Two dice are thrown. What is the probability that the sum is 7?", "options": ["1/9", "1/6", "5/36", "7/36"], "correct_answer": 1, "explanation": "Favorable outcomes: (1,6),(2,5),(3,4),(4,3),(5,2),(6,1) = 6. Total = 36. P = 6/36 = 1/6."},
    {"question_id": "tw_001", "topic_id": "time_work", "difficulty": "beginner", "question": "A can do a piece of work in 10 days and B can do it in 15 days. In how many days can they together finish the work?", "options": ["5 days", "6 days", "7 days", "8 days"], "correct_answer": 1, "explanation": "A's rate = 1/10, B's rate = 1/15. Combined = 1/10 + 1/15 = 5/30 = 1/6. They finish in 6 days."},
    {"question_id": "tw_002", "topic_id": "time_work", "difficulty": "intermediate", "question": "A does 1/3 of a work in 5 days. B does 2/5 of the work in 10 days. In how many days can both together finish the work?", "options": ["75/8 days", "75/4 days", "10 days", "12 days"], "correct_answer": 0, "explanation": "A's rate = (1/3)/5 = 1/15 per day. B's rate = (2/5)/10 = 1/25 per day. Combined = 1/15+1/25 = 8/75. Days = 75/8."},
    {"question_id": "pct_001", "topic_id": "percentages", "difficulty": "beginner", "question": "What is 25% of 200?", "options": ["25", "40", "50", "75"], "correct_answer": 2, "explanation": "25% of 200 = (25/100) × 200 = 50."},
    {"question_id": "pct_002", "topic_id": "percentages", "difficulty": "intermediate", "question": "If a number is increased by 20% and then decreased by 20%, the net change is:", "options": ["No change", "4% increase", "4% decrease", "2% decrease"], "correct_answer": 2, "explanation": "Let number = 100. After 20% increase: 120. After 20% decrease: 120 × 0.8 = 96. Net change = 4% decrease."},
    {"question_id": "rp_001", "topic_id": "ratio_proportion", "difficulty": "beginner", "question": "If A:B = 2:3 and B:C = 4:5, find A:B:C.", "options": ["8:12:15", "2:3:5", "4:6:5", "8:12:10"], "correct_answer": 0, "explanation": "Make B common: A:B = 8:12, B:C = 12:15. So A:B:C = 8:12:15."},
    {"question_id": "ns_001", "topic_id": "number_series", "difficulty": "beginner", "question": "Find the next number: 2, 6, 12, 20, 30, ?", "options": ["40", "42", "44", "48"], "correct_answer": 1, "explanation": "Differences: 4, 6, 8, 10, 12. Next number = 30 + 12 = 42."},
    {"question_id": "pl_001", "topic_id": "profit_loss", "difficulty": "beginner", "question": "A shopkeeper buys an article for ₹500 and sells it for ₹600. What is the profit percentage?", "options": ["10%", "15%", "20%", "25%"], "correct_answer": 2, "explanation": "Profit = 600 - 500 = 100. Profit % = (100/500) × 100 = 20%."},
    {"question_id": "lr_001", "topic_id": "logical_reasoning", "difficulty": "beginner", "question": "All cats are animals. Some animals are wild. Which conclusion is valid?", "options": ["All cats are wild", "Some cats are wild", "Some cats may be wild", "No cats are wild"], "correct_answer": 2, "explanation": "We can't definitively say some cats are wild, but the possibility exists since cats are animals and some animals are wild."},
]

async def seed_aptitude_data():
    count = await db.aptitude_topics.count_documents({})
    if count >= 40:
        return
    await db.aptitude_topics.delete_many({})
    await db.aptitude_questions.delete_many({})
    for t in APTITUDE_TOPICS:
        t["total_questions"] = 0
        t["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.aptitude_topics.insert_many(APTITUDE_TOPICS)
    for q in SEED_QUESTIONS:
        q["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.aptitude_questions.insert_many(SEED_QUESTIONS)
    for tid in set(q["topic_id"] for q in SEED_QUESTIONS):
        cnt = len([q for q in SEED_QUESTIONS if q["topic_id"] == tid])
        await db.aptitude_topics.update_one({"topic_id": tid}, {"$set": {"total_questions": cnt}})
    logging.info("Seeded aptitude data: %d topics, %d questions", len(APTITUDE_TOPICS), len(SEED_QUESTIONS))

# ─── AI Question Generation ───
async def generate_questions_for_topic(topic_id: str, topic_name: str, difficulty: str = "beginner", count: int = 3):
    prompt = f"""Generate {count} multiple choice aptitude questions about "{topic_name}" at {difficulty} difficulty level.

For each question, provide:
1. The question text
2. 4 answer options
3. The correct answer index (0-3)
4. A clear step-by-step explanation

Format your response as a JSON array:
[{{"question": "...", "options": ["A", "B", "C", "D"], "correct_answer": 0, "explanation": "..."}}]

Only output the JSON array, nothing else."""

    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"qgen_{topic_id}_{uuid.uuid4().hex[:6]}", system_message="You are an expert aptitude question generator. Output only valid JSON.")
        chat.with_model("openai", "gpt-5.2")
        response = await chat.send_message(UserMessage(text=prompt))
        import json
        clean = response.strip()
        if clean.startswith("```"):
            clean = clean.split("\n", 1)[1].rsplit("```", 1)[0]
        questions_data = json.loads(clean)
        generated = []
        for i, q in enumerate(questions_data):
            qid = f"{topic_id}_{uuid.uuid4().hex[:8]}"
            doc = {
                "question_id": qid,
                "topic_id": topic_id,
                "difficulty": difficulty,
                "question": q["question"],
                "options": q["options"],
                "correct_answer": q["correct_answer"],
                "explanation": q["explanation"],
                "ai_generated": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            generated.append(doc)
        if generated:
            await db.aptitude_questions.insert_many(generated)
            await db.aptitude_topics.update_one({"topic_id": topic_id}, {"$inc": {"total_questions": len(generated)}})
        return generated
    except Exception as e:
        logging.error("Failed to generate questions: %s", str(e))
        return []

# ─── Startup Event ───
@app.on_event("startup")
async def startup():
    await seed_aptitude_data()
    logging.info("XOVA backend started")

# ─── Auth Endpoints ───
@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(400, "Missing session_id")
    async with httpx.AsyncClient() as http_client:
        r = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if r.status_code != 200:
            raise HTTPException(400, "Invalid session")
        data = r.json()
    existing = await db.users.find_one({"email": data["email"]}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"user_id": user_id}, {"$set": {"name": data["name"], "picture": data.get("picture", "")}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id, "email": data["email"], "name": data["name"],
            "picture": data.get("picture", ""), "plan": "free",
            "credits_used_today": 0, "last_credit_reset": "",
            "mentor_personality": "friendly", "mentor_voice": "female",
            "mentor_style": "cyberpunk", "streak": 0, "last_active_date": "",
            "total_questions_answered": 0, "total_correct": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    session_token = f"sess_{uuid.uuid4().hex}"
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    response.set_cookie(key="session_token", value=session_token, path="/", httponly=True, secure=True, samesite="none", max_age=7*24*60*60)
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"session_token": session_token, "user": user}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out"}

# ─── Dashboard ───
@api_router.get("/dashboard")
async def get_dashboard(request: Request):
    user = await get_current_user(request)
    uid = user["user_id"]
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    questions_today = await db.aptitude_progress.count_documents({"user_id": uid, "date": today})
    plan = user.get("plan", "free")
    max_credits = PLAN_LIMITS.get(plan, 10)
    credits_used = user.get("credits_used_today", 0)
    if user.get("last_credit_reset", "") != today:
        credits_used = 0
    streak = user.get("streak", 0)
    last_active = user.get("last_active_date", "")
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
    if last_active == yesterday or last_active == today:
        if last_active != today:
            streak += 1
            await db.users.update_one({"user_id": uid}, {"$set": {"streak": streak, "last_active_date": today}})
    elif last_active != today:
        streak = 1
        await db.users.update_one({"user_id": uid}, {"$set": {"streak": streak, "last_active_date": today}})
    greetings = [
        f"Welcome back, {user.get('name', 'Student')}! Ready to conquer today?",
        f"Hey {user.get('name', 'Student')}! Let's level up your skills!",
        f"Good to see you, {user.get('name', 'Student')}! Your AI mentor is ready.",
    ]
    return {
        "greeting": random.choice(greetings),
        "daily_mission": {"title": "Complete 5 Aptitude Questions", "progress": min(questions_today, 5), "target": 5},
        "stats": {
            "streak": streak,
            "questions_answered": user.get("total_questions_answered", 0),
            "accuracy": round((user.get("total_correct", 0) / max(user.get("total_questions_answered", 1), 1)) * 100),
            "topics_mastered": await db.aptitude_progress.count_documents({"user_id": uid, "accuracy": {"$gte": 80}})
        },
        "credits": {"plan": plan, "used": credits_used, "max": max_credits, "remaining": max(max_credits - credits_used, 0)},
        "user": user
    }

# ─── Chat Endpoints ───
@api_router.post("/chat/send")
async def send_chat(request: Request, body: ChatRequest):
    user = await get_current_user(request)
    uid = user["user_id"]
    has_credit = await check_and_use_credit(uid)
    if not has_credit:
        raise HTTPException(429, "Daily credit limit reached. Upgrade your plan for more responses.")
    personality = body.personality or user.get("mentor_personality", "friendly")
    chat = get_chat_session(uid, personality)
    try:
        ai_response = await chat.send_message(UserMessage(text=body.message))
    except Exception as e:
        logging.error("AI error: %s", str(e))
        ai_response = "I apologize, I encountered an issue. Please try again."
    now = datetime.now(timezone.utc).isoformat()
    user_msg = {"message_id": f"msg_{uuid.uuid4().hex[:12]}", "user_id": uid, "role": "user", "content": body.message, "timestamp": now}
    ai_msg = {"message_id": f"msg_{uuid.uuid4().hex[:12]}", "user_id": uid, "role": "assistant", "content": ai_response, "timestamp": now}
    await db.chat_messages.insert_many([user_msg, ai_msg])
    return {"response": ai_response, "message_id": ai_msg["message_id"]}

@api_router.get("/chat/history")
async def get_chat_history(request: Request, limit: int = 50):
    user = await get_current_user(request)
    messages = await db.chat_messages.find({"user_id": user["user_id"]}, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    messages.reverse()
    return {"messages": messages}

@api_router.delete("/chat/history")
async def clear_chat_history(request: Request):
    user = await get_current_user(request)
    uid = user["user_id"]
    await db.chat_messages.delete_many({"user_id": uid})
    for key in list(chat_sessions.keys()):
        if key.startswith(uid):
            del chat_sessions[key]
    return {"message": "Chat history cleared"}

# ─── Aptitude Endpoints ───
@api_router.get("/aptitude/topics")
async def get_aptitude_topics(request: Request):
    await get_current_user(request)
    topics = await db.aptitude_topics.find({}, {"_id": 0}).to_list(100)
    return {"topics": topics}

@api_router.get("/aptitude/topics/{topic_id}/questions")
async def get_topic_questions(request: Request, topic_id: str, difficulty: str = "beginner"):
    user = await get_current_user(request)
    questions = await db.aptitude_questions.find({"topic_id": topic_id, "difficulty": difficulty}, {"_id": 0}).to_list(50)
    if len(questions) < 3:
        topic = await db.aptitude_topics.find_one({"topic_id": topic_id}, {"_id": 0})
        if topic:
            new_qs = await generate_questions_for_topic(topic_id, topic["name"], difficulty, 5)
            questions = await db.aptitude_questions.find({"topic_id": topic_id, "difficulty": difficulty}, {"_id": 0}).to_list(50)
    progress = await db.aptitude_progress.find_one({"user_id": user["user_id"], "topic_id": topic_id}, {"_id": 0})
    return {"questions": questions, "progress": progress}

@api_router.post("/aptitude/submit")
async def submit_aptitude_answer(request: Request, body: AptitudeSubmit):
    user = await get_current_user(request)
    uid = user["user_id"]
    question = await db.aptitude_questions.find_one({"question_id": body.question_id}, {"_id": 0})
    if not question:
        raise HTTPException(404, "Question not found")
    is_correct = body.selected_answer == question["correct_answer"]
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    await db.aptitude_attempts.insert_one({
        "attempt_id": f"att_{uuid.uuid4().hex[:12]}", "user_id": uid,
        "topic_id": body.topic_id, "question_id": body.question_id,
        "selected_answer": body.selected_answer, "is_correct": is_correct,
        "date": today, "timestamp": datetime.now(timezone.utc).isoformat()
    })
    progress = await db.aptitude_progress.find_one({"user_id": uid, "topic_id": body.topic_id}, {"_id": 0})
    if progress:
        new_correct = progress.get("correct", 0) + (1 if is_correct else 0)
        new_total = progress.get("total", 0) + 1
        accuracy = round((new_correct / new_total) * 100)
        new_difficulty = progress.get("current_difficulty", "beginner")
        if accuracy >= 80 and new_total >= 5:
            if new_difficulty == "beginner":
                new_difficulty = "intermediate"
            elif new_difficulty == "intermediate":
                new_difficulty = "advanced"
        elif accuracy < 40 and new_total >= 3:
            if new_difficulty == "advanced":
                new_difficulty = "intermediate"
            elif new_difficulty == "intermediate":
                new_difficulty = "beginner"
        await db.aptitude_progress.update_one(
            {"user_id": uid, "topic_id": body.topic_id},
            {"$set": {"correct": new_correct, "total": new_total, "accuracy": accuracy, "current_difficulty": new_difficulty, "last_attempt": datetime.now(timezone.utc).isoformat()}}
        )
    else:
        await db.aptitude_progress.insert_one({
            "user_id": uid, "topic_id": body.topic_id,
            "correct": 1 if is_correct else 0, "total": 1,
            "accuracy": 100 if is_correct else 0,
            "current_difficulty": "beginner",
            "last_attempt": datetime.now(timezone.utc).isoformat(), "date": today
        })
    await db.users.update_one({"user_id": uid}, {"$inc": {"total_questions_answered": 1, "total_correct": 1 if is_correct else 0}})
    return {
        "is_correct": is_correct,
        "correct_answer": question["correct_answer"],
        "explanation": question["explanation"],
        "question": question
    }

@api_router.get("/aptitude/progress")
async def get_aptitude_progress(request: Request):
    user = await get_current_user(request)
    progress = await db.aptitude_progress.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    return {"progress": progress}

# ─── Interview Endpoints ───
@api_router.post("/interview/question")
async def get_interview_question(request: Request, body: InterviewRequest):
    user = await get_current_user(request)
    has_credit = await check_and_use_credit(user["user_id"])
    if not has_credit:
        raise HTTPException(429, "Daily credit limit reached")
    category_prompts = {
        "hr": "Generate one realistic HR interview question that tests communication and personality. Just the question, nothing else.",
        "technical": "Generate one technical interview question for a software engineering role. Just the question, nothing else.",
        "behavioral": "Generate one behavioral interview question using the STAR method format. Just the question, nothing else.",
        "startup": "Generate one interview question that tests entrepreneurial thinking and innovation. Just the question, nothing else."
    }
    prompt = category_prompts.get(body.category, category_prompts["hr"])
    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"interview_{uuid.uuid4().hex[:8]}", system_message="You are an expert interviewer.")
        chat.with_model("openai", "gpt-5.2")
        question = await chat.send_message(UserMessage(text=prompt))
        return {"question": question.strip()}
    except Exception as e:
        return {"question": "Tell me about yourself and your key strengths."}

@api_router.post("/interview/evaluate")
async def evaluate_interview(request: Request, body: EvaluateRequest):
    user = await get_current_user(request)
    has_credit = await check_and_use_credit(user["user_id"])
    if not has_credit:
        raise HTTPException(429, "Daily credit limit reached")
    prompt = f"""Evaluate this interview answer:

Question: {body.question}
Answer: {body.answer}

Provide:
1. Clarity Score (0-100)
2. Confidence Score (0-100)
3. Structure Score (0-100)
4. Communication Score (0-100)
5. Overall Score (0-100)
6. Specific improvement suggestions (3 bullet points)
7. What was done well (2 bullet points)

Format as JSON: {{"clarity": 0, "confidence": 0, "structure": 0, "communication": 0, "overall": 0, "improvements": ["..."], "strengths": ["..."]}}
Only output the JSON."""

    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"eval_{uuid.uuid4().hex[:8]}", system_message="You are an expert interview evaluator. Output only valid JSON.")
        chat.with_model("openai", "gpt-5.2")
        response = await chat.send_message(UserMessage(text=prompt))
        import json
        clean = response.strip()
        if clean.startswith("```"):
            clean = clean.split("\n", 1)[1].rsplit("```", 1)[0]
        evaluation = json.loads(clean)
        return {"evaluation": evaluation}
    except Exception as e:
        return {"evaluation": {"clarity": 70, "confidence": 65, "structure": 60, "communication": 70, "overall": 66, "improvements": ["Structure your answer better", "Add specific examples", "Be more concise"], "strengths": ["Good start", "Relevant points"]}}

# ─── Career Guidance ───
@api_router.post("/career/guidance")
async def get_career_guidance(request: Request, body: CareerRequest):
    user = await get_current_user(request)
    has_credit = await check_and_use_credit(user["user_id"])
    if not has_credit:
        raise HTTPException(429, "Daily credit limit reached")
    prompt = f"""Create a career guidance roadmap for someone interested in "{body.field}".

Include:
1. Overview of the field (2-3 sentences)
2. Required skills (5 key skills)
3. Learning roadmap (6 month plan with monthly milestones)
4. Recommended resources (3 resources)
5. Practice recommendations (3 items)

Format as JSON: {{"overview": "...", "skills": ["..."], "roadmap": [{{"month": 1, "focus": "...", "tasks": ["..."]}}], "resources": ["..."], "practice": ["..."]}}
Only output JSON."""

    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"career_{uuid.uuid4().hex[:8]}", system_message="You are an expert career counselor. Output only valid JSON.")
        chat.with_model("openai", "gpt-5.2")
        response = await chat.send_message(UserMessage(text=prompt))
        import json
        clean = response.strip()
        if clean.startswith("```"):
            clean = clean.split("\n", 1)[1].rsplit("```", 1)[0]
        guidance = json.loads(clean)
        return {"guidance": guidance}
    except Exception as e:
        logging.error("Career guidance error: %s", str(e))
        return {"guidance": {"overview": f"The field of {body.field} offers exciting opportunities.", "skills": ["Problem solving", "Communication", "Technical knowledge", "Teamwork", "Continuous learning"], "roadmap": [{"month": 1, "focus": "Fundamentals", "tasks": ["Study core concepts", "Set up development environment"]}], "resources": ["Online courses", "Documentation", "Practice projects"], "practice": ["Build projects", "Solve problems daily", "Join communities"]}}

# ─── Startup Mentor ───
@api_router.post("/startup/advice")
async def get_startup_advice(request: Request, body: StartupRequest):
    user = await get_current_user(request)
    has_credit = await check_and_use_credit(user["user_id"])
    if not has_credit:
        raise HTTPException(429, "Daily credit limit reached")
    prompt = f"""Analyze this startup idea: "{body.idea}"

Provide:
1. Idea Validation Score (0-100)
2. Market potential assessment
3. Key strengths of the idea (3 points)
4. Key challenges (3 points)
5. Product development steps (5 steps)
6. Marketing strategy suggestions (3 suggestions)
7. Growth strategy (3 strategies)

Format as JSON: {{"score": 0, "market": "...", "strengths": ["..."], "challenges": ["..."], "dev_steps": ["..."], "marketing": ["..."], "growth": ["..."]}}
Only output JSON."""

    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"startup_{uuid.uuid4().hex[:8]}", system_message="You are an expert startup mentor and VC advisor. Output only valid JSON.")
        chat.with_model("openai", "gpt-5.2")
        response = await chat.send_message(UserMessage(text=prompt))
        import json
        clean = response.strip()
        if clean.startswith("```"):
            clean = clean.split("\n", 1)[1].rsplit("```", 1)[0]
        advice = json.loads(clean)
        return {"advice": advice}
    except Exception as e:
        logging.error("Startup advice error: %s", str(e))
        return {"advice": {"score": 65, "market": "Interesting market opportunity.", "strengths": ["Novel concept", "Growing market", "Clear target audience"], "challenges": ["Competition", "Funding needs", "Market education"], "dev_steps": ["Validate idea", "Build MVP", "Get early users", "Iterate", "Scale"], "marketing": ["Social media", "Content marketing", "Partnerships"], "growth": ["Viral loops", "Referral program", "Strategic partnerships"]}}

# ─── User Profile & Settings ───
@api_router.get("/user/profile")
async def get_profile(request: Request):
    user = await get_current_user(request)
    return user

@api_router.put("/user/settings")
async def update_settings(request: Request, body: SettingsUpdate):
    user = await get_current_user(request)
    updates = {}
    if body.mentor_personality:
        updates["mentor_personality"] = body.mentor_personality
    if body.mentor_voice:
        updates["mentor_voice"] = body.mentor_voice
    if body.mentor_style:
        updates["mentor_style"] = body.mentor_style
    if updates:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": updates})
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return updated

@api_router.get("/user/credits")
async def get_credits(request: Request):
    user = await get_current_user(request)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    credits_used = user.get("credits_used_today", 0)
    if user.get("last_credit_reset", "") != today:
        credits_used = 0
    plan = user.get("plan", "free")
    max_credits = PLAN_LIMITS.get(plan, 10)
    return {"plan": plan, "used": credits_used, "max": max_credits, "remaining": max(max_credits - credits_used, 0)}

@api_router.post("/user/upgrade")
async def upgrade_plan(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    plan = body.get("plan", "lite")
    if plan not in PLAN_LIMITS:
        raise HTTPException(400, "Invalid plan")
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"plan": plan, "credits_used_today": 0}})
    return {"message": f"Upgraded to {plan} plan", "plan": plan}

# ─── Health Check ───
@api_router.get("/")
async def root():
    return {"message": "XOVA API is running", "version": "1.0.0"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
