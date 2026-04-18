import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from './db.js';

const JWT_SECRET = 'your-secret-key-change-this-in-prod';

export const register = (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const id = uuidv4();
    
    const stmt = db.prepare('INSERT INTO users (id, username, password) VALUES (?, ?, ?)');
    stmt.run(id, username, hashedPassword);
    
    const token = jwt.sign({ id, username, role: 'USER' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id, username, role: 'USER' } });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Username taken' });
    res.status(500).json({ error: err.message });
  }
};

export const login = (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
};

export const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
  next();
};
