import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTactics } from '../../context/TacticsContext';
import { deleteRecording, renameRecording, fetchRecordings } from '../../services/apiService';
import {
  Video, Calendar, Clock, Play, Pause, Trash2, Scissors,
  Download, ChevronLeft, ChevronRight,
  Volume2, Loader2, Layout, MousePointer2
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
  // --- Refs ---
  const videoRef = useRef(null);
  const canvasRef = useRef(null); // For export re-composition
  const streamRef = useRef(null); // Live camera stream for cameo

  // --- State ---
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [trimming, setTrimming] = useState(false);
  const [title, setTitle] = useState(rec.title);
  const [editingTitle, setEditingTitle] = useState(false);

  // --- Multi-Clip State ---
  const [clips, setClips] = useState([
    { id: 'c1', rec, in: 0, out: rec.duration || 10, speed: 1 }
  ]);
  const [selectedClipId, setSelectedClipId] = useState('c1');
  
  // --- Export & Cameo State ---
  const [exportOrientation, setExportOrientation] = useState('landscape'); // 'landscape' | 'portrait'
  const [videoRotation, setVideoRotation] = useState(0); // 0, 90, 180, 270
  const [cameoConfig, setCameoConfig] = useState({
    enabled: false,
    x: 80, // % of width
    y: 20, // % of height
    size: 20, // % of width
    rotation: 0
  });

  // --- Playback State ---
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  const activeClip = clips.find(c => c.id === selectedClipId) || clips[0];
  const sequenceDuration = clips.reduce((acc, c) => acc + (c.out - c.in), 0);
  
  // Calculate global sequence time based on current video time and clip index
  const getSequenceTime = () => {
    const activeIdx = clips.findIndex(c => c.id === selectedClipId);
    let time = 0;
    for (let i = 0; i < activeIdx; i++) time += (clips[i].out - clips[i].in);
    time += (currentTime - activeClip.in);
    return time;
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onMeta = () => { 
      if (duration === 0) {
        setDuration(v.duration);
        setClips(prev => prev.map(c => c.id === 'c1' ? { ...c, out: v.duration } : c));
      }
    };
    const onTime = () => {
      setCurrentTime(v.currentTime);
      // Auto-play next clip logic
      if (v.currentTime >= activeClip.out) {
        const idx = clips.findIndex(c => c.id === selectedClipId);
        if (idx < clips.length - 1) {
          const next = clips[idx + 1];
          setSelectedClipId(next.id);
          v.currentTime = next.in;
        } else if (isLooping) {
          const first = clips[0];
          setSelectedClipId(first.id);
          v.currentTime = first.in;
        } else {
          v.pause();
          setPlaying(false);
        }
      }
    };
    
    v.addEventListener('loadedmetadata', onMeta);
    v.addEventListener('timeupdate', onTime);
    return () => { 
      v.removeEventListener('loadedmetadata', onMeta); 
      v.removeEventListener('timeupdate', onTime); 
    };
  }, [activeClip.in, activeClip.out, isLooping, duration, selectedClipId, clips]);

  // Handle Camera Stream for Cameo
  useEffect(() => {
    if (cameoConfig.enabled && !streamRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(s => { streamRef.current = s; })
        .catch(e => console.error('Cameo stream failed:', e));
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [cameoConfig.enabled]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) { v.pause(); setPlaying(false); }
    else {
      if (v.currentTime >= activeClip.out) v.currentTime = activeClip.in;
      v.play().then(() => setPlaying(true)).catch(e => console.error(e));
    }
  };

  const step = (amount) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + amount));
    }
  };

  // --- Multi-Clip Methods ---
  const handleSplitClip = () => {
    const v = videoRef.current;
    if (!v) return;
    const t = v.currentTime;
    
    setClips(prev => {
      const idx = prev.findIndex(c => c.id === selectedClipId);
      if (idx === -1) return prev;
      const target = prev[idx];
      
      const clipA = { ...target, id: Math.random().toString(36).substr(2, 9), out: t };
      const clipB = { ...target, id: Math.random().toString(36).substr(2, 9), in: t };
      
      const newClips = [...prev];
      newClips.splice(idx, 1, clipA, clipB);
      setSelectedClipId(clipB.id);
      return newClips;
    });
  };

  const handleMoveClip = (id, direction) => {
    setClips(prev => {
      const idx = prev.findIndex(c => c.id === id);
      if (idx === -1) return prev;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      
      const newClips = [...prev];
      const [moved] = newClips.splice(idx, 1);
      newClips.splice(newIdx, 0, moved);
      return newClips;
    });
  };

  const handleDeleteClip = (id) => {
    if (clips.length <= 1) return;
    setClips(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (selectedClipId === id) setSelectedClipId(filtered[0].id);
      return filtered;
    });
  };

  // --- Export Logic with Canvas Re-composition ---
  const handleExport = async () => {
    setTrimming(true);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set resolution based on orientation
    if (exportOrientation === 'landscape') {
      canvas.width = 1920; canvas.height = 1080;
    } else {
      canvas.width = 1080; canvas.height = 1920;
    }

    const stream = canvas.captureStream(30);
    const chunks = [];
    const mr = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    
    mr.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${title}_${exportOrientation}_edit.webm`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      setTrimming(false);
    };

    mr.start();

    // Stitching logic
    for (const clip of clips) {
      const v = videoRef.current;
      v.src = clip.rec.video_url;
      v.currentTime = clip.in;
      await new Promise(r => v.onseeked = r);
      v.play();

      const drawFrame = () => {
        if (v.paused || v.ended || v.currentTime >= clip.out) return;
        
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Video Content
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((videoRotation * Math.PI) / 180);
        
        // After rotation, we need to decide the drawing dimensions.
        // If we rotated 90 or 270, the dimensions are swapped relative to the canvas.
        const isVertical = videoRotation === 90 || videoRotation === 270;
        if (exportOrientation === 'landscape') {
          if (isVertical) {
             // Portrait video in landscape canvas (pillarbox)
             const scale = canvas.height / v.videoWidth;
             ctx.drawImage(v, - (v.videoWidth * scale) / 2, -canvas.height / 2, v.videoWidth * scale, canvas.height);
          } else {
             ctx.drawImage(v, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
          }
        } else {
          // Portrait Canvas
          if (isVertical) {
             // Landscape video rotated to fill Portrait canvas
             ctx.drawImage(v, -canvas.height / 2, -canvas.width / 2, canvas.height, canvas.width);
          } else {
             // Landscape video in Portrait canvas (letterbox)
             const scale = canvas.width / v.videoWidth;
             ctx.drawImage(v, -canvas.width / 2, - (v.videoHeight * scale) / 2, canvas.width, v.videoHeight * scale);
          }
        }
        ctx.restore();

        // Draw Cameo if enabled
        if (cameoConfig.enabled && streamRef.current) {
          const video = document.createElement('video');
          video.srcObject = streamRef.current;
          video.play();
          
          const camSize = canvas.width * (cameoConfig.size / 100);
          const camX = canvas.width * (cameoConfig.x / 100) - camSize/2;
          const camY = canvas.height * (cameoConfig.y / 100) - camSize/2;

          ctx.save();
          ctx.translate(camX + camSize/2, camY + camSize/2);
          ctx.rotate((cameoConfig.rotation * Math.PI) / 180);
          // In portrait, rotate cameo to face "up" (+180 deg) as requested
          if (exportOrientation === 'portrait') ctx.rotate(Math.PI);
          
          ctx.beginPath();
          ctx.arc(0, 0, camSize/2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(video, -camSize/2, -camSize/2, camSize, camSize);
          ctx.restore();
        }

        requestAnimationFrame(drawFrame);
      };

      drawFrame();
      await new Promise(r => {
        const check = setInterval(() => {
          if (v.currentTime >= clip.out) { clearInterval(check); v.pause(); r(); }
        }, 50);
      });
    }

    mr.stop();
  };

  const fmt = (s) => {
    if (!s || isNaN(s)) return '00:00';
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    return `${m.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      {/* Tight Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 20px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-panel)' }}>
        <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>
          <ChevronLeft size={14} /> EXIT
        </button>
        <div style={{ width: '1px', height: '20px', background: 'var(--border-color)' }} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '-0.2px' }}>{title}</span>
          <div style={{ display: 'flex', background: 'var(--bg-panel-muted)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <button onClick={() => setExportOrientation('landscape')} 
              style={{ padding: '4px 10px', borderRadius: '4px', border: 'none', background: exportOrientation === 'landscape' ? 'var(--brand-primary)' : 'transparent', color: '#fff', cursor: 'pointer', fontSize: '9px', fontWeight: '900' }}>16:9</button>
            <button onClick={() => setExportOrientation('portrait')} 
              style={{ padding: '4px 10px', borderRadius: '4px', border: 'none', background: exportOrientation === 'portrait' ? 'var(--brand-primary)' : 'transparent', color: '#fff', cursor: 'pointer', fontSize: '9px', fontWeight: '900' }}>9:16</button>
          </div>
        </div>
        <button onClick={handleExport} disabled={trimming}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '6px', border: 'none', background: 'var(--brand-primary)', color: '#fff', fontWeight: '800', fontSize: '11px', cursor: 'pointer' }}>
          {trimming ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
          {trimming ? 'RENDERING…' : 'JOIN & EXPORT'}
        </button>
      </div>

      {/* Editor Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', background: 'var(--bg-main)' }}>
          
          {/* Main Viewport */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', minHeight: '400px' }}>
            <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', background: '#000', aspectRatio: exportOrientation === 'landscape' ? '16/9' : '9/16', maxHeight: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', border: '1px solid var(--border-color)' }}>
              <video 
                ref={videoRef} src={activeClip.rec.video_url} 
                style={{ 
                  width: '100%', height: '100%', objectFit: 'contain',
                  transform: `rotate(${videoRotation}deg) ${ (videoRotation === 90 || videoRotation === 270) ? 'scale(1.778)' : '' }`,
                  transition: 'transform 0.3s ease'
                }}
                onClick={togglePlay}
              />
              {cameoConfig.enabled && (
                <div 
                  style={{ 
                    position: 'absolute', left: `${cameoConfig.x}%`, top: `${cameoConfig.y}%`, 
                    width: `${cameoConfig.size}%`, aspectRatio: '1', borderRadius: '50%', background: 'var(--bg-panel-muted)', border: '1.5px solid var(--text-main)',
                    transform: `translate(-50%, -50%) rotate(${cameoConfig.rotation}deg)`, cursor: 'move', overflow: 'hidden'
                  }}
                  onMouseDown={(e) => {
                    const startX = e.clientX; const startY = e.clientY;
                    const startPosX = cameoConfig.x; const startPosY = cameoConfig.y;
                    const onMove = (em) => {
                      const dx = ((em.clientX - startX) / e.currentTarget.parentElement.offsetWidth) * 100;
                      const dy = ((em.clientY - startY) / e.currentTarget.parentElement.offsetHeight) * 100;
                      setCameoConfig(prev => ({ ...prev, x: Math.max(0, Math.min(100, startPosX + dx)), y: Math.max(0, Math.min(100, startPosY + dy)) }));
                    };
                    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
                    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
                  }}
                >
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', fontSize: '9px' }}>CAM</div>
                </div>
              )}
            </div>
          </div>

          {/* Unified Timeline / Sequence Track */}
          <div style={{ background: 'var(--bg-panel)', borderTop: '1px solid var(--border-color)', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <button onClick={togglePlay} style={{ background: 'var(--brand-primary)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {playing ? <Pause size={16} fill="#fff" /> : <Play size={16} fill="#fff" />}
                 </button>
                 <button onClick={handleSplitClip} style={{ background: 'var(--bg-panel-muted)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}>
                   <Scissors size={12} style={{ marginRight: '6px' }} /> SPLIT
                 </button>
               </div>
               <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--brand-primary)' }}>
                 {fmt(getSequenceTime())} / {fmt(sequenceDuration)}
               </div>
            </div>

            {/* The Joined Track */}
            <div style={{ position: 'relative', height: '48px', background: 'var(--bg-panel-muted)', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden', cursor: 'crosshair' }}
              onClick={(e) => {
                 const rect = e.currentTarget.getBoundingClientRect();
                 const targetSeqTime = ((e.clientX - rect.left) / rect.width) * sequenceDuration;
                 let acc = 0;
                 for (const c of clips) {
                   const dur = c.out - c.in;
                   if (targetSeqTime <= acc + dur) { setSelectedClipId(c.id); videoRef.current.currentTime = c.in + (targetSeqTime - acc); return; }
                   acc += dur;
                 }
              }}
            >
               {clips.map((clip, i) => (
                 <div key={clip.id} style={{ 
                    position: 'absolute', top: 0, bottom: 0, 
                    left: `${(clips.slice(0, i).reduce((acc, c) => acc + (c.out - c.in), 0) / sequenceDuration) * 100}%`,
                    width: `${((clip.out - clip.in) / sequenceDuration) * 100}%`,
                    background: selectedClipId === clip.id ? 'rgba(29,158,74,0.4)' : 'rgba(255,255,255,0.05)',
                    borderRight: '1px solid var(--border-color)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '900', color: 'var(--text-muted)'
                 }}>
                   {i + 1}
                 </div>
               ))}
               <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${(getSequenceTime() / sequenceDuration) * 100}%`, width: '2px', background: 'var(--text-main)', zIndex: 10, boxShadow: '0 0 10px var(--text-main)' }} />
            </div>

            {/* Horizontal Clip Cards (Compact) */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginTop: '12px', paddingBottom: '4px' }}>
              {clips.map((clip, idx) => (
                <div key={clip.id} onClick={() => setSelectedClipId(clip.id)}
                  style={{ 
                    minWidth: '120px', padding: '8px', borderRadius: '8px', cursor: 'pointer',
                    background: selectedClipId === clip.id ? 'var(--bg-panel-muted)' : 'var(--bg-panel)',
                    border: `1px solid ${selectedClipId === clip.id ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                    position: 'relative'
                  }}
                >
                  <div style={{ fontSize: '9px', fontWeight: '900', color: selectedClipId === clip.id ? 'var(--brand-primary)' : 'var(--text-muted)', marginBottom: '2px' }}>CLIP {idx + 1}</div>
                  <div style={{ fontSize: '11px', fontWeight: '700' }}>{fmt(clip.out - clip.in)}</div>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                    <button onClick={(e) => { e.stopPropagation(); handleMoveClip(clip.id, -1); }} disabled={idx === 0} style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}><ChevronLeft size={12} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleMoveClip(clip.id, 1); }} disabled={idx === clips.length - 1} style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}><ChevronRight size={12} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteClip(clip.id); }} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: '#991b1b', cursor: 'pointer' }}><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Inspector */}
        <div style={{ background: 'var(--bg-panel)', borderLeft: '1px solid var(--border-color)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <section>
            <h5 style={{ fontSize: '10px', fontWeight: '900', color: 'var(--text-muted)', marginBottom: '12px' }}>CLIP INSPECTOR</h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
               <div>
                 <label style={{ fontSize: '8px', fontWeight: '900', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>START</label>
                 <input type="number" step="0.1" value={activeClip.in.toFixed(1)} 
                   onChange={e => setClips(prev => prev.map(c => c.id === selectedClipId ? { ...c, in: parseFloat(e.target.value) } : c))}
                   style={{ width: '100%', background: 'var(--bg-panel-muted)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '6px', borderRadius: '4px', fontSize: '11px' }} />
               </div>
               <div>
                 <label style={{ fontSize: '8px', fontWeight: '900', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>END</label>
                 <input type="number" step="0.1" value={activeClip.out.toFixed(1)} 
                   onChange={e => setClips(prev => prev.map(c => c.id === selectedClipId ? { ...c, out: parseFloat(e.target.value) } : c))}
                   style={{ width: '100%', background: 'var(--bg-panel-muted)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '6px', borderRadius: '4px', fontSize: '11px' }} />
               </div>
            </div>
          </section>

          <section>
            <h5 style={{ fontSize: '10px', fontWeight: '900', color: 'var(--text-muted)', marginBottom: '12px' }}>CAMEO & OVERLAY</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span style={{ fontSize: '11px' }}>Enabled</span>
                 <button onClick={() => setCameoConfig(prev => ({ ...prev, enabled: !prev.enabled }))} 
                   style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: cameoConfig.enabled ? 'var(--brand-primary)' : 'var(--bg-panel-muted)', color: '#fff', fontSize: '9px', fontWeight: '900', cursor: 'pointer' }}>{cameoConfig.enabled ? 'ON' : 'OFF'}</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}><span>Size</span><span>{cameoConfig.size}%</span></div>
                 <input type="range" min="10" max="40" value={cameoConfig.size} onChange={e => setCameoConfig(prev => ({ ...prev, size: parseInt(e.target.value) }))} style={{ width: '100%' }} />
              </div>
            </div>
          </section>

          <section>
             <h5 style={{ fontSize: '10px', fontWeight: '900', color: 'var(--text-muted)', marginBottom: '12px' }}>PROJECT ORIENTATION</h5>
             <div style={{ display: 'flex', gap: '8px' }}>
                {[0, 90, 180, 270].map(rot => (
                  <button key={rot} onClick={() => setVideoRotation(rot)}
                    style={{ flex: 1, padding: '6px', fontSize: '9px', fontWeight: '900', borderRadius: '4px', border: 'none', background: videoRotation === rot ? 'var(--brand-primary)' : 'var(--bg-panel-muted)', color: 'var(--text-main)', cursor: 'pointer' }}>
                    {rot}°
                  </button>
                ))}
             </div>
          </section>

          <div style={{ marginTop: 'auto', padding: '16px', background: 'var(--bg-panel-muted)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
             <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '900', marginBottom: '2px' }}>SEQUENCE TOTAL</div>
             <div style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '-0.5px' }}>{fmt(sequenceDuration)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
/* ─── TacticCard component ─── */
const TacticCard = ({ team, onLoad, onDelete }) => (
  <div 
    style={{ background: 'var(--bg-panel)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden', transition: 'all 0.15s' }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
  >
    <div style={{ padding: '24px', background: 'rgba(29, 158, 74, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border-color)' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(29, 158, 74, 0.3)' }}>
        <Layout size={24} />
      </div>
    </div>
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0 }}>{team.name}</h3>
        <span style={{ fontSize: '10px', fontWeight: '800', padding: '2px 6px', background: 'var(--bg-panel-muted)', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
          {team.home_formation}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={11} /> {new Date(team.created_at).toLocaleDateString()}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MousePointer2 size={11} /> {team.is_dual_team ? 'Match' : 'Single'}</span>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => onLoad(team)}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--brand-primary)', color: '#fff', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Play size={12} fill="#fff" /> Load Board
        </button>
        <button onClick={() => onDelete(team.id)}
          style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: '#ff4d4d', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  </div>
);

/* ─── Main GalleryView ─── */
const GalleryView = () => {
  const { reloadData, savedTeams, loadTeam, deleteSavedTeam } = useTactics();
  const [recordings, setRecordings] = useState([]);
  const [category, setCategory] = useState('TACTICS'); // 'TACTICS' | 'VIDEOS'
  const [filter, setFilter] = useState('ALL');
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    try { const data = await fetchRecordings(); setRecordings(data); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDeleteRecording = (id) => { setRecordings(prev => prev.filter(r => r.id !== id)); reloadData(); };
  const handleRenameRecording = (id, title) => { setRecordings(prev => prev.map(r => r.id === id ? { ...r, title } : r)); };

  const handleLoadBoard = (team) => {
    loadTeam(team);
    navigate('/studio');
  };

  const filteredVideos = filter === 'ALL' ? recordings : recordings.filter(r => r.media_type === filter);

  if (editing) {
    return <VideoEditor rec={editing} onClose={() => setEditing(null)} onDelete={handleDeleteRecording} onRename={handleRenameRecording} />;
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>Studio Library</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Your saved tactical boards and session recordings</p>
        </div>
        <div style={{ display: 'flex', background: 'var(--bg-panel)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-color)', gap: '4px' }}>
          {[
            { id: 'TACTICS', label: 'Tactics Boards', icon: Layout },
            { id: 'VIDEOS', label: 'Recordings', icon: Video }
          ].map(cat => (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '9px', border: 'none', background: category === cat.id ? 'var(--brand-primary)' : 'transparent', color: category === cat.id ? '#fff' : 'var(--text-main)', cursor: 'pointer', fontSize: '13px', fontWeight: '700', transition: 'all 0.2s' }}>
              <cat.icon size={16} /> {cat.label}
            </button>
          ))}
        </div>
      </header>

      {category === 'VIDEOS' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <div style={{ display: 'flex', background: 'var(--bg-panel)', padding: '3px', borderRadius: '10px', border: '1px solid var(--border-color)', gap: '2px' }}>
            {['ALL', 'RAW', 'EDITED'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: '6px 14px', borderRadius: '7px', border: 'none', background: filter === f ? 'var(--bg-panel-muted)' : 'transparent', color: filter === f ? 'var(--brand-primary)' : 'var(--text-main)', cursor: 'pointer', fontSize: '11px', fontWeight: '800' }}>
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
          <Loader2 size={40} color="var(--brand-primary)" className="animate-spin" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {category === 'TACTICS' ? (
            savedTeams.map(team => (
              <TacticCard 
                key={team.id} 
                team={team} 
                onLoad={handleLoadBoard} 
                onDelete={deleteSavedTeam} 
              />
            ))
          ) : (
            filteredVideos.map(rec => (
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
                    <button onClick={async (e) => { e.stopPropagation(); if (confirm('Delete this recording?')) { try { await deleteRecording(rec.id); handleDeleteRecording(rec.id); } catch { alert('Delete failed'); } } }}
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: '#ff4d4d', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {category === 'TACTICS' && savedTeams.length === 0 && !loading && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', background: 'var(--bg-panel)', borderRadius: '20px', border: '1px dashed var(--border-color)', opacity: 0.4 }}>
              <Layout size={40} style={{ marginBottom: '12px' }} />
              <p style={{ fontSize: '14px', fontWeight: '600' }}>No saved tactics yet.</p>
            </div>
          )}

          {category === 'VIDEOS' && filteredVideos.length === 0 && !loading && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', background: 'var(--bg-panel)', borderRadius: '20px', border: '1px dashed var(--border-color)', opacity: 0.4 }}>
              <Video size={40} style={{ marginBottom: '12px' }} />
              <p style={{ fontSize: '14px', fontWeight: '600' }}>No recordings found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GalleryView;
