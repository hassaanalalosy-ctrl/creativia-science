# Creativia Science content guide

Account: Instagram **@creativia.sci** + its own Facebook Page. Name: كريتيفيا ساينس | Creativia Science.
Sister account: @creativia.mag (creative fields). The two accounts are fully separate: never reuse its topics, files, colours or rules here.
Bio: "علوم تخلّيك تكول: شلون؟! 🔬 — تجارب مجنونة، معلومات تصدمك، وأخبار علمية مثيرة — منشور جديد كل يوم — ✦ للإبداع تابع: @creativia.mag".
Owner: Hassaan Al-Alusi (Iraqi art director). Audience: curious people across the whole Arab world, students, families.

## What we post
Science and general knowledge that makes people say "how?!":
crazy experiments · shocking everyday facts · the human body · space · physics and chemistry in daily life · technology and inventions · animals and nature · Earth and weather · recent science news.
Owner's example topics: what happens to your body if you drink 50 colas? · cigarettes vs vapes · how much does a cloud weigh? · what are the lights you see when you close your eyes? · exciting science news (e.g. a flying car).
Rotate categories: never the same category three posts in a row (check `log/posted.md`).

## Accuracy (the most important rule of this account)
- Every fact, number and date is confirmed in **at least 2 independent reliable sources**. Never invent numbers, quotes, names, studies or dates.
- Reliable sources: peer-reviewed studies and journals, WHO, NASA, ESA, NOAA, national health agencies (CDC, NHS), universities and research institutes (their press releases on EurekAlert), and established science outlets: Nature News, Science, New Scientist, Scientific American, Live Science, Popular Science, Smithsonian, National Geographic, Quanta.
- Science TV, YouTube channels and social media: discovery only; confirm everything at the original source.
- Never post viral numbers that have no scientific source. If a popular "fact" is a myth, say so clearly (myths make great posts).
- Health topics (sugar, smoking, vaping, sleep, caffeine, etc.): calm and factual, no scare tactics, no exaggeration. Never give personal medical advice or dosing. When useful, end with "استشر طبيبك" style wording.
- "What happens if…" topics: describe what science actually knows, with the source; if the answer is an estimate, say it is an estimate.
- News: say what was actually achieved (prototype, test, study in mice…) and do not oversell it.

## Language (owner: very important)
Every on-screen text and caption is proofread for correct Standard Arabic spelling and grammar before it is written (full checklist in `guide/RUN.md`, "Language check"). House spelling: إذاً, never إذن.

## Choosing a topic
A topic qualifies only if ALL are true:
1. Recent science news (last 14 days), OR a timeless surprising fact / question / experiment that most Arab readers do not know (about 1 post in 2 may be timeless).
2. Verifiable in 2 sources (see above).
3. Visual: the idea can be shown with explanatory illustrations (see below) and, for real things, real credited images.
4. Not already posted: check `log/posted.md`.
5. Surprising or useful to a general Arab audience.
Avoid: politics, religion debates, war imagery, gore and graphic medical images, nudity, gossip, pseudoscience, conspiracy theories, and AI-generated images presented as real.

## Voice
- **Simple Modern Standard Arabic** (فصحى مبسطة) that every Arab reader understands. No dialect in slides, captions or reels.
- Short sentences. One idea per slide. No filler, no exaggeration, no clickbait lies.
- **All numbers are written with English digits** (2026, 500, 1 / 7). Units in Arabic (كغ، كم، درجة مئوية).
- Scientific names and terms: Arabic first; add the English term in the caption only when it helps.
- Names of scientists, institutes and journals: Arabic in slide text, original spelling in the caption sources.

## Format rotation (keeps the feed varied)
Post days only (reels follow REELS.md). Count the post-day entries already in `log/schedule.json` (ignore reels and `-extra` keys; call it N), then N mod 5 — this gives 8 carousels and 2 single posts a month:
- **0 · News carousel** — `cover` (Kreti) → `inner` slides (what happened, how it works, what is next) → one `text` slide with the key takeaway → `end`.
- **1 · "What happens if…" carousel** — `cover` (Kreti `think`) → steps in order (`inner` or `text` slides, with numbers and times) → `text` summary → `end`.
- **2 · Single post** — one `single` slide: one stunning real image (space, nature, microscope) with a short surprising fact.
- **3 · Myth vs fact carousel** — `cover` (Kreti `point`) → 2 to 3 `text` slides, each a common myth and the real answer → 1 `inner` image slide → `end`.
- **4 · Explainer carousel** — `coverImage` of the subject → `inner` slides that explain how it works (body, space, physics, inventions) → one `text` slide ("3 things to remember") → `end`.
If the topic truly cannot fit that format, use the next format in the list (never the same format as the previous post).
Use `"mode": "dark"` when N mod 4 is 3, or for space, night and dramatic topics.
Kreti cover poses rotate too: `point`, `jump`, `think` — not the same pose twice in a row. Kreti always wears his lab goggles (built into the engine).

