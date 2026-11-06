# Reels

About 20 reels per month: every day except the post days (3, 6, 9, 12, 15, 18, 21, 24, 27, 30), which are carousels or single posts. One feed post every day.
Two reel types (owner, Nov 2026): **about 15 animated reels a month (engine 4, see `guide/ANIMATION.md`, narrator Hamida)** and **about 5 story reels (engine 3, this file, narrator fbIG6gEosVIM95R5qOna)**. Story reels are only for topics that need real photos or direct information. Narration costs about 500 to 800 ElevenLabs credits per reel (about 10,000 to 16,000 a month), from the Starter plan's 30,000 shared with @creativia.mag.
**Every reel has a voiceover** in simple Modern Standard Arabic — see "Voice reels" below. Music plays under the voice.

## Topics
- Quick shocking facts (one surprising fact explained in 30 seconds).
- "What happens if…" (to your body, to Earth, in space) — step by step, with real numbers.
- Myth vs fact (use the `compare` scene: `bad.label` "خرافة", `good.label` "حقيقة").
- How things work (everyday physics and chemistry, inventions, the human body).
- A recent science news story in 3 facts, using credited real images exactly like posts.
Facts must be confirmed in 2 reliable sources (see CONTENT_GUIDE.md). No invented statistics. Health topics: calm, factual, no medical advice. Do not repeat a topic already in `log/posted.md`.

