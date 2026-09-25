# "Hero Academy" theme pack — Noise Game

Theme content for the Villain Pressure noise game (`docs/architecture/noise-game-design.md`, §9). This is content data, not code or copied media — it fills in the swappable `NoiseGameTheme` interface (`src/features/noise-defense/theme/types.ts`, extended per §9 of the architecture doc) with names, roles, and original writing. For **Owen's own classroom use only, not for redistribution.** Nothing here is implemented; this is the content spec a future implementation pass would load into the theme object.

---

## 1. Cast

| Role | Character | Tower / function | Voice |
|---|---|---|---|
| Guardian — **N** | Deku | Tower N | Earnest, effortful, "I'll figure this out" analytical encouragement |
| Guardian — **O** | Uraraka | Tower O | Warm, buoyant, keeps the mood light |
| Guardian — **I** | Todoroki | Tower I | Calm, measured, speaks in balance/steadiness metaphors |
| Guardian — **S** | Iida | Tower S | Formal, disciplined, the "protocol" voice — announces mode changes |
| Guardian — **E** | Bakugo | Tower E | Intense, gruff, high-drive — but never aimed at anyone, always at "the pressure" |
| Villain | Shigaraki | The threat the towers hold back | Dramatic, creeping, decay-themed menace — played for fun, never genuinely frightening |
| Narrator | All Might | Big triumphant beats — recovery, mission complete | Booming, larger-than-life encouragement |
| Narrator | Aizawa | Quiet/administrative beats — protocol changes, idle, calibrating | Dry, deadpan, minimal words |

Together the five Guardians' initials spell **N‑O‑I‑S‑E**, front to back, matching the fixed tower sequence in the engine (§3.5 of the architecture doc).

## 2. Visual-originality constraint (repeated here deliberately)

Every mockup and any eventual implementation must represent this cast with **original geometric/abstract shapes only** — a colored badge, an icon, a silhouette built from simple original shapes, typography. **No official artwork, no character likenesses, no logos, anywhere.** This is Owen's personal classroom tool, not something distributed, but the visual-originality bar is the same regardless.

## 3. Line bank (45 lines, grouped by moment)

Every line is written fresh for this project. None is a quote from the source material. No line ever calls out, embarrasses, or references a specific student — every line is about "the room," "the pressure," "the line holding," never about who caused it.

### Protocol change

1. **Iida (→ Stealth):** "Protocol shift: Stealth. Full silence, effective immediately."
2. **Iida (→ Patrol):** "Protocol shift: Patrol. Whisper volume only — hold the line."
3. **Iida (→ Combat):** "Protocol shift: Combat. Discussion volume authorized. Stay sharp."
4. **Aizawa (any change):** "New protocol logged. Adjust accordingly."
5. **Todoroki (→ Stealth):** "Quiet mode. Let's keep it steady."
6. **Uraraka (→ Combat):** "Discussion time — let's make it count, not just make noise."

### Warning (pressure approaching a strike)

7. **Shigaraki:** "Mmm... it's building nicely..."
8. **Deku:** "Pressure's climbing — we can still bring it back down."
9. **Bakugo:** "Heads up! It's creeping toward the red!"
10. **Todoroki:** "We're drifting off balance. A little quieter brings us back."

### Strike

11. **Shigaraki:** "There it is. One line, weaker."
12. **Iida:** "Impact registered. Formation holds — barely."
13. **Bakugo:** "Tch — took a hit. Shake it off!"
14. **Deku:** "That one landed... but we're still standing."

### Tower fall (decay)

15. **Shigaraki:** "Crumble, crumble... one down."
16. **Uraraka:** "Oh no — we lost one. Let's not lose another."
17. **Todoroki:** "One post is down. The rest of us hold steady."
18. **All Might:** "A setback, not the end! The next line stands ready!"
19. **Iida:** "Tower offline. Passing the front line forward."

### All towers down (Villain Alert)

20. **Shigaraki:** "All of them... down. Was that so hard?"
21. **All Might:** "Every line has fallen — but a hero academy doesn't stay down!"
22. **Deku:** "Okay. Deep breath. We rebuild from here."
23. **Iida:** "All towers offline. Awaiting repair before we can hold again."

### Recovery begins

24. **Todoroki:** "It's quiet now. Good. Let it heal."
25. **Uraraka:** "Ooh, I can feel it lightening up already!"
26. **Deku:** "This is working — keep it right here."
27. **Aizawa:** "Quiet sustained. Recovery started."

### Recovery complete

28. **All Might:** "Fully restored! That's what real teamwork sounds like — quiet, focused teamwork!"
29. **Bakugo:** "Back to full. Don't get comfortable, though."
30. **Uraraka:** "Yes! Good as new!"
31. **Iida:** "Structural integrity: one hundred percent. Well executed."

### Mission complete

32. **All Might:** "Mission complete! Every Guardian is proud of this room today!"
33. **Deku:** "We did it — not by being perfect, just by looking out for each other."
34. **Iida:** "Mission log closed. A disciplined, well-run session."
35. **Uraraka:** "That was a great one! See you next mission!"
36. **Bakugo:** "Not bad. Seriously — not bad."

### Idle / calibrating

37. **Aizawa:** "Calibrating. Stay quiet a moment longer."
38. **Aizawa:** "Baseline set. Standing by."
39. **Todoroki:** "Reading the room before we begin."
40. **Deku:** "Give us just a few seconds — figuring out what quiet sounds like in here today."
41. **Iida:** "Systems idle. Awaiting mission start."

### Comms Jammer (engage / disengage)

42. **Iida (engage):** "Comms Jammer active. Listening paused — as ordered."
43. **Aizawa (engage):** "Analysis paused. Nothing lost. Carry on."
44. **Iida (disengage):** "Comms restored. Resuming exactly where we left off."
45. **Todoroki (disengage):** "We're back. Same pressure, same line, same plan."

## 4. Tone rules (recap for anyone extending this list later)

- Villain (Shigaraki) lines may be dramatic, creepy-fun, or gloating — never genuinely scary, never referencing a real person or student.
- Every Guardian/narrator line stays encouraging or neutral, even after a strike or a tower fall — the target of every line is "the pressure" or "the room," never a student, a group of students, or "whoever" made the noise.
- No line uses the source material's own signature catchphrases verbatim (this list deliberately avoids them) — everything here is written fresh, per the task's originality requirement.
