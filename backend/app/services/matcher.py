from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from app.models.jobs import jobs
from app.services.extractor import extract_candidate_profile

model = SentenceTransformer("paraphrase-MiniLM-L3-v2")

def calculate_scores(candidate, job):

    resume_text = " ".join(candidate["skills"])
    job_text = " ".join(job["skills_required"])

    resume_emb = model.encode(resume_text, convert_to_numpy=True)
    job_emb = model.encode(job_text, convert_to_numpy=True)

    skill_similarity = cosine_similarity(
        [resume_emb],
        [job_emb]
    )[0][0]

    skill_score = float(skill_similarity) * 100

    if candidate["experience"] >= job["min_experience"]:
        experience_score = 100
    else:
        experience_score = (
            candidate["experience"] / job["min_experience"]
        ) * 100

    location_score = 100 if candidate["location"] == job["location"] else 0

    min_sal, max_sal = job["salary_range"]
    expected = candidate["expected_salary"]
    salary_score = 100 if min_sal <= expected <= max_sal else 0

    final_score = (
        skill_score * 0.4 +
        experience_score * 0.2 +
        location_score * 0.2 +
        salary_score * 0.2
    )

    return {
        "skill_score": round(skill_score, 2),
        "experience_score": round(experience_score, 2),
        "location_score": location_score,
        "salary_score": salary_score,
        "final_score": round(final_score, 2),
        "hiring_probability": round(final_score / 100, 2)
    }

def match_resume(resume_text: str):

    candidate = extract_candidate_profile(resume_text)

    results = []

    for job in jobs:
        scores = calculate_scores(candidate, job)

        results.append({
            "job_id": job["id"],
            "title": job["title"],
            "company": job["company"],
            **scores
        })

    results = sorted(results, key=lambda x: x["final_score"], reverse=True)

    return results