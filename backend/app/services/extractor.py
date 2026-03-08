import re

KNOWN_SKILLS = [
    "python", "java", "c++", "sql",
    "fastapi", "react", "docker",
    "machine learning", "pandas",
    "scikit-learn"
]

LOCATIONS = ["bhubaneswar", "delhi", "mumbai", "cuttack"]

def extract_candidate_profile(resume_text: str):

    text = resume_text.lower()

    # Skill extraction
    skills = [skill for skill in KNOWN_SKILLS if skill in text]

    # Experience extraction
    exp_match = re.search(r"(\\d+)\\s+(years|year)", text)
    experience = int(exp_match.group(1)) if exp_match else 0

    # Location extraction
    location = None
    for loc in LOCATIONS:
        if loc in text:
            location = loc
            break

    return {
        "skills": skills,
        "experience": experience,
        "location": location,
        "expected_salary": 6
    }