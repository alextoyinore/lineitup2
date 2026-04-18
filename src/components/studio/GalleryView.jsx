import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTactics } from '../../context/TacticsContext';
import { deleteRecording, renameRecording, fetchRecordings } from '../../services/apiService';
import {
  Video, Calendar, Clock, Play, Pause, Trash2, Scissors,
  Download, Pencil, Check, X, ChevronLeft, SkipBack, SkipForward,
  Volume2, Loader2
} from 'lucide-react';

/* ─── helpers ─── */
const fmt = (s) => {
  if (isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
};

/* ─── VideoEditor panel ─── */
const VideoEditor = ({ rec, onClose, onDelete, onRename }) => {
  const videoRef = useRef(null);
  const timelineRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [inPoint, setInPoint] = useState(0);
  const [outPoint, setOutPoint] = useState(0);
  const [dragging, setDragging] = useState(null); // 'in' | 'out' | 'playhead'
  const [trimming, setTrimming] = useState(false);
  const [title, setTitle] = useState(rec.title);
  const [editingTitle, setEditingTitle] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onMeta = () => { setDuration(v.duration); setOutPoint(v.duration); };
    const onTime = () => setCurrentTime(v.currentTime);
    const onEnded = () => setPlaying(false);
    v.addEventListener('loadedmetadata', onMeta);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('ended', onEnded);
    return () => { v.removeEventListener('loadedmetadata', onMeta); v.removeEventListener('timeupdate', onTime); v.removeEventListener('ended', onEnded); };
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (playing) { v.pause(); setPlaying(false); }
    else {
      if (v.currentTime >= outPoint) v.currentTime = inPoint;
      v.play(); setPlaying(true);
    }
  };

  // Stop at outPoint
  useEffect(() => {
    if (playing && currentTime >= outPoint) {
      videoRef.current?.pause();
      setPlaying(false);
    }
  }, [currentTime, outPoint, playing]);

  const getPct = (t) => duration ? (t / duration) * 100 : 0;

  const handleTimelineMouseDown = (e, handle) => {
    e.preventDefault();
    setDragging(handle);
  };

  const handleTimelineMouseMove = useCallback((e) => {
    if (!dragging || !timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const t = pct * duration;
    if (dragging === 'in') { setInPoint(Math.min(t, outPoint - 0.5)); videoRef.current.currentTime = t; }
    else if (dragging === 'out') { setOutPoint(Math.max(t, inPoint + 0.5)); }
    else if (dragging === 'playhead') { videoRef.current.currentTime = t; }
  }, [dragging, duration, inPoint, outPoint]);

  const handleMouseUp = useCallback(() => setDragging(null), []);

  useEffect(() => {
    window.addEventListener('mousemove', handleTimelineMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleTimelineMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [handleTimelineMouseMove, handleMouseUp]);

  const handleTimelineClick = (e) => {
    if (dragging) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pct * duration;
  };

  /* Trim & Export — re-records from inPoint to outPoint then triggers download */
  const handleTrimExport = async () => {
    const v = videoRef.current;
    if (!v || !duration) return;
    setTrimming(true);
    try {
      const stream = v.captureStream();
      const chunks = [];
      const mr = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${title}_trim_${fmt(inPoint)}-${fmt(outPoint)}.webm`;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setTrimming(false);
      };
      v.currentTime = inPoint;
      await new Promise(r => v.addEventListener('seeked', r, { once: true }));
      v.play();
      mr.start();
      // Stop recording when we reach outPoint
      const checkInterval = setInterval(() => {
        if (v.currentTime >= outPoint) {
          clearInterval(checkInterval);
          v.pause();
          mr.stop();
        }
      }, 100);
    } catch (err) {
      console.error(err);
      alert('Could not trim video. Your browser may not support captureStream.');
      setTrimming(false);
    }
  };

  const handleSaveTitle = async () => {
    try { await renameRecording(rec.id, title); onRename(rec.id, title); setEditingTitle(false); }
    catch { alert('Failed to rename'); }
  };

  const handleDelete = async () => {
    if (!confirm('Permanently delete this recording?')) return;
    try { await deleteRecording(rec.id); onDelete(rec.id); onClose(); }
    catch { alert('Failed to delete'); }
  };

  const trimWidth = `${getPct(outPoint) - getPct(inPoint)}%`;
  const trimLeft = `${getPct(inPoint)}%`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', height: '100%', background: 'var(--bg-main)' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-panel)' }}>
        <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>
          <ChevronLeft size={16} /> Back
        </button>
        <div style={{ width: '1px', height: '20px', background: 'var(--border-color)' }} />
        {editingTitle ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
            <input value={title} onChange={e => setTitle(e.target.value)} autoFocus
              style={{ flex: 1, padding: '6px 10px', fontSize: '14px', fontWeight: '700', borderRadius: '8px', border: '1px solid var(--brand-primary)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', outline: 'none' }} />
            <button onClick={handleSaveTitle} style={{ background: 'var(--brand-primary)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Check size={14} /></button>
            <button onClick={() => { setTitle(rec.title); setEditingTitle(false); }} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={14} /></button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <span style={{ fontSize: '15px', fontWeight: '800' }}>{title}</span>
            <button onClick={() => setEditingTitle(true)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex' }}><Pencil size={13} /></button>
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          <button onClick={handleDelete} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid #ff4d4d', background: 'transparent', color: '#ff4d4d', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
            <Trash2 size={14} /> Delete
          </button>
          <button onClick={handleTrimExport} disabled={trimming}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: trimming ? 'var(--bg-panel-muted)' : 'var(--brand-primary)', color: trimming ? 'var(--text-muted)' : '#fff', fontWeight: '700', fontSize: '12px', cursor: trimming ? 'default' : 'pointer' }}>
            {trimming ? <Loader2 size={14} className="animate-spin" /> : <Scissors size={14} />}
            {trimming ? 'Exporting…' : 'Trim & Export'}
          </button>
        </div>
      </div>

      {/* Main editor area */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', flex: 1, overflow: 'hidden' }}>
        {/* Video + timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '24px', gap: '20px', overflowY: 'auto' }}>
          {/* Video player */}
          <div style={{ borderRadius: '16px', overflow: 'hidden', background: '#000', aspectRatio: '16/9', position: 'relative' }}>
            <video ref={videoRef} src={rec.video_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>

          {/* Playback controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => { videoRef.current.currentTime = inPoint; }} title="Go to In Point"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', display: 'flex' }}><SkipBack size={18} /></button>
            <button onClick={togglePlay}
              style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--brand-primary)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {playing ? <Pause size={18} fill="#fff" /> : <Play size={18} fill="#fff" />}
            </button>
            <button onClick={() => { videoRef.current.currentTime = outPoint; }} title="Go to Out Point"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', display: 'flex' }}><SkipForward size={18} /></button>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', marginLeft: '8px' }}>{fmt(currentTime)} / {fmt(duration)}</span>
          </div>

          {/* Timeline scrubber */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span>Timeline</span>
              <span>Selection: {fmt(inPoint)} → {fmt(outPoint)} ({fmt(outPoint - inPoint)})</span>
            </div>
            {/* Track */}
            <div ref={timelineRef} onClick={handleTimelineClick}
              style={{ position: 'relative', height: '52px', background: 'var(--bg-panel-muted)', borderRadius: '10px', border: '1px solid var(--border-color)', cursor: 'pointer', userSelect: 'none' }}>

              {/* Selected range highlight */}
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: trimLeft, width: trimWidth, background: 'rgba(29,158,74,0.18)', borderLeft: '2px solid var(--brand-primary)', borderRight: '2px solid var(--brand-primary)' }} />

              {/* Timecode ticks */}
              {duration > 0 && Array.from({ length: Math.min(20, Math.floor(duration)) }, (_, i) => {
                const t = (i / Math.min(20, Math.floor(duration))) * duration;
                return (
                  <div key={i} style={{ position: 'absolute', left: `${(t / duration) * 100}%`, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
                    <div style={{ width: '1px', height: '8px', background: 'var(--border-color)', opacity: 0.6 }} />
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', marginTop: '2px', transform: 'translateX(-50%)', opacity: 0.6 }}>{fmt(t)}</span>
                  </div>
                );
              })}

              {/* IN handle */}
              <div onMouseDown={e => handleTimelineMouseDown(e, 'in')}
                style={{ position: 'absolute', left: `${getPct(inPoint)}%`, top: 0, bottom: 0, width: '12px', marginLeft: '-6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'ew-resize', zIndex: 3 }}>
                <div style={{ width: '4px', height: '100%', background: 'var(--brand-primary)', borderRadius: '4px', boxShadow: '0 0 0 2px rgba(29,158,74,0.3)' }} />
                <div style={{ position: 'absolute', bottom: '-18px', fontSize: '9px', fontWeight: '800', color: 'var(--brand-primary)', whiteSpace: 'nowrap' }}>IN</div>
              </div>

              {/* OUT handle */}
              <div onMouseDown={e => handleTimelineMouseDown(e, 'out')}
                style={{ position: 'absolute', left: `${getPct(outPoint)}%`, top: 0, bottom: 0, width: '12px', marginLeft: '-6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'ew-resize', zIndex: 3 }}>
                <div style={{ width: '4px', height: '100%', background: '#f59e0b', borderRadius: '4px', boxShadow: '0 0 0 2px rgba(245,158,11,0.3)' }} />
                <div style={{ position: 'absolute', bottom: '-18px', fontSize: '9px', fontWeight: '800', color: '#f59e0b', whiteSpace: 'nowrap' }}>OUT</div>
              </div>

              {/* Playhead */}
              <div onMouseDown={e => handleTimelineMouseDown(e, 'playhead')}
                style={{ position: 'absolute', left: `${getPct(currentTime)}%`, top: 0, bottom: 0, width: '2px', background: '#fff', opacity: 0.9, marginLeft: '-1px', zIndex: 4, cursor: 'col-resize', boxShadow: '0 0 4px rgba(255,255,255,0.5)' }} />
            </div>
          </div>

          {/* In / Out number inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[{ label: 'In Point', val: inPoint, color: 'var(--brand-primary)', set: (v) => setInPoint(Math.max(0, Math.min(v, outPoint - 0.5))) },
              { label: 'Out Point', val: outPoint, color: '#f59e0b', set: (v) => setOutPoint(Math.max(inPoint + 0.5, Math.min(v, duration))) }].map(({ label, val, color, set }) => (
              <div key={label} style={{ background: 'var(--bg-panel)', border: `1px solid ${color}22`, borderRadius: '10px', padding: '12px 16px' }}>
                <div style={{ fontSize: '10px', fontWeight: '800', color, textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
                <input type="number" step="0.1" min="0" max={duration} value={val.toFixed(2)}
                  onChange={e => set(parseFloat(e.target.value))}
                  style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '20px', fontWeight: '800', outline: 'none', fontVariantNumeric: 'tabular-nums' }} />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{fmt(val)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right info panel */}
        <div style={{ borderLeft: '1px solid var(--border-color)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--bg-panel)', overflowY: 'auto' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '12px' }}>Recording Info</div>
            {[
              { label: 'Duration', value: fmt(duration) },
              { label: 'Type', value: rec.media_type || 'RAW' },
              { label: 'Date', value: new Date(rec.created_at).toLocaleDateString() },
              { label: 'Time', value: new Date(rec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontSize: '12px', fontWeight: '700' }}>{value}</span>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '12px' }}>Export Selection</div>
            <div style={{ background: 'var(--bg-panel-muted)', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Start</span><span style={{ fontWeight: '700', color: 'var(--brand-primary)' }}>{fmt(inPoint)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>End</span><span style={{ fontWeight: '700', color: '#f59e0b' }}>{fmt(outPoint)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Length</span><span style={{ fontWeight: '700' }}>{fmt(outPoint - inPoint)}</span>
              </div>
            </div>
            <button onClick={handleTrimExport} disabled={trimming}
              style={{ marginTop: '12px', width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: trimming ? 'var(--bg-panel-muted)' : 'var(--brand-primary)', color: trimming ? 'var(--text-muted)' : '#fff', fontWeight: '800', fontSize: '13px', cursor: trimming ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {trimming ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {trimming ? 'Exporting…' : 'Download Trim'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Main GalleryView ─── */
const GalleryView = () => {
  const { reloadData } = useTactics();
  const [recordings, setRecordings] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { const data = await fetchRecordings(); setRecordings(data); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = (id) => { setRecordings(prev => prev.filter(r => r.id !== id)); reloadData(); };
  const handleRename = (id, title) => { setRecordings(prev => prev.map(r => r.id === id ? { ...r, title } : r)); };

  const filtered = filter === 'ALL' ? recordings : recordings.filter(r => r.media_type === filter);

  if (editing) {
    return <VideoEditor rec={editing} onClose={() => setEditing(null)} onDelete={handleDelete} onRename={handleRename} />;
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>Tactical Gallery</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Recorded sessions and clipped highlights</p>
        </div>
        <div style={{ display: 'flex', background: 'var(--bg-panel)', padding: '3px', borderRadius: '10px', border: '1px solid var(--border-color)', gap: '2px' }}>
          {['ALL', 'RAW', 'EDITED'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '7px 16px', borderRadius: '7px', border: 'none', background: filter === f ? 'var(--brand-primary)' : 'transparent', color: filter === f ? '#fff' : 'var(--text-main)', cursor: 'pointer', fontSize: '12px', fontWeight: '700', transition: 'all 0.15s' }}>
              {f}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
          <Loader2 size={40} color="var(--brand-primary)" className="animate-spin" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {filtered.map(rec => (
            <div key={rec.id}
              style={{ background: 'var(--bg-panel)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden', transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              {/* Thumbnail */}
              <div style={{ position: 'relative', aspectRatio: '16/9', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <video src={rec.video_url} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }} />
                <div style={{ position: 'absolute', top: '10px', right: '10px', padding: '3px 8px', background: 'rgba(0,0,0,0.6)', borderRadius: '5px', color: '#fff', fontSize: '10px', fontWeight: '800', backdropFilter: 'blur(4px)' }}>
                  {rec.media_type || 'RAW'}
                </div>
                <button onClick={() => setEditing(rec)}
                  style={{ position: 'absolute', width: '44px', height: '44px', borderRadius: '50%', background: 'var(--brand-primary)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                  <Play size={20} fill="#fff" />
                </button>
              </div>
              {/* Meta */}
              <div style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: '800', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rec.title}</h3>
                <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={11} />{new Date(rec.created_at).toLocaleDateString()}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={11} />{new Date(rec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setEditing(rec)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', borderRadius: '8px', border: 'none', background: 'var(--brand-primary)', color: '#fff', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}>
                    <Scissors size={12} /> Edit
                  </button>
                  <button onClick={async (e) => { e.stopPropagation(); if (confirm('Delete this recording?')) { try { await deleteRecording(rec.id); handleDelete(rec.id); } catch { alert('Delete failed'); } } }}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: '#ff4d4d', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && !loading && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', background: 'var(--bg-panel)', borderRadius: '20px', border: '1px dashed var(--border-color)', opacity: 0.4 }}>
              <Video size={40} style={{ marginBottom: '12px' }} />
              <p style={{ fontSize: '14px', fontWeight: '600' }}>No recordings found in this category.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GalleryView;
