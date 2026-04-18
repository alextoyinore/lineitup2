import React, { useState, useEffect } from 'react';
import { fetchGlobalTeams, fetchGlobalPlayers, deleteGlobalPlayer, updateGlobalPlayer } from '../../services/apiService';
import { Users, Plus, Loader2, Trash2, Search, Pencil, Check, X } from 'lucide-react';

const POSITIONS = ['GK','LB','CB','RB','LWB','RWB','CDM','CM','CAM','LM','RM','LW','RW','ST','CF','LS','RS'];

const PlayersView = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPlayer, setNewPlayer] = useState({ name: '', number: '', position: '', avatar_url: '' });
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);

  useEffect(() => { loadTeams(); }, []);

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

  const loadTeams = async () => {
    try {
      const data = await fetchGlobalTeams();
      setTeams(data);
      if (data.length > 0) { setSelectedTeamId(data[0].id); loadPlayers(data[0].id); }
      setLoading(false);
    } catch (err) { console.error(err); }
  };

  const loadPlayers = async (teamId) => {
    try { setPlayers(await fetchGlobalPlayers(teamId)); }
    catch (err) { console.error(err); }
  };

  const handleTeamChange = (teamId) => {
    setSelectedTeamId(teamId);
    setNewPlayer({ name: '', number: '', position: '', avatar_url: '' });
    setEditingPlayer(null);
    loadPlayers(teamId);
  };

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    if (!selectedTeamId || !newPlayer.name) return;
    try {
      const res = await fetch('/api/global/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ team_id: selectedTeamId, ...newPlayer, number: Number(newPlayer.number) })
      });
      if (res.ok) { setNewPlayer({ name: '', number: '', position: '', avatar_url: '' }); loadPlayers(selectedTeamId); }
    } catch { alert('Error saving player'); }
  };

  const handleDeletePlayer = async (id) => {
    if (!confirm('Delete this player?')) return;
    try { await deleteGlobalPlayer(id); loadPlayers(selectedTeamId); }
    catch { alert('Error deleting player'); }
  };

  const handleSaveEdit = async () => {
    if (!editingPlayer) return;
    try {
      await updateGlobalPlayer(editingPlayer.id, {
        name: editingPlayer.name,
        number: Number(editingPlayer.number),
        position: editingPlayer.position,
        avatar_url: editingPlayer.avatar_url
      });
      setEditingPlayer(null);
      loadPlayers(selectedTeamId);
    } catch { alert('Error saving player'); }
  };

  const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
      <Loader2 className="animate-spin" color="var(--brand-primary)" size={48} />
    </div>
  );

  const inputStyle = { padding: '3px 6px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Squad Registration</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Manage player lists and technical metadata for official teams.</p>
        </div>
        <button onClick={() => setShowAdd(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '10px', background: showAdd ? 'var(--bg-panel-muted)' : 'var(--brand-primary)', color: showAdd ? 'var(--text-main)' : '#fff', border: 'none', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
          {showAdd ? <X size={15} /> : <Plus size={15} />} {showAdd ? 'Cancel' : 'Add Player'}
        </button>
      </header>

      {/* TEAM SELECTOR */}
      <section style={{ background: 'var(--bg-panel)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input placeholder="Filter teams..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '8px 8px 8px 32px', fontSize: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {filteredTeams.map(team => (
            <div key={team.id} onClick={() => handleTeamChange(team.id)}
              style={{ padding: '8px 12px', borderRadius: '6px', background: selectedTeamId === team.id ? 'var(--brand-primary)' : 'transparent', cursor: 'pointer', fontWeight: selectedTeamId === team.id ? '700' : '500', color: selectedTeamId === team.id ? '#fff' : 'var(--text-main)', fontSize: '12px', transition: 'all 0.1s' }}>
              {team.name}
            </div>
          ))}
        </div>
      </section>

      {/* ROSTER MANAGEMENT */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {!selectedTeamId ? (
          <div style={{ padding: '60px', textAlign: 'center', background: 'var(--bg-panel)', borderRadius: '12px', border: '1px solid var(--border-color)', opacity: 0.5, fontSize: '13px' }}>Select a team to manage roster.</div>
        ) : (
          <>
            {showAdd && (
              <div style={{ background: 'var(--bg-panel)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-color)' }}>
                <form onSubmit={handleAddPlayer} style={{ display: 'grid', gridTemplateColumns: 'minmax(40px, auto) 2fr 1fr 1fr 100px', gap: '16px', alignItems: 'end' }}>
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
                    <select value={newPlayer.position} onChange={e => setNewPlayer({...newPlayer, position: e.target.value})} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', fontSize: '12px', outline: 'none' }}>
                      <option value="">Pos</option>
                      {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <button type="submit" disabled={uploading} style={{ padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--brand-primary)', color: '#fff', fontWeight: '700', fontSize: '12px' }}>Add</button>
                </form>
              </div>
            )}

            <div style={{ background: 'var(--bg-panel)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-panel-muted)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '10px 16px', fontWeight: '800', width: '60px' }}>No.</th>
                    <th style={{ padding: '10px 16px', fontWeight: '800', width: '50px' }}>Avi</th>
                    <th style={{ padding: '10px 16px', fontWeight: '800' }}>Name</th>
                    <th style={{ padding: '10px 16px', fontWeight: '800', width: '100px' }}>Position</th>
                    <th style={{ padding: '10px 16px', fontWeight: '800', textAlign: 'right', width: '90px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player, idx) => {
                    const isEditing = editingPlayer?.id === player.id;
                    return (
                      <tr key={player.id} style={{ background: idx % 2 === 0 ? 'transparent' : 'var(--bg-panel-muted)', borderBottom: '1px solid var(--border-color)', height: '40px' }}>
                        <td style={{ padding: '4px 16px', fontWeight: '800', color: 'var(--brand-primary)' }}>
                          {isEditing
                            ? <input type="number" value={editingPlayer.number} onChange={e => setEditingPlayer({...editingPlayer, number: e.target.value})} style={{ ...inputStyle, width: '48px' }} />
                            : player.number}
                        </td>
                        <td style={{ padding: '4px 16px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-panel-muted)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {player.avatar_url ? <img src={player.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={14} opacity={0.3} />}
                          </div>
                        </td>
                        <td style={{ padding: '4px 16px', fontWeight: '600' }}>
                          {isEditing
                            ? <input value={editingPlayer.name} onChange={e => setEditingPlayer({...editingPlayer, name: e.target.value})} style={{ ...inputStyle, width: '100%' }} />
                            : player.name}
                        </td>
                        <td style={{ padding: '4px 16px' }}>
                          {isEditing
                            ? <select value={editingPlayer.position} onChange={e => setEditingPlayer({...editingPlayer, position: e.target.value})} style={inputStyle}>
                                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                            : <span style={{ padding: '2px 8px', background: 'rgba(29,158,74,0.08)', color: 'var(--brand-primary)', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>{player.position}</span>}
                        </td>
                        <td style={{ padding: '4px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                            {isEditing ? (
                              <>
                                <button onClick={handleSaveEdit} title="Save" style={{ background: 'var(--brand-primary)', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', display: 'flex' }}><Check size={13} /></button>
                                <button onClick={() => setEditingPlayer(null)} title="Cancel" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', display: 'flex' }}><X size={13} /></button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => setEditingPlayer({...player})} title="Edit" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex' }}><Pencil size={13} /></button>
                                <button onClick={() => handleDeletePlayer(player.id)} title="Delete" style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '4px', display: 'flex' }}><Trash2 size={13} /></button>
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
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default PlayersView;
