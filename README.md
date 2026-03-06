# Appoint Buddy

Appoint Buddy is an agentic voice AI receptionist that uses ElevenLabs Conversational AI and tool calling to find and book the best appointment. This repo includes:

- **Backend**: FastAPI service that creates an ElevenLabs agent and exposes tool webhooks.
- **Frontend**: Lovable-built React UI to start conversations and visualize transcripts/tool calls.

## Project status

This project is **not deployed** due to time constraints. I am a **virtual participant** and focused on delivering a working local demo.

## Features

- ElevenLabs conversational agent creation via `/start`
- Tool calling for provider lookup, simulated calls, and scoring
- Local demo UI with transcripts and tool logs

## Tech stack

- Backend: Python, FastAPI, ElevenLabs SDK
- Frontend: Vite, React, TypeScript, Tailwind, shadcn/ui

## Repository structure

- `main.py` — FastAPI backend
- `requirements.txt` — backend dependencies
- `callpilot-ai-main/` — frontend app

## Prerequisites

- Python 3.10+
- Node.js 18+
- ElevenLabs API key with `convai_write` permission

## Backend setup

1) Create a backend `.env` in the repo root:

```
ELEVENLABS_API_KEY=your_key_here
PUBLIC_BASE_URL=http://localhost:8000
```

2) Install and run:

```
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000
```

3) Verify:

```
curl -X POST http://127.0.0.1:8000/start
```

You should receive:

```
{"agent_url":"wss://api.elevenlabs.io/v1/convai/conversation?agent_id=..."}
```

## Frontend setup

1) Go to the frontend directory:

```
cd callpilot-ai-main
```

2) Install and run:

```
npm install
npm run dev
```

3) Open the UI:

```
http://localhost:8080
```

## Local demo flow

1) Start backend.
2) Start frontend.
3) Click the microphone button and allow mic permissions.
4) The UI calls `/start`, then connects to ElevenLabs and streams the conversation.

## Notes about deployment

This repository is intended for local demo only at the moment. If deployed later:

- Store `ELEVENLABS_API_KEY` as a server-side secret.
- Set `PUBLIC_BASE_URL` to the public backend URL.
- Update CORS to only allow your frontend domain.

## Security

- **Never** place the ElevenLabs API key in the frontend `.env`.
- Only store the key in the backend `.env` or your cloud provider’s secret manager.

## License

MIT (or specify your preferred license)
