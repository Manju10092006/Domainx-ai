const mongoose = require('mongoose');

const resumeResultSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    rawText: {
        type: String,
        default: '',
    },
    skills: {
        type: [String],
        default: [],
    },
    atsScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    missingSkills: {
        type: [String],
        default: [],
    },
    scoringBreakdown: {
        skillScore: {
            type: Number,
            default: 0,
        },
        experienceScore: {
            type: Number,
            default: 0,
        },
        educationScore: {
            type: Number,
            default: 0,
        },
        formatScore: {
            type: Number,
            default: 0,
        },
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'text_extracted', 'skills_extracted', 'completed', 'failed'],
        default: 'pending',
    },
    error: {
        type: String,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const ResumeResult = mongoose.model('ResumeResult', resumeResultSchema);

module.exports = ResumeResult;
