/**
 * API Service for team persistence and auth
 */

const getToken = () => localStorage.getItem('token');

const getHeaders = (isMultipart = false) => {
  const headers = {};
  if (!isMultipart) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

export const register = async (username, password) => {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Registration failed');
  }
  return res.json();
};

export const login = async (username, password) => {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Login failed');
  }
  return res.json();
};

export const fetchTeams = async () => {
  const res = await fetch('/api/teams', { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch teams');
  return res.json();
};

export const saveTeam = async (teamData) => {
  const res = await fetch('/api/teams', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(teamData),
  });
  if (!res.ok) throw new Error('Failed to save team');
  return res.json();
};

export const deleteTeam = async (id) => {
  const res = await fetch(`/api/teams/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete team');
  return res.json();
};

export const fetchLeagues = async () => {
  const res = await fetch('/api/leagues', { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch leagues');
  return res.json();
};

export const saveLeague = async (leagueData) => {
  const res = await fetch('/api/leagues', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(leagueData),
  });
  if (!res.ok) throw new Error('Failed to save league');
  return res.json();
};

export const fetchRecordings = async (type) => {
  const url = type ? `/api/recordings?type=${type}` : '/api/recordings';
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch recordings');
  return res.json();
};

export const deleteRecording = async (id) => {
  const res = await fetch(`/api/recordings/${id}`, { method: 'DELETE', headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to delete recording');
  return res.json();
};

export const renameRecording = async (id, title) => {
  const res = await fetch(`/api/recordings/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ title }) });
  if (!res.ok) throw new Error('Failed to rename recording');
  return res.json();
};

export const uploadRecording = async (blob, title, duration, mediaType = 'RAW') => {
  const formData = new FormData();
  formData.append('video', blob, 'recording.webm');
  formData.append('title', title);
  formData.append('duration', duration);
  formData.append('media_type', mediaType);

  const res = await fetch('/api/recordings', {
    method: 'POST',
    headers: getHeaders(true),
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload recording');
  return res.json();
};

// GLOBAL DATA
export const fetchGlobalTeams = async () => {
  const res = await fetch('/api/global/teams');
  return res.json();
};

export const fetchGlobalPlayers = async (teamId) => {
  const res = await fetch(`/api/global/teams/${teamId}/players`);
  return res.json();
};

export const fetchGlobalPlayer = async (id) => {
  const res = await fetch(`/api/global/players/${id}`);
  if (!res.ok) throw new Error('Failed to fetch player');
  return res.json();
};

export const updateLeague = async (id, data) => {
  const res = await fetch(`/api/leagues/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to update league');
  return res.json();
};

export const deleteLeague = async (id) => {
  const res = await fetch(`/api/leagues/${id}`, { method: 'DELETE', headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to delete league');
  return res.json();
};

export const saveGlobalTeam = async (data) => {
  const res = await fetch('/api/global/teams', { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to save team');
  return res.json();
};

export const updateGlobalTeam = async (id, data) => {
  const res = await fetch(`/api/global/teams/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to update team');
  return res.json();
};

export const deleteGlobalTeam = async (id) => {
  const res = await fetch(`/api/global/teams/${id}`, { method: 'DELETE', headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to delete team');
  return res.json();
};

export const updateGlobalPlayer = async (id, data) => {
  const res = await fetch(`/api/global/players/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to update player');
  return res.json();
};

export const deleteGlobalPlayer = async (id) => {
  const res = await fetch(`/api/global/players/${id}`, { method: 'DELETE', headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to delete player');
  return res.json();
};
