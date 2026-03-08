from fastapi import FastAPI, UploadFile, File
import pdfplumber
import os
from app.services.matcher import match_resume

app = FastAPI()

if not os.path.exists("temp"):
    os.makedirs("temp")

def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
    return text

@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):

    if not file.filename.endswith(".pdf"):
        return {"error": "Please upload a valid PDF file."}

    file_location = f"temp/{file.filename}"

    with open(file_location, "wb") as f:
        f.write(await file.read())

    extracted_text = extract_text_from_pdf(file_location)
    os.remove(file_location)

    if not extracted_text.strip():
        return {"error": "No readable text found in PDF."}

    ranked_jobs = match_resume(extracted_text)

    return {
        "message": "Resume processed successfully",
        "ranked_jobs": ranked_jobs
    }