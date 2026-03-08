from celery_app import celery_app
from utils.db import get_db
from utils.text_extractor import extract_text
from bson import ObjectId
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@celery_app.task(name='tasks.parse_resume_task', bind=True)
def parse_resume_task(self, message):
    """
    Celery task to extract text from resume files (PDF/DOCX).
    Extracts raw text and updates MongoDB with results.
    
    NO SKILLS EXTRACTION
    NO NLP ANALYSIS
    NO ATS SCORING
    
    Args:
        message (dict): Message containing:
            - resumeId: MongoDB ObjectId of ResumeResult document
            - userId: MongoDB ObjectId of User
            - filePath: Path to uploaded resume file
    
    Returns:
        dict: Status dictionary with extraction results
    """
    resume_id = None
    db = None
    resume_results_collection = None
    
    try:
        # Log received message
        logger.info("="*60)
        logger.info(f"📩 RECEIVED RESUME PARSING TASK")
        logger.info(f"Task ID: {self.request.id}")
        logger.info("="*60)
        
        # Extract message fields
        resume_id = message.get('resumeId')
        user_id = message.get('userId')
        file_path = message.get('filePath')
        
        logger.info(f"📋 Resume ID: {resume_id}")
        logger.info(f"👤 User ID: {user_id}")
        logger.info(f"📁 File Path: {file_path}")
        
        # Validate inputs
        if not resume_id or not file_path:
            raise ValueError("Missing required fields: resumeId or filePath")
        
        # Connect to MongoDB
        db = get_db()
        resume_results_collection = db['resumeresults']
        
        # Update status to 'processing'
        logger.info("🔄 Updating status to 'processing'...")
        resume_results_collection.update_one(
            {'_id': ObjectId(resume_id)},
            {'$set': {'status': 'processing'}}
        )
        
        # Check if file exists
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Resume file not found: {file_path}")
        
        # Detect file extension
        _, ext = os.path.splitext(file_path)
        ext = ext.lower()
        logger.info(f"🔍 File type detected: {ext}")
        
        # Extract text from resume
        logger.info("📝 Starting text extraction...")
        extracted_text = extract_text(file_path)
        
        if not extracted_text or len(extracted_text.strip()) == 0:
            raise ValueError("No text could be extracted from the resume")
        
        logger.info(f"✅ Text extraction successful!")
        logger.info(f"📊 Extracted {len(extracted_text)} characters")
        logger.info(f"📊 Extracted {len(extracted_text.split())} words")
        
        # =====================================================
        # SKILL EXTRACTION (STEP 5)
        # =====================================================
        logger.info("="*60)
        logger.info("🔍 STARTING SKILL EXTRACTION")
        logger.info("="*60)
        
        from utils.skills_extractor import extract_skills
        
        # Extract skills from text
        detected_skills = extract_skills(extracted_text)
        
        logger.info(f"✅ Skill extraction completed")
        logger.info(f"📊 Detected {len(detected_skills)} skills")
        
        if detected_skills:
            logger.info(f"🎯 Skills: {', '.join(detected_skills[:15])}{'...' if len(detected_skills) > 15 else ''}")
        else:
            logger.info("ℹ️  No skills detected in resume")
        
        # =====================================================
        # ATS SCORING (STEP 6)
        # =====================================================
        logger.info("="*60)
        logger.info("🎯 STARTING ATS SCORING")
        logger.info("="*60)
        
        from utils.ats_engine import calculate_ats_score
        
        # Calculate ATS score
        ats_result = calculate_ats_score(extracted_text, detected_skills)
        
        ats_score = ats_result['atsScore']
        missing_skills = ats_result['missingSkills']
        scoring_breakdown = ats_result['scoringBreakdown']
        
        logger.info(f"✅ ATS scoring completed: {ats_score}/100")
        logger.info(f"📊 Scoring breakdown:")
        logger.info(f"   - Skills: {scoring_breakdown['skillScore']}/40")
        logger.info(f"   - Experience: {scoring_breakdown['experienceScore']}/25")
        logger.info(f"   - Education: {scoring_breakdown['educationScore']}/15")
        logger.info(f"   - Formatting: {scoring_breakdown['formatScore']}/20")
        
        if missing_skills:
            logger.info(f"⚠️  Missing common skills: {', '.join(missing_skills[:5])}{'...' if len(missing_skills) > 5 else ''}")
        
        # Update MongoDB with complete results
        logger.info("💾 Updating database with complete results...")
        update_result = resume_results_collection.update_one(
            {'_id': ObjectId(resume_id)},
            {
                '$set': {
                    'status': 'completed',
                    'rawText': extracted_text,
                    'skills': detected_skills,
                    'atsScore': ats_score,
                    'missingSkills': missing_skills,
                    'scoringBreakdown': scoring_breakdown
                }
            }
        )
        
        if update_result.modified_count > 0:
            logger.info("✅ Database updated successfully")
        else:
            logger.warning("⚠️  Database update returned 0 modified count")
        
        # Log success
        logger.info("="*60)
        logger.info("✅ RESUME PROCESSING COMPLETED")
        logger.info("="*60)
        
        return {
            "status": "completed",
            "resumeId": resume_id,
            "taskId": self.request.id,
            "textLength": len(extracted_text),
            "wordCount": len(extracted_text.split()),
            "skillsCount": len(detected_skills),
            "skills": detected_skills,
            "atsScore": ats_score,
            "scoringBreakdown": scoring_breakdown
        }


        
    except FileNotFoundError as error:
        logger.error(f"❌ File not found: {error}")
        
        # Update status to failed
        if resume_id and resume_results_collection is not None:
            resume_results_collection.update_one(
                {'_id': ObjectId(resume_id)},
                {
                    '$set': {
                        'status': 'failed',
                        'error': f"File not found: {str(error)}"
                    }
                }
            )
        
        return {
            "status": "failed",
            "resumeId": resume_id,
            "error": str(error)
        }
        
    except ValueError as error:
        logger.error(f"❌ Validation error: {error}")
        
        # Update status to failed
        if resume_id and resume_results_collection is not None:
            resume_results_collection.update_one(
                {'_id': ObjectId(resume_id)},
                {
                    '$set': {
                        'status': 'failed',
                        'error': str(error)
                    }
                }
            )
        
        return {
            "status": "failed",
            "resumeId": resume_id,
            "error": str(error)
        }
        
    except NotImplementedError as error:
        logger.error(f"❌ Unsupported file format: {error}")
        
        # Update status to failed
        if resume_id and resume_results_collection is not None:
            resume_results_collection.update_one(
                {'_id': ObjectId(resume_id)},
                {
                    '$set': {
                        'status': 'failed',
                        'error': f"Unsupported file format: {str(error)}"
                    }
                }
            )
        
        return {
            "status": "failed",
            "resumeId": resume_id,
            "error": str(error)
        }
        
    except Exception as error:
        logger.error(f"❌ Unexpected error during text extraction: {error}")
        logger.exception("Full traceback:")
        
        # Update status to failed
        if resume_id and resume_results_collection is not None:
            try:
                resume_results_collection.update_one(
                    {'_id': ObjectId(resume_id)},
                    {
                        '$set': {
                            'status': 'failed',
                            'error': str(error)
                        }
                    }
                )
            except Exception as db_error:
                logger.error(f"❌ Failed to update database with error status: {db_error}")
        
        return {
            "status": "failed",
            "resumeId": resume_id,
            "error": str(error)
        }



@celery_app.task(name='tasks.calculate_ats_score')
def calculate_ats_score_task(resume_data):
    """
    Placeholder task for ATS score calculation.
    Will be implemented in later steps.
    
    Args:
        resume_data (dict): Parsed resume data
        
    Returns:
        str: Status message
    """
    # TODO: Implement ATS scoring logic
    logger.info("⚠️  ATS score calculation not yet implemented")
    return "pending"

