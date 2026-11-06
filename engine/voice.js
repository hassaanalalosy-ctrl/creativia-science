// Generates the voiceover for a reel: one clip per scene that has "say".
// Needs env ELEVENLABS_API_KEY (GitHub secret). Writes posts/<id>/voice/NN.mp3 and voice.json.
// Usage: node engine/voice.js <post-id>
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DEFAULT_VOICE = process.env.VOICE_ID || ''; // Creativia Science voice: not chosen yet — set it here once the owner picks one
const MODEL = 'eleven_v4';

(async () => {
  const id = process.argv[2];
  const dir = path.join(ROOT, 'posts', id);
  const spec = JSON.parse(fs.readFileSync(path.join(dir, 'reel.json'), 'utf8'));
  if (!spec.voice) { console.log('no voice for', id); return; }
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error('ELEVENLABS_API_KEY missing');
  const vdir = path.join(dir, 'voice');
  fs.mkdirSync(vdir, { recursive: true });
  const old = fs.existsSync(path.join(vdir, 'voice.json')) ? JSON.parse(fs.readFileSync(path.join(vdir, 'voice.json'), 'utf8')) : { clips: [] };
  const voiceId = spec.voiceId || DEFAULT_VOICE;
  if (!voiceId) throw new Error('No voice chosen yet: add voiceId to reel.json or set DEFAULT_VOICE in engine/voice.js');
  const says = spec.scenes.map(s => s.say || '');
  const clips = [];
  let chars = 0;
  for (let k = 0; k < says.length; k++) {
    if (!says[k]) continue;
    const file = String(k).padStart(2, '0') + '.mp3';
    const prev = old.clips.find(c => c.scene === k);
    if (prev && prev.text === says[k] && prev.voiceId === voiceId && fs.existsSync(path.join(vdir, file))) { clips.push(prev); continue; }
    const body = { text: says[k], model_id: MODEL, previous_text: says.slice(0, k).filter(Boolean).slice(-1)[0] || undefined, next_text: says.slice(k + 1).filter(Boolean)[0] || undefined };
    let res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, { method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) { // retry without context fields
      delete body.previous_text; delete body.next_text;
      res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, { method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }
    if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 300)}`);
    fs.writeFileSync(path.join(vdir, file), Buffer.from(await res.arrayBuffer()));
    const dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(vdir, file)]).toString());
    chars += says[k].length;
    clips.push({ scene: k, file, text: says[k], voiceId, dur: Math.round(dur * 100) / 100 });
  }
  fs.writeFileSync(path.join(vdir, 'voice.json'), JSON.stringify({ model: MODEL, voiceId, clips }, null, 2));
  console.log('voice done', id, clips.length, 'clips,', chars, 'new characters');
})().catch(e => { console.error(e); process.exit(1); });
