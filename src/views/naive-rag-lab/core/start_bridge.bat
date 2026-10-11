@echo off
chcp 65001 >nul
title Naive RAG Lab - Python Bridge Server
cd /d "%~dp0"
echo ===================================================
echo   Naive RAG Lab — Python HTTP Bridge Server
echo ===================================================
echo.
python bridge.py
pause

