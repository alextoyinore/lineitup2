import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchGlobalTeams, fetchGlobalPlayers, deleteGlobalPlayer, updateGlobalPlayer } from '../../services/apiService';
import { Users, Plus, Loader2, Trash2, Pencil, Check, X, ArrowLeft } from 'lucide-react';

const POSITIONS = ['GK','LB','CB','RB','LWB','RWB','CDM','CM','CAM','LM','RM','LW','RW','ST','CF','LS','RS'];

const TeamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPlayer, setNewPlayer] = useState({ name: '', number: '', position: '', avatar_url: '', is_starting: 0 });
  const [uploading, setUploading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
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
        body: JSON.stringify({ team_id: id, ...newPlayer, number: Number(newPlayer.number) })
      });
      if (res.ok) { setNewPlayer({ name: '', number: '', position: '', avatar_url: '', is_starting: 0 }); loadData(); }
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

  const totalPages = Math.ceil(players.length / playersPerPage);
  const paginatedPlayers = players.slice((currentPage - 1) * playersPerPage, currentPage * playersPerPage);

  const inputStyle = { padding: '3px 6px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate('/admin/teams')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-panel-muted)', border: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer' }}>
            <ArrowLeft size={16} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-panel-muted)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {team.logo_url ? <img src={team.logo_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Users size={20} opacity={0.3} />}
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>{team.name}</h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>{team.city} &middot; {team.stadium_name}</p>
            </div>
          </div>
        </div>
        <button onClick={() => setShowAdd(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '10px', background: showAdd ? 'var(--bg-panel-muted)' : 'var(--brand-primary)', color: showAdd ? 'var(--text-main)' : '#fff', border: 'none', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
          {showAdd ? <X size={15} /> : <Plus size={15} />} {showAdd ? 'Cancel' : 'Add Player'}
        </button>
      </header>

      <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {showAdd && (
          <div style={{ background: 'var(--bg-panel)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-color)' }}>
            <form onSubmit={handleAddPlayer} style={{ display: 'grid', gridTemplateColumns: 'minmax(40px, auto) 2fr 1fr 1fr 1fr 100px', gap: '16px', alignItems: 'end' }}>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '10px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase' }}>Role</label>
                <select value={newPlayer.is_starting} onChange={e => setNewPlayer({...newPlayer, is_starting: Number(e.target.value)})} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', fontSize: '12px', outline: 'none' }}>
                  <option value={1}>Starter</option>
                  <option value={0}>Bench</option>
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
                <th style={{ padding: '10px 16px', fontWeight: '800', width: '100px' }}>Role</th>
                <th style={{ padding: '10px 16px', fontWeight: '800', textAlign: 'right', width: '110px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPlayers.map((player, idx) => {
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
                    <td style={{ padding: '4px 16px' }}>
                      {isEditing
                        ? <select value={editingPlayer.is_starting} onChange={e => setEditingPlayer({...editingPlayer, is_starting: Number(e.target.value)})} style={inputStyle}>
                            <option value={1}>Starter</option>
                            <option value={0}>Bench</option>
                          </select>
                        : <span style={{ padding: '2px 8px', background: player.is_starting ? 'rgba(245,158,11,0.1)' : 'rgba(100,116,139,0.1)', color: player.is_starting ? '#f59e0b' : 'var(--text-muted)', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>{player.is_starting ? 'Starter' : 'Bench'}</span>}
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
                            <button onClick={() => navigate(`/admin/players/${player.id}`)} title="View Detail" style={{ background: 'transparent', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', padding: '4px', display: 'flex', fontSize: '11px', fontWeight: '700', marginRight: '4px' }}>Detail</button>
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
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px', borderTop: '1px solid var(--border-color)' }}>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-main)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '12px' }}>Prev</button>
              <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', fontWeight: '700' }}>Page {currentPage} of {totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-main)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '12px' }}>Next</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default TeamDetail;
