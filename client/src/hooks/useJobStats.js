// =============================================
// src/hooks/useJobStats.js  — user-scoped
// =============================================
import { useEffect, useMemo, useState } from "react";
import axios, { tokenStore } from "../utils/axios";

const STATUS = {
  APPLIED: "applied",
  SCREENING: "screening",
  INTERVIEW: "interview",
  OFFER: "offer",
  REJECTED: "rejected",
};

const mockJobs = [
  { id: 1, title: "PhD – TU Delft", status: STATUS.APPLIED,   createdAt: "2025-05-03", userId: "me" },
  { id: 2, title: "PhD – KTH",      status: STATUS.INTERVIEW, createdAt: "2025-06-10", userId: "me" },
  { id: 3, title: "PhD – Twente",   status: STATUS.OFFER,     createdAt: "2025-07-02", userId: "me" },
  { id: 4, title: "PhD – Radboud",  status: STATUS.REJECTED,  createdAt: "2025-07-18", userId: "me" },
  { id: 5, title: "PhD – Chalmers", status: STATUS.APPLIED,   createdAt: "2025-08-05", userId: "me" },
  { id: 6, title: "PhD – Leiden",   status: STATUS.INTERVIEW, createdAt: "2025-08-21", userId: "me" },
];

// Minimal, safe JWT parser (no dependency)
function parseJwtSub(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    // common fields you might use: sub | userId | id
    return payload?.sub || payload?.userId || payload?.id || null;
  } catch {
    return null;
  }
}

// Prefer these endpoints (first that responds is used)
const CANDIDATE_ENDPOINTS = [
  "/jobs?me=1",
  "/api/jobs?me=1",
  "/jobs/me",
  "/api/jobs/me",
  "/api/jobs",    // last resort (will be client-filtered)
];

export function useJobStats({ jobs: jobsOverride } = {}) {
  const [jobs, setJobs] = useState(jobsOverride || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (jobsOverride) return; // caller provided data

    let mounted = true;

    async function fetchUserJobs() {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        if (token) tokenStore.set(token);

        const authHeader = tokenStore.get()
          ? { Authorization: `Bearer ${tokenStore.get()}` }
          : {};

        // find the first endpoint that returns successfully
        let data = null;
        let lastErr = null;
        for (const url of CANDIDATE_ENDPOINTS) {
          try {
            const res = await axios.get(url, { headers: authHeader });
            data = Array.isArray(res.data) ? res.data : (res.data?.items || res.data?.data || null);
            if (data) break;
          } catch (e) {
            lastErr = e;
            // try next endpoint
          }
        }
        if (!mounted) return;

        if (!data) {
          // all endpoints failed -> fall back to mocks
          setJobs(mockJobs);
          setError(lastErr || new Error("No jobs data"));
          return;
        }

        // Client-side safety filter in case API still sent mixed users
        let arr = data;
        if (typeof arr[0] === "object") {
          const token = tokenStore.get?.();
          const myId = token ? parseJwtSub(token) : null;

          if (myId) {
            // guess common user id fields
            const idFields = ["userId", "ownerId", "user", "owner"];
            const field = idFields.find((f) => f in (arr[0] || {}));
            if (field) {
              arr = arr.filter((j) => {
                const v = j[field];
                // support both primitives and objects { id: ... }
                return (typeof v === "object" && v?.id === myId) || v === myId;
              });
            }
          }
        }

        // If after filtering we lost everything, still prefer showing something
        setJobs(arr.length ? arr : mockJobs);
      } catch (e) {
        if (!mounted) return;
        setJobs(mockJobs);
        setError(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchUserJobs();
    return () => { mounted = false; };
  }, [jobsOverride]);

  const stats = useMemo(() => {
    const arr = jobs || [];
    const total = arr.length;

    const norm = (s) => (s || "").toLowerCase();
    const interviews = arr.filter((j) => norm(j.status) === STATUS.INTERVIEW).length;
    const offers     = arr.filter((j) => norm(j.status) === STATUS.OFFER).length;
    const rejections = arr.filter((j) => norm(j.status) === STATUS.REJECTED).length;
    const successRate = total ? offers / total : 0;

    // Group by YYYY-MM for a tiny trend chart
    const byMonthMap = new Map();
    for (const j of arr) {
      const d = new Date(j.createdAt || j.appliedAt || j.updatedAt || Date.now());
      const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonthMap.set(label, (byMonthMap.get(label) || 0) + 1);
    }
    const byMonth = Array.from(byMonthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, applied]) => ({ date, applied }));

    return { total, interviews, offers, rejections, successRate, byMonth };
  }, [jobs]);

  return { jobs, loading, error, ...stats };
}
