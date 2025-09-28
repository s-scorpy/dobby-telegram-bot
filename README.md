# Dobby Telegram Bot (Shit-Poster)

A tiny Telegram bot that turns your topic into **3 CT-ready tweets (≤240 chars)** in Dobby's voice.

## Commands
- `/dobby <topic>` → generate 3 options
- `/style <serious|explanatory|meme>` → set tone per chat
- `/help`, `/start`, `/ping`

## Local Setup
1) Install Node.js 18+ from https://nodejs.org
2) Create a bot via Telegram **@BotFather** → copy the token (TG_TOKEN)
3) `cp .env.example .env` and fill in `TG_TOKEN` + `OPENAI_API_KEY`
4) In a terminal: `npm i` then `npm run dev`
5) In Telegram, DM your bot: `/start` then `/dobby why dobby + ROMA`.

## Deploy (quick ideas)
- Any Node host works (Railway, Render, Fly). Set env vars and run `npm start`.

## Notes
- Model defaults to `gpt-4o-mini`. Change with `OPENAI_MODEL` if you prefer.
- Output is clamped to 240 characters per tweet.