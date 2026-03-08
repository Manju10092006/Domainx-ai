"""
ATS (Applicant Tracking System) Scoring Engine
Rule-based scoring system for resume evaluation.

NO AI, NO ML - 100% deterministic rule-based scoring.
"""

import re
import logging
from utils.skills_data import SKILLS

logger = logging.getLogger(__name__)


def calculate_skill_score(raw_text, detected_skills):
    """
    Calculate skill match score (40 points max).
    
    Score = (detected_skills_count / min(total_possible_skills, 50)) * 40
    
    Args:
        raw_text (str): Resume text
        detected_skills (list): List of detected skills
        
    Returns:
        dict: Score and details
    """
    # Use a reasonable cap for total possible skills (50)
    # This prevents penalizing candidates for not having ALL 200+ skills
    total_possible_skills = min(len(SKILLS), 50)
    detected_count = len(detected_skills)
    
    # Calculate score
    if total_possible_skills > 0:
        skill_score = (detected_count / total_possible_skills) * 40
    else:
        skill_score = 0
    
    # Find missing critical skills (sample from common ones)
    common_skills = [
        'python', 'java', 'javascript', 'react', 'node.js',
        'aws', 'docker', 'git', 'sql', 'agile'
    ]
    
    missing_skills = [skill for skill in common_skills if skill not in detected_skills]
    
    logger.debug(f"Skill Score: {skill_score:.2f}/40 (detected {detected_count} skills)")
    
    return {
        'score': skill_score,
        'detected_count': detected_count,
        'missing_skills': missing_skills
    }


def calculate_experience_score(raw_text):
    """
    Calculate experience clarity score (25 points max).
    
    Checks for:
    - Work experience section
    - Years of experience patterns
    - Action verbs
    
    Args:
        raw_text (str): Resume text
        
    Returns:
        dict: Score and details
    """
    text_lower = raw_text.lower()
    score = 0
    
    # Check for experience section (5 points)
    experience_keywords = ['experience', 'work history', 'employment', 'professional background']
    if any(keyword in text_lower for keyword in experience_keywords):
        score += 5
        logger.debug("✓ Experience section found (+5)")
    
    # Check for years of experience patterns (8 points)
    year_patterns = [
        r'\d+\+?\s*years?',  # "2 years", "3+ years"
        r'years?\s*of\s*experience',  # "years of experience"
        r'\d{4}\s*-\s*\d{4}',  # "2020-2023"
        r'\d{4}\s*-\s*present',  # "2020-present"
    ]
    
    years_found = 0
    for pattern in year_patterns:
        if re.search(pattern, text_lower):
            years_found += 1
    
    year_score = min(years_found * 2, 8)
    score += year_score
    logger.debug(f"✓ Year patterns found: {years_found} (+{year_score})")
    
    # Check for action verbs (12 points)
    action_verbs = [
        'developed', 'built', 'created', 'designed', 'implemented',
        'managed', 'led', 'coordinated', 'achieved', 'improved',
        'optimized', 'deployed', 'maintained', 'collaborated',
        'engineered', 'architected', 'delivered', 'launched'
    ]
    
    verbs_found = sum(1 for verb in action_verbs if verb in text_lower)
    verb_score = min(verbs_found * 2, 12)
    score += verb_score
    logger.debug(f"✓ Action verbs found: {verbs_found} (+{verb_score})")
    
    logger.debug(f"Experience Score: {score}/25")
    return {'score': score}


def calculate_education_score(raw_text):
    """
    Calculate education presence score (15 points max).
    
    Checks for:
    - Degree presence
    - Graduation year
    
    Args:
        raw_text (str): Resume text
        
    Returns:
        dict: Score and details
    """
    text_lower = raw_text.lower()
    score = 0
    
    # Check for degree keywords (10 points)
    degree_keywords = [
        'bachelor', 'master', 'phd', 'doctorate', 'b.tech', 'b.e.',
        'm.tech', 'm.s.', 'mba', 'degree', 'university', 'college',
        'graduate', 'undergraduate', 'diploma'
    ]
    
    degrees_found = sum(1 for keyword in degree_keywords if keyword in text_lower)
    degree_score = min(degrees_found * 3, 10)
    score += degree_score
    logger.debug(f"✓ Degree keywords found: {degrees_found} (+{degree_score})")
    
    # Check for graduation year (5 points)
    year_pattern = r'\b(19|20)\d{2}\b'
    years_found = len(re.findall(year_pattern, raw_text))
    
    if years_found > 0:
        score += 5
        logger.debug(f"✓ Graduation years found (+5)")
    
    logger.debug(f"Education Score: {score}/15")
    return {'score': score}


