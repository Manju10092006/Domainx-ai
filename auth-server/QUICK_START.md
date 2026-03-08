# Quick Start Guide

## Step 1: Create .env file

Create a file named `.env` in the `auth-server` folder with the following content:

```
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
SESSION_SECRET=any-random-string-for-session-security
PORT=8000
```

## Step 2: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set Application type to "Web application"
6. Add authorized redirect URI: `http://localhost:8000/auth/google/callback`
7. Copy the Client ID and Client Secret to your `.env` file

## Step 3: Start the Server

Run one of these commands:

```bash
npm start
```

Or on Windows:
```bash
start-server.bat
```

The server will start on `http://localhost:8000`

## Step 4: Test

1. Open your frontend (should be running on `http://localhost:3000`)
2. Click "Sign in with Google"
3. You should be redirected to Google's login page
4. After authentication, you'll be redirected back to your frontend

## Troubleshooting

- **"Cannot find module"**: Run `npm install` first
- **"Port 8000 already in use"**: Change PORT in .env or stop the other service
- **"Invalid credentials"**: Check your Google OAuth Client ID and Secret in .env
- **"Redirect URI mismatch"**: Make sure the redirect URI in Google Console matches exactly: `http://localhost:8000/auth/google/callback`

