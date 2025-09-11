// src/components/admin/AdminNotesPanel.jsx
import React, { useEffect, useState } from 'react';
import axios, { tokenStore } from '../utils/axios';

export default function AdminNotesPanel({ entityType, entityId, onClose, user, setUser }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [body, setBody] = useState('');

  async function load(retried = false) {
    setLoading(true); setErr('');
    try {
      const { data } = await axios.get('/admin/notes', {
        params: { entity_type: entityType, entity_id: entityId }
      });
      setItems(data.items || []);
    } catch (e) {
      const s = e?.response?.status;
      if (!retried && s === 401) {
        try {
          const r = await axios.post('/auth/refresh');
          if (r?.data?.accessToken) {
            tokenStore.set(r.data.accessToken);
            setUser?.(r.data.user);
            return load(true);
          }
        } catch {}
      }
      setErr(e?.response?.data?.message || e.message || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(false); /* eslint-disable-next-line */ }, [entityType, entityId]);

  const add = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    try {
      const { data } = await axios.post('/admin/notes', {
        entity_type: entityType, entity_id: entityId, body: body.trim()
      });
      setItems(prev => [data, ...prev]);
      setBody('');
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Failed to add note');
    }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await axios.delete(`/admin/notes/${id}`);
      setItems(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Failed to delete note');
    }
  };

  return (
    <div style={panel}>
      <div style={{ display:'flex', alignItems:'center' }}>
        <h4 style={{ margin:0, flex:1 }}>Admin Notes</h4>
        {onClose && <button onClick={onClose} style={closeBtn}>Close</button>}
      </div>

      <form onSubmit={add} style={{ margin:'8px 0', display:'grid', gap:8 }}>
        <textarea
          rows={3}
          style={ta}
          placeholder="Leave a note for other admins…"
          value={body}
          onChange={e=>setBody(e.target.value)}
        />
        <div>
          <button type="submit" style={btn}>Add note</button>
        </div>
      </form>

      {err && <div style={errBox}>{err}</div>}
      {loading && <p>Loading…</p>}
      {!loading && !items.length && <p>No notes yet.</p>}

      {!!items.length && (
        <ul style={list}>
          {items.map(n => (
            <li key={n.id} style={li}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <b>{n.admin_username || n.admin_email || `#${n.admin_id}`}</b>
                <small style={{ opacity:0.6 }}>{new Date(n.created_at).toLocaleString()}</small>
                <div style={{ flex:1 }} />
                <button onClick={()=>del(n.id)} style={miniBtn}>Delete</button>
              </div>
              <div style={{ whiteSpace:'pre-wrap', marginTop:6 }}>{n.body}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const panel = { border:'1px solid #eee', borderRadius:12, padding:12, background:'#fff' };
const ta = { padding:8, border:'1px solid #ddd', borderRadius:8, width:'100%', resize:'vertical' };
const btn = { padding:'8px 12px', borderRadius:10, border:'1px solid #333', background:'#111', color:'#fff' };
const miniBtn = { padding:'6px 10px', borderRadius:8, border:'1px solid #ccc', background:'#fff' };
const closeBtn = { padding:'6px 10px', borderRadius:8, border:'1px solid #ccc', background:'#f8f8f8' };
const list = { listStyle:'none', padding:0, margin:0, display:'grid', gap:10 };
const li = { border:'1px solid #f0f0f0', borderRadius:10, padding:10 };
const errBox = { background:'#ffe9e9', border:'1px solid #ffb3b3', padding:10, borderRadius:8, marginTop:10, color:'#900' };
