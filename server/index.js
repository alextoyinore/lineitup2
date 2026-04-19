import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import db from './db.js';
import { register, login, authenticateToken, isAdmin } from './auth.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('server/uploads'));

// Multer Config for Video Uploads
const storage = multer.diskStorage({
  destination: 'server/uploads/',
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

// --- AUTH ROUTES ---
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);

// --- TEAMS (USER PRIVATE) ---
app.get('/api/teams', authenticateToken, (req, res) => {
  try {
    const teams = db.prepare('SELECT * FROM teams WHERE owner_id = ? ORDER BY created_at DESC').all(req.user.id);
    const parsedTeams = teams.map(t => ({
      ...t,
      team_colors: JSON.parse(t.team_colors),
      ui_config: JSON.parse(t.ui_config),
      players: JSON.parse(t.players),
      drawings: JSON.parse(t.drawings),
      is_dual_team: Boolean(t.is_dual_team)
    }));
    res.json(parsedTeams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/teams', authenticateToken, (req, res) => {
  const team = req.body;
  const id = team.id || uuidv4();
  
  try {
    const stmt = db.prepare(`
      INSERT INTO teams (id, name, home_formation, away_formation, is_dual_team, team_colors, ui_config, players, drawings, owner_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        home_formation = excluded.home_formation,
        away_formation = excluded.away_formation,
        is_dual_team = excluded.is_dual_team,
        team_colors = excluded.team_colors,
        ui_config = excluded.ui_config,
        players = excluded.players,
        drawings = excluded.drawings
    `);

    stmt.run(
      id,
      team.name,
      team.home_formation,
      team.away_formation,
      team.is_dual_team ? 1 : 0,
      JSON.stringify(team.team_colors),
      JSON.stringify(team.ui_config),
      JSON.stringify(team.players),
      JSON.stringify(team.drawings),
      req.user.id
    );

    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/teams/:id', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM teams WHERE id = ? AND owner_id = ?').run(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- RECORDINGS ---
app.get('/api/recordings', authenticateToken, (req, res) => {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM recordings WHERE owner_id = ?';
    let params = [req.user.id];
    
    if (type) {
      query += ' AND media_type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY created_at DESC';
    const recs = db.prepare(query).all(...params);
    res.json(recs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/recordings', authenticateToken, upload.single('video'), (req, res) => {
  try {
    const id = uuidv4();
    const { title, duration, media_type = 'RAW' } = req.body;
    const video_url = `/uploads/${req.file.filename}`;
    
    db.prepare('INSERT INTO recordings (id, owner_id, title, video_url, file_size, duration, media_type) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, req.user.id, title || 'Untitled Session', video_url, req.file.size, duration || 0, media_type);
      
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- GLOBAL DATA (MANAGED BY ADMIN) ---
app.delete('/api/recordings/:id', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM recordings WHERE id = ? AND owner_id = ?').run(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/recordings/:id', authenticateToken, (req, res) => {
  try {
    const { title } = req.body;
    db.prepare('UPDATE recordings SET title = ? WHERE id = ? AND owner_id = ?').run(title, req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Generic Image Upload
app.post('/api/upload', authenticateToken, isAdmin, upload.single('image'), (req, res) => {
  try {
    const url = `/uploads/${req.file.filename}`;
    res.json({ success: true, url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Leagues
app.get('/api/leagues', (req, res) => {
  try {
    const leagues = db.prepare('SELECT * FROM leagues ORDER BY name ASC').all();
    res.json(leagues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/leagues', authenticateToken, isAdmin, (req, res) => {
  try {
    const { name, logo_url, country } = req.body;
    const id = uuidv4();
    db.prepare('INSERT INTO leagues (id, name, logo_url, country) VALUES (?, ?, ?, ?)').run(id, name, logo_url, country);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/leagues/:id', authenticateToken, isAdmin, (req, res) => {
  try {
    const { name, logo_url, country } = req.body;
    db.prepare('UPDATE leagues SET name = ?, logo_url = ?, country = ? WHERE id = ?').run(name, logo_url, country, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/leagues/:id', authenticateToken, isAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM leagues WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Global Teams
app.get('/api/global/teams', (req, res) => {
  try {
    const teams = db.prepare('SELECT * FROM global_teams ORDER BY name ASC').all();
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/global/teams', authenticateToken, isAdmin, (req, res) => {
  try {
    const { name, league_id, logo_url, stadium_name, city, manager_name, foundation_year, stadium_image_url, location_map_url, default_formation } = req.body;
    const id = uuidv4();
    db.prepare(`INSERT INTO global_teams (id, name, league_id, logo_url, stadium_name, city, manager_name, foundation_year, stadium_image_url, location_map_url, default_formation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, name, league_id, logo_url, stadium_name, city, manager_name, foundation_year, stadium_image_url, location_map_url, default_formation || '4-3-3');
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/global/teams/:id', authenticateToken, isAdmin, (req, res) => {
  try {
    const { name, league_id, logo_url, stadium_name, city, manager_name, foundation_year, stadium_image_url, location_map_url, default_formation } = req.body;
    db.prepare(`UPDATE global_teams SET name=?, league_id=?, logo_url=?, stadium_name=?, city=?, manager_name=?, foundation_year=?, stadium_image_url=?, location_map_url=?, default_formation=? WHERE id=?`)
      .run(name, league_id, logo_url, stadium_name, city, manager_name, foundation_year, stadium_image_url, location_map_url, default_formation, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/global/teams/:id', authenticateToken, isAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM global_teams WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Global Players
app.get('/api/global/teams/:teamId/players', (req, res) => {
  try {
    const players = db.prepare('SELECT * FROM global_players WHERE team_id = ?').all(req.params.teamId);
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/global/players/:id', (req, res) => {
  try {
    const player = db.prepare('SELECT * FROM global_players WHERE id = ?').get(req.params.id);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json(player);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/global/players', authenticateToken, isAdmin, (req, res) => {
  try {
    const { team_id, name, number, position, avatar_url, grade, is_starting } = req.body;
    const id = uuidv4();
    db.prepare('INSERT INTO global_players (id, team_id, name, number, position, avatar_url, grade, is_starting) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, team_id, name, number, position, avatar_url, Number(grade || 0), Number(is_starting));
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/global/players/:id', authenticateToken, isAdmin, (req, res) => {
  try {
    const { name, number, position, avatar_url, grade, is_starting } = req.body;
    db.prepare('UPDATE global_players SET name=?, number=?, position=?, avatar_url=?, grade=?, is_starting=? WHERE id=?')
      .run(name, number, position, avatar_url, Number(grade || 0), Number(is_starting), req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/global/players/:id', authenticateToken, isAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM global_players WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`--- Full-stack server running on http://localhost:${PORT}`);
});
