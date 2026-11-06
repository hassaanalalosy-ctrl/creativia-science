# Animated reels — engine 4 (APPROVED by the owner, Nov 2026)

Full 2D cartoon scenes: rigged characters, real sets, a moving camera, parallax depth, strong visual gags.
Engine: `engine/toon.js` (driver, timing, audio) + `engine/toon-lib.js` (characters, poses, props, sets).
Spec file: `posts/<id>/toon.json` (`"engine": 4`). **Approved reference: `posts/test-toon-2/toon.json`** (brain + space, 16 s).
Look at the reference first, then write the new spec in the same way.

## Which reels are animated (owner rule)
- About **15 animated reels + 5 story reels (engine 3) a month** (about 20 reels in total).
- Story reels (engine 3, `guide/REELS.md`) are only for topics that need **real photos or direct information**: news with real NASA/ESA images, real experiments, real animals or places, records, "look at this real photo".
- Everything else (how the body works, what happens if…, myths, physics, space facts, everyday science) is animated.
- Counting: before picking the format, count this month's reel entries in `log/schedule.json` by engine. Keep the month near 15 animated / 5 story reels; the topic decides when a story reel is needed.

## Story (the most important part)
- 15 to 40 seconds. 3 to 6 shots in **at least 2 different sets** (e.g. lab → space, home → inside the body, street → ocean).
- **Hook in the first 2 seconds**: a strong action on screen at once (not a character standing still) plus a 1-line spoken hook.
- **Every shot has one strong visual gag that shows the fact literally**, like the reference videos: the head opens and the brain comes out, a character shrinks into the body, grows huge, floats away, an object explodes into stars, a heart beats out of the chest, the camera flies through the window into the sky. The gag happens on the word that says the fact (use anchors).
- The characters act: walk in, react (surprise, fear, joy, thinking), point at things, hold things. Faces change with the story.
- One idea per reel, said simply. Facts verified in 2 sources (CONTENT_GUIDE.md). Health topics: calm, no medical advice.
- End: the last line ends with "وتابعنا على كريتيفيا ساينس" and the last shot ends on Kreti (a poster, billboard, satellite…).

## Kreti (owner rule)
Kreti is **never the main character** in animated reels. He is hidden in the world in every reel, at least once, and the last shot ends on him: a poster or framed photo on the wall, a sticker on a jar or chest, a badge on a coat, the patch on a space suit, a billboard, a satellite, a birdhouse. Colors are free and natural for each scene (blue sea, green grass); the brand purple is only an accent.

## Characters and arms (owner rules)
- The body faces the camera; arms come out of the **shoulders at both sides** and hang naturally. Sideways gestures (pointing, presenting) only when the story needs them.
- Rubber-hose arms may stretch (`stretch` in a pose) when a hand must reach high, but a hand must never cover the face.
- Looks: `scientist`, `professor` (moustache), `assistant` (bun), `woman`, `kid` (use `"s": 0.72`), `astronaut`, `diver`. Add `lookOverride` for colors.
- Poses: `stand`, `walk`, `run`, `point`, `tap` (finger on the head), `surprise`, `scared`, `think`, `shrug`, `facepalm`, `present`, `carry`, `cheer`, `jumpJoy`, `holdUp`, `sit`, `sleep`, `float`, `wave` (floating). Blend time between poses: `blend` (default 0.28 s).
- Expressions (`expr`, merged over time): `eyes` open/wide/closed/happy, `brows` neutral/up/worried/angry, `mouth` smile/talk/o/grin/flat/frown, `lookX`/`lookY` (-1…1), `sweat`, `blush`. Use `"mouth": "talk"` while that character's line is spoken. Blinking is automatic.
- Numeric tracks per actor key: `x`, `y` (feet, floor = 520), `s`, `rot`, `lid` (skull cap 0…1), `brain` (how far the brain rises), `bglow`. Also `jumps` [{t0,t1,h}], `tremble` [{t0,t1,amp}], `"float": true` (no shadow, gentle bob), `face` (1 or -1).

## Sets, props, camera
- Sets: `lab`, `home`, `street`, `nature`, `ocean`, `body` (inside a blood vessel), `space` (tall: camera y ≈ 1400 is inside the clouds, y ≈ 40 is deep space). Each set has far / air / mid / fg layers that move at different speeds (parallax) and small living details (clouds, clock, bubbles, fish, cars, dust).
- Props (`shot.props`: `{type, keys:[{t,x,y,s,rot,op}], front, t0, t1}`): brain, heart, drop, bulb, apple, star, bolt, phone, book, cup, cell, fish, sun, kreti.
- **New topic needs a new set or prop? Add it to `engine/toon-lib.js` in the same style**: outline `#2A2230` 2.2–2.6 px, soft gradients, a white highlight stroke, rounded shapes, layered far/air/mid/fg, at least one moving detail. Render stills (`FRAMES=…`) and look at them before pushing. Never copy a known cartoon, character or brand.
- Camera keys `{t, x, y, z}` with `ease` (inout, out, in, back, linear). Move the camera in every shot: slow push, punch-in on the gag (z 1.7–2.2), follow, whip pan, rise.
- Transitions between sets: fly through a window / into an object / up through the clouds, with `mblur` (vertical motion blur 6–12) and a short white `flash` at the cut. No plain hard cuts.
- `shake` [{t0,t1,amp}] on impacts, `bursts` (sparkles) on reveals, `pops` (big words or numbers like "20%", `dir: "ltr"` for numbers). Pops and props never cover the caption area (top of the screen, about y 60–150 on screen) or any other text.

## Voice, captions, sound
- Narrator for animated reels: **Hamida — voice id `JjTirzdD7T3GMLkwdd3a`** (owner's choice). Story reels keep `fbIG6gEosVIM95R5qOna`.
- `lines`: `[{"say": fully vowelled, "show": plain caption text, "gap": seconds before it}]`. Same number of words in say and show when possible (numbers like "2%" are fine in show). Proofread every show line (RUN.md "Language check").
- Anchors: any `t`, `t0`, `t1`, `start`, `end`, `at`, `duration` can be "L1", "L1:end" or "L1:word" with an offset ("L1:خمس-0.2"). Tie every gag to the word that says it.
- Captions are automatic: the spoken words appear one by one in a glass pill at the top.
- Music from `assets/music` (volume 0.12, it is ducked under the voice automatically), sound effects from `assets/sfx` on every gag (pop, whoosh, sparkle, riser, ding).
- Cost: about 30 to 60 ElevenLabs characters per line; voice clips are cached by text.

## Make, check, publish
1. Write `posts/<id>/toon.json` and `posts/<id>/stories.json`. Before pushing, run `FRAMES=1,3,5,… node engine/toon.js <id>` locally (timings are estimated without the voice) and open the stills: arms, faces, gags, nothing over text, Kreti visible.
2. Commit "Animated reel spec: <slug>" and push. The Action makes the voice and renders `reel.mp4` + `reel-cover.jpg` (set `coverAt` to the gag moment).
3. Poll like any reel (up to 45 minutes) for `reel-rendered.json` or `render-error.json`, then check 20 frames and the audio exactly as RUN.md 3R says.
4. Schedule it in Metricool exactly like a reel (RUN.md section 4).
