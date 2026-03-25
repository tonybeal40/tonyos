import os
import textwrap
import requests
from flask import Flask, render_template, request, jsonify, send_file
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

app = Flask(__name__)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# In memory store for last result (simple MVP)
LAST_RESULT = ""


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/generate", methods=["POST"])
def generate():
    """
    Accepts JSON:
    {
      "url": "...",          # optional
      "brandName": "...",    # optional
      "answers": {           # StoryBrand Q&A
         "hero": "...",
         "want": "...",
         "problem": "...",
         "villain": "...",
         "guide": "...",
         "plan": "...",
         "cta": "...",
         "stakes": "...",
         "success": "..."
      }
    }
    """
    data = request.get_json(force=True)
    url = data.get("url") or ""
    brand_name = data.get("brandName") or ""
    answers = data.get("answers") or {}

    website_text = ""
    if url.strip():
        try:
            resp = requests.get(url, timeout=10)
            resp.raise_for_status()
            website_text = resp.text[:4000]  # keep it reasonable
        except Exception as e:
            website_text = f"Could not fetch site due to: {e}"

    # Build a tight prompt for StoryBrand
    sb_context = textwrap.dedent(f"""
    You are an expert StoryBrand strategist and conversion copywriter.

    Use Donald Miller's 7-part framework:
    1. Character (hero)
    2. Problem (external, internal, philosophical)
    3. Guide (empathy + authority)
    4. Plan (simple steps)
    5. Call to Action
    6. Stakes (failure)
    7. Success (happy ending)

    Brand name: {brand_name or "Unknown yet"}
    Website sample (if any was provided):
    {website_text}

    Answers from the user (treat these as primary truth):

    Hero (who is the character): {answers.get("hero","")}
    What the hero wants: {answers.get("want","")}
    Main problem: {answers.get("problem","")}
    Villain or root cause: {answers.get("villain","")}
    Guide (how the brand guides them): {answers.get("guide","")}
    Plan: {answers.get("plan","")}
    Call to action: {answers.get("cta","")}
    Stakes if they do nothing: {answers.get("stakes","")}
    Success picture: {answers.get("success","")}

    Task:
    Create a complete StoryBrand BrandScript and website copy set.

    Output in this structure:

    # BrandScript Summary
    - One line Hero summary
    - One line Problem summary
    - One line Guide summary
    - One line Plan summary
    - One line CTA summary
    - One line Stakes summary
    - One line Success summary

    # Full StoryBrand Script
    ## 1. Character
    ## 2. Problem
    ### External
    ### Internal
    ### Philosophical
    ## 3. Guide
    ### Empathy
    ### Authority
    ## 4. Plan
    ### Process Plan (3 steps)
    ### Agreement Plan (what you promise)
    ## 5. Call to Action
    ### Direct CTAs
    ### Transitional CTAs
    ## 6. Stakes (Failure)
    ## 7. Success (Happy Ending)

    # Homepage Wireframe (grunt test ready)
    - Header line (hero + result)
    - Subheader line (how you help)
    - Primary CTA button text
    - Secondary CTA button text
    - 3 bullet benefits
    - Short "How it works" section
    - Short credibility line

    # Elevator Pitch (one short paragraph)

    Keep language clear, simple, and powerful.
    """)

    completion = client.responses.create(
        model="gpt-4.1-mini",
        input=sb_context,
    )

    global LAST_RESULT
    LAST_RESULT = completion.output[0].content[0].text
    return jsonify({"result": LAST_RESULT})


@app.route("/api/download", methods=["GET"])
def download():
    """Download the last BrandScript as a text file."""
    global LAST_RESULT
    if not LAST_RESULT:
        return jsonify({"error": "No BrandScript generated yet"}), 400

    path = "brand_script.txt"
    with open(path, "w", encoding="utf-8") as f:
        f.write(LAST_RESULT)

    return send_file(path, as_attachment=True)


if __name__ == "__main__":
    app.run(debug=True)
