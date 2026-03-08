/**
 * jobController.js (legacy) — now uses local dataset
 */
const jobsData = require("../data/jobsData");

exports.searchJobs = (req, res) => {
  const { keywords, location } = req.body;
  const q = (keywords || "").trim().toLowerCase();
  const loc = (location || "").trim().toLowerCase();

  let results = jobsData;
  if (q) results = results.filter(j => j.title.toLowerCase().includes(q) || j.required_skills.some(s => s.toLowerCase().includes(q)));
  if (loc && loc !== "india") results = results.filter(j => j.location.toLowerCase().includes(loc));

  const jobs = results.map(j => ({
    id: j.id,
    title: j.title,
    company: j.company,
    location: j.location,
    salary: `₹${j.salary_min}-${j.salary_max} LPA`,
    type: j.location.toLowerCase() === "remote" ? "Remote" : "Full-time",
    url: "#",
  }));

  return res.json({ success: true, jobs });
};
