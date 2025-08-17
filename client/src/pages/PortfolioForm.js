import { useState } from 'react';
import axios from '../utils/axios';
import './PortfolioForm.css'; // <- no trailing slash

export default function PortfolioForm({ initialData = {}, onSuccess }) {
  const [form, setForm] = useState({
    title: initialData.title || '',
    bio: initialData.bio || '',
    slug: initialData.slug || '',
    is_public: initialData.is_public || false,
    mediaUrl: '',
    mediaFile: null,
  });
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [previewMedia, setPreviewMedia] = useState([]);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Name/Title is required';
    if (!form.slug.trim()) e.slug = 'Slug is required';
    if (form.slug && !/^[a-z0-9-]+$/i.test(form.slug)) e.slug = 'Slug can only contain letters, numbers, hyphens';
    return e;
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox') setForm(f => ({ ...f, [name]: checked }));
    else if (type === 'file') setForm(f => ({ ...f, mediaFile: files[0] }));
    else setForm(f => ({ ...f, [name]: value }));
  };

  const handleAddMediaUrl = () => {
    if (!form.mediaUrl.trim()) return;
    setPreviewMedia(pm => [...pm, form.mediaUrl.trim()]);
    setForm(f => ({ ...f, mediaUrl: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = validate();
    if (Object.keys(val).length) { setErrors(val); return; }
    setErrors({});
    setFeedback('Saving…');

    try {
      const token = localStorage.getItem('token');
      const payload = {
        title: form.title,
        subtitle: '',
        bio: form.bio,
        slug: form.slug,
        is_public: form.is_public,
      };

      let res;
      if (initialData.id) {
        res = await axios.put(`/portfolios/${initialData.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        res = await axios.post('/portfolios', payload, { headers: { Authorization: `Bearer ${token}` } });
      }

      setFeedback('Portfolio saved successfully!');
      onSuccess?.(res.data);
    } catch (err) {
      console.error(err);
      setFeedback('Error saving portfolio.');
    }
  };

  return (
    <div className="portfolio-builder">
      <form onSubmit={handleSubmit} className="portfolio-form">
        <h2>Portfolio Builder</h2>

        <label>
          Name
          <input type="text" name="title" value={form.title} onChange={handleChange}/>
          {errors.title && <span className="error">{errors.title}</span>}
        </label>

        <label>
          Bio
          <textarea name="bio" value={form.bio} onChange={handleChange} />
        </label>

        <label>
          Slug (for your public link)
          <input type="text" name="slug" value={form.slug} onChange={handleChange}/>
          {errors.slug && <span className="error">{errors.slug}</span>}
        </label>

        <label className="checkbox">
          <input type="checkbox" name="is_public" checked={form.is_public} onChange={handleChange}/> Make Public
        </label>

        <label>
          Add media (URL)
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="url" name="mediaUrl" value={form.mediaUrl} onChange={handleChange} placeholder="https://example.com/image.jpg"/>
            <button type="button" onClick={handleAddMediaUrl}>Add</button>
          </div>
        </label>

        <label>
          Or upload file
          <input type="file" name="mediaFile" onChange={handleChange} accept="image/*" />
        </label>

        <button type="submit" className="save-btn">Save portfolio</button>
        {feedback && <div className="feedback">{feedback}</div>}
      </form>

      <div className="portfolio-preview">
        <h3>Preview</h3>
        <div className="preview-card">
          <h4>{form.title || 'Portfolio Name'}</h4>
          <p>{form.bio || 'Your bio will appear here.'}</p>
          {previewMedia.length > 0 && (
            <div className="media-preview">
              {previewMedia.map((url, i) => (
                <img key={i} src={url} alt="" style={{ width: '100%', marginTop: 8 }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
