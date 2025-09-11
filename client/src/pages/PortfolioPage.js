// src/pages/PortfolioPage.jsx
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import Sidebar from '../components/Sidebar';
import './portfolio-page.css';

export default function PortfolioPage() {
  const { state } = useLocation();
  const initialData = state?.initialData || {};

  const navigate = useNavigate();
  const [currentId, setCurrentId] = useState(initialData.id ?? null);

  const [form, setForm] = useState({
    title: initialData.title || '',
    bio: initialData.bio || '',
    slug: initialData.slug || '',
    is_public: !!initialData.is_public,
    mediaUrl: '',
    mediaFile: null,
  });

  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [previewMedia, setPreviewMedia] = useState([]);
  const titleInputRef = useRef(null);

  // Rehydrate ONLY when record identity changes
  useEffect(() => {
    const newId = initialData?.id ?? null;
    setCurrentId(newId);
    if (newId !== null) {
      setForm(f => ({
        ...f,
        title: initialData.title || '',
        bio: initialData.bio || '',
        slug: initialData.slug || '',
        is_public: !!initialData.is_public,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.id]);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Name/Title is required';
    if (!form.slug.trim()) e.slug = 'Slug is required';
    if (form.slug && !/^[a-z0-9-]+$/i.test(form.slug)) e.slug = 'Slug can only contain letters, numbers, hyphens';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox') setForm(f => ({ ...f, [name]: checked }));
    else if (type === 'file') setForm(f => ({ ...f, mediaFile: files?.[0] || null }));
    else setForm(f => ({ ...f, [name]: value }));
  };

  const handleAddMediaUrl = () => {
    if (!form.mediaUrl.trim()) return;
    setPreviewMedia(pm => [...pm, form.mediaUrl.trim()]);
    setForm(f => ({ ...f, mediaUrl: '' }));
  };

  const handleEditFocus = () => {
    titleInputRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async () => {
    if (!currentId) return;
    if (!window.confirm('Delete this portfolio? This cannot be undone.')) return;
    try {
      await axios.delete(`/portfolios/${currentId}`);
      setFeedback('Portfolio deleted.');
      setCurrentId(null);
      setForm(f => ({ ...f, title: '', bio: '', slug: '', is_public: false }));
      // bounce back to dashboard after a moment
      setTimeout(() => navigate('/dashboard'), 600);
    } catch (err) {
      setFeedback(err?.response?.data?.message || 'Error deleting portfolio.');
    }
  };

// inside PortfolioPage.jsx
const uploadMediaIfNeeded = async () => {
  if (!form.mediaFile) return null;
  const fd = new FormData();
  fd.append('file', form.mediaFile);
  const { data } = await axios.post('/uploads', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data?.url || null;
};

const saveAssetIfNeeded = async (portfolioId, url) => {
  if (!url && !form.mediaUrl) return;
  const finalUrl = url || form.mediaUrl.trim();
  if (!finalUrl) return;
  await axios.post(`/portfolios/${portfolioId}/assets`, {
    asset_type: /^https?:/i.test(finalUrl) ? 'external' : 'upload',
    url: finalUrl,
    label: 'Primary',
  });
};

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validate()) return;
  setFeedback('Saving…');

  try {
    const payload = {
      title: form.title,
      subtitle: '',
      bio: form.bio,              // you can store HTML; sanitize on render
      slug: form.slug,
      is_public: form.is_public,
    };

    const res = currentId
      ? await axios.put(`/portfolios/${currentId}`, payload)
      : await axios.post('/portfolios', payload);

    const id = currentId || res?.data?.id;
    if (!currentId && id) setCurrentId(id);

    // upload file (optional) then save asset
    const uploadedUrl = await uploadMediaIfNeeded();
    await saveAssetIfNeeded(id, uploadedUrl);

    setFeedback('Portfolio saved successfully!');
  } catch (err) {
    setFeedback(err?.response?.data?.message || 'Error saving portfolio.');
  }
};

  const editing = !!currentId;
  const hasPublicLink = !!form.is_public && !!form.slug;

  return (
    <div className="page-shell">
      <Sidebar />

      <main className="page-main">
        <header className="page-header">
          <div>
            <h1 className="page-title">Portfolio Builder</h1>
            <p className="page-sub">Create or update your public portfolio page.</p>
          </div>
          <div className="page-actions">
            <button className="btn ghost" onClick={() => navigate('/dashboard')}>← Back to dashboard</button>
          </div>
        </header>

        <div className="pf-grid">
          {/* Form card */}
          <form onSubmit={handleSubmit} className="card">
            <div className="card-header">
              <h2 className="card-title">
                Details {editing && <span className="pill ok">editing</span>}
              </h2>
            </div>

            <div className="field">
              <label htmlFor="pf-title">Name</label>
              <input
                id="pf-title"
                ref={titleInputRef}
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                className={`input ${errors.title ? 'invalid' : ''}`}
                placeholder="e.g. Jane Doe"
              />
              {errors.title && <span className="error">{errors.title}</span>}
            </div>

            <div className="field">
              <label htmlFor="pf-bio">Bio</label>
              <textarea
                id="pf-bio"
                name="bio"
                value={form.bio}
                onChange={handleChange}
                className="textarea"
                rows={4}
                placeholder="Short intro about you, your work and interests…"
              />
            </div>

            <div className="field">
              <label htmlFor="pf-slug">Slug (for your public link)</label>
              <input
                id="pf-slug"
                type="text"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                className={`input ${errors.slug ? 'invalid' : ''}`}
                placeholder="your-name"
              />
              {errors.slug && <span className="error">{errors.slug}</span>}
              {hasPublicLink && (
                <div className="hint">
                  Public URL:&nbsp;
                  <a href={`/p/${form.slug}`} target="_blank" rel="noreferrer" className="link">
                    /p/{form.slug}
                  </a>
                </div>
              )}
            </div>

            <label className="checkbox">
              <input
                type="checkbox"
                name="is_public"
                checked={form.is_public}
                onChange={handleChange}
              />
              <span>Make Public</span>
            </label>

            <div className="field">
              <label>Add media (URL)</label>
              <div className="row">
                <input
                  type="url"
                  name="mediaUrl"
                  value={form.mediaUrl}
                  onChange={handleChange}
                  className="input"
                  placeholder="https://example.com/image.jpg"
                />
                <button type="button" onClick={handleAddMediaUrl} className="btn ghost">Add</button>
              </div>
            </div>

            <div className="field">
              <label>Or upload file</label>
              <input
                type="file"
                name="mediaFile"
                onChange={handleChange}
                accept="image/*"
                className="file"
              />
            </div>

            <div className="actions">
              <button type="submit" className="btn primary">
                {editing ? 'Save changes' : 'Save portfolio'}
              </button>
              {editing && (
                <button type="button" onClick={handleDelete} className="btn danger">
                  Delete
                </button>
              )}
              {feedback && (
                <div className={`feedback ${/saved/i.test(feedback) ? 'ok' : ''}`}>
                  {feedback}
                </div>
              )}
            </div>
          </form>

          {/* Preview card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Preview</h2>
              <p className="card-sub">This is how your public page will look.</p>
            </div>

            <div className="preview">
              <h4 className="preview-title">{form.title || 'Portfolio Name'}</h4>
              <p className="preview-text">{form.bio || 'Your bio will appear here.'}</p>

              {!!previewMedia.length && (
                <div className="media-grid">
                  {previewMedia.map((url, i) => (
                    <img key={i} src={url} alt="" className="media" />
                  ))}
                </div>
              )}

              <div className="preview-actions">
                <button type="button" onClick={handleEditFocus} className="btn ghost">
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
