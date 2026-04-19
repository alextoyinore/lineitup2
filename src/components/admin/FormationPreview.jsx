import React from 'react';
import { formations } from '../../utils/formations';

const JERSEY_PATH = "M 9 2 Q 12 5 15 2 L 20 3 L 23 8 L 19 11 L 17 8 L 17 22 L 7 22 L 7 8 L 5 11 L 1 8 L 4 3 Z";

const FormationPreview = ({ formationKey, players, onSwap }) => {
  const formation = formations[formationKey] || formations['4-3-3'];
  const starters = players.filter(p => p.is_starting === 1);

  // Intelligent mapping: Match players to formation slots by role
  const mappedPlayers = Array(11).fill(null);
  const unmappedStarters = [...starters];

  // Pass 1: Exact matches or contains
  formation.forEach((slot, slotIdx) => {
    const matchIdx = unmappedStarters.findIndex(p => 
      p.position && (p.position.toUpperCase() === slot.role.toUpperCase() || 
      p.position.toUpperCase().includes(slot.role.toUpperCase()))
    );
    if (matchIdx !== -1) {
      mappedPlayers[slotIdx] = unmappedStarters[matchIdx];
      unmappedStarters.splice(matchIdx, 1);
    }
  });

  // Pass 2: Fill remaining slots with remaining starters
  formation.forEach((slot, slotIdx) => {
    if (!mappedPlayers[slotIdx] && unmappedStarters.length > 0) {
      mappedPlayers[slotIdx] = unmappedStarters.shift();
    }
  });

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      height: '520px', 
      background: 'linear-gradient(180deg, #1e3a1e 0%, #142814 100%)',
      borderRadius: '20px',
      border: '1px solid var(--border-color)',
      overflow: 'hidden',
      boxShadow: 'inset 0 0 60px rgba(0,0,0,0.6)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Pitch Lines */}
      <div style={{ position: 'absolute', inset: '12px', border: '2px solid rgba(255,255,255,0.12)', borderRadius: '4px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', background: 'rgba(255,255,255,0.12)', pointerEvents: 'none' }} />
      <div style={{ 
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
        width: '100px', height: '100px', border: '2px solid rgba(255,255,255,0.12)', borderRadius: '50%', pointerEvents: 'none'
      }} />
      
      {/* Goal Areas */}
      <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', width: '160px', height: '60px', border: '2px solid rgba(255,255,255,0.12)', borderTop: 'none', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', width: '160px', height: '60px', border: '2px solid rgba(255,255,255,0.12)', borderBottom: 'none', pointerEvents: 'none' }} />

      {/* Players */}
      {formation.map((pos, idx) => {
        const player = mappedPlayers[idx];
        // Standard Vertical Logic: 
        // X (length) -> Vertical (Y), Y (width) -> Horizontal (X)
        const left = pos.y;
        const top = 100 - pos.x;

        return (
          <div 
            key={`slot-${idx}`}
            onClick={() => player && onSwap(player)}
            style={{
              position: 'absolute',
              top: `${top}%`,
              left: `${left}%`,
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: 10
            }}
          >
            {/* Jersey SVG */}
            <div style={{ position: 'relative', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" style={{ width: '40px', height: '40px', filter: player ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' : 'none' }}>
                <path 
                  d={JERSEY_PATH} 
                  fill={player ? 'var(--brand-primary)' : 'rgba(255,255,255,0.03)'} 
                  stroke={player ? '#fff' : 'rgba(255,255,255,0.15)'}
                  strokeWidth={player ? '1.2' : '0.8'}
                  strokeDasharray={player ? '0' : '2,1'}
                  style={{ transition: 'all 0.3s ease' }}
                />
              </svg>
              {player && (
                <span style={{ 
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  color: '#fff', fontSize: '13px', fontWeight: '900', marginTop: '1px',
                  fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                }}>
                  {player.number}
                </span>
              )}
            </div>

            {/* Name Label */}
            <div style={{
              marginTop: '4px',
              fontSize: '10px',
              fontWeight: '700',
              color: '#fff',
              textShadow: '0 2px 4px rgba(0,0,0,1)',
              whiteSpace: 'nowrap',
              fontFamily: 'Inter, sans-serif',
              background: player ? 'rgba(0,0,0,0.6)' : 'transparent',
              padding: '1px 6px',
              borderRadius: '4px',
              border: player ? '1px solid rgba(255,255,255,0.1)' : 'none',
              opacity: player ? 1 : 0.6,
              transition: 'all 0.3s ease'
            }}>
              {player ? player.name.split(' ').pop().toUpperCase() : pos.role}
            </div>
          </div>
        );
      })}

      {starters.length === 0 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.15)', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Assign Starters to View Formation
        </div>
      )}
    </div>
  );
};

export default FormationPreview;
