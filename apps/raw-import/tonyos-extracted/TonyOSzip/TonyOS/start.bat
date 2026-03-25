@echo off
echo Starting TonyOS...
echo.
cd /d "%~dp0"

if not exist ".env" (
    echo ERROR: Missing .env file
    echo Create a file called .env with your API key:
    echo OPENAI_API_KEY=your-key-here
    echo.
    pause
    exit /b 1
)

python app.py
pause
