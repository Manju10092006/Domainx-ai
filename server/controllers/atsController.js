/**
 * ATS Controller - Local Resume Analyzer
 * 
 * 100% LOCAL - No external AI APIs (Gemini, HuggingFace, OpenAI, Puter.js)
 * Uses rule-based scoring and keyword matching
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');
const { redisGet, redisSet } = require('../middleware/redisSafe');
const UserResume = require('../models/UserResume');
const ResumeHistory = require('../models/ResumeHistory');

// ============================================================
// TEXT EXTRACTION HELPER
// ============================================================
async function extractResumeText(filePath, originalName) {
    const ext = path.extname(originalName).toLowerCase();
    
    console.log(`📄 Extracting text from: ${originalName} (${ext})`);
    
    try {
        switch (ext) {
            case '.pdf':
                const dataBuffer = fs.readFileSync(filePath);
                const data = await pdfParse(dataBuffer);
                if (!data.text || data.text.trim().length < 20) {
                    throw new Error('PDF appears to be empty or image-only. Try uploading a text-based PDF.');
                }
                return cleanText(data.text);
            
            case '.docx':
            case '.doc':
                const result = await mammoth.extractRawText({ path: filePath });
                if (!result.value || result.value.trim().length < 20) {
                    throw new Error('Document appears to be empty or unreadable.');
                }
                return cleanText(result.value);
            
            case '.txt': {
                const txtContent = fs.readFileSync(filePath, 'utf-8');
                if (!txtContent || txtContent.trim().length < 20) {
                    throw new Error('Text file appears to be empty.');
                }
                return cleanText(txtContent);
            }
            
            case '.jpg':
            case '.jpeg':
            case '.png': {
                console.log('🔍 Running OCR on image...');
                const { data: { text: ocrText } } = await Tesseract.recognize(filePath, 'eng');
                if (!ocrText || ocrText.trim().length < 20) {
                    throw new Error('Could not extract readable text from image. Please ensure the image is clear and contains text.');
                }
                return cleanText(ocrText);
            }
            
            default:
                throw new Error(`Unsupported file type: ${ext}`);
        }
    } catch (error) {
        console.error(`❌ Text extraction error for ${ext}:`, error.message);
        throw error;
    }
}

function cleanText(text) {
    return text
        .replace(/\s+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

// ============================================================
// TECHNICAL KEYWORDS DATABASE
// ============================================================
const TECHNICAL_SKILLS = [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'golang',
    'rust', 'php', 'swift', 'kotlin', 'scala', 'perl', 'r', 'matlab', 'bash', 'shell',
    'react', 'reactjs', 'react.js', 'angular', 'angularjs', 'vue', 'vuejs', 'vue.js',
    'svelte', 'next.js', 'nextjs', 'nuxt', 'gatsby', 'jquery', 'redux', 'mobx',
    'html', 'html5', 'css', 'css3', 'sass', 'scss', 'less', 'tailwind', 'tailwindcss',
    'bootstrap', 'material-ui', 'mui', 'chakra', 'styled-components', 'emotion',
    'node', 'nodejs', 'node.js', 'express', 'expressjs', 'fastify', 'nestjs', 'koa',
    'django', 'flask', 'fastapi', 'spring', 'spring boot', 'springboot', '.net', 'dotnet',
    'rails', 'ruby on rails', 'laravel', 'symfony', 'asp.net',
    'sql', 'mysql', 'postgresql', 'postgres', 'mongodb', 'mongo', 'redis', 'cassandra',
    'dynamodb', 'firebase', 'firestore', 'sqlite', 'oracle', 'mariadb', 'couchdb',
    'elasticsearch', 'neo4j', 'graphql', 'prisma', 'sequelize', 'mongoose',
    'aws', 'amazon web services', 'azure', 'gcp', 'google cloud', 'heroku', 'vercel',
    'netlify', 'digitalocean', 'docker', 'kubernetes', 'k8s', 'jenkins', 'circleci',
    'github actions', 'gitlab ci', 'terraform', 'ansible', 'nginx', 'apache',
    'linux', 'ubuntu', 'centos', 'debian',
    'git', 'github', 'gitlab', 'bitbucket', 'svn', 'jira', 'confluence', 'trello',
    'slack', 'figma', 'sketch', 'adobe xd', 'postman', 'insomnia', 'swagger',
    'jest', 'mocha', 'chai', 'cypress', 'selenium', 'puppeteer', 'playwright',
    'junit', 'pytest', 'rspec', 'testing', 'unit testing', 'integration testing',
    'tdd', 'bdd', 'e2e', 'qa',
    'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'keras', 'scikit-learn',
    'pandas', 'numpy', 'opencv', 'nlp', 'computer vision', 'ai', 'artificial intelligence',
    'react native', 'flutter', 'ionic', 'android', 'ios', 'xcode', 'android studio',
    'rest', 'restful', 'api', 'apis', 'microservices', 'agile', 'scrum', 'kanban',
    'ci/cd', 'devops', 'sre', 'websocket', 'oauth', 'jwt', 'authentication',
    'authorization', 'security', 'encryption', 'ssl', 'tls', 'https'
];

// ============================================================
// SECTION PATTERNS
// ============================================================
const SECTION_PATTERNS = {
    skills: /\b(skills?|technical skills?|technologies|tech stack|proficiencies|competencies|expertise)\b/i,
    experience: /\b(experience|work experience|employment|work history|professional experience|career history)\b/i,
    education: /\b(education|academic|qualification|degree|university|college|school|b\.?tech|b\.?sc|m\.?sc|m\.?tech|bachelor|master|phd|diploma)\b/i,
    projects: /\b(projects?|portfolio|personal projects?|side projects?|case stud(?:y|ies))\b/i,
    certifications: /\b(certification|certificate|certified|credential|accreditation)\b/i,
    summary: /\b(summary|objective|profile|about me|professional summary|career objective)\b/i
};

// ============================================================
// CONTACT PATTERNS
// ============================================================
const CONTACT_PATTERNS = {
    email: /[\w.-]+@[\w.-]+\.\w{2,}/i,
    phone: /(\+\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/,
    linkedin: /linkedin\.com\/in\/[\w-]+|linkedin/i,
    github: /github\.com\/[\w-]+|github/i
};

// ============================================================
// MAIN ANALYSIS FUNCTION
// ============================================================
const analyzeResume = async (req, res) => {
  let filePath = null;
  
  try {
        // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
                error: 'No resume file uploaded. Please select a file.'
      });
    }

    filePath = req.file.path;
        const originalName = req.file.originalname;
        
        console.log('\n' + '='.repeat(60));
        console.log('📄 LOCAL ATS ANALYSIS STARTED');
        console.log('='.repeat(60));
        console.log('File:', originalName);
        console.log('Size:', (req.file.size / 1024).toFixed(2), 'KB');
        console.log('='.repeat(60));

        // Compute MD5 hash of uploaded resume buffer for caching
        const fileBuffer = fs.readFileSync(filePath);
        const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
        const cacheKey = `resume:score:${hash}`;
        
        // Try to get from cache first
        const cachedData = await redisGet(cacheKey);
        if (cachedData) {
            try {
                const parsed = JSON.parse(cachedData);
                console.log(`✅ Cache HIT for resume hash: ${hash.substring(0, 8)}...`);
                console.log('='.repeat(60) + '\n');
                
                // IMPORTANT: Even on cache hit, save to ResumeHistory for authenticated users
                const userId = req.user?.id || req.user?.userId || req.userId;
                if (userId) {
                    try {
                        const historyPayload = {
                            userId: userId,
                            originalFilename: originalName,
                            storedFilepath: '',
                            analysisScore: parsed.score,
                            skills: parsed.skills || [],
                            summary: parsed.summary || '',
                            suggestions: parsed.suggestions || [],
                            strengths: parsed.strengths || [],
                            weaknesses: parsed.weaknesses || [],
                            experience: parsed.experience || '',
                            education: parsed.education || '',
                            fullJson: parsed
                        };
                        await ResumeHistory.create(historyPayload);
                        console.log(`✅ ResumeHistory saved for userId: ${userId} (from cache)`);
                    } catch (historyError) {
                        console.error('⚠️  Error saving ResumeHistory (cache hit):', historyError.message);
                    }
                }
                
                // Cleanup file since we're using cache
                if (filePath && fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                        console.log('🗑️ Temp file cleaned up');
                    } catch (e) {
                        console.error('Cleanup error:', e.message);
                    }
                }
                
                return res.json({
                    success: true,
                    fromCache: true,
                    ...parsed
                });
            } catch (parseError) {
                console.error('⚠️  Error parsing cached data:', parseError.message);
                // Continue to analyze if cache parse fails
            }
        } else {
            console.log(`❌ Cache MISS for resume hash: ${hash.substring(0, 8)}...`);
        }

        // Step 1: Extract text from resume
        let resumeText;
        try {
            resumeText = await extractResumeText(filePath, originalName);
        } catch (extractError) {
            console.error('❌ Extraction failed:', extractError.message);
            return res.status(400).json({
                success: false,
                error: extractError.message || 'Could not extract text from the resume. Please upload a clearer file.'
            });
        }

        if (!resumeText || resumeText.length < 50) {
            return res.status(400).json({
        success: false,
                error: 'Resume appears to be empty or too short. Please upload a complete resume.'
            });
        }

        console.log('📝 Text extracted:', resumeText.length, 'characters');

        // Step 2: Analyze the resume
        const analysis = analyzeResumeText(resumeText);
        
        console.log('\n✅ ANALYSIS COMPLETE');
        console.log('Score:', analysis.score);
        console.log('Skills found:', analysis.skills.length);
        console.log('='.repeat(60) + '\n');

        // Cache the results for 72 hours (259200 seconds)
        await redisSet(cacheKey, JSON.stringify(analysis), 259200);

        // Step 3: Save UserResume and ResumeHistory if user is authenticated
        const userId = req.user?.id || req.user?.userId || req.userId;
        if (userId) {
            try {
                // Don't delete the file, save it for the user
                const userResume = new UserResume({
                    userId,
                    fileName: originalName,
                    filePath: filePath, // Keep the file path
                    atsScore: analysis.score,
                    summary: analysis.summary || '',
                    skills: analysis.skills || [],
                    uploadedAt: new Date()
                });
                await userResume.save();
                console.log(`✅ UserResume saved for userId: ${userId}`);
            } catch (saveError) {
                console.error('⚠️  Error saving UserResume:', saveError.message);
                // Don't fail the request if saving UserResume fails
            }

            // Save to ResumeHistory for history tracking
            try {
                const historyPayload = {
                    userId: userId,
                    originalFilename: originalName,
                    storedFilepath: filePath ? path.basename(filePath) : '',
                    analysisScore: analysis.score,
                    skills: analysis.skills || [],
                    summary: analysis.summary || '',
                    suggestions: analysis.suggestions || [],
                    strengths: analysis.strengths || [],
                    weaknesses: analysis.weaknesses || [],
                    experience: analysis.experience || '',
                    education: analysis.education || '',
                    fullJson: analysis
                };
                await ResumeHistory.create(historyPayload);
                console.log(`✅ ResumeHistory saved for userId: ${userId}`);
            } catch (historyError) {
                console.error('⚠️  Error saving ResumeHistory:', historyError.message);
                // Don't fail the request if saving ResumeHistory fails
            }
        }

        // Step 4: Return results (but don't delete file if user is authenticated)
        res.json({
            success: true,
            fromCache: false,
            ...analysis
        });

    } catch (error) {
        console.error('❌ Analysis Error:', error);
        res.status(500).json({
            success: false,
            error: 'Resume analysis failed. Please try again.'
        });
    } finally {
        // Cleanup: Only delete file if user is NOT authenticated (anonymous uploads)
        // If user is authenticated, keep the file for UserResume record
        const userId = req.user?.id || req.user?.userId || req.userId;
        if (!userId && filePath && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                console.log('🗑️ Temp file cleaned up (anonymous upload)');
            } catch (e) {
                console.error('Cleanup error:', e.message);
            }
        }
    }
};

// ============================================================
// LOCAL ANALYSIS LOGIC (NO AI)
// ============================================================
function analyzeResumeText(text) {
    const lowerText = text.toLowerCase();
    
    // Detect sections
    const hasSkillsSection = SECTION_PATTERNS.skills.test(text);
    const hasExperienceSection = SECTION_PATTERNS.experience.test(text);
    const hasEducationSection = SECTION_PATTERNS.education.test(text);
    const hasProjectsSection = SECTION_PATTERNS.projects.test(text);
    const hasCertificationsSection = SECTION_PATTERNS.certifications.test(text);
    const hasSummarySection = SECTION_PATTERNS.summary.test(text);
    
    // Detect contact info
    const hasEmail = CONTACT_PATTERNS.email.test(text);
    const hasPhone = CONTACT_PATTERNS.phone.test(text);
    const hasLinkedIn = CONTACT_PATTERNS.linkedin.test(text);
    const hasGitHub = CONTACT_PATTERNS.github.test(text);
    
    // Find matched technical skills
    const matchedSkills = [];
    TECHNICAL_SKILLS.forEach(skill => {
        const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(lowerText) && !matchedSkills.includes(skill)) {
            // Capitalize for display
            const displaySkill = skill.split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            matchedSkills.push(displaySkill);
        }
    });
    
    // Remove duplicates and similar entries
    const uniqueSkills = [...new Set(matchedSkills.map(s => s.toLowerCase()))]
        .map(s => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))
        .slice(0, 20); // Limit to 20 skills
    
    // Calculate score
    let score = 0;
    
    // Skills scoring (max 30)
    if (uniqueSkills.length >= 10) score += 30;
    else if (uniqueSkills.length >= 5) score += 20;
    else if (uniqueSkills.length >= 1) score += 10;
    
    // Sections scoring
    if (hasExperienceSection) score += 20;
    if (hasEducationSection) score += 10;
    if (hasProjectsSection) score += 10;
    if (hasCertificationsSection) score += 5;
    if (hasSummarySection) score += 5;
    
    // Contact info scoring
    if (hasEmail && hasPhone) score += 10;
    else if (hasEmail || hasPhone) score += 5;
    
    if (hasLinkedIn || hasGitHub) score += 5;
    
    // Length scoring
    const textLength = text.length;
    if (textLength < 500) score -= 10;
    else if (textLength >= 500 && textLength <= 4000) score += 10;
    else if (textLength > 8000) score -= 10;
    
    // Clamp score between 0 and 100
    score = Math.max(0, Math.min(100, score));
    
    // Extract sections
    const summary = extractSummary(text);
    const experience = extractSection(text, 'experience');
    const education = extractSection(text, 'education');
    
    // Build strengths
    const strengths = [];
    if (uniqueSkills.length >= 5) strengths.push('Strong technical skill set with diverse technologies');
    if (hasProjectsSection) strengths.push('Hands-on project experience demonstrated');
    if (hasExperienceSection) strengths.push('Relevant work experience included');
    if (hasLinkedIn || hasGitHub) strengths.push('Good professional branding with online presence');
    if (hasEmail && hasPhone) strengths.push('Complete contact information provided');
    if (hasSummarySection) strengths.push('Professional summary/objective included');
    if (hasCertificationsSection) strengths.push('Professional certifications mentioned');
    
    // Build weaknesses
    const weaknesses = [];
    if (!hasEducationSection) weaknesses.push('Education section is missing or unclear');
    if (uniqueSkills.length < 3) weaknesses.push('Very few technical skills mentioned');
    if (!hasProjectsSection) weaknesses.push('No projects section found');
    if (!hasExperienceSection) weaknesses.push('Limited or no work experience described');
    if (!hasEmail || !hasPhone) weaknesses.push('Contact details are incomplete');
    if (!hasLinkedIn && !hasGitHub) weaknesses.push('Missing LinkedIn or GitHub profile links');
    if (!hasSummarySection) weaknesses.push('No professional summary or objective');
    if (textLength < 500) weaknesses.push('Resume appears too short');
    if (textLength > 8000) weaknesses.push('Resume may be too verbose');
    
    // Build suggestions
    const suggestions = [];
    if (uniqueSkills.length < 8) {
        suggestions.push('Add a dedicated Skills section with at least 8-10 relevant technical skills.');
    }
    if (!hasProjectsSection) {
        suggestions.push('Include 2-3 key projects with technologies used and measurable outcomes.');
    }
    if (!hasEducationSection) {
        suggestions.push('Ensure your Education section clearly states your degree, institution, and graduation year.');
    }
    if (!hasLinkedIn || !hasGitHub) {
        suggestions.push('Add your LinkedIn and GitHub profile links for better professional visibility.');
    }
    if (!hasExperienceSection) {
        suggestions.push('Add work experience with action verbs and quantifiable achievements.');
    }
    if (!hasSummarySection) {
        suggestions.push('Start with a 2-3 sentence professional summary highlighting your key strengths.');
    }
    if (textLength < 500) {
        suggestions.push('Expand your resume content - a good resume is typically 1-2 pages.');
    }
    if (textLength > 8000) {
        suggestions.push('Consider condensing your resume - focus on the most relevant information.');
    }
    if (!hasCertificationsSection && uniqueSkills.length < 5) {
        suggestions.push('Consider adding relevant certifications to strengthen your profile.');
    }
    
    return {
        score,
        summary: summary || 'Unable to extract summary from resume.',
        skills: uniqueSkills,
        experience: experience || 'No specific experience section detected.',
        education: education || 'No specific education section detected.',
        strengths: strengths.length > 0 ? strengths : ['Resume uploaded successfully'],
        weaknesses: weaknesses.length > 0 ? weaknesses : ['Analysis completed'],
        suggestions: suggestions.length > 0 ? suggestions : ['Keep improving your resume!']
    };
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Extract the first 2-4 sentences as summary
 */
