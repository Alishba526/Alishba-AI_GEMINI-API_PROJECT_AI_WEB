from fastapi import FastAPI, Request, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import google.generativeai as genai
from dotenv import load_dotenv
import os
import zipfile
import io

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    print("Error: GEMINI_API_KEY not found in .env file.")
    exit(1)

genai.configure(api_key=API_KEY)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

language_instructions = {
    "html": "Generate a complete, single-page HTML, CSS, and JavaScript website.",
    "react": "Generate a React component with corresponding CSS.",
    "nextjs": "Generate a Next.js page with server-side rendering.",
    "python": "Generate a Python Flask application with HTML templates.",
    "ruby": "Generate a Ruby on Rails view with embedded Ruby (ERB).",
    "typescript": "Generate a TypeScript React component with appropriate typings."
}

@app.post("/generate")
async def generate_website(request: Request):
    try:
        data = await request.json()
        prompt = data.get("prompt")
        language = data.get("language", "html")

        if not prompt:
            raise HTTPException(status_code=400, detail="Prompt is missing from the request.")

        model = genai.GenerativeModel('models/gemini-1.5-flash-latest')

        instruction = language_instructions.get(language, language_instructions["html"])

        response = model.generate_content(
            f"""{instruction}

            **Instructions:**
            1. Output only the raw code without any explanations or markdown formatting.
            2. Ensure the code is complete and functional.
            3. Use modern best practices for the selected language/framework.

            User Request: {prompt}"""
        )

        generated_code = response.text.strip()

        # Remove markdown fences if present
        if generated_code.startswith("```"):
            generated_code = generated_code.split("```")[1].strip()

        return {"generated_code": generated_code}

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"An unexpected error occurred in /generate: {e}")
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {str(e)}")

@app.post("/download")
async def download_code(request: Request):
    try:
        data = await request.json()
        code = data.get("code")
        if not code:
            raise HTTPException(status_code=400, detail="Code is missing from the request.")

        # Create a zip file in memory
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED) as zip_file:
            zip_file.writestr("index.html", code)
        zip_buffer.seek(0)

        return FileResponse(zip_buffer, media_type='application/zip', filename='website.zip')

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"An unexpected error occurred in /download: {e}")
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {str(e)}")
