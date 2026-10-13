@echo off
title GLIM Cab Share Web App
echo =======================================================
echo    Starting GLIM Cab Share Web App...
echo =======================================================
echo.

cd /d "%~dp0"

:: Start the server in a new window or background
start /b node server/server.js

:: Wait 1.5 seconds for the server to initialize
timeout /t 2 /nobreak >nul

:: Automatically open default web browser
start http://localhost:3000

echo.
echo App is running at http://localhost:3000
echo You can close this window when you're done, or press Ctrl+C in the background to stop.
echo.
pause
