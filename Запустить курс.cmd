@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  QA-course: http://localhost:8801
echo  Ctrl+C - stop
echo.
start "" http://localhost:8801
python -m http.server 8801
