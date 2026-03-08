"""
Skills extraction module using NLP and keyword matching.
Uses spaCy for tokenization and matches against predefined skills list.
"""

import logging
import spacy
from utils.skills_data import SKILLS

logger = logging.getLogger(__name__)

# Global spaCy model instance (loaded once)
_nlp = None


def load_spacy_model():
    """
    Load spaCy English model.
    Uses small model for efficiency (en_core_web_sm).
    
    Returns:
        spacy.Language: Loaded spaCy model
    """
    global _nlp
    
    if _nlp is not None:
        return _nlp
    
    try:
        logger.info("📚 Loading spaCy model...")
        _nlp = spacy.load("en_core_web_sm")
        logger.info("✅ spaCy model loaded successfully")
        return _nlp
    except OSError:
        logger.warning("⚠️  spaCy model 'en_core_web_sm' not found")
        logger.info("💡 Attempting to download spaCy model...")
        
        # Try downloading the model
        import subprocess
        try:
            subprocess.run(
                ["python", "-m", "spacy", "download", "en_core_web_sm"],
                check=True,
                capture_output=True
            )
            logger.info("✅ spaCy model downloaded successfully")
            _nlp = spacy.load("en_core_web_sm")
            return _nlp
        except Exception as download_error:
            logger.error(f"❌ Failed to download spaCy model: {download_error}")
            logger.info("💡 Using blank spaCy model as fallback")
            _nlp = spacy.blank("en")
            return _nlp


def extract_skills(text):
    """
    Extract skills from resume text using keyword matching.
    Uses spaCy for tokenization and matches against predefined SKILLS list.
    
    This is a DETERMINISTIC approach - no ML models, embeddings, or external APIs.
    
    Args:
        text (str): Resume text to extract skills from
        
    Returns:
        list: List of detected skills (unique, lowercase)
    """
    if not text or len(text.strip()) == 0:
        logger.warning("⚠️  Empty text provided for skill extraction")
        return []
    
    try:
        logger.info("🔍 Starting skill extraction...")
        
        # Convert text to lowercase for case-insensitive matching
        text_lower = text.lower()
        
        # Load spaCy model
        nlp = load_spacy_model()
        
        # Tokenize text with spaCy
        doc = nlp(text_lower)
        
        # Extract unique tokens
        tokens = set([token.text for token in doc])
        
        # Also add multi-word phrases (bigrams, trigrams)
        # This helps catch skills like "react native", "spring boot", etc.
        bigrams = set()
        trigrams = set()
        
        for i in range(len(doc) - 1):
            bigram = f"{doc[i].text} {doc[i+1].text}"
            bigrams.add(bigram)
        
        for i in range(len(doc) - 2):
            trigram = f"{doc[i].text} {doc[i+1].text} {doc[i+2].text}"
            trigrams.add(trigram)
        
        # Combine all n-grams
        all_phrases = tokens.union(bigrams).union(trigrams)
        
        # Match against predefined SKILLS list
        detected_skills = []
        
        for skill in SKILLS:
            # Check if skill appears in text
            # We check both in phrases and in the full text
            if skill in all_phrases or skill in text_lower:
                detected_skills.append(skill)
        
        # Remove duplicates while preserving order
        detected_skills = list(dict.fromkeys(detected_skills))
        
        # Sort alphabetically for consistency
        detected_skills.sort()
        
        logger.info(f"✅ Skill extraction completed")
        logger.info(f"📊 Detected {len(detected_skills)} skills")
        
        if detected_skills:
            logger.debug(f"Skills found: {', '.join(detected_skills[:10])}{'...' if len(detected_skills) > 10 else ''}")
        
        return detected_skills
        
    except Exception as error:
        logger.error(f"❌ Error during skill extraction: {error}")
        logger.exception("Full traceback:")
        return []


def extract_skills_simple(text):
    """
    Simplified skill extraction without spaCy (fallback method).
    Uses simple string matching.
    
    Args:
        text (str): Resume text to extract skills from
        
    Returns:
        list: List of detected skills
    """
    if not text or len(text.strip()) == 0:
        return []
    
    text_lower = text.lower()
    detected_skills = []
    
    for skill in SKILLS:
        if skill in text_lower:
            detected_skills.append(skill)
    
    # Remove duplicates and sort
    detected_skills = list(dict.fromkeys(detected_skills))
    detected_skills.sort()
    
    return detected_skills
