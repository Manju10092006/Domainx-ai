@echo off
echo Starting Auth Server...
echo.
echo IMPORTANT: Make sure you have created a .env file with your Google OAuth credentials!
echo.
echo If .env doesn't exist, create it with:
echo   GOOGLE_CLIENT_ID=your-client-id
echo   GOOGLE_CLIENT_SECRET=your-client-secret
echo   SESSION_SECRET=your-random-secret-key
echo   PORT=8000
echo.
pause
node server.js

