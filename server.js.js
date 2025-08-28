console.log('CWD =', process.cwd());
require('dotenv').config(); // Renderissa asetat env-muuttujat UI:ssa

const express = require('express');
const axios   = require('axios');
const cors    = require('cors');

const app  = express();
// Render asettaa PORT-muuttujan automaattisesti
const PORT = process.env.PORT || 8080;
const FB   = process.env.FB_URL;

if (!FB) {
  console.error('ERROR: FB_URL puuttuu ympäristömuuttujista.');
  process.exit(1);
}

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.type('text/plain').send('OK'));

// Proxy GET -> Firebase
app.get('/get', async (req, res) => {
  try {
    const path = req.query.path || '/.json';
    console.log(`[PROXY] GET ${FB}${path}`);
    const r = await axios.get(FB + path, {
      timeout: 10000,
      validateStatus: () => true
    });
    return res.status(r.status).send(r.data);
  } catch (e) {
    console.error('[PROXY] ERROR', e.message);
    return res.status(500).send('ERR: ' + (e.message || 'unknown'));
  }
});

// Halutessasi: PATCH Firebaseen
app.post('/patch', async (req, res) => {
  try {
    const path = req.query.path;
    if (!path) return res.status(400).send('path puuttuu');
    const body = req.body || {};
    console.log(`[PROXY] PATCH ${FB}${path}`, body);
    const r = await axios.patch(FB + path, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
      validateStatus: () => true
    });
    return res.status(r.status).send(r.data);
  } catch (e) {
    console.error('[PROXY] ERROR', e.message);
    return res.status(500).send('ERR: ' + (e.message || 'unknown'));
  }
});

app.listen(PORT, () => console.log(`Proxy up on :${PORT}, FB=${FB}`));