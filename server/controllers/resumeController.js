const ResumeResult = require('../models/ResumeResult');
const { publishToQueue } = require('../queue/rabbitmq');
const path = require('path');
const fs = require('fs');

const uploadResume = async (req, res) => {
    try {
        // Validate file upload
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded. Please upload a resume file.',
            });
        }

        const file = req.file;
        const userId = req.userId;

        console.log(`📥 Resume upload received: ${file.originalname} (${file.size} bytes) from user: ${userId}`);

        // Additional file size validation (Multer already handles this, but double-check)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            // Remove the uploaded file
            fs.unlinkSync(file.path);
            console.log(`❌ File rejected: Size ${file.size} exceeds ${maxSize} limit`);
            return res.status(400).json({
                success: false,
                message: 'File size exceeds 5MB limit.',
            });
        }

        // Validate file is not empty
        if (file.size === 0) {
            fs.unlinkSync(file.path);
            console.log(`❌ File rejected: Empty file`);
            return res.status(400).json({
                success: false,
                message: 'Uploaded file is empty. Please upload a valid resume.',
            });
        }

        // Validate file extension
        const allowedExtensions = ['.pdf', '.doc', '.docx'];
        const fileExtension = path.extname(file.originalname).toLowerCase();

        if (!allowedExtensions.includes(fileExtension)) {
            // Remove the uploaded file
            fs.unlinkSync(file.path);
            console.log(`❌ File rejected: Invalid extension ${fileExtension}`);
            return res.status(400).json({
                success: false,
                message: 'Invalid file type. Only PDF, DOC, and DOCX files are allowed.',
            });
        }

        // File is already saved by Multer with correct naming format
        const filePath = file.path;

        // Create initial DB entry
        const resumeResult = new ResumeResult({
            userId: userId,
            status: 'processing',
            skills: [],
            atsScore: 0,
            createdAt: new Date(),
        });

        await resumeResult.save();
        console.log(`✅ Resume result created in DB: ${resumeResult._id}`);

        // Publish message to RabbitMQ with error handling
        const queueMessage = {
            resumeId: resumeResult._id.toString(),
            userId: userId,
            filePath: filePath,
        };

        try {
            await publishToQueue('resume_parse_queue', queueMessage);
            console.log(`✅ Message published to queue for resume: ${resumeResult._id}`);

            // Return success response
            return res.status(200).json({
                success: true,
                resumeId: resumeResult._id.toString(),
                message: 'Resume uploaded successfully and is being processed.',
            });

        } catch (queueError) {
            console.error(`❌ Failed to publish to RabbitMQ:`, queueError);

            // Update status to failed since we can't process
            await ResumeResult.updateOne(
                { _id: resumeResult._id },
                {
                    $set: {
                        status: 'failed',
                        error: 'Failed to queue resume for processing. Please try again.'
                    }
                }
            );

            // Clean up uploaded file
            try {
                fs.unlinkSync(filePath);
            } catch (unlinkError) {
                console.error('Error deleting file:', unlinkError);
            }

            return res.status(500).json({
                success: false,
                message: 'Failed to queue resume for processing. Please try again later.',
            });
        }

    } catch (error) {
        console.error('❌ Error uploading resume:', error);

        // Clean up file if it exists
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting file:', unlinkError);
            }
        }

        return res.status(500).json({
            success: false,
            message: 'An error occurred while uploading the resume. Please try again.',
        });
    }
};

const getResumeResult = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        // Validate resumeId format (MongoDB ObjectId)
        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid resume ID format.',
            });
        }

        // Find the resume result (user can only access their own results)
        const resumeResult = await ResumeResult.findOne({
            _id: id,
            userId: userId,
        });

        if (!resumeResult) {
            return res.status(404).json({
                success: false,
                message: 'Resume result not found.',
            });
        }

        // Check processing status
        const isCompleted = resumeResult.status === 'completed';
        const isFailed = resumeResult.status === 'failed';

        // If still processing, return minimal status (for polling)
        if (!isCompleted && !isFailed) {
            return res.status(200).json({
                success: true,
                status: resumeResult.status,
                resumeId: resumeResult._id,
                message: 'Resume is still being processed. Please check back shortly.',
            });
        }

        // If failed, return error information
        if (isFailed) {
            return res.status(200).json({
                success: true,
                status: resumeResult.status,
                resumeId: resumeResult._id,
                error: resumeResult.error || 'Processing failed',
                message: 'Resume processing failed.',
            });
        }

        // If completed, return full results
        return res.status(200).json({
            success: true,
            status: resumeResult.status,
            data: {
                resumeId: resumeResult._id,
                skills: resumeResult.skills || [],
                atsScore: resumeResult.atsScore || 0,
                missingSkills: resumeResult.missingSkills || [],
                scoringBreakdown: resumeResult.scoringBreakdown || {
                    skillScore: 0,
                    experienceScore: 0,
                    educationScore: 0,
                    formatScore: 0,
                },
                rawText: resumeResult.rawText || '',
                createdAt: resumeResult.createdAt,
            },
        });

    } catch (error) {
        console.error('Error fetching resume result:', error);

        // Check if it's a MongoDB CastError (invalid ObjectId)
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid resume ID format.',
            });
        }

        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching the resume result.',
        });
    }
};

module.exports = {
    uploadResume,
    getResumeResult,
};