## Older spec — engine 2 (kept for reference; new reels use engine 3 above)
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
- **Illustrate:** every reel explains its idea with at least 2 vector illustrations (`"art"` on `point` or `image` scenes, same rules as CONTENT_GUIDE.md "Explanatory illustrations": the drawing must show the fact literally, laid out with `row` / `stack`). They animate on their own (pop in right to left, herds appear one by one, floating and bobbing). Real photos only for real, specific things.
- Always start with `hook` and finish with `end`. Use 3 to 5 different scene types per reel.
- Badges: معلومة علمية · ماذا لو؟ · خرافة أم حقيقة؟ · خبر علمي · كيف يعمل؟
- Kreti poses: point, jump, think, wave. Use Kreti in 2 to 3 scenes only (he always wears his lab goggles).
- Sound effects are added automatically per scene type; set `"sfx": [[sec, "role", volume], ...]` on a scene only to override.
- Caption: same rules as posts (hook line ✦, the facts written out, sources, a question 👇, 5 to 9 hashtags starting with #كريتيفيا_ساينس).

## Story reels — engine 3 (APPROVED by the owner, Nov 2026; use it for every reel)
Reference: `posts/test-tunnel-2/reel.json` (the approved test). Always `"engine": 3`.
- A reel is a few **shots**. A shot keeps ONE picture on screen for several spoken **beats**: no cuts inside a shot, only captions, counters, labels and the camera change. A new picture = a new shot, reached by a morph of the glass shape. Usually: `open` → 1 or 2 `window` shots → `end`.
- `open`: the picture full screen (no glass), with optional `lines` drawn on it; its `handoff` makes it shrink exactly into the next window's picture.
- `window`: the liquid-glass window with one illustration (`art`), and:
  - `labels`: glass chips pinned to parts of the picture (`ax`, `ay` in the 400 x 300 art space, `side`, `in`, `out`). Keep chips inside the window: a left chip needs its point at x ≥ 162, a right chip at x ≤ 238 (at zoom 1). Never let two chips overlap.
  - `dot`: a glowing circle that moves (`keys` with `y`/`x` and `ease` in/out/inout/linear; optional `pendulum`). Use it for the moving thing instead of Kreti.
  - `follow`: the camera zooms in and travels with the dot (`from`, `to`, `z`). Zoom is what keeps the reel alive.
  - `camera`: keyframes `{at, d, z, x, y}` (e.g. pull back and lift the picture when a big number appears).
  - Never zoom so that an item of a `row` is left cut at the window edge (e.g. a cloud half outside the frame). Zoom on a single object, or keep z at 1 for rows; if you zoom into one part of a row, return to z 1 within 1.5 seconds. Check this in the frames.
  - `counters`: glass chips (time `fmt: "time"` in minutes → mm:ss, or numbers with `digits`, `unit`), and `big: true` for the key number.
  - `note`: ONE short line under the window (e.g. an assumption). Sources go in the caption, not on screen.
- `end` (always last): Kreti, a reaction bubble with a drawn emoji (`👍`, `😱`, `💡`) that appears on a word and disappears, and the card "تابعنا على كريتيفيا ساينس" with @creativia.sci. The narrator says one line to Kreti here and ends with "وتابعنا على كريتيفيا ساينس".
- **Anchors** (all times): a number of seconds in the shot, `"b1"` (start of beat 1), `"b1:end"`, `"b1:word"` (when that word is spoken), plus an offset like `"b3:ثمان-0.5"`. Tie every action to the word that announces it.
- **Every beat has `say` and `show`**: `say` is the line FULLY VOWELLED (تشكيل كامل) so the voice pronounces every word correctly (e.g. "كَالبَنْدُولِ"); `show` is the same words without vowels for the captions. Same number of words in both. Check the Arabic grammar and wording of every line.
- **Hook**: the opening beat is at most 8 to 10 words (this deep voice speaks slowly; 14 words took 9 seconds).
- Voice: `"voiceId": "fbIG6gEosVIM95R5qOna"` (the owner's chosen deep narrator). Mode dark for space and dramatic topics.
- Check before scheduling: extract about 20 frames across the video and look at every one: no cut that resets the same picture, no stretched or distorted shapes, no overlaps, nothing in the bottom fifth, captions readable; `ffprobe` shows an audio stream.

### Motion variety and audio (owner rules, Nov 2026)
- **Vary the motion with the story**; never reuse the same structure reel after reel. Choose per story:
  - **Opening scene**: `"scene": "meadow"` (sky, sun, clouds, hill, grass, flowers; for weather, nature, plants, the sky) or `"scene": "space"` (stars and nebula; for space and astronomy) behind the `open` shot's subject. When the story moves to the subject, the scene melts away (fade + blur) and the subject flies into the glass window while the grid background appears. Without a fitting scene, open on the subject alone.
  - **Window frame**: `"frame": "wide"` (default), `"square"` or `"tall"` (4:5). `frameKeys` (`[{"at": "b1", "frame": "tall"}]`) grow or shrink the window during a shot when the content needs it (a tall `stack`, a falling object, a tall body diagram). Use tall with tall content only (rows look small in it), and keep the beats under a tall frame short (2 caption lines at most).
  - **Camera**: zoom into a detail, follow a moving dot, pull back to reveal, lift for a big number. At least two kinds of camera move per reel.
  - **Lens** (`lens` in `art`) to zoom into tiny things; `counters` for numbers that climb; `labels` to name parts.
- **Music sits far under the narrator** (the engine sets it low and ducks it hard under the voice). Never raise `musicVolume`; the narrator and the sound effects must always be clearly heard.

- Every `show` line, label, unit and note is proofread for correct Arabic spelling and grammar before rendering (`guide/RUN.md`, "Language check"); write إذاً, never إذن.

## Storytelling (owner's reference reels, Nov 2026)
The owner shared reference reels (space without a suit, laughing-gas balloons, how far is the Sun, why zombies are green, two grapes in a microwave). What to take from them, done in OUR 2D dreamy style (never copy their 3D or presenters):
- **Hook = one or two short sentences (2 to 4 seconds at most), then straight into the information** (owner rule). No long intros, no long jokes: humour only works in the references because of rich 3D characters, which we do not have. Examples: "كم تزن هذه الغيمة؟", "ماذا لو…؟", "لماذا…؟".
- **Tell it as a short story**, not a list: a situation → what happens step by step (with a running timer or counter on screen) → the surprising twist → a light, funny ending.
- **Bust a myth** when there is one ("لا، لن تنفجر").
- **Zoom in**: from the object to its inside (a lens circle, skin layers, blood cells, molecules), then back out to the result.
- **Scale analogies**: compare with something familiar (a cloud = many elephants, the Sun as a ball, a hair under a lens).
- **Counters and meters**: numbers that climb (1 → 100), timers (0:15 → 1:30), simple gauges.
- **Experiments**: show the real experiment when a real, credited photo or frame of it exists; explain what happens inside with our illustrations (energy, particles, forces), then return to the real result.
- **Narrator**: a deep, warm storyteller voice in simple Modern Standard Arabic. It may address Kreti directly, but at most ONE line per reel (e.g. "لا تحاول يا كريتي"). Kreti never speaks; he reacts (points, jumps, thinks) beside the glass window, never inside a drawn scene.
- **Scenes**: a simple drawn scene (sky, hill, clouds, flowers...) may open the reel full screen; the camera then pulls back and the scene shrinks into the liquid-glass window, Kreti appears beside it, and the same window morphs into the explanatory animated illustrations. Kreti is never drawn inside a scene. No complex drawn environments (rooms, streets).
- **Always the approved style**: drifting blurred colour blobs with light grain, liquid glass with the glowing rotating rim, ONE glass shape that morphs between scenes, slow camera push with a slight 3D tilt, words appearing one by one, every move right to left. A story reel must look like the same family as every other reel.
- **Length**: 45 to 70 seconds is fine as long as it never feels slow; every 2 to 3 seconds something new happens on screen.

## Music (own library)
Music is mixed INTO the video from `assets/music/library.json`. Pick by mood: upbeat for facts and news (owner's favourite); lofi for calm explainers; ambient for space and nature; emotional for serious topics. Never the same track as the previous reel (check the last reel.json in `log/schedule.json`). Do NOT send Instagram `audioConfiguration` for engine 2 reels.

## Voice reels — every reel
Set `"voice": true` on every reel and give every scene a `"say"` line.
**Voice:** the owner's chosen deep narrator, `fbIG6gEosVIM95R5qOna` (set `voiceId` in every reel). Model `eleven_v4`.
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
