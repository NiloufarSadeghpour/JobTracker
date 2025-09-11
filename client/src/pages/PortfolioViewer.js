// src/pages/PortfolioViewer.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../utils/axios';
import DOMPurify from 'dompurify';

export default function PortfolioViewer() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await axios.get(`/portfolios/p/${slug}/full`);
        if (active) setData(data);
      } catch (e) {
        if (active) setErr('Portfolio not found');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [slug]);

  if (loading) return <main className="container">Loading…</main>;
  if (err) return <main className="container">{err}</main>;

  const { portfolio, assets, items } = data;
  const firstAsset = assets?.[0];

  return (
    <main className="container">
      <div className="job-tracker-container">
        <div className="job-tracker-header">
          <h2 className="brand-accent">{portfolio.title}</h2>
          <Link to="/dashboard" className="add-job-btn">Back</Link>
        </div>

        {firstAsset ? (
          <>
            {/* try embed, fallback link */}
            <iframe title="Portfolio"
              src={firstAsset.url}
              style={{ width:'100%', height:'70vh', border:'1px solid var(--border)', borderRadius:12 }}
            />
            <div className="next-steps-buttons" style={{ marginTop:12, display:'flex', gap:8 }}>
              <a className="upload-btn" href={firstAsset.url} target="_blank" rel="noreferrer">Open</a>
              <a className="save-btn" href={firstAsset.url} download>Download</a>
            </div>
          </>
        ) : null}

        {portfolio.bio && (
          <div className="preview-card" style={{ marginTop:16 }}>
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(portfolio.bio) }} />
          </div>
        )}

        {!!items?.length && (
          <div style={{ marginTop:24 }}>
            {items.map(it => (
              <section key={it.id} className="card" style={{ marginBottom:12 }}>
                <h3 className="card-title">{it.title}</h3>
                {it.description && <p>{it.description}</p>}
                {!!it.images?.length && (
                  <div className="media-grid">
                    {it.images.map(img => (
                      <img key={img.id} src={img.url} alt={img.alt_text || it.title} className="media" />
                    ))}
                  </div>
                )}
                {!!it.links?.length && (
                  <div style={{ marginTop:8 }}>
                    {it.links.map(l => (
                      <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="link" style={{ marginRight:8 }}>
                        {l.label}
                      </a>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
