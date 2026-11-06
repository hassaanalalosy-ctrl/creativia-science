# Run procedure — Creativia Science (scheduled task, once a day)

This repository is for **@creativia.sci only**. Never touch the `creativia-content` repository or the @creativia.mag Metricool brand from this task.

Goal: keep the next 7 days filled, **one feed post every day** at **21:00 Asia/Baghdad**, on Instagram AND Facebook.
Monthly plan (owner, Nov 2026): **about 20 reels + 10 posts (carousels and single posts)**, plus **2 stories every day**, plus an **extra post on the same day for a truly huge trend**.
Each run creates **at most one slot post (with its two stories) plus at most one extra post** (see Extra posts). Do not edit or delete anything else in Metricool.

## 1. Setup
- Attach `hassaanalalosy-ctrl/creativia-science` with push access (add_repo) and `git clone --depth 1` it to `/home/claude/creativia-science`.
- Read `guide/CONTENT_GUIDE.md`, `guide/REELS.md`, `log/posted.md` and `log/schedule.json`.
- Load the Metricool tools with ToolSearch (query "metricool"). Brand/blog id: **7909822** (the "Creativia Science" brand: Instagram @creativia.sci + its Facebook Page; never use 7656023, that is @creativia.mag), timezone Asia/Baghdad.

## 2. Pick the slot (or stop)
- Slot days: every day.
- Starting from tomorrow (Baghdad date), walk forward up to 7 days and take the first date that is not already a key in `log/schedule.json`.
- If there is no such slot, stop: reply in one Arabic line "الجدول مكتمل حتى <last filled date>، لا جديد اليوم" and end the run without changes.
- **Post days**: day-of-month 3, 6, 9, 12, 15, 18, 21, 24, 27, 30 (10 per month). **Every other day is a reel day** (about 20 per month). On a reel day follow section 3R instead of 3, and in section 4 use the reel settings.
- On a post day, the format comes from the content guide's rotation (8 carousels + 2 single posts per month).

