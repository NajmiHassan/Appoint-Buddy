import asyncio
import logging
import os
import random
from datetime import datetime, timedelta
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from elevenlabs import ElevenLabs
from elevenlabs.types import ToolRequestModel
from elevenlabs.types.array_json_schema_property_input import ArrayJsonSchemaPropertyInput
from elevenlabs.types.literal_json_schema_property import LiteralJsonSchemaProperty
from elevenlabs.types.object_json_schema_property_input import ObjectJsonSchemaPropertyInput
from elevenlabs.types.tool_request_model_tool_config import ToolRequestModelToolConfig_Client

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("appointbuddy")

app = FastAPI(title="Appoint Buddy Backend")

_cors_origins = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]
_frontend_url = os.getenv("FRONTEND_URL")
if _frontend_url:
    _cors_origins.append(_frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_PROMPT = (
    "You are Appoint Buddy, an autonomous voice AI receptionist.\n"
    "Your goal is to help the user find and book the best appointment.\n\n"
    "Follow these steps:\n"
    "1. Ask the user what service they need and their location.\n"
    "2. Call lookup_providers to search Google for real nearby providers.\n"
    "3. Briefly tell the user what you found (names, ratings).\n"
    "4. Call simulate_call for the top 2-3 providers to check availability.\n"
    "5. Call score_options with the results to pick the best one.\n"
    "6. Recommend the best option with its name, rating, and available time. Ask if they'd like to book.\n"
    "7. When the user confirms, call book_appointment with the provider name, slot, and service.\n"
    "8. Confirm the booking to the user.\n\n"
    "Be concise and conversational. Mention real provider names and ratings from search results."
)

SERPER_API_URL = "https://google.serper.dev/places"

cached_providers: list[dict[str, Any]] = []


class LookupProvidersRequest(BaseModel):
    service: str = Field(..., description="Requested service (e.g., dental cleaning)")
    location: str = Field(..., description="City or neighborhood")


class SimulateCallRequest(BaseModel):
    provider_name: str = Field(..., description="Provider name to call")


class ProviderOption(BaseModel):
    provider_name: str
    rating: float
    distance_km: float
    available_slot: str | None = None


class ScoreOptionsRequest(BaseModel):
    options: list[ProviderOption]


class BookAppointmentRequest(BaseModel):
    provider_name: str = Field(..., description="Provider name to book with")
    slot: str = Field(..., description="ISO datetime of the appointment slot")
    service: str = Field(default="Appointment", description="Service being booked")


latest_appointment: dict[str, Any] | None = None


def _generate_fake_slots() -> list[str]:
    """Generate realistic-looking appointment slots for the next few days."""
    now = datetime.now()
    slots = []
    for day_offset in range(1, 5):
        day = now + timedelta(days=day_offset)
        hour = random.choice([9, 10, 11, 13, 14, 15, 16])
        minute = random.choice([0, 15, 30, 45])
        slot_dt = day.replace(hour=hour, minute=minute, second=0, microsecond=0)
        slots.append(slot_dt.isoformat())
    return random.sample(slots, min(2, len(slots)))


async def lookup_providers(service: str, location: str) -> dict[str, Any]:
    global cached_providers
    logger.info("lookup_providers called: service=%s location=%s", service, location)

    serper_key = os.getenv("SERPER_API_KEY")
    if not serper_key:
        logger.warning("SERPER_API_KEY not set — returning empty results")
        return {"service": service, "location": location, "providers": []}

    query = f"{service} near {location}"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                SERPER_API_URL,
                headers={"X-API-KEY": serper_key, "Content-Type": "application/json"},
                json={"q": query, "num": 5},
            )
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:
        logger.error("Serper API error: %s", e)
        return {"service": service, "location": location, "providers": []}

    places = data.get("places", [])
    providers = []
    for place in places[:5]:
        provider = {
            "name": place.get("title", "Unknown"),
            "rating": place.get("rating", round(random.uniform(3.5, 5.0), 1)),
            "address": place.get("address", ""),
            "phone": place.get("phoneNumber", ""),
            "distance_km": round(random.uniform(0.5, 10.0), 1),
            "slots": _generate_fake_slots(),
        }
        providers.append(provider)

    cached_providers = providers
    logger.info("Serper returned %d providers for '%s'", len(providers), query)

    return {
        "service": service,
        "location": location,
        "providers": providers,
    }


async def simulate_call(provider_name: str) -> dict[str, Any]:
    logger.info("simulate_call called: provider_name=%s", provider_name)
    await asyncio.sleep(random.uniform(0.5, 1.5))

    provider = next((p for p in cached_providers if p["name"] == provider_name), None)
    slot = provider["slots"][0] if provider and provider.get("slots") else None
    address = provider.get("address", "") if provider else ""
    return {"provider": provider_name, "available_slot": slot, "address": address}


def score_options(options: list[ProviderOption]) -> dict[str, Any]:
    logger.info("score_options called: %d options", len(options))
    best_option: ProviderOption | None = None
    best_score = float("-inf")

    for option in options:
        score = (option.rating * 2.0) - (option.distance_km * 0.5)
        if score > best_score:
            best_score = score
            best_option = option

    return {
        "best_option": best_option.model_dump() if best_option else None,
        "score": best_score,
    }


