@echo off
title RS Paper and Packaging Server
color 0A

echo ========================================================
echo    RS Paper and Packaging - Factory ERP Server
echo ========================================================
echo.
echo Starting the server on http://localhost:5000 ...
echo Press Ctrl + C to stop the server anytime.
echo.

:: Automatically open browser after 2 seconds
start "" http://localhost:5000

:: Start the node server
node server/index.js

pause
