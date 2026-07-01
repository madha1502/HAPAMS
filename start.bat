@echo off
title HAPAMS Runner
echo ==========================================================
echo       Starting HAPAMS (Hostel Performance Analytics)      
echo ==========================================================
echo.

echo Starting Backend Server (Express)...
start "HAPAMS Backend" cmd /k "cd backend && npm run dev"

echo Starting Frontend Server (Vite)...
start "HAPAMS Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ==========================================================
echo  Servers are starting in separate windows.
echo  - Backend runs at: http://localhost:5000
echo  - Frontend runs at: http://localhost:5173
echo ==========================================================
pause