## 3. Make the post
- Research and choose a topic exactly as the content guide says (web search + page fetches; verify facts in 2 sources).
- Write `posts/<id>/spec.json` (id = `<slot date>-<short-slug>`), following the guide's structure, voice and credit rules. Default 6 to 7 slides.
- Commit "Post spec: <slug>" and push to main. The GitHub Action "Render slides" renders it.
- Poll every 15 seconds (`git fetch origin main`) for up to 30 minutes (the render job can wait in GitHub's queue) until `posts/<id>/rendered.json` or `posts/<id>/render-error.json` exists on origin/main, then `git reset --hard origin/main`.
- If render-error.json appears (usually a bad image URL): replace the failing image URL in the spec with another credited image of the same work, delete render-error.json, push again and wait again. Give up after 2 attempts: delete the post folder, push, and reply with the error.
- Every post explains its idea with vector illustrations (`art`, see the content guide); real photos only for real, specific things.
- Open every rendered slide image with the Read tool and check it: text not cut off, no overlapping elements, images loaded, numbers in English digits, credits present. If something is wrong, fix the spec and re-render (delete rendered.json, push).

## 3R. Make a reel (reel days only)
- Choose a topic as `guide/REELS.md` says, and write `posts/<id>/reel.json` as a **story reel, `"engine": 3`** (see REELS.md, reference `posts/test-tunnel-2/reel.json`), music from the library, `"voice": true`, `"voiceId": "fbIG6gEosVIM95R5qOna"`, and every beat with a fully vowelled `say` and a plain `show`.
- Also write `posts/<id>/stories.json` (section 3S) in the same commit.
- Commit "Reel spec: <slug>" and push. The GitHub Action renders `reel.mp4` (with music, sound effects and voice) and `reel-cover.jpg`, then the stories (about 4 to 8 minutes).
- Poll every 30 seconds for up to 45 minutes (GitHub sometimes queues the render job for 15 to 20 minutes before it starts; a story reel then takes about 8 to 10 minutes) until `posts/<id>/reel-rendered.json` or `posts/<id>/render-error.json` exists on origin/main, then `git reset --hard origin/main`.
- Check it: extract 20 frames spread across the video with ffmpeg (`ffmpeg -ss <sec> -i reel.mp4 -frames:v 1 -vf scale=270:480 f.png`) and open them with the Read tool. Text must not overlap, be cut off, or sit in the bottom fifth. Check the audio exists (`ffprobe` shows an audio stream). Fix the spec and re-render if needed (delete reel-rendered.json, push).

## 3S. Stories (every slot day)
Write `posts/<id>/stories.json` together with the post spec:
```json
{"mode": "dark",
 "alert": {"title": "the post's hook in under 60 characters"},
 "fact": {"tag": "معلومة سريعة", "icon": "؟", "title": "a surprising science fact, under 40 characters", "lines": 2, "body": "1 to 2 short sentences explaining it", "image": "optional credited image URL", "credit": "optional"}}
```
- The fact is a DIFFERENT short science fact (not the day's post), verified in 2 sources, not already in `log/posted.md` (log it there too). `lines` = number of lines the title takes (1 or 2).
- `mode`: same as the post.
- The Action renders `story-alert.png` (with the post cover) and `story-fact.png`. Open both with Read and check them.

## Overlap rule (owner: very important)
Nothing may sit on top of anything else in any slide, reel frame or story: no text over text, no Kreti over text, cards or images, no element over the handle or the badge, nothing cut off. Check every image/frame you open for this. If anything overlaps, shorten the text or fix the spec and re-render BEFORE scheduling. Story alert titles must be under 60 characters; fact titles under 40.

## 4. Put it in Metricool
Call createScheduledPost with blogId 7909822, date `<slot>T21:00:00+03:00`, and info:
- `media`: raw URLs pinned to the commit that holds the rendered files (`sha=$(git log -1 --format=%H -- posts/<id>)`): `https://raw.githubusercontent.com/hassaanalalosy-ctrl/creativia-science/<sha>/posts/<id>/slides/NN.png` in order. Never use `main` in these URLs (it is cached and can serve an old version).
- `providers`: `[{"network":"instagram"},{"network":"facebook"}]` — the same post goes to both.
- `instagramData`: `{"type":"POST"}`; `facebookData`: `{"type":"POST"}`
- `text`: the caption; `publicationDate`: `{"dateTime":"<slot>T21:00:00","timezone":"Asia/Baghdad"}`
- **Reels:** `media` = the pinned URL of `posts/<id>/reel.mp4`, `videoThumbnailUrl` = the pinned URL of `posts/<id>/reel-cover.jpg`, `instagramData` = `{"type":"REEL","showReelOnFeed":true}` (music is already inside the video; never send audioConfiguration), `facebookData` = `{"type":"REEL","title":"<reel title>"}`.
- **Stories (two more createScheduledPost calls, same slot date):**
  - Quick fact at `<slot>T13:00:00+03:00`: `media` = pinned URL of `story-fact.png`, `providers` = instagram + facebook, `instagramData` = `{"type":"STORY"}`, `facebookData` = `{"type":"STORY"}`, no `text`, `"draft": false, "autoPublish": true`.
  - New-post alert at `<slot>T21:15:00+03:00`: same, with `story-alert.png`.
  - If the slot date is today and 13:00 has passed, skip the fact story for that day.
- **Publish directly (owner approved, no review): `"draft": false, "autoPublish": true`.** The post goes live on its own at the scheduled time.

### Replacing images of an existing post
GitHub's raw links on `main` are cached for a few minutes, so after a re-render never reuse the `main` URL. Use the commit that holds the new image: `git log -1 --format=%H -- posts/<id>/slides/NN.png`, then `https://raw.githubusercontent.com/hassaanalalosy-ctrl/creativia-science/<that sha>/posts/<id>/slides/NN.png`. Download it once and compare it with the local file before sending it to Metricool.

## 5. Record and clean up
- Add `"<slot>": "<id>"` to `log/schedule.json` and a line to `log/posted.md`: `- <slot> · <category> · <Arabic one-line topic> · <id>`.
- Delete `posts/*/slides` folders of posts whose slot date is more than 30 days ago (Metricool keeps its own copy).
- Commit "Schedule <id>" and push.

## 6. Reply (this is what the owner sees in the notification)
Two or three lines in Arabic: the slot date, the topic, number of slides (or "ريل" and its length, music and whether it has voice), that the two stories are scheduled, and the Metricool planner link of the main post.

## Extra posts (huge trends, same day)
Every run, before the slot work, check the last 24 hours of science and tech news. If something is a truly HUGE trend that everyone is talking about (owner's example: a flying car shown by a big company; also a landmark discovery, a major space mission moment, a Nobel science prize) and it is confirmed by reliable outlets, make ONE extra post about it **for today**: a `single` post or a short carousel (fast to make), scheduled today at 15:00 Asia/Baghdad, or at the next full hour if 15:00 has passed (never later than 19:00, to keep distance from the 21:00 post). On Instagram and Facebook like every post, no stories. Log it with key `<date>-extra`. Say clearly what is confirmed and what is only a claim or a prototype. At most 3 extra posts in any 7 days; skip if nothing is clearly huge (most days nothing is).

## Results review (every 15 days)
A separate scheduled task reviews the results every 15 days (`guide/REVIEW.md`) and writes `log/insights.md`. Read it before choosing topics, hooks and formats, and follow its "Do more" / "Do less" lines (they never override the plan, the voice or the identity).
