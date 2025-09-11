// src/components/AICoverLetter.jsx
import { useEffect, useMemo, useState } from "react";
import axios from "../utils/axios";
import jsPDF from "jspdf";

const ENDPOINT = "/cover-letter";

export default function AICoverLetter({ initialRole = "" }) {
  const [jobDescription, setJD] = useState("");
  const [cvText, setCV] = useState("");
  const [tone, setTone] = useState("professional");
  const [role, setRole] = useState(initialRole);
  const [loading, setLoading] = useState(false);
  const [letter, setLetter] = useState("");
  const [meta, setMeta] = useState(null); // { provider, model, status, note, copied }
  const [editing, setEditing] = useState(true); // 👈 NEW: edit/preview toggle

  // sync role if parent changes it
  useEffect(() => { setRole(initialRole || ""); }, [initialRole]);

  // naive role guesser (same as before)
  useEffect(() => {
    if (!jobDescription || role) return;
    const map = [
      [/phd|doctoral|dphil/i, "PhD Candidate"],
      [/machine learning engineer/i, "Machine Learning Engineer"],
      [/data scientist/i, "Data Scientist"],
      [/software engineer/i, "Software Engineer"],
      [/frontend developer/i, "Frontend Developer"],
      [/backend developer/i, "Backend Developer"],
      [/full-?stack/i, "Full-Stack Developer"],
      [/research scientist/i, "Research Scientist"],
      [/research assistant/i, "Research Assistant"],
      [/postdoctoral/i, "Postdoctoral Researcher"],
      [/intern|internship/i, "Intern"],
      [/product manager/i, "Product Manager"],
      [/devops/i, "DevOps Engineer"],
      [/qa/i, "QA Engineer"],
      [/analyst/i, "Analyst"],
    ];
    for (const [re, label] of map) {
      if (re.test(jobDescription)) { setRole(label); break; }
    }
  }, [jobDescription, role]);

  const disabled = useMemo(
    () => loading || !jobDescription.trim() || !cvText.trim(),
    [loading, jobDescription, cvText]
  );

  async function generate() {
    setLoading(true);
    setLetter("");
    setMeta(null);
    try {
      const { data } = await axios.post(ENDPOINT, {
        jobDescription,
        cvText,
        tone,
        wordTarget: 400,
        role: role?.trim() || undefined,
      });
      setLetter(data.coverLetter || "");
      setMeta({
        provider: data.provider || "gemini",
        model: data.model || "gemini-2.5-pro",
        status: 200,
      });
      setEditing(true); // open in editor so user can tweak immediately
    } catch (e) {
      const status = e.response?.status;
      const msg = e.response?.data?.message || e.message || "Generation failed.";
      const fallback = e.response?.data?.coverLetter;

      if (fallback) {
        setLetter(fallback);
        setMeta({
          provider: e.response?.data?.provider || "template",
          model: e.response?.data?.model,
          status,
          note: msg,
        });
        setEditing(true);
      } else {
        setLetter(`Sorry—generation failed (${status || "no status"}): ${msg}`);
        setMeta({ status, note: msg });
        setEditing(true);
      }
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(letter);
      setMeta((m) => ({ ...(m || {}), copied: true }));
      setTimeout(() => setMeta((m) => (m ? { ...m, copied: false } : m)), 1200);
    } catch { /* no-op */ }
  }

  function downloadMarkdown() {
    const date = new Date().toISOString().slice(0, 10);
    const safeRole = (role || "Cover_Letter").replace(/[^a-z0-9]+/gi, "_");
    const filename = `${safeRole}_${date}.md`;
    const blob = new Blob([letter], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  // 👇 NEW: Download as PDF (client-side)
  function downloadPDF() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 48;
    const maxWidth = 595 - margin * 2; // A4 width is 595pt
    const lines = doc.splitTextToSize(letter || "", maxWidth);

    // Optional simple header
    const title = role ? `Cover Letter – ${role}` : "Cover Letter";
    doc.setFont("helvetica", "bold"); doc.setFontSize(14);
    doc.text(title, margin, margin);

    doc.setFont("helvetica", "normal"); doc.setFontSize(12);
    doc.text(lines, margin, margin + 24);

    const date = new Date().toISOString().slice(0, 10);
    const safeRole = (role || "Cover_Letter").replace(/[^a-z0-9]+/gi, "_");
    doc.save(`${safeRole}_${date}.pdf`);
  }

  function resetForm() {
    setLetter("");
    setMeta(null);
    setEditing(true);
  }

  return (
    <div className="space-y-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-blue-900">AI Cover Letter Generator</h3>
        {meta?.provider && (
          <span className="text-xs text-slate-500">
            {meta.provider}{meta.model ? ` · ${meta.model}` : ""}
            {meta.note ? ` · ${meta.note}` : ""}
          </span>
        )}
      </div>

      <label className="text-xs text-slate-600">Role / Job Title (optional)</label>
      <input
        className="w-full rounded border p-2"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        placeholder="e.g., Machine Learning Engineer"
      />

      <label className="text-xs text-slate-600">Job Description</label>
      <textarea
        className="w-full h-28 rounded border p-2"
        value={jobDescription}
        onChange={(e) => setJD(e.target.value)}
        placeholder="Paste the job description here..."
      />

      <label className="text-xs text-slate-600">Your CV (paste text)</label>
      <textarea
        className="w-full h-28 rounded border p-2"
        value={cvText}
        onChange={(e) => setCV(e.target.value)}
        placeholder="Paste your CV/resume text here..."
      />

      <div className="flex items-center gap-3">
        <label className="text-xs text-slate-600">Tone</label>
        <select
          className="rounded border p-1"
          value={tone}
          onChange={(e) => setTone(e.target.value)}
        >
          <option value="professional">Professional</option>
          <option value="enthusiastic">Enthusiastic</option>
          <option value="confident">Confident</option>
          <option value="concise">Concise</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={resetForm}
            className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-50 transition"
            disabled={loading}
          >
            Reset
          </button>
          <button
            onClick={generate}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
            disabled={disabled}
          >
            {loading ? "Generating…" : "Generate"}
          </button>
        </div>
      </div>

      {letter && (
        <div className="mt-3 space-y-3">
          {/* Controls for Draft */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-slate-600">Draft</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing((v) => !v)}
                className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-900 hover:bg-blue-50 transition"
                title={editing ? "Preview" : "Edit"}
              >
                {editing ? "Preview" : "Edit"}
              </button>
              <button
                onClick={copyToClipboard}
                className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-900 hover:bg-blue-50 transition"
                title="Copy to clipboard"
              >
                {meta?.copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={downloadMarkdown}
                className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-900 hover:bg-blue-50 transition"
                title="Download as .md"
              >
                Download .md
              </button>
              <button
                onClick={downloadPDF}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
                title="Download as PDF"
              >
                Download PDF
              </button>
            </div>
          </div>

          {/* Editor / Preview */}
          <div className="rounded-2xl border border-blue-100 bg-white p-3 shadow-sm">
            {editing ? (
              <textarea
                className="w-full min-h-[320px] rounded border p-3"
                value={letter}
                onChange={(e) => setLetter(e.target.value)}
                placeholder="Your generated cover letter will appear here. You can edit it freely."
              />
            ) : (
              <div className="prose max-w-none whitespace-pre-wrap leading-7 text-slate-800">
                {letter}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
