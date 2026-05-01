import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchLeagues, saveLeague, updateLeague, deleteLeague } from '../../services/apiService';
import { Trophy, Plus, Loader2, Globe, Trash2, Pencil, Check, X } from 'lucide-react';

const LeaguesView = () => {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newLeague, setNewLeague] = useState({ name: '', country: '', logo_url: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingLeague, setEditingLeague] = useState(null);

  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteContent, setPasteContent] = useState('');

  useEffect(() => { loadLeagues(); }, []);

  const loadLeagues = async () => {
    try { setLeagues(await fetchLeagues()); setLoading(false); }
    catch (err) { console.error(err); }
  };

  const handleJsonUpload = async (data) => {
    try {
      if (Array.isArray(data)) {
        setUploading(true);
        await fetch('/api/leagues/batch', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify(data) });
        loadLeagues();
        alert('Batch upload successful!');
        setShowPasteModal(false);
        setPasteContent('');
      } else {
        alert('Invalid JSON format. Expected an array.');
      }
    } catch (err) {
      alert('Error parsing JSON or uploading data');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e, isEdit = false) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: formData });
      const data = await res.json();
      if (data.success) {
        if (isEdit) setEditingLeague(prev => ({ ...prev, logo_url: data.url }));
        else setNewLeague(prev => ({ ...prev, logo_url: data.url }));
      }
    } catch { alert('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleAddLeague = async (e) => {
    e.preventDefault();
    if (!newLeague.name) return;
    try {
      await saveLeague(newLeague);
      setNewLeague({ name: '', country: '', logo_url: '' });
      setShowAdd(false);
      loadLeagues();
    } catch { alert('Error saving league'); }
  };

  const handleDeleteLeague = async (id) => {
    if (!confirm('Delete this league? All associated teams may be affected.')) return;
    try { await deleteLeague(id); loadLeagues(); }
    catch { alert('Error deleting league'); }
  };

  const handleSaveEdit = async () => {
    if (!editingLeague) return;
    try {
      await updateLeague(editingLeague.id, { name: editingLeague.name, country: editingLeague.country, logo_url: editingLeague.logo_url });
      setEditingLeague(null);
      loadLeagues();
    } catch { alert('Error updating league'); }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
      <Loader2 className="animate-spin" color="var(--brand-primary)" size={48} />
    </div>
  );

  const inputStyle = { padding: '4px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <header className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>League Management</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Manage official competition structures and regional associations.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowPasteModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '10px', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
            Paste JSON
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '10px', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
            <Loader2 size={15} style={{ display: uploading ? 'block' : 'none' }} className="animate-spin" />
            <span style={{ display: uploading ? 'none' : 'block' }}>Upload JSON File</span>
            <input type="file" accept=".json" onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = async (event) => {
                try {
                  const data = JSON.parse(event.target.result);
                  await handleJsonUpload(data);
                } catch (err) {
                  alert('Invalid JSON file');
                }
              };
              reader.readAsText(file);
            }} style={{ display: 'none' }} />
          </label>
          <button onClick={() => setShowAdd(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '10px', background: showAdd ? 'var(--bg-panel-muted)' : 'var(--brand-primary)', color: showAdd ? 'var(--text-main)' : '#fff', border: 'none', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
            {showAdd ? <X size={15} /> : <Plus size={15} />} {showAdd ? 'Cancel' : 'Add League'}
          </button>
        </div>
      </header>

      {showPasteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-panel)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', width: '500px', maxWidth: '90%', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Paste Leagues JSON</h2>
                <button onClick={() => {
                  navigator.clipboard.writeText('[\n  {\n    "name": "Premier League",\n    "country": "England",\n    "logo_url": "https://example.com/pl-logo.png"\n  }\n]');
                  alert('Template copied to clipboard!');
                }} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>Copy Template</button>
              </div>
              <button onClick={() => setShowPasteModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <textarea 
              placeholder="[\n  {\n    &quot;name&quot;: &quot;League Name&quot;,\n    &quot;country&quot;: &quot;Country&quot;\n  }\n]"
              value={pasteContent}
              onChange={e => setPasteContent(e.target.value)}
              style={{ width: '100%', height: '200px', padding: '12px', borderRadius: '8px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '12px', fontFamily: 'monospace', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setShowPasteModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
              <button disabled={uploading || !pasteContent.trim()} onClick={() => {
                try {
                  const data = JSON.parse(pasteContent);
                  handleJsonUpload(data);
                } catch {
                  alert('Invalid JSON syntax');
                }
              }} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--brand-primary)', color: '#fff', fontWeight: '700', fontSize: '12px', cursor: uploading || !pasteContent.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {uploading && <Loader2 size={14} className="animate-spin" />} Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div style={{ background: 'var(--bg-panel)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-color)' }}>
          <form onSubmit={handleAddLeague} className="admin-form-grid" style={{ display: 'grid', gridTemplateColumns: 'auto 2fr 1fr 100px', gap: '16px', alignItems: 'end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '10px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase' }}>Logo</label>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--bg-panel-muted)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                {newLeague.logo_url ? <img src={newLeague.logo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Trophy size={14} opacity={0.3} />}
                <input type="file" accept="image/*" onChange={e => handleFileUpload(e, false)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '10px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase' }}>Name</label>
              <input placeholder="Premier League" value={newLeague.name} onChange={e => setNewLeague({...newLeague, name: e.target.value})} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', fontSize: '12px' }} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '10px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase' }}>Country</label>
              <input placeholder="England" value={newLeague.country} onChange={e => setNewLeague({...newLeague, country: e.target.value})} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', fontSize: '12px' }} />
            </div>
            <button type="submit" disabled={uploading} style={{ padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--brand-primary)', color: '#fff', fontWeight: '700', fontSize: '12px' }}>Add</button>
          </form>
        </div>
      )}

      <div className="responsive-table-container" style={{ background: 'var(--bg-panel)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-panel-muted)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '10px 16px', fontWeight: '800', width: '40px' }}>S/N</th>
              <th style={{ padding: '10px 16px', fontWeight: '800', width: '50px' }}>Logo</th>
              <th style={{ padding: '10px 16px', fontWeight: '800' }}>Name</th>
              <th style={{ padding: '10px 16px', fontWeight: '800', width: '160px' }}>Country</th>
              <th style={{ padding: '10px 16px', fontWeight: '800', textAlign: 'right', width: '90px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leagues.map((league, idx) => {
              const isEditing = editingLeague?.id === league.id;
              return (
                <tr key={league.id} style={{ background: idx % 2 === 0 ? 'transparent' : 'var(--bg-panel-muted)', borderBottom: '1px solid var(--border-color)', height: '44px' }}>
                  <td style={{ padding: '4px 16px', fontWeight: '700', color: 'var(--text-muted)' }}>{idx + 1}</td>
                  <td style={{ padding: '4px 16px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--bg-panel-muted)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                      {(isEditing ? editingLeague.logo_url : league.logo_url)
                        ? <img src={isEditing ? editingLeague.logo_url : league.logo_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        : <Trophy size={12} opacity={0.3} />}
                      {isEditing && <input type="file" accept="image/*" onChange={e => handleFileUpload(e, true)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />}
                    </div>
                  </td>
                  <td style={{ padding: '4px 16px', fontWeight: '700' }}>
                    {isEditing
                      ? <input value={editingLeague.name} onChange={e => setEditingLeague({...editingLeague, name: e.target.value})} style={{ ...inputStyle, width: '100%' }} />
                      : <Link to={`/admin/teams?leagueId=${league.id}`} style={{ color: 'inherit', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--brand-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'inherit'}>{league.name}</Link>}
                  </td>
                  <td style={{ padding: '4px 16px' }}>
                    {isEditing
                      ? <input value={editingLeague.country || ''} onChange={e => setEditingLeague({...editingLeague, country: e.target.value})} style={inputStyle} />
                      : <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}><Globe size={11} /> {league.country || '—'}</span>}
                  </td>
                  <td style={{ padding: '4px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      {isEditing ? (
                        <>
                          <button onClick={handleSaveEdit} title="Save" style={{ background: 'var(--brand-primary)', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', display: 'flex' }}><Check size={13} /></button>
                          <button onClick={() => setEditingLeague(null)} title="Cancel" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', display: 'flex' }}><X size={13} /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setEditingLeague({...league})} title="Edit" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex' }}><Pencil size={13} /></button>
                          <button onClick={() => handleDeleteLeague(league.id)} title="Delete" style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '4px', display: 'flex' }}><Trash2 size={13} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {leagues.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', opacity: 0.3, fontSize: '13px' }}>No leagues registered yet.</div>
        )}
      </div>
    </div>
  );
};

export default LeaguesView;