def book_appointment(provider_name: str, slot: str, service: str) -> dict[str, Any]:
    global latest_appointment
    logger.info("book_appointment called: provider=%s slot=%s service=%s", provider_name, slot, service)
    from datetime import datetime

    try:
        dt = datetime.fromisoformat(slot)
        date_str = dt.strftime("%B %d, %Y")
        time_str = dt.strftime("%I:%M %p")
    except ValueError:
        date_str = slot
        time_str = ""

    appt = {
        "id": f"appt-{int(datetime.now().timestamp())}",
        "title": service,
        "date": date_str,
        "time": time_str,
        "location": provider_name,
        "attendee": "You",
    }
    latest_appointment = appt
    return {"status": "confirmed", "appointment": appt}


def _extract_id(obj: Any) -> str:
    if hasattr(obj, "id"):
        return obj.id
    if isinstance(obj, dict) and "id" in obj:
        return obj["id"]
    raise ValueError("Tool creation did not return an id.")


def _extract_agent_id(obj: Any) -> str:
    if hasattr(obj, "agent_id"):
        return obj.agent_id
    if isinstance(obj, dict) and "agent_id" in obj:
        return obj["agent_id"]
    raise ValueError("Agent creation did not return an agent_id.")


@app.post("/tools/lookup_providers")
async def tool_lookup_providers(payload: LookupProvidersRequest) -> dict[str, Any]:
    return await lookup_providers(payload.service, payload.location)


@app.post("/tools/simulate_call")
async def tool_simulate_call(payload: SimulateCallRequest) -> dict[str, Any]:
    return await simulate_call(payload.provider_name)


@app.post("/tools/score_options")
async def tool_score_options(payload: ScoreOptionsRequest) -> dict[str, Any]:
    return score_options(payload.options)


@app.post("/tools/book_appointment")
async def tool_book_appointment(payload: BookAppointmentRequest) -> dict[str, Any]:
    return book_appointment(payload.provider_name, payload.slot, payload.service)


@app.get("/appointment/latest")
async def get_latest_appointment() -> dict[str, Any]:
    return {"appointment": latest_appointment}


@app.post("/start")
async def start(request: Request) -> dict[str, str]:
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ELEVENLABS_API_KEY is not set.")

    client = ElevenLabs(api_key=api_key)

    lookup_params = ObjectJsonSchemaPropertyInput(
        type="object",
        required=["service", "location"],
        properties={
            "service": LiteralJsonSchemaProperty(type="string", description="Service the user needs."),
            "location": LiteralJsonSchemaProperty(type="string", description="City or neighborhood."),
        },
    )

    lookup_tool = client.conversational_ai.tools.create(
        request=ToolRequestModel(
            tool_config=ToolRequestModelToolConfig_Client(
                name="lookup_providers",
                description="Searches Google for local providers for a given service and location. Returns real business names, ratings, and addresses.",
                parameters=lookup_params,
            )
        )
    )

    call_params = ObjectJsonSchemaPropertyInput(
        type="object",
        required=["provider_name"],
        properties={
            "provider_name": LiteralJsonSchemaProperty(type="string", description="Exact provider name to call."),
        },
    )

    call_tool = client.conversational_ai.tools.create(
        request=ToolRequestModel(
            tool_config=ToolRequestModelToolConfig_Client(
                name="simulate_call",
                description="Calls a provider to check their next available appointment slot.",
                parameters=call_params,
            )
        )
    )

    options_item_schema = ObjectJsonSchemaPropertyInput(
        type="object",
        required=["provider_name", "rating", "distance_km"],
        properties={
            "provider_name": LiteralJsonSchemaProperty(type="string", description="Provider name."),
            "rating": LiteralJsonSchemaProperty(type="number", description="Provider rating (0-5)."),
            "distance_km": LiteralJsonSchemaProperty(type="number", description="Distance in kilometers."),
            "available_slot": LiteralJsonSchemaProperty(type="string", description="ISO datetime for the best slot."),
        },
    )

    score_params = ObjectJsonSchemaPropertyInput(
        type="object",
        required=["options"],
        properties={
            "options": ArrayJsonSchemaPropertyInput(
                type="array",
                description="Provider options with availability.",
                items=options_item_schema,
            ),
        },
    )

    score_tool = client.conversational_ai.tools.create(
        request=ToolRequestModel(
            tool_config=ToolRequestModelToolConfig_Client(
                name="score_options",
                description="Scores provider options by rating and distance and returns the best one.",
                parameters=score_params,
            )
        )
    )

    book_params = ObjectJsonSchemaPropertyInput(
        type="object",
        required=["provider_name", "slot"],
        properties={
            "provider_name": LiteralJsonSchemaProperty(type="string", description="Provider name to book with."),
            "slot": LiteralJsonSchemaProperty(type="string", description="ISO datetime of the appointment slot."),
            "service": LiteralJsonSchemaProperty(type="string", description="Service being booked (e.g. dental cleaning)."),
        },
    )

    book_tool = client.conversational_ai.tools.create(
        request=ToolRequestModel(
            tool_config=ToolRequestModelToolConfig_Client(
                name="book_appointment",
                description="Books an appointment with the chosen provider and slot. Call this after the user confirms.",
                parameters=book_params,
            )
        )
    )

    tool_ids = [
        _extract_id(lookup_tool),
        _extract_id(call_tool),
        _extract_id(score_tool),
        _extract_id(book_tool),
    ]

    agent = client.conversational_ai.agents.create(
        conversation_config={
            "agent": {
                "prompt": {
                    "prompt": SYSTEM_PROMPT,
                    "tool_ids": tool_ids,
                }
            }
        },
        name="Appoint Buddy",
    )

    agent_id = _extract_agent_id(agent)
    agent_url = f"wss://api.elevenlabs.io/v1/convai/conversation?agent_id={agent_id}"

    return {"agent_url": agent_url}
