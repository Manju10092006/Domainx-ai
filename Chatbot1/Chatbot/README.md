# Career Assistant Chatbot Widget (Puter.js + SQLite)

A mini job & company Q&A chatbot widget.

- **No AI API key needed** — AI runs free via [Puter.js](https://js.puter.com/v2/)
- **No database installation needed** — uses SQLite (pure JS, file-based, works on every laptop)
- Frontend: HTML/CSS/vanilla JS floating widget
- Backend: Node.js + Express
- DB: SQLite via `sql.js` (zero native dependencies)

## 1) Prerequisites

- Node.js 18+ (that's it!)

## 2) Backend setup

### Install & run

```bash
cd backend
npm install
npm start
```

That's all. The backend will:
- Automatically create `backend/chatbot.db` (SQLite file) on first run
- Auto-create the `users` and `conversations` tables
- Serve the frontend at `http://localhost:5000`

### Environment (optional)

`/backend/.env` only needs:

```env
PORT=5000
```

## 3) Open the demo page

With the backend running, open your browser at:

```
http://localhost:5000
```

You'll see the full **TechHire** job portal demo with the chatbot widget in the bottom-right corner.

**First time only:** Puter.js will ask you to sign in with a free Puter account — sign up once and the AI works for free forever.

## 4) Embed on any existing page

Add these 3 lines to your HTML:

```html
<link rel="stylesheet" href="/path/to/widget.css" />
<script src="https://js.puter.com/v2/"></script>
<script src="/path/to/widget.js"></script>
```

The widget appears fixed at the bottom-right of any page.

## 5) API

### POST `/api/chat`

Saves a conversation turn to SQLite (AI reply is generated on the frontend by Puter.js).

Body:
```json
{ "userId": "<uuid>", "message": "Hello", "reply": "Hi there!" }
```

Response:
```json
{ "reply": "Hi there!" }
```

### GET `/api/history/:userId`

Returns last 20 messages (chronological):
```json
{ "messages": [{ "user_message": "...", "bot_response": "...", "created_at": "..." }] }
```

### GET `/health`

```json
{ "ok": true }
```

## Notes

- Rate limit: **20 requests / IP / minute** on `/api/*`
- Chat history is persisted in `backend/chatbot.db` (SQLite file — safe to delete to reset)
- AI is 100% free via Puter.js, runs in the browser, no server-side API calls
