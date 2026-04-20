
import db from '../server/db.js';

const recordings = db.prepare('SELECT id, video_url, media_type FROM recordings').all();

console.log('Current recordings:', recordings);

recordings.forEach(rec => {
  if (rec.video_url.startsWith('/uploads/')) {
    const filename = rec.video_url.split('/').pop();
    let sub = (rec.media_type || 'raw').toLowerCase();
    if (sub === 'edit') sub = 'edited';
    const newUrl = `/LineItUp/${sub}/${filename}`;
    
    console.log(`Updating ${rec.id}: ${rec.video_url} -> ${newUrl}`);
    db.prepare('UPDATE recordings SET video_url = ? WHERE id = ?').run(newUrl, rec.id);
  } else if (rec.video_url.startsWith('/LineItUp/') && !rec.video_url.includes('/raw/') && !rec.video_url.includes('/edited/') && !rec.video_url.includes('/screenshots/')) {
    // If it's already LineItUp but missing subfolder
    const filename = rec.video_url.split('/').pop();
    let sub = (rec.media_type || 'raw').toLowerCase();
    if (sub === 'edit') sub = 'edited';
    const newUrl = `/LineItUp/${sub}/${filename}`;
    
    console.log(`Fixing ${rec.id}: ${rec.video_url} -> ${newUrl}`);
    db.prepare('UPDATE recordings SET video_url = ? WHERE id = ?').run(newUrl, rec.id);
  }
});

console.log('Migration complete.');
