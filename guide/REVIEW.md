# Results review — every 15 days (scheduled task)

Repository: `hassaanalalosy-ctrl/creativia-science` (@creativia.sci only; never touch @creativia.mag, Metricool brand 7656023).
Metricool brand/blog id: **7909822**, timezone Asia/Baghdad.

## Goal
Find what makes the audience watch, save, share and comment, and turn it into concrete rules the daily task follows.

## Steps
1. Attach the repo with push access (add_repo), `git clone --depth 1` it, read `log/schedule.json`, `log/posted.md`, the last `log/insights.md` and the reel specs (`posts/*/reel.json`) and post specs (`posts/*/spec.json`) of the last 30 days.
2. Load the Metricool tools (ToolSearch "metricool"). Call getAnalyticsAvailableMetrics for Instagram and Facebook, then getAnalyticsDataByMetrics for the last 15 days and the 15 days before that (for comparison): per post and per reel — reach, views/plays, average watch time or retention if available, likes, comments, saves, shares, follows gained. Also the account's follower growth.
3. Match every published item to its spec (by date and id) to know its topic, science category, format (reel / carousel type / single), mode (light/dark), hook line (the first beat `show` of a reel, the cover title of a post), length, music mood, posting day.
4. Analyse:
   - **Hooks**: which first lines got the most views and the best watch time? What do the winners have in common (question / "what if" / number / myth / shock)? Quote the top 3 and the weakest 3.
   - **Science categories**: which categories (space, human body, physics in daily life, animals, inventions, health, news...) bring the most comments, saves and shares? Which bring the least?
   - **Comments**: if comment texts are available, what do people ask or argue about? Which topics start conversations? List requested topics.
   - **Formats**: reels vs carousels vs single posts; light vs dark; reel length vs watch time.
   - **Timing**: anything clear about weekdays.
   Only call something a pattern if it appears in at least 2 items. Say when the data is too small to conclude.
5. Write `log/insights.md` (replace the previous content, keep a short "previous period" summary line at the bottom):
   - `## Do more` and `## Do less` — short, concrete lines the daily task can follow (e.g. "hooks that start with a number", "more space topics", "fewer myth carousels").
   - `## Best hooks` and `## Topics people asked for`.
   - `## Suggestions for the owner` — anything that would change the plan, the posting time, the voice, the identity or the volume. These are NEVER applied automatically.
   Commit "Insights <date>" and push.
6. Reply in Arabic (this is what the owner reads): 5 to 8 short lines — the period's numbers in one line (reach, views, followers gained, top post), the 2 or 3 strongest findings, what the daily task will now do more and less, and any suggestion that needs his decision.

## Limits
Do not change the schedule, posting time, number of reels/posts, the voice, the music library or the identity. Do not create, edit or delete Metricool posts.