## Carousel structure
5 to 8 slides, rendered at 1080 × 1350:
1. `cover` or `coverImage` — a hook headline (max ~45 characters, 2 lines), 2 chips (category + angle), a short handwritten note, Kreti pose `point`, `think` or `jump`.
2. Story slides: `inner` (framed image, good for landscape images) or `image` (full-bleed, portrait images only).
3. At least one `text` slide with 3 short numbered points.
4. Last slide always `end`.
Kreti appears on the cover, the end slide, and at most once inside (on an `inner` slide with `pose: think`). Every other `inner` slide uses `"kreti": false`.
Handwritten notes (`note`): 2 to 3 words max (انظر هنا! · مدهش! · احفظها! · هل تصدق؟).

## Slide spec (posts/<id>/spec.json)
```json
{
  "id": "YYYY-MM-DD-short-slug",
  "topic": "English one-line topic",
  "category": "فضاء",
  "mode": "light",
  "sources": ["https://...", "https://..."],
  "slides": [
    {"type": "cover", "badge": "جديد اليوم", "title": "...", "note": "هل تصدق؟", "pose": "point",
     "chips": [{"icon": "planet", "label": "فضاء"}, {"icon": "spark", "label": "اكتشاف"}]},
    {"type": "inner", "image": "https://direct-image-url.jpg", "title": "...", "body": "max ~120 characters",
     "credit": "الصورة: NASA/JPL", "chip": {"icon": "star", "label": "..."}, "kreti": false},
    {"type": "image", "image": "https://portrait-image.jpg", "title": "...", "credit": "...", "chip": {...}},
    {"type": "text", "tag": "الخلاصة", "tagIcon": "flask", "title": "...", "points": ["...", "...", "..."], "note": "احفظها!"},
    {"type": "coverImage", "image": "...", "fit": "contain", "title": "...", "credit": "...", "chips": [{...}, {...}], "kreti": false},
    {"type": "single", "image": "...", "title": "...", "credit": "...", "chip": {...}, "kreti": true, "note": "مدهش!"},
    {"type": "end"}
  ],
  "caption": "..."
}
```
Icons: flask, atom, microscope, planet, dna, bolt, rocket, magnet, brain, drop, trend, star, clock, spark.
Use `"art"` in place of `"image"` for an illustration (see Explanatory illustrations).
Optional: `"fit": "contain"` on `inner`/`single` to show a whole image without cropping; `"titleSize"` to shrink a long title (cover default 22, text default 25).

## Caption
1. Hook line + ✦
2. 2 to 3 short paragraphs: the fact, how we know it, why it matters.
3. A question inviting comments + 👇
4. Sources in original spelling: "المصادر: NASA · Nature" (journal or institute names, not long URLs).
5. 5 to 9 hashtags: always #كريتيفيا_ساينس first, plus Arabic tags (#علوم #معلومات #فضاء ...) and 2 to 4 English ones (#science #space ...).

## Explanatory illustrations (owner rule: always)
Science must be explained and simplified with **vector illustrations** in the Creativia Science dreamy style. Use them in every post and every reel, wherever a picture explains the idea better than words.
- Real photos stay for real, specific things (a news story, a real discovery, a NASA image, an animal species). Everything else is illustrated.
- Style (built into `engine/art.js`): soft gradient body, inner light and shade, glossy highlight, gentle glow and a soft ground shadow. Natural colours are welcome: a white cloud, a blue elephant, a red heart. Do not force the brand purple onto illustrations.
- Put `"art"` instead of `"image"` on `inner`, `single`, `image`, `coverImage` slides, on reel `point` and `image` scenes, and on the story `fact`. It shows the whole drawing (`fit: contain` by default).
- Library items: cloud, drop, elephant, hair, bolt, sun, earth, moon, planet, rocket, atom, heart, brain, lungs, dna, flask, magnet, can, thermometer, bubble, mountain, tree, fish, cigarette, vape, eye.
- One item: `"art": "cloud"`.
- **The drawing must SHOW the fact, literally and clearly** (owner rule). Ask: could someone understand the idea from the picture alone?
  - "A cloud weighs as much as 100 elephants" → a cloud = a herd of many elephants (not one). Use `count` (6 to 12 copies; it does not need to be the real number, it must read as "many").
  - "A cloud droplet is smaller than a hair" → a magnifier lens showing a hair strand with the tiny droplet next to it, at a believable relative size. (A real credited microscope photo is also fine.)
  - Before / after, cause → effect, bigger / smaller: use `=`, `+`, `>`, `<`, `→` between items.
