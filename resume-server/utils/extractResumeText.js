/**
 * Extract Resume Text Utility
 * Extracts plain text from various resume file formats
 * Supports: PDF, DOC, DOCX, TXT, JPG, JPEG, PNG
 * 
 * 100% LOCAL - No external AI APIs
 */

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');

/**
 * Extract text from a resume file
 * @param {string} filePath - Path to the uploaded file
 * @param {string} originalName - Original filename (for extension detection)
 * @returns {Promise<string>} - Extracted text content
 */
async function extractResumeText(filePath, originalName) {
    const ext = path.extname(originalName).toLowerCase();
    
    console.log(`📄 Extracting text from: ${originalName} (${ext})`);
    
    try {
        switch (ext) {
            case '.pdf':
                return await extractFromPDF(filePath);
            
            case '.docx':
                return await extractFromDOCX(filePath);
            
            case '.doc':
                // mammoth also handles .doc files reasonably well
                return await extractFromDOCX(filePath);
            
            case '.txt':
                return await extractFromTXT(filePath);
            
            case '.jpg':
            case '.jpeg':
            case '.png':
                return await extractFromImage(filePath);
            
            default:
                throw new Error(`Unsupported file type: ${ext}`);
        }
    } catch (error) {
        console.error(`❌ Text extraction error for ${ext}:`, error.message);
        throw error;
    }
}

/**
 * Extract text from PDF using pdf-parse
 */
async function extractFromPDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    
    if (!data.text || data.text.trim().length < 20) {
        throw new Error('PDF appears to be empty or image-only. Try uploading a text-based PDF.');
    }
    
    console.log(`✅ PDF extracted: ${data.text.length} characters`);
    return cleanText(data.text);
}

/**
 * Extract text from DOCX/DOC using mammoth
 */
async function extractFromDOCX(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    
    if (!result.value || result.value.trim().length < 20) {
        throw new Error('Document appears to be empty or unreadable.');
    }
    
    console.log(`✅ DOCX extracted: ${result.value.length} characters`);
    return cleanText(result.value);
}

/**
 * Extract text from TXT file
 */
async function extractFromTXT(filePath) {
    const text = fs.readFileSync(filePath, 'utf-8');
    
    if (!text || text.trim().length < 20) {
        throw new Error('Text file appears to be empty.');
    }
    
    console.log(`✅ TXT extracted: ${text.length} characters`);
    return cleanText(text);
}

/**
 * Extract text from image using Tesseract.js OCR
 */
async function extractFromImage(filePath) {
    console.log('🔍 Running OCR on image...');
    
    try {
        const { data: { text } } = await Tesseract.recognize(
            filePath,
            'eng',
            {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                    }
                }
            }
        );
        
        if (!text || text.trim().length < 20) {
            throw new Error('Could not extract readable text from image. Please ensure the image is clear and contains text.');
        }
        
        console.log(`✅ Image OCR extracted: ${text.length} characters`);
        return cleanText(text);
    } catch (error) {
        console.error('❌ OCR failed:', error.message);
        throw new Error('Unable to read text from image resume. Please upload a clearer image or use PDF/DOCX format.');
    }
}

/**
 * Clean and normalize extracted text
 */
function cleanText(text) {
    return text
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        // Remove excessive newlines
        .replace(/\n{3,}/g, '\n\n')
        // Trim
        .trim();
}

module.exports = { extractResumeText };