def calculate_format_score(raw_text):
    """
    Calculate formatting and structure score (20 points max).
    
    Checks for:
    - Proper headings
    - Bullet points
    - Paragraph length
    - Excessive empty lines
    
    Args:
        raw_text (str): Resume text
        
    Returns:
        dict: Score and details
    """
    text_lower = raw_text.lower()
    lines = raw_text.split('\n')
    score = 0
    
    # Check for proper headings (8 points)
    headings = ['skills', 'experience', 'education', 'projects', 'summary', 'objective']
    headings_found = sum(1 for heading in headings if heading in text_lower)
    heading_score = min(headings_found * 2, 8)
    score += heading_score
    logger.debug(f"✓ Headings found: {headings_found} (+{heading_score})")
    
    # Check for bullet points (6 points)
    bullet_patterns = ['-', '•', '∙', '▪', '*']
    bullet_count = sum(1 for line in lines if any(line.strip().startswith(bp) for bp in bullet_patterns))
    
    if bullet_count > 0:
        bullet_score = min(bullet_count // 2, 6)
        score += bullet_score
        logger.debug(f"✓ Bullet points found: {bullet_count} (+{bullet_score})")
    
    # Check paragraph length (3 points)
    # Good resumes have concise paragraphs
    paragraphs = [p for p in raw_text.split('\n\n') if p.strip()]
    reasonable_paragraphs = sum(1 for p in paragraphs if len(p) < 300)
    
    if paragraphs and (reasonable_paragraphs / len(paragraphs)) > 0.7:
        score += 3
        logger.debug("✓ Good paragraph length (+3)")
    
    # Check for excessive empty lines (3 points)
    # Penalize if more than 4 consecutive empty lines
    consecutive_empty = 0
    max_consecutive = 0
    for line in lines:
        if not line.strip():
            consecutive_empty += 1
            max_consecutive = max(max_consecutive, consecutive_empty)
        else:
            consecutive_empty = 0
    
    if max_consecutive <= 4:
        score += 3
        logger.debug("✓ No excessive empty lines (+3)")
    
    logger.debug(f"Format Score: {score}/20")
    return {'score': score}


def calculate_ats_score(raw_text, detected_skills):
    """
    Calculate complete ATS score based on rule-based criteria.
    
    Scoring breakdown:
    - Skill Match: 40 points
    - Experience Clarity: 25 points
    - Education Presence: 15 points
    - Formatting & Structure: 20 points
    
    Total: 100 points
    
    Args:
        raw_text (str): Resume text
        detected_skills (list): List of detected skills
        
    Returns:
        dict: {
            "atsScore": int (0-100),
            "missingSkills": list,
            "scoringBreakdown": {
                "skillScore": float,
                "experienceScore": float,
                "educationScore": float,
                "formatScore": float
            }
        }
    """
    logger.info("🎯 Starting ATS score calculation...")
    
    if not raw_text or len(raw_text.strip()) == 0:
        logger.warning("⚠️  Empty text provided for ATS scoring")
        return {
            "atsScore": 0,
            "missingSkills": [],
            "scoringBreakdown": {
                "skillScore": 0,
                "experienceScore": 0,
                "educationScore": 0,
                "formatScore": 0
            }
        }
    
    # Calculate individual scores
    skill_result = calculate_skill_score(raw_text, detected_skills)
    experience_result = calculate_experience_score(raw_text)
    education_result = calculate_education_score(raw_text)
    format_result = calculate_format_score(raw_text)
    
    # Extract scores
    skill_score = skill_result['score']
    experience_score = experience_result['score']
    education_score = education_result['score']
    format_score = format_result['score']
    
    # Calculate total ATS score
    total_score = skill_score + experience_score + education_score + format_score
    ats_score = int(round(total_score))
    
    # Ensure score is within bounds
    ats_score = max(0, min(100, ats_score))
    
    logger.info(f"✅ ATS score calculation completed: {ats_score}/100")
    logger.info(f"   - Skill Score: {skill_score:.2f}/40")
    logger.info(f"   - Experience Score: {experience_score}/25")
    logger.info(f"   - Education Score: {education_score}/15")
    logger.info(f"   - Format Score: {format_score}/20")
    
    return {
        "atsScore": ats_score,
        "missingSkills": skill_result['missing_skills'],
        "scoringBreakdown": {
            "skillScore": round(skill_score, 2),
            "experienceScore": experience_score,
            "educationScore": education_score,
            "formatScore": format_score
        }
    }
