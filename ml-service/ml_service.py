"""
DomainX AI — Python ML Microservice
Semantic Job Matching using sentence-transformers (MiniLM)

Run with:
    uvicorn ml_service:app --reload --port 8001

Install:
    pip install fastapi uvicorn sentence-transformers scikit-learn
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import re
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================
# APP SETUP
# ============================================================
app = FastAPI(
    title="DomainX ML Job Matcher",
    description="Semantic resume-to-job matching using MiniLM",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# LOAD MODEL ONCE AT STARTUP
# ============================================================
logger.info("⏳ Loading MiniLM model (first run may take ~30s)...")
model = SentenceTransformer("paraphrase-MiniLM-L3-v2")
logger.info("✅ Model loaded successfully")

# ============================================================
# JOB DATASET — 20 curated tech jobs
# ============================================================
JOB_DATASET = [
    {
        "id": "j001",
        "title": "Frontend Developer",
        "company": "TechCorp India",
        "location": "Bangalore",
        "salary_lpa": 12,
        "required_skills": ["react", "javascript", "css", "html", "typescript"],
        "experience_years": 2,
        "description": "Build modern React web applications with TypeScript and REST APIs"
    },
    {
        "id": "j002",
        "title": "Full Stack Engineer",
        "company": "Startup Labs",
        "location": "Hyderabad",
        "salary_lpa": 18,
        "required_skills": ["node.js", "react", "mongodb", "express", "javascript"],
        "experience_years": 3,
        "description": "Design and build full-stack applications using MERN stack"
    },
    {
        "id": "j003",
        "title": "Backend Developer",
        "company": "Enterprise Solutions",
        "location": "Pune",
        "salary_lpa": 15,
        "required_skills": ["python", "django", "postgresql", "rest api", "docker"],
        "experience_years": 3,
        "description": "Develop scalable backend services using Python and Django"
    },
    {
        "id": "j004",
        "title": "Data Scientist",
        "company": "Analytics House",
        "location": "Mumbai",
        "salary_lpa": 22,
        "required_skills": ["python", "pandas", "machine learning", "scikit-learn", "sql"],
        "experience_years": 2,
        "description": "Build ML models and data pipelines for business intelligence"
    },
    {
        "id": "j005",
        "title": "DevOps Engineer",
        "company": "CloudFirst",
        "location": "Remote",
        "salary_lpa": 20,
        "required_skills": ["docker", "kubernetes", "aws", "ci/cd", "linux"],
        "experience_years": 3,
        "description": "Manage cloud infrastructure and automate deployment pipelines"
    },
    {
        "id": "j006",
        "title": "React Native Developer",
        "company": "MobileFirst",
        "location": "Chennai",
        "salary_lpa": 14,
        "required_skills": ["react native", "javascript", "mobile", "ios", "android"],
        "experience_years": 2,
        "description": "Build cross-platform mobile apps using React Native"
    },
    {
        "id": "j007",
        "title": "Machine Learning Engineer",
        "company": "AI Ventures",
        "location": "Bangalore",
        "salary_lpa": 28,
        "required_skills": ["python", "tensorflow", "pytorch", "deep learning", "nlp"],
        "experience_years": 3,
        "description": "Research and implement deep learning models for production AI systems"
    },
    {
        "id": "j008",
        "title": "Java Backend Developer",
        "company": "Banking Systems Ltd",
        "location": "Mumbai",
        "salary_lpa": 16,
        "required_skills": ["java", "spring boot", "microservices", "sql", "rest api"],
        "experience_years": 2,
        "description": "Build robust Java microservices for banking and fintech applications"
    },
    {
        "id": "j009",
        "title": "Cloud Architect",
        "company": "AWS Solutions Partner",
        "location": "Remote",
        "salary_lpa": 35,
        "required_skills": ["aws", "azure", "terraform", "cloud", "architecture"],
        "experience_years": 5,
        "description": "Design and implement enterprise-scale cloud architectures"
    },
    {
        "id": "j010",
        "title": "UI/UX Engineer",
        "company": "Design Studio",
        "location": "Delhi",
        "salary_lpa": 13,
        "required_skills": ["figma", "css", "react", "design systems", "javascript"],
        "experience_years": 2,
        "description": "Create pixel-perfect UI implementations from Figma designs"
    },
    {
        "id": "j011",
        "title": "Python Developer",
        "company": "DataSystems Inc",
        "location": "Hyderabad",
        "salary_lpa": 14,
        "required_skills": ["python", "fastapi", "postgresql", "redis", "docker"],
        "experience_years": 2,
        "description": "Build APIs and data processing systems using Python and FastAPI"
    },
    {
        "id": "j012",
        "title": "Security Engineer",
        "company": "CyberShield",
        "location": "Bangalore",
        "salary_lpa": 24,
        "required_skills": ["cybersecurity", "penetration testing", "python", "linux", "encryption"],
        "experience_years": 3,
        "description": "Perform security audits and build defensive systems"
    },
    {
        "id": "j013",
        "title": "Site Reliability Engineer",
        "company": "Reliability Corp",
        "location": "Remote",
        "salary_lpa": 26,
        "required_skills": ["sre", "kubernetes", "prometheus", "golang", "linux"],
        "experience_years": 4,
        "description": "Maintain reliability and performance of large-scale distributed systems"
    },
    {
        "id": "j014",
        "title": "Angular Developer",
        "company": "Enterprise Web",
        "location": "Pune",
        "salary_lpa": 12,
        "required_skills": ["angular", "typescript", "rxjs", "html", "css"],
        "experience_years": 2,
        "description": "Build enterprise Angular applications with TypeScript"
    },
    {
        "id": "j015",
        "title": "Database Administrator",
        "company": "DataSolutions",
        "location": "Chennai",
        "salary_lpa": 15,
        "required_skills": ["postgresql", "mysql", "mongodb", "sql", "redis"],
        "experience_years": 3,
        "description": "Manage and optimize high-performance databases at scale"
    },
    {
        "id": "j016",
        "title": "Blockchain Developer",
        "company": "Web3 Labs",
        "location": "Remote",
        "salary_lpa": 30,
        "required_skills": ["solidity", "web3", "ethereum", "javascript", "smart contracts"],
        "experience_years": 2,
        "description": "Build decentralized applications and smart contracts"
    },
    {
        "id": "j017",
        "title": "Go Developer",
        "company": "HighPerf Systems",
        "location": "Bangalore",
        "salary_lpa": 22,
        "required_skills": ["golang", "microservices", "docker", "grpc", "linux"],
        "experience_years": 3,
        "description": "Build high-performance microservices in Go"
    },
    {
        "id": "j018",
        "title": "QA Automation Engineer",
        "company": "QualityFirst",
        "location": "Hyderabad",
        "salary_lpa": 11,
        "required_skills": ["selenium", "pytest", "cypress", "javascript", "testing"],
        "experience_years": 2,
        "description": "Build automated test suites using Selenium and Cypress"
    },
    {
        "id": "j019",
        "title": "Data Engineer",
        "company": "BigData Co",
        "location": "Mumbai",
        "salary_lpa": 20,
        "required_skills": ["spark", "hadoop", "python", "sql", "aws"],
        "experience_years": 3,
        "description": "Design and build data pipelines using Spark and cloud platforms"
    },
    {
        "id": "j020",
        "title": "Product Engineer",
        "company": "SaaS Platform",
        "location": "Bangalore",
        "salary_lpa": 18,
        "required_skills": ["react", "node.js", "python", "postgresql", "aws"],
        "experience_years": 3,
        "description": "Full ownership engineering for B2B SaaS product features"
    }
]

# ============================================================
# PRECOMPUTE JOB EMBEDDINGS AT STARTUP
# ============================================================
logger.info("⏳ Precomputing job embeddings...")
job_descriptions = [
    f"{job['title']} {job['description']} {' '.join(job['required_skills'])}"
    for job in JOB_DATASET
]
JOB_EMBEDDINGS = model.encode(job_descriptions, convert_to_numpy=True)
logger.info(f"✅ Precomputed embeddings for {len(JOB_DATASET)} jobs")

# ============================================================
# REQUEST MODEL
# ============================================================
class ResumeText(BaseModel):
    text: str

# ============================================================
# HELPER: EXTRACT SKILLS FROM TEXT
# ============================================================
KNOWN_SKILLS = [
    "javascript", "typescript", "python", "java", "react", "node.js", "angular",
    "vue", "css", "html", "sql", "mongodb", "postgresql", "mysql", "redis",
    "docker", "kubernetes", "aws", "azure", "gcp", "django", "fastapi", "flask",
    "spring boot", "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy",
    "machine learning", "deep learning", "nlp", "ci/cd", "git", "linux",
    "golang", "rust", "c++", "c#", "kotlin", "swift", "react native", "flutter",
    "selenium", "cypress", "jest", "graphql", "rest api", "microservices",
    "solidity", "blockchain", "spark", "hadoop", "terraform", "ansible"
]

def extract_skills_from_text(text: str) -> list:
    text_lower = text.lower()
    return [skill for skill in KNOWN_SKILLS if skill in text_lower]

# ============================================================
# HELPER: EXTRACT EXPERIENCE YEARS
# ============================================================
def extract_experience_years(text: str) -> int:
    patterns = [
        r'(\d+)\+?\s*years?\s*of\s*(?:work\s*)?experience',
        r'(\d+)\+?\s*years?\s*experience',
        r'experience\s*(?:of\s*)?(\d+)\+?\s*years?',
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return min(int(match.group(1)), 20)
    # Estimate from work history context
    if 'senior' in text.lower(): return 5
    if 'junior' in text.lower(): return 1
    return 2  # default

# ============================================================
# SCORING FUNCTIONS
# ============================================================
def calculate_skill_score(resume_skills: list, job_skills: list) -> float:
    if not job_skills:
        return 50.0
    matched = sum(1 for s in job_skills if s.lower() in resume_skills)
    return round((matched / len(job_skills)) * 100, 1)

def calculate_experience_score(resume_exp: int, job_exp: int) -> float:
    if resume_exp >= job_exp:
        return min(100.0, 70.0 + (resume_exp - job_exp) * 5)
    gap = job_exp - resume_exp
    return max(10.0, 70.0 - gap * 20)

def calculate_location_score(job_location: str) -> float:
    if job_location.lower() == "remote":
        return 100.0
    return 75.0  # Willing-to-relocate default

def calculate_salary_score(salary_lpa: int, resume_exp: int) -> float:
    expected = 4 + (resume_exp * 3)  # rough expected LPA
    if salary_lpa >= expected:
        return min(100.0, 60.0 + (salary_lpa - expected) * 2)
    return max(20.0, 60.0 - (expected - salary_lpa) * 3)

def calculate_hiring_probability(final_score: float) -> float:
    if final_score >= 85: return round(0.85 + (final_score - 85) * 0.01, 2)
    if final_score >= 70: return round(0.60 + (final_score - 70) * 0.016, 2)
    if final_score >= 50: return round(0.30 + (final_score - 50) * 0.015, 2)
    return round(final_score * 0.005, 2)

# ============================================================
# MAIN ENDPOINT — POST /analyze-text
# ============================================================
@app.post("/analyze-text")
async def analyze_resume_text(resume: ResumeText):
    try:
        text = resume.text.strip()
        if not text or len(text) < 30:
            return {"top_matches": [], "error": "Resume text too short"}

        logger.info(f"📄 Analyzing resume text ({len(text)} chars)...")

        # Extract resume features
        resume_skills = extract_skills_from_text(text)
        resume_exp = extract_experience_years(text)

        # Generate resume embedding
        resume_embedding = model.encode([text], convert_to_numpy=True)

        # Cosine similarity against all jobs
        similarities = cosine_similarity(resume_embedding, JOB_EMBEDDINGS)[0]

        # Score each job with weighted formula
        job_scores = []
        for i, job in enumerate(JOB_DATASET):
            skill_score    = calculate_skill_score(resume_skills, job["required_skills"])
            exp_score      = calculate_experience_score(resume_exp, job["experience_years"])
            location_score = calculate_location_score(job["location"])
            salary_score   = calculate_salary_score(job["salary_lpa"], resume_exp)
            semantic_score = round(float(similarities[i]) * 100, 1)

            # Weighted final score
            final_score = (
                skill_score    * 0.40 +
                exp_score      * 0.20 +
                location_score * 0.15 +
                salary_score   * 0.15 +
                semantic_score * 0.10
            )
            final_score = round(min(100.0, max(0.0, final_score)), 1)

            job_scores.append({
                "id":                  job["id"],
                "title":               job["title"],
                "company":             job["company"],
                "location":            job["location"],
                "salary_lpa":          job["salary_lpa"],
                "final_score":         final_score,
                "hiring_probability":  calculate_hiring_probability(final_score),
                "breakdown": {
                    "skill_score":     skill_score,
                    "experience_score": exp_score,
                    "location_score":  location_score,
                    "salary_score":    salary_score,
                    "semantic_score":  semantic_score
                }
            })

        # Sort by final score, return top 5
        top_matches = sorted(job_scores, key=lambda x: x["final_score"], reverse=True)[:5]

        logger.info(f"✅ Top match: {top_matches[0]['title']} ({top_matches[0]['final_score']}%)")

        return {"top_matches": top_matches}

    except Exception as e:
        logger.error(f"❌ ML analysis error: {e}")
        return {"top_matches": [], "error": str(e)}

# ============================================================
# HEALTH CHECK
# ============================================================
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "model": "paraphrase-MiniLM-L3-v2",
        "jobs_indexed": len(JOB_DATASET)
    }
