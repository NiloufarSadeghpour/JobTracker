// src/components/ResumeUpload.jsx
import { useRef, useState } from 'react';
import axios from '../utils/axios';
import { Upload, FileText, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

const MAX_MB = 5;

export default function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [resumeUrl, setResumeUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState('');
  const inputRef = useRef(null);

  const onPick = (f) => {
    setErr('');
    setResumeUrl('');
    if (!f) return setFile(null);

    // Basic validation
    const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
    const tooBig = f.size > MAX_MB * 1024 * 1024;

    if (!isPdf) return setErr('Only PDF files are allowed.');
    if (tooBig) return setErr(`File is too large. Max ${MAX_MB} MB.`);

    setFile(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    onPick(e.dataTransfer.files?.[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || busy) return;
    setErr('');
    setProgress(0);

    const formData = new FormData();
    formData.append('resume', file); 

    try {
      setBusy(true);
      const res = await axios.post('/resume', formData, {
        onUploadProgress: (p) => {
          if (!p.total) return;
          setProgress(Math.round((p.loaded / p.total) * 100));
        },
      });
      setResumeUrl(res.data?.path || '');
    } catch (error) {
      const status = error?.response?.status;
      const msg =
        error?.response?.data?.message ||
        (status === 401 ? 'Please log in again.' :
         status === 415 ? 'Only PDF files are allowed.' :
         'Upload failed.');
      setErr(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-8 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
      <h3 className="mb-2 text-xl font-bold text-blue-900">Upload Resume (PDF)</h3>
      <p className="mb-4 text-sm text-slate-600">
        Max {MAX_MB} MB. We’ll store it with your profile for quick applications.
      </p>

      <form onSubmit={handleUpload} className="space-y-4">
        {/* Drop zone */}
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className={`flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed p-6 transition
            ${file ? 'border-blue-300 bg-blue-50/50' : 'border-blue-200 hover:bg-blue-50/40'}
          `}
          onClick={() => inputRef.current?.click()}
          title="Click or drop a PDF"
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0] || null)}
          />
          <div className="flex flex-col items-center">
            <Upload className="mb-2 h-6 w-6 text-blue-700" />
            <span className="text-sm font-semibold text-blue-900">
              {file ? 'Ready to upload' : 'Click to choose a PDF or drag & drop'}
            </span>
            <span className="text-xs text-slate-600">
              {file ? file.name : 'PDF only'}
            </span>
          </div>
        </div>

        {/* Selected file details */}
        {file && (
          <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-white px-3 py-2">
            <FileText className="h-5 w-5 text-blue-700" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-blue-900">{file.name}</div>
              <div className="text-xs text-slate-600">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </div>
            </div>
            <button
              type="button"
              className="text-sm text-slate-600 underline hover:text-slate-800"
              onClick={() => { setFile(null); setErr(''); setProgress(0); }}
            >
              remove
            </button>
          </div>
        )}

        {/* Error */}
        {err && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <AlertTriangle className="h-4 w-4" />
            {err}
          </div>
        )}

        {/* Progress */}
        {busy && (
          <div className="flex items-center gap-3">
            <div className="h-2 w-full rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="w-12 text-right text-sm tabular-nums text-slate-700">{progress}%</span>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!file || busy}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-semibold text-white transition
              ${!file || busy ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
            `}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {busy ? 'Uploading…' : 'Upload'}
          </button>

          {resumeUrl && !busy && (
            <a
              href={resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700 hover:bg-emerald-100 transition"
              title="Open uploaded resume"
            >
              <CheckCircle2 className="h-4 w-4" />
              Uploaded! View / Download
            </a>
          )}
        </div>
      </form>
    </div>
  );
}