function extractSummary(text) {
    const cleanText = text.replace(/\s+/g, ' ').trim();
    const sentences = cleanText.match(/[^.!?]+[.!?]+/g);
    
    if (sentences && sentences.length > 0) {
        const summaryParts = sentences.slice(0, 3);
        return summaryParts.join(' ').trim().substring(0, 400);
    }
    
    return cleanText.substring(0, 300) + (cleanText.length > 300 ? '...' : '');
}

/**
 * Extract text from a specific section
 */
function extractSection(text, sectionType) {
    const patterns = {
        experience: /(?:experience|work experience|employment|work history|professional experience)[:\s]*([\s\S]{0,600}?)(?=\n\n[A-Z]|\n[A-Z][a-z]+:|\n(?:education|skills|projects|certifications)|$)/i,
        education: /(?:education|academic|qualifications?)[:\s]*([\s\S]{0,400}?)(?=\n\n[A-Z]|\n[A-Z][a-z]+:|\n(?:experience|skills|projects|certifications)|$)/i
    };
    
    const pattern = patterns[sectionType];
    if (!pattern) return null;
    
    const match = text.match(pattern);
    if (match && match[1]) {
        return match[1].replace(/\s+/g, ' ').trim().substring(0, 500);
    }
    
    return null;
}

// ============================================================
// GET LAST RESUME FOR USER
// ============================================================
const getLastResume = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?.userId || req.userId;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User ID not found in token'
            });
        }

        const lastResume = await UserResume.findOne({ userId })
            .sort({ uploadedAt: -1 })
            .select('fileName uploadedAt atsScore');

        if (!lastResume) {
            return res.json({
                success: true,
                resume: null
            });
        }

        res.json({
            success: true,
            resume: {
                fileName: lastResume.fileName,
                uploadedAt: lastResume.uploadedAt,
                atsScore: lastResume.atsScore
            }
        });

    } catch (error) {
        console.error('Error fetching last resume:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch last resume',
            message: error.message
        });
    }
};

// ============================================================
// EXPORT
// ============================================================
module.exports = { analyzeResume, getLastResume };

