@echo off
title RS Paper and Packaging - Dev Mode
color 0B

echo ========================================================
echo    RS Paper and Packaging - Development Mode
echo ========================================================
echo.
echo Starting client and server in dev mode...
echo.

start "" http://localhost:5173
npm run dev

pause
