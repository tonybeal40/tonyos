#!/bin/bash
echo "Starting TonyOS..."
echo

cd "$(dirname "$0")"

if [ ! -f ".env" ]; then
    echo "ERROR: Missing .env file"
    echo "Create a file called .env with your API key:"
    echo "OPENAI_API_KEY=your-key-here"
    echo
    exit 1
fi

python3 app.py
