import os
import re
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from dotenv import load_dotenv

load_dotenv()

ANAM_API_KEY        = os.getenv("ANAM_API_KEY", "")
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
ANTHROPIC_API_KEY   = os.getenv("ANTHROPIC_API_KEY", "")

app = FastAPI(title="Voice AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Models ────────────────────────────────────────────────────────────────────

class SessionRequest(BaseModel):
    persona_id: str

class ChatRequest(BaseModel):
    message: str

# ── Prompts & strings ─────────────────────────────────────────────────────────

SYSTEM_PROMPT = (
    "You are a warm, friendly voice assistant living inside an animated avatar. "
    "Your reply will be spoken aloud — never use markdown, bullet points, asterisks, pipes, hashtags, "
    "or any special characters. Plain spoken sentences only, 1–2 short sentences maximum. "
    "Be natural and conversational, like a real person. Never say you are an AI unless asked directly. "
    "If the user asks about weather, remind them to say the city name, e.g. 'What is the weather in London?'"
)

def clean_for_speech(text: str) -> str:
    """Strip markdown and special chars that TTS would pronounce literally."""
    # Remove markdown formatting
    text = re.sub(r'[*_`~#|\\^]', '', text)
    # Remove markdown links [text](url)
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
    # Replace dashes used as bullet points at line start
    text = re.sub(r'^\s*[-•]\s+', '', text, flags=re.MULTILINE)
    # Collapse multiple spaces / newlines into a single space
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

WEATHER_RESPONSE = (
    "Right now in {city}, it's {desc}. "
    "The temperature is {temp} degrees Celsius, feeling like {feels}. "
    "Today's high is {hi} and the low is {lo}. "
    "Humidity is {hum} percent, with winds at {wind} kilometres per hour."
)

CITY_ASK  = "Which city would you like the weather for?"
NOT_FOUND = "Sorry, I couldn't find '{city}'. Could you check the spelling and try again?"
FALLBACK  = "I can help with the weather! Just say something like: what's the weather in Tokyo?"

# ── Weather helpers ───────────────────────────────────────────────────────────

WEATHER_KEYWORDS = {
    "weather", "temperature", "forecast", "rain", "sunny", "cloudy",
    "humidity", "wind", "hot", "cold", "snow", "storm", "thunder",
    "raining", "drizzle", "overcast", "haze", "fog", "mist", "temp",
}

CITY_PATTERNS = [
    r"weather\s+(?:in|at|for|of)\s+([A-Za-z\s,\-]+?)(?:\?|$|\.|,|\s+today|\s+now|\s+like)",
    r"(?:in|at|for|of)\s+([A-Za-z\s,\-]+?)\s+(?:weather|forecast|temperature|temp)",
    r"temperature\s+(?:in|at|of)\s+([A-Za-z\s,\-]+?)(?:\?|$|\.|,)",
    r"how\s+(?:is|'s|is\s+the)\s+(?:weather|climate)\s+(?:in|at|of)?\s*([A-Za-z\s,\-]+?)(?:\?|$|\.)",
    r"(?:what's|what\s+is)\s+(?:the\s+)?(?:weather|temperature|forecast)\s+(?:like\s+)?(?:in|at)?\s*([A-Za-z\s,\-]+?)(?:\?|$|\.)",
    r"([A-Za-z\s,\-]+?)\s+(?:weather|temperature|forecast|climate)(?:\?|$|\.|\s+today|\s+now)",
]

def is_weather_query(text: str) -> bool:
    return any(kw in text.lower() for kw in WEATHER_KEYWORDS)

def extract_city(text: str) -> str | None:
    for pattern in CITY_PATTERNS:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            city = m.group(1).strip().strip("?.,!").strip()
            if city and len(city) > 1 and city.lower() not in {
                "the", "a", "an", "me", "my", "i", "here", "there"
            }:
                return city
    return None

def format_weather(data: dict) -> str:
    return WEATHER_RESPONSE.format(
        city  = data["name"],
        desc  = data["weather"][0]["description"],
        temp  = round(data["main"]["temp"]),
        feels = round(data["main"]["feels_like"]),
        hi    = round(data["main"]["temp_max"]),
        lo    = round(data["main"]["temp_min"]),
        hum   = data["main"]["humidity"],
        wind  = round(data["wind"]["speed"] * 3.6),
    )

# ── LLM helper ────────────────────────────────────────────────────────────────

async def llm_respond(message: str) -> str:
    if not ANTHROPIC_API_KEY:
        return FALLBACK
    async with httpx.AsyncClient(timeout=12.0) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-haiku-4-5-20251001",
                "max_tokens": 100,
                "system": SYSTEM_PROMPT,
                "messages": [{"role": "user", "content": message}],
            },
        )
    if resp.status_code == 200:
        return clean_for_speech(resp.json()["content"][0]["text"])
    return FALLBACK

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"status": "Voice AI API is running", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/anam/personas")
async def list_anam_personas():
    if not ANAM_API_KEY:
        raise HTTPException(status_code=500, detail="ANAM_API_KEY not configured")
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(
            "https://api.anam.ai/v1/personas",
            headers={"Authorization": f"Bearer {ANAM_API_KEY}"},
            params={"perPage": 50},
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        return resp.json()


@app.post("/api/anam/session")
async def create_anam_session(request: SessionRequest):
    if not ANAM_API_KEY:
        raise HTTPException(status_code=500, detail="ANAM_API_KEY not configured")
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            "https://api.anam.ai/v1/auth/session-token",
            headers={"Authorization": f"Bearer {ANAM_API_KEY}", "Content-Type": "application/json"},
            json={"personaId": request.persona_id},
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        return resp.json()


@app.post("/api/chat")
async def chat(request: ChatRequest):
    message = request.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Empty message")

    # Weather path
    if is_weather_query(message):
        city = extract_city(message)
        if not city:
            return {"response": CITY_ASK, "type": "clarification"}
        if not OPENWEATHER_API_KEY:
            return {"response": "Weather API not configured.", "type": "error"}
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://api.openweathermap.org/data/2.5/weather",
                params={"q": city, "appid": OPENWEATHER_API_KEY, "units": "metric"},
            )
            if resp.status_code == 404:
                return {"response": NOT_FOUND.format(city=city), "type": "error"}
            if resp.status_code != 200:
                return {"response": "Weather service is temporarily unavailable.", "type": "error"}
            return {"response": format_weather(resp.json()), "type": "weather"}

    # General conversation — use LLM
    response = await llm_respond(message)
    return {"response": response, "type": "general"}
