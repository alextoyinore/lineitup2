import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchGlobalTeams, fetchGlobalPlayers, deleteGlobalPlayer, updateGlobalPlayer, updateGlobalTeam } from '../../services/apiService';
import { Users, Plus, Loader2, Trash2, Pencil, Check, X, ArrowLeft, Search, ChevronLeft, ChevronRight } from 'lucide-react';

import FormationPreview from './FormationPreview';
import { formationKeys } from '../../utils/formations';

const TeamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPlayer, setNewPlayer] = useState({ name: '', number: '', position: '', avatar_url: '', grade: 0, is_starting: 0 });
  const [uploading, setUploading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [subSwapSource, setSubSwapSource] = useState(null);
  const playersPerPage = 20;

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      const teams = await fetchGlobalTeams();
      const foundTeam = teams.find(t => t.id === id);
      if (foundTeam) {
        setTeam(foundTeam);
        const roster = await fetchGlobalPlayers(id);
        setPlayers(roster);
      }
      setLoading(false);
    } catch (err) { console.error(err); }
  };

  const updateFormation = async (newFormation) => {
    const oldFormation = team.default_formation;
    try {
      const updatedTeam = { ...team, default_formation: newFormation };
      setTeam(updatedTeam);
      await updateGlobalTeam(id, updatedTeam);
    } catch (err) { 
      console.error(err);
      setTeam(prev => ({ ...prev, default_formation: oldFormation }));
      alert('Failed to update formation on server. Check console for details.'); 
    }
  };

  const handleJsonUpload = async (data) => {
    try {
      if (Array.isArray(data)) {
        // Inject team_id automatically
        data = data.map(player => ({ ...player, team_id: id }));
        
        await fetch('/api/global/players/batch', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, 
          body: JSON.stringify(data) 
        });
        loadData();
        alert('Batch upload successful!');
        setShowPasteModal(false);
        setPasteContent('');
      } else {
        alert('Invalid JSON format. Expected an array.');
      }
    } catch (err) {
      alert('Error parsing JSON or uploading data');
    }
  };

  const handleSwap = async (p1, p2) => {
    if (!p1 || !p2 || p1.id === p2.id) return;
    
    console.log(`Swapping ${p1.name} (Role: ${p1.is_starting}) with ${p2.name} (Role: ${p2.is_starting})`);
    
    try {
      // Toggle roles: p1 gets p2's role, p2 gets p1's role
      const r1 = p1.is_starting;
      const r2 = p2.is_starting;
      
      // Perform updates in parallel
      await Promise.all([
        updateGlobalPlayer(p1.id, { ...p1, is_starting: r2 }),
        updateGlobalPlayer(p2.id, { ...p2, is_starting: r1 })
      ]);
      
      console.log('Swap successful on server');
      setSubSwapSource(null);
      await loadData(); // Refresh roster from DB
    } catch (err) { 
      console.error('Swap failed:', err);
      alert('Swap failed. Check server connection.'); 
    }
  };

  const handlePlayerClick = (player) => {
    if (!subSwapSource) {
      setSubSwapSource(player);
    } else if (subSwapSource.id === player.id) {
      setSubSwapSource(null);
    } else {
      handleSwap(subSwapSource, player);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: formData });
      const data = await res.json();
      if (data.success) setNewPlayer(prev => ({ ...prev, avatar_url: data.url }));
    } catch { alert('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    if (!newPlayer.name) return;
    try {
      const res = await fetch('/api/global/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ team_id: id, ...newPlayer, number: Number(newPlayer.number), grade: Number(newPlayer.grade) })
      });
      if (res.ok) { setNewPlayer({ name: '', number: '', position: '', avatar_url: '', grade: 0, is_starting: 0 }); loadData(); }
    } catch { alert('Error saving player'); }
  };

  const handleDeletePlayer = async (playerId) => {
    if (!confirm('Delete this player?')) return;
    try { await deleteGlobalPlayer(playerId); loadData(); }
    catch { alert('Error deleting player'); }
  };

  const handleSaveEdit = async () => {
    if (!editingPlayer) return;
    try {
      await updateGlobalPlayer(editingPlayer.id, {
        name: editingPlayer.name,
        number: Number(editingPlayer.number),
        position: editingPlayer.position,
        avatar_url: editingPlayer.avatar_url,
        grade: Number(editingPlayer.grade),
        is_starting: editingPlayer.is_starting
      });
      setEditingPlayer(null);
      loadData();
    } catch { alert('Error saving player'); }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
      <Loader2 className="animate-spin" color="var(--brand-primary)" size={48} />
    </div>
  );

  if (!team) return <div style={{ color: 'var(--text-main)' }}>Team not found.</div>;

  const filteredPlayers = players.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.number.toString().includes(searchTerm);
    const matchesRole = roleFilter === 'all' || p.is_starting.toString() === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredPlayers.length / playersPerPage);
  const paginatedPlayers = filteredPlayers.slice((currentPage - 1) * playersPerPage, currentPage * playersPerPage);

  const inputStyle = { padding: '3px 6px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <header className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/admin/teams')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-panel-muted)', border: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer' }}>
            <ArrowLeft size={16} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-panel-muted)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {team.logo_url ? <img src={team.logo_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Users size={20} opacity={0.3} />}
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>{team.name}</h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>{team.city} &middot; {team.stadium_name}{team.manager_name ? ` · Manager: ${team.manager_name}` : ''}</p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowPasteModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '10px', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
            Paste JSON
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '10px', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
            Upload JSON File
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
            {showAdd ? <X size={15} /> : <Plus size={15} />} {showAdd ? 'Cancel' : 'Add Player'}
          </button>
        </div>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {showPasteModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: 'var(--bg-panel)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', width: '500px', maxWidth: '90%', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Paste Players JSON</h2>
                    <button onClick={() => {
                      navigator.clipboard.writeText('[\n  {\n    "name": "Erling Haaland",\n    "number": 9,\n    "position": "ST",\n    "grade": 91,\n    "is_starting": 1\n  }\n]');
                      alert('Template copied to clipboard! (team_id is automatically assigned)');
                    }} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>Copy Template</button>
                  </div>
                  <button onClick={() => setShowPasteModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
                </div>
                <textarea 
                  placeholder="[\n  {\n    &quot;name&quot;: &quot;Player Name&quot;,\n    &quot;number&quot;: 10,\n    &quot;position&quot;: &quot;CAM&quot;,\n    &quot;grade&quot;: 85,\n    &quot;is_starting&quot;: 1\n  }\n]"
                  value={pasteContent}
                  onChange={e => setPasteContent(e.target.value)}
                  style={{ width: '100%', height: '200px', padding: '12px', borderRadius: '8px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '12px', fontFamily: 'monospace', resize: 'vertical' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button onClick={() => setShowPasteModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                  <button disabled={!pasteContent.trim()} onClick={() => {
                    try {
                      const data = JSON.parse(pasteContent);
                      handleJsonUpload(data);
                    } catch {
                      alert('Invalid JSON syntax');
                    }
                  }} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--brand-primary)', color: '#fff', fontWeight: '700', fontSize: '12px', cursor: !pasteContent.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Upload
                  </button>
                </div>
              </div>
            </div>
          )}

          {showAdd && (
            <div style={{ background: 'var(--bg-panel)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-color)' }}>
              <form onSubmit={handleAddPlayer} className="admin-form-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(40px, auto) 2fr 1fr 1fr 1fr 1fr 100px', gap: '16px', alignItems: 'end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '10px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase' }}>Avatar</label>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-panel-muted)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                    {newPlayer.avatar_url ? <img src={newPlayer.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Plus size={14} opacity={0.3} />}
                    <input type="file" accept="image/*" onChange={handleFileUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '10px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase' }}>Name</label>
                  <input placeholder="Erling Haaland" value={newPlayer.name} onChange={e => setNewPlayer({...newPlayer, name: e.target.value})} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', fontSize: '12px' }} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '10px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase' }}>No.</label>
                  <input placeholder="9" type="number" value={newPlayer.number} onChange={e => setNewPlayer({...newPlayer, number: e.target.value})} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', fontSize: '12px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '10px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase' }}>Pos</label>
                  <input placeholder="LW, ST" value={newPlayer.position} onChange={e => setNewPlayer({...newPlayer, position: e.target.value.toUpperCase()})} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', fontSize: '12px', textTransform: 'uppercase' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '10px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase' }}>OVR</label>
                  <input placeholder="85" type="number" min="1" max="99" value={newPlayer.grade || ''} onChange={e => setNewPlayer({...newPlayer, grade: e.target.value})} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', fontSize: '12px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '10px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase' }}>Role</label>
                  <select value={newPlayer.is_starting} onChange={e => setNewPlayer({...newPlayer, is_starting: Number(e.target.value)})} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', fontSize: '12px', outline: 'none' }}>
                    <option value={1}>Starter</option>
                    <option value={0}>Bench</option>
                    <option value={-1}>Injured</option>
                    <option value={-2}>Loaned Out</option>
                    <option value={-3}>Reserved</option>
                  </select>
                </div>
                <button type="submit" disabled={uploading} style={{ padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--brand-primary)', color: '#fff', fontWeight: '700', fontSize: '12px' }}>Add</button>
              </form>
            </div>
          )}

          {/* Filters */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
              <input 
                placeholder="Search by name or number..." 
                value={searchTerm} 
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                style={{ ...inputStyle, width: '100%', paddingLeft: '32px', height: '36px' }} 
              />
            </div>
            <select 
              value={roleFilter} 
              onChange={e => { setRoleFilter(e.target.value); setCurrentPage(1); }} 
              style={{ ...inputStyle, width: '140px', height: '36px' }}
            >
              <option value="all">All Roles</option>
              <option value="1">Starters</option>
              <option value="0">Bench</option>
              <option value="-1">Injured</option>
              <option value="-2">Loaned Out</option>
              <option value="-3">Reserved</option>
            </select>
          </div>

          <div className="responsive-table-container" style={{ background: 'var(--bg-panel)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-panel-muted)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '10px 16px', fontWeight: '800', width: '40px' }}>S/N</th>
                  <th style={{ padding: '10px 16px', fontWeight: '800', width: '60px' }}>No.</th>
                  <th style={{ padding: '10px 16px', fontWeight: '800', width: '50px' }}>Avi</th>
                  <th style={{ padding: '10px 16px', fontWeight: '800' }}>Name</th>
                  <th style={{ padding: '10px 16px', fontWeight: '800', width: '50px' }}>OVR</th>
                  <th style={{ padding: '10px 16px', fontWeight: '800', width: '120px' }}>Position</th>
                  <th style={{ padding: '10px 16px', fontWeight: '800', width: '100px' }}>Role</th>
                  <th style={{ padding: '10px 16px', fontWeight: '800', textAlign: 'right', width: '110px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPlayers.map((player, idx) => {
                  const isEditing = editingPlayer?.id === player.id;
                  const isSelected = subSwapSource?.id === player.id;
                  
                  const getRoleBadge = (val) => {
                    if (val === 1) return <span style={{ padding: '2px 8px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>Starter</span>;
                    if (val === -1) return <span style={{ padding: '2px 8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>Injured</span>;
                    if (val === -2) return <span style={{ padding: '2px 8px', background: 'rgba(168,85,247,0.1)', color: '#a855f7', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>Loaned</span>;
                    if (val === -3) return <span style={{ padding: '2px 8px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>Reserved</span>;
                    return <span style={{ padding: '2px 8px', background: 'rgba(100,116,139,0.1)', color: 'var(--text-muted)', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>Bench</span>;
                  };

                  return (
                    <tr 
                      key={player.id} 
                      onClick={() => !isEditing && handlePlayerClick(player)}
                      style={{ 
                        borderBottom: '1px solid var(--border-color)', 
                        transition: 'all 0.2s',
                        cursor: isEditing ? 'default' : 'pointer',
                        background: subSwapSource?.id === player.id ? 'rgba(29,158,74,0.1)' : (idx % 2 === 0 ? 'transparent' : 'var(--bg-panel-muted)')
                      }}
                      className="hover-row"
                    >
                      <td style={{ padding: '4px 16px', fontWeight: '700', color: 'var(--text-muted)' }}>{(currentPage - 1) * playersPerPage + idx + 1}</td>
                      <td style={{ padding: '4px 16px', fontWeight: '800', color: 'var(--brand-primary)' }}>
                        {isEditing
                          ? <input type="number" value={editingPlayer.number} onClick={e => e.stopPropagation()} onChange={e => setEditingPlayer({...editingPlayer, number: e.target.value})} style={{ ...inputStyle, width: '48px' }} />
                          : player.number}
                      </td>
                      <td style={{ padding: '4px 16px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-panel-muted)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {player.avatar_url ? <img src={player.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={14} opacity={0.3} />}
                        </div>
                      </td>
                      <td style={{ padding: '4px 16px', fontWeight: '600' }}>
                        {isEditing
                          ? <input value={editingPlayer.name} onClick={e => e.stopPropagation()} onChange={e => setEditingPlayer({...editingPlayer, name: e.target.value})} style={{ ...inputStyle, width: '100%' }} />
                          : player.name}
                      </td>
                      <td style={{ padding: '4px 16px', fontWeight: '800', color: 'var(--text-main)' }}>
                        {isEditing
                          ? <input type="number" min="1" max="99" value={editingPlayer.grade || ''} onClick={e => e.stopPropagation()} onChange={e => setEditingPlayer({...editingPlayer, grade: e.target.value})} style={{ ...inputStyle, width: '48px' }} />
                          : player.grade || '—'}
                      </td>
                      <td style={{ padding: '4px 16px' }}>
                        {isEditing
                          ? <input value={editingPlayer.position} onClick={e => e.stopPropagation()} onChange={e => setEditingPlayer({...editingPlayer, position: e.target.value.toUpperCase()})} style={{ ...inputStyle, width: '100px', textTransform: 'uppercase' }} />
                          : <span style={{ padding: '2px 8px', background: 'rgba(29,158,74,0.08)', color: 'var(--brand-primary)', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>{player.position}</span>}
                      </td>
                      <td style={{ padding: '4px 16px' }}>
                        {isEditing
                          ? <select value={editingPlayer.is_starting} onClick={e => e.stopPropagation()} onChange={e => setEditingPlayer({...editingPlayer, is_starting: Number(e.target.value)})} style={inputStyle}>
                              <option value={1}>Starter</option>
                              <option value={0}>Bench</option>
                              <option value={-1}>Injured</option>
                              <option value={-2}>Loaned Out</option>
                              <option value={-3}>Reserved</option>
                            </select>
                          : getRoleBadge(player.is_starting)}
                      </td>
                      <td style={{ padding: '4px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                          {isEditing ? (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }} title="Save" style={{ background: 'var(--brand-primary)', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', display: 'flex' }}><Check size={13} /></button>
                              <button onClick={(e) => { e.stopPropagation(); setEditingPlayer(null); }} title="Cancel" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', display: 'flex' }}><X size={13} /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/players/${player.id}`); }} title="View Detail" style={{ background: 'transparent', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', padding: '4px', display: 'flex', fontSize: '11px', fontWeight: '700', marginRight: '4px' }}>Detail</button>
                              <button onClick={(e) => { e.stopPropagation(); setEditingPlayer({...player}); }} title="Edit" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex' }}><Pencil size={13} /></button>
                              <button onClick={(e) => { e.stopPropagation(); handleDeletePlayer(player.id); }} title="Delete" style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '4px', display: 'flex' }}><Trash2 size={13} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {players.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', opacity: 0.3, fontSize: '13px' }}>The roster for this team is currently empty.</div>
            )}
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px', borderTop: '1px solid var(--border-color)' }}>
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-main)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '12px' }}>Prev</button>
                <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', fontWeight: '700' }}>Page {currentPage} of {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-main)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '12px' }}>Next</button>
              </div>
            )}
          </div>
        </div>

        {/* Formation Preview Side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'var(--bg-panel)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '10px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Default Formation</label>
              <select 
                value={team.default_formation || '4-3-3'} 
                onChange={(e) => updateFormation(e.target.value)}
                style={{ ...inputStyle, width: '100%', height: '36px', fontSize: '13px', fontWeight: '700' }}
              >
                {formationKeys.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Primary Color</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="color" 
                    value={team.primary_color || '#E63946'} 
                    onChange={async (e) => {
                      const val = e.target.value;
                      const updated = { ...team, primary_color: val };
                      setTeam(updated);
                      await updateGlobalTeam(id, updated);
                    }}
                    style={{ width: '36px', height: '36px', padding: '0', border: 'none', background: 'none', cursor: 'pointer' }} 
                  />
                  <span style={{ fontSize: '11px', fontWeight: '700', fontFamily: 'monospace' }}>{team.primary_color || '#E63946'}</span>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '10px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Away Color</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="color" 
                    value={team.secondary_color || '#1D3557'} 
                    onChange={async (e) => {
                      const val = e.target.value;
                      const updated = { ...team, secondary_color: val };
                      setTeam(updated);
                      await updateGlobalTeam(id, updated);
                    }}
                    style={{ width: '36px', height: '36px', padding: '0', border: 'none', background: 'none', cursor: 'pointer' }} 
                  />
                  <span style={{ fontSize: '11px', fontWeight: '700', fontFamily: 'monospace' }}>{team.secondary_color || '#1D3557'}</span>
                </div>
              </div>
            </div>
          </div>

          <FormationPreview 
            formationKey={team.default_formation || '4-3-3'} 
            players={players} 
            onSwap={handlePlayerClick}
            primaryColor={team.primary_color}
          />
          
          <div style={{ background: 'rgba(29,158,74,0.05)', borderRadius: '12px', padding: '12px', border: '1px solid rgba(29,158,74,0.1)' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
              <strong>Tip:</strong> Click a starter on the pitch or a bench player in the list to begin a substitution. Click another player to complete the swap.
            </p>
          </div>
          
          {subSwapSource && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'var(--brand-primary)', color: '#fff', borderRadius: '8px', animation: 'pulse 2s infinite' }}>
              <span style={{ fontSize: '11px', fontWeight: '800' }}>Swapping: {subSwapSource.name}</span>
              <button onClick={() => setSubSwapSource(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={14} /></button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default TeamDetail;
