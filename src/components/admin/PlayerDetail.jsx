import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchGlobalTeams, fetchGlobalPlayer, updateGlobalPlayer } from '../../services/apiService';
import { Users, Loader2, Save, ArrowLeft } from 'lucide-react';

const POSITIONS = ['GK','LB','CB','RB','LWB','RWB','CDM','CM','CAM','LM','RM','LW','RW','ST','CF','LS','RS'];

const PlayerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      const playerData = await fetchGlobalPlayer(id);
      setPlayer(playerData);
      
      if (playerData.team_id) {
        const teams = await fetchGlobalTeams();
        setTeam(teams.find(t => t.id === playerData.team_id) || null);
      }
      setLoading(false);
    } catch (err) { 
      console.error(err); 
      setLoading(false);
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
      if (data.success) setPlayer(prev => ({ ...prev, avatar_url: data.url }));
    } catch { alert('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateGlobalPlayer(player.id, {
        name: player.name,
        number: Number(player.number),
        position: player.position,
        avatar_url: player.avatar_url,
        grade: Number(player.grade || 0),
        is_starting: player.is_starting
      });
      navigate(`/admin/teams/${player.team_id}`);
    } catch (err) {
      alert('Error saving player');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
      <Loader2 className="animate-spin" color="var(--brand-primary)" size={48} />
    </div>
  );

  if (!player) return <div style={{ color: 'var(--text-main)' }}>Player not found.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => navigate(`/admin/teams/${player.team_id}`)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-panel-muted)', border: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer' }}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Edit Player</h1>
          {team && <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>{team.name}</p>}
        </div>
      </header>

      <div style={{ background: 'var(--bg-panel)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border-color)' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-panel-muted)', border: '2px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                {player.avatar_url ? <img src={player.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={32} opacity={0.3} />}
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                {uploading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" color="#fff" size={20} /></div>}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Change Avatar</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.7, textTransform: 'uppercase' }}>Full Name</label>
            <input value={player.name} onChange={e => setPlayer({...player, name: e.target.value})} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', fontSize: '14px' }} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.7, textTransform: 'uppercase' }}>Number</label>
              <input type="number" value={player.number} onChange={e => setPlayer({...player, number: e.target.value})} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', fontSize: '14px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.7, textTransform: 'uppercase' }}>Position</label>
              <input placeholder="LW, ST" value={player.position || ''} onChange={e => setPlayer({...player, position: e.target.value.toUpperCase()})} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', fontSize: '14px', textTransform: 'uppercase' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.7, textTransform: 'uppercase' }}>Overall Grade (OVR)</label>
              <input type="number" min="1" max="99" value={player.grade || ''} onChange={e => setPlayer({...player, grade: e.target.value})} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', fontSize: '14px' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.7, textTransform: 'uppercase' }}>Role in Squad</label>
              <select value={player.is_starting} onChange={e => setPlayer({...player, is_starting: Number(e.target.value)})} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }}>
                <option value={1}>Starting 11</option>
                <option value={0}>Substitute / Bench</option>
                <option value={-1}>Injured</option>
                <option value={-2}>Loaned Out</option>
                <option value={-3}>Reserved</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={saving || uploading} style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--brand-primary)', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: (saving || uploading) ? 'not-allowed' : 'pointer' }}>
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Save Player
          </button>
        </form>
      </div>
    </div>
  );
};

export default PlayerDetail;
