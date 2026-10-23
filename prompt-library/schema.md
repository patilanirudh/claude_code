# Prompt library schema

Every prompt used to teach a feature in this workshop gets logged here as it's
delivered, one file per prompt. This is what lets us show a real before/after
number per capability instead of an anecdote.

```yaml
---
id: f03-token-hook-001        # f<feature-id>-<slug>-<seq>
feature: 3                     # matches ui/data/roadmap.json feature id
capability: token-economics
variant: baseline               # baseline | treatment
model: sonnet-5-5
---
```

Followed by the literal prompt text, then a `## Result` section filled in
live during the session:

```
## Result
- tokens_in: 1240
- tokens_out: 410
- wall_clock_s: 38
- correction_turns: 1
- passed: true
```

Folders are created per feature as we build it (`prompt-library/feature-01/`,
`prompt-library/feature-02/`, ...) -- nothing is pre-populated here, since the
point is to log what actually happened in session, not a script.
