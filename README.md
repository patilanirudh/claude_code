# RiskPulse — Claude Code Workshop

A real-time transaction fraud & risk monitoring platform, built live,
one feature at a time, using Claude Code. This repo is also the workshop
itself: the console it boots shows what's been built so far and whether
your machine is ready for what's coming next.

## Run it

Only requirement right now: **Python 3**. Nothing else needs to be
installed yet — later features will ask for Node/npm and Docker, and the
console will tell you exactly when.

```bash
./run.sh
```

This starts a local server and opens the workshop console at
`http://localhost:8787`. On a remote VM, forward that port or browse to
`http://<vm-ip>:8787` directly — the script prints both.

## What you'll see

- **Environment Readiness** — a live check of what's installed on this
  machine (Python, Node, npm, Docker, Git, internet), run fresh every time
  you start `./run.sh`, so missing tools show up before they block you.
- **Feature Roadmap** — every capability we're covering, grouped by theme,
  each tagged `live` (built together in session) or `take-home` (same
  pattern, finished after). Statuses update as we go — `git pull` before
  each block to see the latest.

## During the workshop

Before each feature block:

```bash
git pull
./run.sh
```

Everything we build — the actual RiskPulse app code, the prompts used to
build it, and the metrics on how well each Claude Code capability performed
— lands in this same repo as we go.
