// Formations are based on a 0-100 coordinate system. 
// X is length (left to right), Y is width (top to bottom).
// The Home team attacks left to right, Away attacks right to left.

export const formations = {
  '4-3-3': [
    { id: 1, role: 'GK', x: 8, y: 50 },
    { id: 2, role: 'LB', x: 25, y: 15 },
    { id: 3, role: 'CB', x: 20, y: 35 },
    { id: 4, role: 'CB', x: 20, y: 65 },
    { id: 5, role: 'RB', x: 25, y: 85 },
    { id: 6, role: 'CM', x: 45, y: 30 },
    { id: 7, role: 'CDM', x: 38, y: 50 },
    { id: 8, role: 'CM', x: 45, y: 70 },
    { id: 9, role: 'LW', x: 75, y: 20 },
    { id: 10, role: 'ST', x: 70, y: 50 },
    { id: 11, role: 'RW', x: 75, y: 80 },
  ],
  '4-2-3-1': [
    { id: 1, role: 'GK', x: 8, y: 50 },
    { id: 2, role: 'LB', x: 25, y: 15 },
    { id: 3, role: 'CB', x: 20, y: 35 },
    { id: 4, role: 'CB', x: 20, y: 65 },
    { id: 5, role: 'RB', x: 25, y: 85 },
    { id: 6, role: 'CDM', x: 40, y: 35 },
    { id: 7, role: 'CDM', x: 40, y: 65 },
    { id: 8, role: 'LAM', x: 60, y: 25 },
    { id: 9, role: 'CAM', x: 55, y: 50 },
    { id: 10, role: 'RAM', x: 60, y: 75 },
    { id: 11, role: 'ST', x: 75, y: 50 },
  ],
  '4-4-2': [
    { id: 1, role: 'GK', x: 8, y: 50 },
    { id: 2, role: 'LB', x: 25, y: 15 },
    { id: 3, role: 'CB', x: 20, y: 35 },
    { id: 4, role: 'CB', x: 20, y: 65 },
    { id: 5, role: 'RB', x: 25, y: 85 },
    { id: 6, role: 'LM', x: 50, y: 15 },
    { id: 7, role: 'CM', x: 45, y: 35 },
    { id: 8, role: 'CM', x: 45, y: 65 },
    { id: 9, role: 'RM', x: 50, y: 85 },
    { id: 10, role: 'ST', x: 70, y: 35 },
    { id: 11, role: 'ST', x: 70, y: 65 },
  ],
  '3-5-2': [
    { id: 1, role: 'GK', x: 8, y: 50 },
    { id: 2, role: 'LCB', x: 22, y: 25 },
    { id: 3, role: 'CB', x: 18, y: 50 },
    { id: 4, role: 'RCB', x: 22, y: 75 },
    { id: 5, role: 'LWB', x: 45, y: 12 },
    { id: 6, role: 'CM', x: 40, y: 35 },
    { id: 7, role: 'CDM', x: 35, y: 50 },
    { id: 8, role: 'CM', x: 40, y: 65 },
    { id: 9, role: 'RWB', x: 45, y: 88 },
    { id: 10, role: 'ST', x: 75, y: 35 },
    { id: 11, role: 'ST', x: 75, y: 65 },
  ],
  '3-4-3': [
    { id: 1, role: 'GK', x: 8, y: 50 },
    { id: 2, role: 'LCB', x: 20, y: 25 },
    { id: 3, role: 'CB', x: 18, y: 50 },
    { id: 4, role: 'RCB', x: 20, y: 75 },
    { id: 5, role: 'LM', x: 45, y: 15 },
    { id: 6, role: 'CM', x: 40, y: 35 },
    { id: 7, role: 'CM', x: 40, y: 65 },
    { id: 8, role: 'RM', x: 45, y: 85 },
    { id: 9, role: 'LW', x: 75, y: 25 },
    { id: 10, role: 'ST', x: 70, y: 50 },
    { id: 11, role: 'RW', x: 75, y: 75 },
  ],
  '4-5-1': [
    { id: 1, role: 'GK', x: 8, y: 50 },
    { id: 2, role: 'LB', x: 25, y: 15 },
    { id: 3, role: 'CB', x: 20, y: 35 },
    { id: 4, role: 'CB', x: 20, y: 65 },
    { id: 5, role: 'RB', x: 25, y: 85 },
    { id: 6, role: 'LM', x: 50, y: 15 },
    { id: 7, role: 'CM', x: 45, y: 35 },
    { id: 8, role: 'CM', x: 40, y: 50 },
    { id: 9, role: 'CM', x: 45, y: 65 },
    { id: 10, role: 'RM', x: 50, y: 85 },
    { id: 11, role: 'ST', x: 75, y: 50 },
  ],
  '5-3-2': [
    { id: 1, role: 'GK', x: 8, y: 50 },
    { id: 2, role: 'LWB', x: 25, y: 10 },
    { id: 3, role: 'LCB', x: 18, y: 30 },
    { id: 4, role: 'CB', x: 15, y: 50 },
    { id: 5, role: 'RCB', x: 18, y: 70 },
    { id: 6, role: 'RWB', x: 25, y: 90 },
    { id: 7, role: 'LCM', x: 45, y: 25 },
    { id: 8, role: 'CM', x: 40, y: 50 },
    { id: 9, role: 'RCM', x: 45, y: 75 },
    { id: 10, role: 'LS', x: 75, y: 35 },
    { id: 11, role: 'RS', x: 75, y: 65 },
  ],
  '4-1-2-1-2 (Diamond)': [
    { id: 1, role: 'GK', x: 8, y: 50 },
    { id: 2, role: 'LB', x: 25, y: 15 },
    { id: 3, role: 'CB', x: 20, y: 35 },
    { id: 4, role: 'CB', x: 20, y: 65 },
    { id: 5, role: 'RB', x: 25, y: 85 },
    { id: 6, role: 'CDM', x: 38, y: 50 },
    { id: 7, role: 'LCM', x: 50, y: 30 },
    { id: 8, role: 'RCM', x: 50, y: 70 },
    { id: 9, role: 'CAM', x: 62, y: 50 },
    { id: 10, role: 'LS', x: 75, y: 35 },
    { id: 11, role: 'RS', x: 75, y: 65 },
  ]
};

// Generates the players array for a given formation and team type
export function generatePlayers(formationKey, isHome, generateSubs = false, isSecondHalf = false) {
  const baseForm = formations[formationKey];
  if (!baseForm) return [];

  // In second half, sides are switched (180 degree rotation)
  const effectiveIsHome = isSecondHalf ? !isHome : isHome;

  let players = baseForm.map(p => {
    const actualX = effectiveIsHome ? p.x : 100 - p.x;
    const actualY = effectiveIsHome ? p.y : 100 - p.y;
    
    return {
      id: `${isHome ? 'home' : 'away'}-${p.id}`,
      number: p.id,
      positionStr: p.role,
      name: p.role,
      team: isHome ? 'home' : 'away',
      relativeX: actualX,
      relativeY: actualY
    };
  });

  if (generateSubs) {
    for (let i = 1; i <= 7; i++) {
      const subId = 11 + i;
      // Start Subs along the bottom touchline
      const subX = isHome ? 8 + (i * 5) : 92 - (i * 5);
      players.push({
        id: `${isHome ? 'home' : 'away'}-${subId}`,
        number: subId,
        positionStr: 'SUB',
        name: 'Bench',
        team: isHome ? 'home' : 'away',
        relativeX: subX,
        relativeY: 92 
      });
    }
  }

  return players;
}

export const formationKeys = Object.keys(formations);
