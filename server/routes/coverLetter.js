// routes/coverLetter.js
const express = require("express");
const router = express.Router();

const PROVIDER = process.env.AI_PROVIDER || "gemini";

/* -------------------- Utilities -------------------- */

// Build the prompt fed to the model
function buildPrompt({ role, jobDescription, cvText, tone, wordTarget }) {
  const system = [
    "You are an expert cover-letter writer.",
    "Write concise, tailored letters with clear structure:",
    "Opening → Fit highlights (3–5 bullets woven into prose) → Motivation → Close.",
    "Use the candidate’s CV only if relevant to the job. No generic fluff.",
    `Tone: ${tone}. British English. ~${wordTarget} words.`,
    "Do not assume this is a PhD or academic position unless the description explicitly states it.",
    "Return markdown only (no extra commentary)."
  ].join("\n");

  const user = [
    "ROLE (what the candidate applies for):", role || "Applicant", "",
    "JOB DESCRIPTION:", jobDescription, "",
    "CANDIDATE CV (raw text):", cvText
  ].join("\n");

  return `${system}\n\n${user}`;
}

// Very simple role inference if the client didn't provide one
function inferRole(jd = "") {
  if (!jd) return null;
  if (/\b(phd|doctoral|dphil)\b/i.test(jd)) return "PhD Candidate";
  const candidates = [
    "Research Scientist","Research Assistant","Postdoctoral Researcher",
    "Machine Learning Engineer","Data Scientist","Software Engineer",
    "Backend Developer","Frontend Developer","Full-Stack Developer",
    "DevOps Engineer","QA Engineer","Product Manager","Analyst","Intern"
  ];
  for (const t of candidates) {
    if (new RegExp(t, "i").test(jd)) return t;
  }
  const m = jd.match(/(?:role|position|title)\s*:\s*([^\n\r]+)/i);
  return m ? m[1].trim() : null;
}

// Deterministic last-ditch template so UI never ends empty-handed
function templateFallback({ role, jobDescription, cvText }) {
  const roleLine = role ? ` for the ${role} role` : "";
  const jdOne = String(jobDescription || "").split(/\n/).slice(0, 6).join(" ");
  const skills = String(cvText || "").split(/\n/).slice(0, 6).join(" ");
  return [
    `**Cover Letter${roleLine}**`,
    "",
    `Dear Hiring Manager,`,
    "",
    `I am writing to express my interest${role ? ` in the ${role}` : ""}. The position aligns well with my background, and I am eager to contribute.`,
    "",
    `**Fit for the role** – From the job description: ${jdOne}`,
    `**Relevant experience** – From my background: ${skills}`,
    "",
    `I am motivated by the opportunity to contribute meaningfully and to learn quickly within your team. I would welcome the chance to discuss how I can help.`,
    "",
    `Kind regards,`,
    `Your Name`
  ].join("\n");
}

// Retry helper for transient 503/429
async function retry(fn, { tries = 3, base = 600 } = {}) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const status = e.status || e.response?.status;
      const msg = (e.message || "").toLowerCase();
      const retryable = status === 503 || status === 429 || msg.includes("overloaded") || msg.includes("rate");
      if (!retryable || i === tries - 1) break;
      const wait = base * Math.pow(2, i) + Math.floor(Math.random() * 250);
      await new Promise(r => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

/* -------------------- Route -------------------- */

router.post("/", async (req, res) => {
  try {
    let {
      jobDescription,
      cvText,
      role, // no PhD default here
      tone = "professional",
      wordTarget = 400,
    } = req.body;

    if (!jobDescription || !cvText) {
      return res.status(400).json({ message: "jobDescription and cvText are required." });
    }

    // Clamp very long inputs (helps avoid timeouts/overload)
    const clamp = (s, n) => String(s || "").slice(0, n);
    jobDescription = clamp(jobDescription, 8000);
    cvText        = clamp(cvText, 8000);

    const finalRole = role && role.trim() ? role.trim() : (inferRole(jobDescription) || "Applicant");
    const prompt = buildPrompt({ role: finalRole, jobDescription, cvText, tone, wordTarget });

    if (PROVIDER !== "gemini") {
      return res.status(500).json({ message: "No AI provider configured (set AI_PROVIDER=gemini)." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: "Missing GEMINI_API_KEY in server environment." });
    }

    // Robust Gemini branch: try pro → 2.5-flash → 1.5-flash, with retries on each
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const models = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-1.5-flash"];

    let lastErr;
    for (const name of models) {
      try {
        const text = await retry(async () => {
          const model = genAI.getGenerativeModel({ model: name });
          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }]}],
            generationConfig: { maxOutputTokens: 700, temperature: 0.7 }
          });
          const out = result.response?.text?.() || "";
          if (!out.trim()) throw new Error("Empty response from Gemini");
          return out.trim();
        });
        return res.json({ coverLetter: text, provider: "gemini", model: name });
      } catch (e) {
        lastErr = e; // try next model
      }
    }

    // All models failed → graceful fallback so UI still has a draft
    const fallback = templateFallback({ role: finalRole, jobDescription, cvText });
    return res.status(503).json({
      message: "Gemini overloaded; returned a safe fallback draft.",
      coverLetter: fallback,
      provider: "template"
    });

  } catch (err) {
    console.error(err);
    const status = err.status || err.response?.status || 500;
    return res.status(status).json({
      message: err.message || "Cover letter generation failed."
    });
  }
});

module.exports = router;
