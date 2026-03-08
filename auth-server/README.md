# Auth Server

Node.js + Express + Passport authentication server with Google OAuth.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Fill in your Google OAuth credentials in `.env`:
- Get credentials from [Google Cloud Console](https://console.cloud.google.com/)
- Create OAuth 2.0 Client ID
- Add authorized redirect URI: `http://localhost:8000/auth/google/callback`

4. Start the server:
```bash
npm start
```

The server will run on `http://localhost:8000`

## Endpoints

- `GET /auth/google` - Start Google OAuth flow
- `GET /auth/google/callback` - Google OAuth callback
- `GET /auth/user` - Get current logged-in user
- `GET /auth/logout` - Logout user
- `GET /health` - Health check

