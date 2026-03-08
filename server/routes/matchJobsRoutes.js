/**
 * Match Jobs Route — Matches AI-extracted skills against local job dataset
 * POST /api/match-jobs
 * Body: { skills: ["JavaScript", "React", "Node.js"] }
 * Returns: Matched jobs sorted by relevance score
 */

const express = require('express');
const router = express.Router();
const jobsData = require('../data/jobsData');

router.post('/', (req, res) => {
    try {
        const { skills } = req.body;

        if (!skills || !Array.isArray(skills) || skills.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'skills array is required'
            });
        }

        const normalizedSkills = skills.map(s => s.toLowerCase().trim());

        // Score each job by how many of the user's skills match
        const scoredJobs = jobsData.map(job => {
            const jobSkills = (job.required_skills || []).map(s => s.toLowerCase().trim());

            let matchCount = 0;
            const matchedSkills = [];
            const missingSkills = [];

            jobSkills.forEach(js => {
                const found = normalizedSkills.some(us =>
                    us.includes(js) || js.includes(us)
                );
                if (found) {
                    matchCount++;
                    matchedSkills.push(js);
                } else {
                    missingSkills.push(js);
                }
            });

            const totalRequired = jobSkills.length || 1;
            const matchScore = Math.round((matchCount / totalRequired) * 100);

            return {
                id: job.id,
                title: job.title,
                company: job.company,
                location: job.location,
                salary: job.salary,
                jobType: job.jobType || 'Full-time',
                url: job.url || '#',
                snippet: job.snippet,
                required_skills: job.required_skills,
                matchScore,
                matchedSkills,
                missingSkills,
                matchCount,
                totalRequired: jobSkills.length
            };
        });

        // Sort by match score descending, filter out 0% matches
        const matched = scoredJobs
            .filter(j => j.matchScore > 0)
            .sort((a, b) => b.matchScore - a.matchScore);

        res.json({
            success: true,
            totalMatched: matched.length,
            userSkills: skills,
            jobs: matched.slice(0, 20) // Top 20 matches
        });

    } catch (error) {
        console.error('[/api/match-jobs error]', error.message);
        res.status(500).json({
            success: false,
            error: 'Job matching failed'
        });
    }
});

module.exports = router;
