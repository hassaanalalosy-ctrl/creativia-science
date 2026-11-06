# Reels

10 reels per month; every other day is a carousel or single post (one feed post every day).
**Reel days: the 1st, 4th, 7th, 10th, 13th, 16th, 19th, 22nd, 25th and 28th of every month.**
**All 10 reels have a voiceover** in simple Modern Standard Arabic — see "Voice reels" below. Music plays under the voice.

## Topics
- Quick shocking facts (one surprising fact explained in 30 seconds).
- "What happens if…" (to your body, to Earth, in space) — step by step, with real numbers.
- Myth vs fact (use the `compare` scene: `bad.label` "خرافة", `good.label` "حقيقة").
- How things work (everyday physics and chemistry, inventions, the human body).
- A recent science news story in 3 facts, using credited real images exactly like posts.
Facts must be confirmed in 2 reliable sources (see CONTENT_GUIDE.md). No invented statistics. Health topics: calm, factual, no medical advice. Do not repeat a topic already in `log/posted.md`.

## Spec (posts/<id>/reel.json) — engine 2 (liquid glass), the ONLY engine for new reels
Always set `"engine": 2`. 18 to 45 seconds, 5 to 8 scenes. Titles under ~35 characters, bodies under ~90.
```json
{
  "id": "YYYY-MM-DD-short-slug",
  "topic": "English one-line topic",
  "category": "جسم الإنسان",
  "format": "reel",
  "engine": 2,
  "mode": "dark",
  "badge": "معلومة علمية",
  "coverAt": 2.4,
  "music": "assets/music/<file from assets/music/library.json>",
  "musicStart": 0,
  "voice": true,
  "scenes": [
    {"type": "hook", "dur": 3.4, "pose": "point", "title": "...", "pill": "optional short pill, e.g. 500 طن", "sub": "...", "say": "..."},
    {"type": "point", "dur": 3.0, "num": "1", "title": "...", "body": "...", "kreti": "think", "say": "..."},
    {"type": "point", "dur": 3.0, "num": "2", "image": "https://...", "credit": "الصورة: NASA", "title": "...", "body": "...", "say": "..."},
    {"type": "image", "dur": 3.0, "image": "https://...", "title": "...", "credit": "...", "chip": "optional label", "tall": false, "fit": "cover", "say": "..."},
    {"type": "compare", "dur": 3.2, "title": "...", "bad": {"label": "خرافة", "text": "..."}, "good": {"label": "حقيقة", "text": "..."}, "kreti": "jump", "say": "..."},
    {"type": "list", "dur": 3.4, "tag": "الخلاصة", "title": "...", "points": ["...", "...", "..."], "kreti": "wave", "say": "..."},
    {"type": "statement", "dur": 2.8, "text": "one strong sentence", "sub": "...", "say": "..."},
    {"type": "end", "dur": 2.8, "note": "optional line under the handle", "say": "..."}
  ],
  "caption": "..."
}
```
- Always start with `hook` and finish with `end`. Use 3 to 5 different scene types per reel.
- Badges: معلومة علمية · ماذا لو؟ · خرافة أم حقيقة؟ · خبر علمي · كيف يعمل؟
- Kreti poses: point, jump, think, wave. Use Kreti in 2 to 3 scenes only (he always wears his lab goggles).
- Sound effects are added automatically per scene type; set `"sfx": [[sec, "role", volume], ...]` on a scene only to override.
- Caption: same rules as posts (hook line ✦, the facts written out, sources, a question 👇, 5 to 9 hashtags starting with #كريتيفيا_ساينس).

## Music (own library)
Music is mixed INTO the video from `assets/music/library.json`. Pick by mood: upbeat for facts and news (owner's favourite); lofi for calm explainers; ambient for space and nature; emotional for serious topics. Never the same track as the previous reel (check the last reel.json in `log/schedule.json`). Do NOT send Instagram `audioConfiguration` for engine 2 reels.

## Voice reels — every reel
Set `"voice": true` on every reel and give every scene a `"say"` line.
**Voice: NOT CHOSEN YET.** The owner will pick a voice for this account (different from @creativia.mag's). Until `DEFAULT_VOICE` is set in `engine/voice.js`, voice generation stops with an error: do not make a reel; make a normal post for that day instead and say so in the reply. Model `eleven_v4`.
Rules:
- **Simple Modern Standard Arabic** (فصحى مبسطة), warm and clear, for every Arab. No dialect, no English words in the voice line.
- The on-screen text uses the same simple standard Arabic.
- Short sentences, 1 sentence per scene, 3 to 14 words. Numbers written as words (خمسمئة طن، ثلاثون ألف درجة).
- Whole script under 500 characters (about 30 to 45 seconds). Say it naturally; do not read the on-screen text word for word.
- Scene durations stretch automatically to fit each line; the music ducks under the voice.
- The generator caches clips; changing a "say" line regenerates only that clip.
- ElevenLabs credits are shared with @creativia.mag (Starter plan, 30,000 per month): never generate test clips on your own.

## Motion rules (owner)
- Arabic text appears **word by word**, never letter by letter (letters are joined; splitting breaks their shapes).
- **Every reveal moves right to left**: words, cards, transitions, camera pans.
- Vertical 9:16 only; keep everything in the safe area (y 70 to 500 on the 360×640 stage). Instagram covers the bottom fifth and the right edge.
- Style: liquid glass cards with a glowing rim, morphing shapes, soft blur-in reveals, slow camera push and slight 3D tilt, a softly drifting purple gradient background, small sparkles. Creativia Science purple, Playpen Sans Arabic, Kreti with goggles.
- Sound effects live in `assets/sfx/library.json`. Keep them subtle under the music; never more than one effect at the same moment.
- Light / dark: dark for space, night, tech and dramatic topics; light for calm, nature and cheerful topics. Never two reels in a row in the same mode.