- **Layout: always use `row` or `stack`** so everything is aligned automatically: all items and signs sit on one shared centre line, evenly spaced, nothing touching. The row reads right to left: the first entry is on the right.
```json
"art": {"row": [{"name": "cloud"}, "=", {"name": "elephant", "count": 8}]}
"art": {"row": [{"lens": {"stack": [{"name": "hair", "h": 76}, {"name": "drop", "h": 52}], "gap": 26}, "d": 250}]}
"art": {"row": [{"name": "can"}, "→", {"name": "heart"}]}
"art": {"stack": [{"name": "sun", "h": 90}, {"name": "earth", "h": 110}]}
```
  Entries: a library item `{"name": ...}` (optional `h` = height), a herd `{"name": ..., "count": n, "cols": c}`, a magnifier `{"lens": {...a row or stack...}, "d": diameter, "handle": true}`, or a sign `"="`, `"+"`, `">"`, `"<"`, `"→"`. Use 1 to 3 entries plus signs.
- **Size balance (owner rule):** keep the real order of sizes (next to a herd, the single item is drawn as tall as the herd) (the small thing is clearly smaller) but soften extreme gaps so everything stays readable and the composition feels balanced. The engine never draws an item shorter than about 45% of the tallest one in the same row or stack; for very different sizes use a magnifier lens instead of a dot-sized item. Example: in the hair lens the droplet is about half the hair's thickness, not a speck.
- Signs read in Arabic order (right to left): in `[A, ">", B]` A is on the right and bigger, and the sign opens toward A.
- In reels the drawing moves: items pop in one by one from right to left, a herd appears animal by animal, clouds float, animals bob. This happens automatically for `art` on `point` and `image` scenes.
- Free placement (`"items"` with x/y offsets, `"arrows"`) still exists for special cases, but prefer `row` / `stack`.
- Something not in the library: draw it as a custom item with the same treatment, using simple closed shapes:
```json
{"parts": ["<path d='M...Z'/>", "<circle cx='200' cy='140' r='40'/>"], "palette": "green", "box": [x0, y0, x1, y1],
 "details": ["<circle cx='190' cy='130' r='6' fill='#14204A'/>"], "gloss": "M... (a short highlight stroke)"}
```
  Palettes: white, blue, sky, yellow, orange, red, pink, green, purple, grey, brown, sand. `box` is the shape's bounding box. Keep shapes simple, rounded and friendly.
- No text inside illustrations (labels go in the slide text). Leave clear space between items: nothing touches or overlaps, and nothing sits under a chip, badge or number.
- Credit illustrations as "رسم توضيحي: كريتيفيا ساينس". Never present an illustration as a real photo.
- Check every illustrated slide and reel frame like any image. If an illustration looks wrong, simplify it rather than adding detail.

## Stories (owner rule)
Both daily stories use the same guideline style as everything else (built into `engine/story.js`): the grid background, glass cards, the science icon tiles and a glass category chip. In `stories.json` the fact's `icon` must be one of the identity icon names (flask, atom, microscope, planet, dna, bolt, rocket, magnet, brain, drop), not an emoji; `icon2` may pick the second decorative tile. A fact can use `art` (an illustration) instead of an image.

- Images must show the real thing, with a known source. Credit the source on every slide that shows an image.
- Free science image sources: NASA (public domain, credit "NASA" or the mission), ESA (check the licence, usually CC BY-SA 3.0 IGO, credit "ESA/…"), NOAA, Wikimedia Commons (check each file's licence and credit the author as the file page asks), university and journal press images (credit as given).
- Copy the direct image file URL (ideally 1000 px wide or more). On Wikimedia use the original file URL from upload.wikimedia.org.
- Pinterest and social media: discovery only. Never use an image whose original source you cannot identify.
- No gore, graphic medical images or injured people. For body and health topics use our illustrations (heart, lungs, brain...) instead of photos.
- Never present an AI-generated or illustrative image as a real photo. A labelled illustration ("تصوّر فني") from NASA/ESA is fine.
- Some sites refuse automated fetching. If a page will not fetch, use another reliable outlet covering the same story.
