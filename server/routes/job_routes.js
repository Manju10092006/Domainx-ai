const express = require("express");
const router = express.Router();
const redis = require("../utils/redis"); // redis client
const authMiddleware = require("../middleware/auth"); // JWT middleware

router.post("/save", authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const job = req.body.job;
    if (!job) return res.status(400).json({ error: "Job not provided" });

    const key = `saved_jobs:${userId}`;
    await redis.rpush(key, JSON.stringify(job));
    return res.json({ success: true, message: "Job saved successfully" });
});

router.get("/saved", authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const key = `saved_jobs:${userId}`;
    const jobs = await redis.lrange(key, 0, -1);
    return res.json(jobs.map(j => JSON.parse(j)));
});

module.exports = router;

