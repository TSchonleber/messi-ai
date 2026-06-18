# Leo Autonomous Bounty Generator — Design

**Date:** 2026-06-17
**Repo:** TSchonleber/messi-ai
**Status:** Approved design, pre-implementation

## Goal

Have **Leo** (the Lionel Messi companion persona already in this repo) autonomously
generate pump.fun GO bounties in his own voice, drop them on a schedule into a live
**Bounties** feed on a polished version of the site, and make each one *post-ready* so
the operator does the final fund + submit on pump.fun manually.

## Key decisions (locked)

1. **Leo generates, in-character.** Persona overrides the source spec's "feel like a
   different real person each time." Output format, anti-slop banned-word list, and
   safety constraints from the source spec carry over.
2. **Full variety, Leo's voice.** Rotate across dev, design, content, social/marketing,
   research, memes, IRL-but-safe, community ops, translation, data tasks — every brief
   written in Leo's quiet/warm/Argentine register.
3. **Scheduled drops + live feed.** Generation runs on a cron, not on user input.
4. **No safe auto-post API exists.** pump.fun GO has no official posting API; the only
   programmatic routes are third-party and unverified (Bounty Agent endpoint
   "deploying", copy-paste skill w/ embedded key = honeypot shape; BountyPad). We do
   **not** wire a wallet to vaporware. Pipeline is built *except* the final fund+submit.
5. **Architecture B — public showcase, no DB.** GitHub Actions cron runs the Python
   generator, commits `public/bounties.json`, the static site fetches it. Zero infra,
   free, every drop git-auditable, reuses existing Python/OpenAI code.
6. **Site scope:** polish the existing landing (typography, spacing, motion, imagery)
   and add a strong Bounties section. Leo companion stays primary; bounties are a new beat.

## Architecture

```
GitHub Actions (cron, e.g. every 8h)
        │  runs
        ▼
agent/bounty.py  ──reads──> agent/PERSONA.md  (Leo voice)
        │                   agent/BOUNTY_SPEC.md (rules, format, safety)
        │                   public/bounties.json (last N drops — anti-repeat readback)
        │  calls OpenAI Responses API (structured JSON output)
        ▼
  new bounty objects
        │  publish gate: banned-word/anti-slop filter + 2nd-pass LLM safety check
        ▼
  prepend to public/bounties.json  ──commit & push──> repo
        │
        ▼
Static Vite site fetches /bounties.json ──> Bounties feed (cards)
        │
        ▼
Each card: Copy button + postToBounty() adapter (deep-link into pump.fun GO create form)
        │
        ▼
  OPERATOR funds + submits on pump.fun  (manual gate — never automated)
```

## Components

### 1. `agent/BOUNTY_SPEC.md` (new)
The pasted source spec, edited: remove the "different real person" line, add "write as
Leo (see PERSONA.md voice)", keep output requirements + the full banned-words list +
all safety constraints. Defines the JSON shape the model must emit.

### 2. `agent/bounty.py` (new)
Reuses the OpenAI/Responses pattern from `agent_1.py`. Responsibilities:
- Load `PERSONA.md` + `BOUNTY_SPEC.md` as instructions.
- **Anti-repetition readback:** read last N (e.g. 25) entries from `public/bounties.json`,
  inject their titles / concepts / reward amounts / categories as an explicit
  "do NOT repeat any of these" block. (Cron runs are amnesiac; storage feeds the prompt.)
- Request **structured JSON** output (not freeform): a small batch per run (default 3).
- **Publish gate** before write:
  - banned-word / anti-slop scan (reject "unleash", "leverage", "supercharge", etc.);
  - second-pass LLM safety check (no real private individuals, no unsafe/illegal stunts,
    no scams/impersonation/financial-advice). Fail → drop discarded, logged, not written.
- Prepend survivors to `public/bounties.json`, cap file length (e.g. keep latest 100).

### 3. Bounty JSON schema
```json
{
  "id": "uuid-or-timestamp-slug",
  "createdAt": "2026-06-17T01:00:00Z",
  "title": "string (5-9 words)",
  "reward": "$250",
  "rewardUsd": 250,
  "deadline": "72 hours",
  "task": "2-4 sentence plain brief in Leo's voice",
  "deliverables": ["verifiable item", "verifiable item", "verifiable item"],
  "category": "dev|design|content|social|research|meme|irl|community|translation|data",
  "status": "fresh"
}
```

### 4. `.github/workflows/bounty-drop.yml` (new)
Scheduled `cron` + manual `workflow_dispatch`. Steps: checkout, setup Python, install
deps, run `agent/bounty.py`, commit `public/bounties.json` if changed, push. Uses
`OPENAI_API_KEY` from repo secrets. Commit message names the drop count.

### 5. Bounties feed UI + navigation (in `src/`)
**Navigation (decided):** teaser-on-landing + dedicated full page.
- Add `react-router-dom` (new dep). Two routes: `/` (landing) and `/bounties` (full feed).
- **Nav:** add a "Bounties" link (routes to `/bounties`) + a hero/CTA button.
- **Landing teaser:** a `BountiesTeaser` section showing the latest ~3 drops with a
  "See all bounties →" button to `/bounties`. Sits between Features and the closing CTA.
  Shows visitors that Leo is actively dropping bounties without bloating the landing.
- **`/bounties` page:** full feed, newest-first, all drops from the JSON (with simple
  client-side "load more" or pagination if the list is long).
- **Shared `BountyCard` component** used by both teaser and full page.

`BountyCard`:
- Fetches `/bounties.json` (page/teaser fetch on load); renders: title, reward badge,
  deadline countdown, task, deliverables list, category tag, "fresh drop" styling.
- **Copy** (formats post-ready text to clipboard) + **Open in pump.fun GO** via a
  `postToBounty(bounty)` adapter — today builds the prefilled create-form deep-link;
  later this single function can call a real API (the seam).
- Empty / loading / error states on both teaser and full page.

### 6. Site polish (in `src/App.tsx` / `App.css`)
Keep structure; sharpen type scale, spacing rhythm, motion (subtle reveal/hover), and
swap in real Messi/World Cup imagery. No rewrite of the chat demo — light touch only.

## Safety model (two distinct gates)

- **Publish gate (automated):** runs in `bounty.py` before any text reaches the public
  JSON. Anti-slop + LLM safety pass. This is the gate the advisor flagged — generated
  text auto-publishes, so it must be filtered before it's public, separate from posting.
- **Fund + submit gate (human):** the operator funds escrow and submits on pump.fun.
  Never automated. No wallet keys in the repo, CI, or the browser.

## Out of scope (v1 / YAGNI)

- Real auto-posting to pump.fun (no trustworthy API). `postToBounty()` seam only.
- Database, admin panel, status tracking beyond `status: "fresh"` (that's Approach A).
- Auto-posting drops to X/Twitter.
- Wiring Bounty Agent / BountyPad.

## Testing

- `bounty.py`: unit-test the readback dedupe (given prior drops, new prompt excludes
  them), the JSON parse/validate, and the publish gate (banned word → rejected; unsafe
  brief → rejected). Mock OpenAI.
- Feed UI: renders cards from a fixture `bounties.json`; copy + deep-link build correct
  strings; loading/empty/error states.
- Workflow: `workflow_dispatch` dry run produces a valid committed JSON.
- Real-browser smoke test of the feed before calling it done (per project convention —
  jsdom won't catch CSS issues).
