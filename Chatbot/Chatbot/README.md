# Career Assistant Chatbot Widget (Puter.js + MySQL)

A mini job & company Q&A chatbot widget. **No AI API key needed** — AI runs free via [Puter.js](https://js.puter.com/v2/).

- Frontend: HTML/CSS/vanilla JS (floating widget) + Puter.js for AI
- Backend: Node.js + Express (stores chat history only)
- DB: MySQL

## 1) Prerequisites

- Node.js 18+
- MySQL 8+ (or compatible, e.g. MySQL Workbench)

## 2) Create MySQL database

Open MySQL Workbench and run:

```sql
CREATE DATABASE chatbot_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

The backend **auto-creates** the `users` and `conversations` tables on first startup.

## 3) Backend setup

### Configure environment

Edit `/backend/.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=chatbot_db
PORT=5000
```

### Install & run

```bash
cd backend
npm install
npm start
```

Backend runs at `http://localhost:5000`.

Health check: `GET http://localhost:5000/health` → `{ "ok": true }`

## 4) Open the demo page

With the backend running, open your browser at:

```
http://localhost:5000
```

This serves the full TechHire job portal demo (`index.html`) with the chatbot widget embedded in the bottom-right corner.

On first use, Puter.js may ask you to sign in with a free Puter account — this is required to use their AI for free.

## 5) Embed on any existing page (2 lines)

```html
<link rel="stylesheet" href="/path/to/widget.css" />
<script src="https://js.puter.com/v2/"></script>
<script src="/path/to/widget.js"></script>
```

The widget will appear fixed at the bottom-right of any page.

## 6) API

### POST `/api/chat`

Saves a conversation turn (AI reply comes from frontend Puter.js call).

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

## Notes

- Rate limit: **20 requests / IP / minute** on `/api/*`
- AI is completely free via Puter.js — no API key required
- Puter.js runs entirely in the browser; the backend only stores history
