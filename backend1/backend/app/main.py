from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from fastapi import FastAPI, UploadFile, File
import pdfplumber
import os
import re

print("RUNNING ADVANCED SINGLE-FILE ATS")

app = FastAPI()

# ----------------------------
# Load AI Model
# ----------------------------
model = SentenceTransformer("paraphrase-MiniLM-L3-v2")

# ----------------------------
# Configurations
# ----------------------------
KNOWN_SKILLS = [
    "python", "java", "c++", "sql",
    "fastapi", "react", "docker",
    "machine learning", "pandas",
    "scikit-learn", "aws", "kubernetes",
    "spring boot", "django"
]

LOCATIONS = ["delhi", "mumbai", "bangalore", "remote"]

# ----------------------------
# Job Database (Sample 20 — extend to 50 if needed)
# ----------------------------
jobs = [
    {"id": 1, "title": "Backend Developer", "company": "TechNova",
     "description": "Python FastAPI PostgreSQL Docker REST APIs",
     "min_experience": 2, "location": "bangalore", "salary_range": (4, 10)},

    {"id": 2, "title": "Machine Learning Engineer", "company": "DataMinds",
     "description": "Python scikit-learn pandas machine learning model deployment",
     "min_experience": 1, "location": "remote", "salary_range": (6, 15)},

    {"id": 3, "title": "Frontend Developer", "company": "WebWorks",
     "description": "React JavaScript HTML CSS UI design",
     "min_experience": 1, "location": "delhi", "salary_range": (3, 8)},

    {"id": 4, "title": "DevOps Engineer", "company": "CloudStack",
     "description": "Docker Kubernetes CI/CD AWS cloud automation",
     "min_experience": 3, "location": "mumbai", "salary_range": (7, 18)},

    {"id": 5, "title": "Data Analyst", "company": "InsightCorp",
     "description": "Python SQL pandas data visualization statistics",
     "min_experience": 1, "location": "bangalore", "salary_range": (4, 9)},
]

# Precompute job embeddings
for job in jobs:
    job["embedding"] = model.encode(job["description"], convert_to_numpy=True)

# ----------------------------
# Utility Functions
# ----------------------------
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


def extract_skills(text):
    text = text.lower()
    return [skill for skill in KNOWN_SKILLS if skill in text]


def extract_experience(text):
    matches = re.findall(r"(\d+)\s*\+?\s*(years|year|yrs|yr)", text.lower())
    if matches:
        return max([int(m[0]) for m in matches])
    return 0


def extract_location(text):
    text = text.lower()
    for loc in LOCATIONS:
        if loc in text:
            return loc
    return None


# ----------------------------
# Core Matching Logic
# ----------------------------
def match_resume_to_jobs(resume_text: str):

    resume_embedding = model.encode(resume_text, convert_to_numpy=True)

    candidate_skills = extract_skills(resume_text)
    candidate_experience = extract_experience(resume_text)
    candidate_location = extract_location(resume_text)
    expected_salary = 6  # Default expected salary (LPA)

    results = []

    for job in jobs:

        # 1️⃣ Skill Score (40%)
        matched_skills = sum(1 for skill in candidate_skills if skill in job["description"].lower())
        skill_score = (matched_skills / len(KNOWN_SKILLS)) * 100 if candidate_skills else 0

        # 2️⃣ Experience Score (20%)
        required_exp = job["min_experience"]
        experience_score = 100 if candidate_experience >= required_exp else (
            (candidate_experience / required_exp) * 100 if required_exp > 0 else 100
        )

        # 3️⃣ Location Score (15%)
        if job["location"] == "remote":
            location_score = 100
        else:
            location_score = 100 if candidate_location == job["location"] else 0

        # 4️⃣ Salary Score (15%)
        min_sal, max_sal = job["salary_range"]
        salary_score = 100 if min_sal <= expected_salary <= max_sal else 0

        # 5️⃣ Semantic AI Score (10%)
        similarity = cosine_similarity([resume_embedding], [job["embedding"]])[0][0]
        semantic_score = float(similarity) * 100

        # Final Combined Score
        final_score = (
            0.4 * skill_score +
            0.2 * experience_score +
            0.15 * location_score +
            0.15 * salary_score +
            0.1 * semantic_score
        )

        results.append({
            "job_id": job["id"],
            "title": job["title"],
            "company": job["company"],
            "skill_score": round(skill_score, 2),
            "experience_score": round(experience_score, 2),
            "location_score": round(location_score, 2),
            "salary_score": round(salary_score, 2),
            "semantic_score": round(semantic_score, 2),
            "final_score": round(final_score, 2),
            "hiring_probability": round(final_score / 100, 2)
        })

    return sorted(results, key=lambda x: x["final_score"], reverse=True)


# ----------------------------
# API Endpoint
# ----------------------------
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

    matches = match_resume_to_jobs(extracted_text)

    return {
        "top_matches": matches[:5]
    }