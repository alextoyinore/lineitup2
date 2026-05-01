import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchGlobalTeams, fetchLeagues, deleteGlobalTeam, updateGlobalTeam } from '../../services/apiService';
import { Users, Plus, Loader2, MapPin, Building2, Calendar, Trophy, Trash2, Pencil, Check, X } from 'lucide-react';

const TeamsView = () => {
  const [searchParams] = useSearchParams();
  const leagueIdParam = searchParams.get('leagueId');

  const [teams, setTeams] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState(leagueIdParam || 'all');
  const [loading, setLoading] = useState(true);
  const [newTeam, setNewTeam] = useState({ name: '', league_id: '', logo_url: '', stadium_name: '', city: '', manager_name: '', foundation_year: '', stadium_image_url: '', location_map_url: '' });
  const [uploading, setUploading] = useState({ badge: false, stadium: false, map: false });
  const [showAdd, setShowAdd] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [pasteLeagueId, setPasteLeagueId] = useState('');

  useEffect(() => { loadData(); }, []);

  const uploadFile = async (file, onSuccess) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch('/api/upload', { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: formData });
    const data = await res.json();
    if (data.success) onSuccess(data.url);
  };

  const handleFileUpload = async (e, type, isEdit = false) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(prev => ({ ...prev, [type]: true }));
    try {
      await uploadFile(file, (url) => {
        const fieldMap = { badge: 'logo_url', stadium: 'stadium_image_url', map: 'location_map_url' };
        const field = fieldMap[type];
        if (isEdit) setEditingTeam(prev => ({ ...prev, [field]: url }));
        else setNewTeam(prev => ({ ...prev, [field]: url }));
      });
    } catch { alert('Upload failed'); }
    finally { setUploading(prev => ({ ...prev, [type]: false })); }
  };

  const loadData = async () => {
    try {
      const [t, l] = await Promise.all([fetchGlobalTeams(), fetchLeagues()]);
      setTeams(t); setLeagues(l); setLoading(false);
    } catch (err) { console.error(err); }
  };

  const handleJsonUpload = async (data) => {
    try {
      if (Array.isArray(data)) {
        if (pasteLeagueId) {
          data = data.map(team => ({ ...team, league_id: pasteLeagueId }));
        }
        const invalid = data.some(t => !t.league_id);
        if (invalid) {
          alert('Some teams are missing a league_id. Please select a league below or include it in the JSON.');
          return;
        }
        setUploading(prev => ({ ...prev, batch: true }));
        await fetch('/api/global/teams/batch', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify(data) });
        loadData();
        alert('Batch upload successful!');
        setShowPasteModal(false);
        setPasteContent('');
      } else {
        alert('Invalid JSON format. Expected an array.');
      }
    } catch (err) {
      alert('Error parsing JSON or uploading data');
    } finally {
      setUploading(prev => ({ ...prev, batch: false }));
    }
  };

  const handleAddTeam = async (e) => {
    e.preventDefault();
    if (!newTeam.name) return;
    try {
      await fetch('/api/global/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ name: newTeam.name, league_id: newTeam.league_id, logo_url: newTeam.logo_url, stadium_name: newTeam.stadium_name, city: newTeam.city, manager_name: newTeam.manager_name, foundation_year: newTeam.foundation_year, stadium_image_url: newTeam.stadium_image_url, location_map_url: newTeam.location_map_url })
      });
      setNewTeam({ name: '', league_id: '', logo_url: '', stadium_name: '', city: '', manager_name: '', foundation_year: '', stadium_image_url: '', location_map_url: '' });
      setShowAdd(false);
      loadData();
    } catch { alert('Error saving team'); }
  };

  const handleDeleteTeam = async (id) => {
    if (!confirm('Delete this team? All associated players will also be removed.')) return;
    try { await deleteGlobalTeam(id); loadData(); }
    catch { alert('Error deleting team'); }
  };

  const handleSaveEdit = async () => {
    if (!editingTeam) return;
    try {
      await updateGlobalTeam(editingTeam.id, {
        name: editingTeam.name,
        league_id: editingTeam.league_id,
        logo_url: editingTeam.logo_url,
        stadium_name: editingTeam.stadium_name,
        city: editingTeam.city,
        manager_name: editingTeam.manager_name,
        foundation_year: editingTeam.foundation_year,
        stadium_image_url: editingTeam.stadium_image_url,
        location_map_url: editingTeam.location_map_url
      });
      setEditingTeam(null);
      loadData();
    } catch { alert('Error updating team'); }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const teamsPerPage = 20;

  const filteredTeams = selectedLeagueId === 'all' ? teams : teams.filter(t => t.league_id === selectedLeagueId);
  
  const totalPages = Math.ceil(filteredTeams.length / teamsPerPage);
  const paginatedTeams = filteredTeams.slice((currentPage - 1) * teamsPerPage, currentPage * teamsPerPage);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
      <Loader2 className="animate-spin" color="var(--brand-primary)" size={48} />
    </div>
  );

  const inputStyle = { padding: '4px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <header className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Team Database</h1>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Manage club details, stadiums, and location data.</p>
          </div>
          {/* League filter */}
          <div style={{ display: 'flex', background: 'var(--bg-panel)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)', gap: '2px', overflowX: 'auto', maxWidth: '100%' }}>
            <button key="all" onClick={() => { setSelectedLeagueId('all'); setCurrentPage(1); }} style={{ padding: '5px 10px', borderRadius: '5px', border: 'none', background: selectedLeagueId === 'all' ? 'var(--brand-primary)' : 'transparent', color: selectedLeagueId === 'all' ? '#fff' : 'var(--text-main)', cursor: 'pointer', fontSize: '10px', fontWeight: '700', whiteSpace: 'nowrap' }}>All</button>
            {leagues.map(l => (
              <button key={l.id} onClick={() => { setSelectedLeagueId(l.id); setCurrentPage(1); }} style={{ padding: '5px 10px', borderRadius: '5px', border: 'none', background: selectedLeagueId === l.id ? 'var(--brand-primary)' : 'transparent', color: selectedLeagueId === l.id ? '#fff' : 'var(--text-main)', cursor: 'pointer', fontSize: '10px', fontWeight: '700', whiteSpace: 'nowrap' }}>{l.name}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => {
            setPasteLeagueId(selectedLeagueId !== 'all' ? selectedLeagueId : '');
            setShowPasteModal(true);
          }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '10px', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
            Paste JSON
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '10px', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
            <Loader2 size={15} style={{ display: uploading.batch ? 'block' : 'none' }} className="animate-spin" />
            <span style={{ display: uploading.batch ? 'none' : 'block' }}>Upload JSON File</span>
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
            {showAdd ? <X size={15} /> : <Plus size={15} />} {showAdd ? 'Cancel' : 'Add Team'}
          </button>
        </div>
      </header>

      {showPasteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-panel)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', width: '500px', maxWidth: '90%', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Paste Teams JSON</h2>
                <button onClick={() => {
                  navigator.clipboard.writeText('[\n  {\n    "name": "Arsenal",\n    "logo_url": "https://example.com/arsenal.png",\n    "stadium_name": "Emirates Stadium",\n    "city": "London",\n    "manager_name": "Mikel Arteta",\n    "foundation_year": "1886",\n    "stadium_image_url": "https://example.com/emirates.png",\n    "location_map_url": "https://example.com/map.png",\n    "default_formation": "4-3-3",\n    "primary_color": "#EF0107",\n    "secondary_color": "#063672"\n  }\n]');
                  alert('Template copied to clipboard! (league_id omitted, assign it below)');
                }} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>Copy Template</button>
              </div>
              <button onClick={() => setShowPasteModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <textarea 
              placeholder="[\n  {\n    &quot;name&quot;: &quot;Team Name&quot;\n  }\n]"
              value={pasteContent}
              onChange={e => setPasteContent(e.target.value)}
              style={{ width: '100%', height: '200px', padding: '12px', borderRadius: '8px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '12px', fontFamily: 'monospace', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <select value={pasteLeagueId} onChange={e => setPasteLeagueId(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', fontSize: '12px' }}>
                <option value="">— Assign all to League —</option>
                {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setShowPasteModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                <button disabled={uploading.batch || !pasteContent.trim()} onClick={() => {
                  try {
                    const data = JSON.parse(pasteContent);
                    handleJsonUpload(data);
                  } catch {
                    alert('Invalid JSON syntax');
                  }
                }} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--brand-primary)', color: '#fff', fontWeight: '700', fontSize: '12px', cursor: uploading.batch || !pasteContent.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {uploading.batch && <Loader2 size={14} className="animate-spin" />} Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div style={{ background: 'var(--bg-panel)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-color)' }}>
          <form onSubmit={handleAddTeam} className="admin-form-grid" style={{ display: 'grid', gridTemplateColumns: 'auto 2fr 1fr 1fr 1fr 1fr auto auto 80px', gap: '12px', alignItems: 'end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '10px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase' }}>Badge</label>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--bg-panel-muted)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                {newTeam.logo_url ? <img src={newTeam.logo_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Trophy size={14} opacity={0.3} />}
                <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'badge')} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '10px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase' }}>Name</label>
              <input placeholder="Manchester City" value={newTeam.name} onChange={e => setNewTeam({...newTeam, name: e.target.value})} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', fontSize: '12px' }} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '10px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase' }}>League</label>
              <select value={newTeam.league_id} onChange={e => setNewTeam({...newTeam, league_id: e.target.value})} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', fontSize: '12px' }}>
                <option value="">— League —</option>
                {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '10px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase' }}>City</label>
              <input placeholder="Manchester" value={newTeam.city} onChange={e => setNewTeam({...newTeam, city: e.target.value})} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', fontSize: '12px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '10px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase' }}>Manager</label>
              <input placeholder="Pep Guardiola" value={newTeam.manager_name} onChange={e => setNewTeam({...newTeam, manager_name: e.target.value})} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', fontSize: '12px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '10px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase' }}>Stadium</label>
              <input placeholder="Etihad" value={newTeam.stadium_name} onChange={e => setNewTeam({...newTeam, stadium_name: e.target.value})} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', fontSize: '12px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '10px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase' }}>Stad.Img</label>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--bg-panel-muted)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                {newTeam.stadium_image_url ? <img src={newTeam.stadium_image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Building2 size={14} opacity={0.3} />}
                <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'stadium')} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '10px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase' }}>Map</label>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--bg-panel-muted)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                {newTeam.location_map_url ? <img src={newTeam.location_map_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <MapPin size={14} opacity={0.3} />}
                <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'map')} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
              </div>
            </div>
            <button type="submit" style={{ padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--brand-primary)', color: '#fff', fontWeight: '700', fontSize: '12px' }}>Add</button>
          </form>
        </div>
      )}

      <div className="responsive-table-container" style={{ background: 'var(--bg-panel)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-panel-muted)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '10px 16px', fontWeight: '800', width: '40px' }}>S/N</th>
              <th style={{ padding: '10px 16px', fontWeight: '800', width: '44px' }}></th>
              <th style={{ padding: '10px 16px', fontWeight: '800' }}>Team</th>
              <th style={{ padding: '10px 16px', fontWeight: '800', width: '140px' }}>League</th>
              <th style={{ padding: '10px 16px', fontWeight: '800', width: '120px' }}>City</th>
              <th style={{ padding: '10px 16px', fontWeight: '800', width: '160px' }}>Stadium</th>
              <th style={{ padding: '10px 16px', fontWeight: '800', width: '140px' }}>Manager</th>
              <th style={{ padding: '10px 16px', fontWeight: '800', textAlign: 'right', width: '150px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTeams.map((team, idx) => {
              const isEditing = editingTeam?.id === team.id;
              const leagueName = leagues.find(l => l.id === team.league_id)?.name || '—';
              return (
                <tr key={team.id} style={{ background: idx % 2 === 0 ? 'transparent' : 'var(--bg-panel-muted)', borderBottom: '1px solid var(--border-color)', height: '44px' }}>
                  <td style={{ padding: '4px 16px', fontWeight: '700', color: 'var(--text-muted)' }}>{(currentPage - 1) * teamsPerPage + idx + 1}</td>
                  <td style={{ padding: '4px 16px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--bg-panel-muted)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                      {(isEditing ? editingTeam.logo_url : team.logo_url)
                        ? <img src={isEditing ? editingTeam.logo_url : team.logo_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        : <Trophy size={12} opacity={0.3} />}
                      {isEditing && <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'badge', true)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />}
                    </div>
                  </td>
                  <td style={{ padding: '4px 16px', fontWeight: '700' }}>
                    {isEditing
                      ? <input value={editingTeam.name} onChange={e => setEditingTeam({...editingTeam, name: e.target.value})} style={{ ...inputStyle, width: '100%' }} />
                      : team.name}
                  </td>
                  <td style={{ padding: '4px 16px', color: 'var(--text-muted)' }}>
                    {isEditing
                      ? <select value={editingTeam.league_id || ''} onChange={e => setEditingTeam({...editingTeam, league_id: e.target.value})} style={inputStyle}>
                          <option value="">— League —</option>
                          {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                      : leagueName}
                  </td>
                  <td style={{ padding: '4px 16px', color: 'var(--text-muted)' }}>
                    {isEditing
                      ? <input value={editingTeam.city || ''} onChange={e => setEditingTeam({...editingTeam, city: e.target.value})} style={inputStyle} placeholder="City" />
                      : <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={10} />{team.city || '—'}</span>}
                  </td>
                  <td style={{ padding: '4px 16px', color: 'var(--text-muted)' }}>
                    {isEditing
                      ? <input value={editingTeam.stadium_name || ''} onChange={e => setEditingTeam({...editingTeam, stadium_name: e.target.value})} style={inputStyle} placeholder="Stadium" />
                      : <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Building2 size={10} />{team.stadium_name || '—'}</span>}
                  </td>
                  <td style={{ padding: '4px 16px', color: 'var(--text-muted)' }}>
                    {isEditing
                      ? <input value={editingTeam.manager_name || ''} onChange={e => setEditingTeam({...editingTeam, manager_name: e.target.value})} style={inputStyle} placeholder="Manager" />
                      : team.manager_name || '—'}
                  </td>
                  <td style={{ padding: '4px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      {isEditing ? (
                        <>
                          <button onClick={handleSaveEdit} title="Save" style={{ background: 'var(--brand-primary)', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', display: 'flex' }}><Check size={13} /></button>
                          <button onClick={() => setEditingTeam(null)} title="Cancel" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', display: 'flex' }}><X size={13} /></button>
                        </>
                      ) : (
                        <>
                          <a href={`/admin/teams/${team.id}`} title="View Details" style={{ background: 'transparent', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', padding: '4px 8px', display: 'flex', textDecoration: 'none', fontSize: '11px', fontWeight: '700' }}>Manage</a>
                          <button onClick={() => setEditingTeam({...team})} title="Edit" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex' }}><Pencil size={13} /></button>
                          <button onClick={() => handleDeleteTeam(team.id)} title="Delete" style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '4px', display: 'flex' }}><Trash2 size={13} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredTeams.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', opacity: 0.3, fontSize: '13px' }}>No teams found for this filter.</div>
        )}
        
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px', borderTop: '1px solid var(--border-color)' }}>
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-main)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '12px' }}>Prev</button>
            <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', fontWeight: '700' }}>Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-main)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '12px' }}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamsView;
