"""
Leo's autonomous bounty generator for pump.fun GO.

Generates a small batch of fresh, on-brand bounties in Leo's voice, runs each through a
publish gate (anti-slop + an LLM safety pass), and prepends the survivors to
public/bounties.json. Run by .github/workflows/bounty-drop.yml on a schedule.

Env:
    OPENAI_API_KEY   required
    LEO_MODEL        generation model (default: gpt-5.2)
    BATCH            how many to ask for per run (default: 3)
    FEED_PATH        path to the feed JSON (default: ../public/bounties.json)

Local run:
    pip install -r agent/requirements.txt
    OPENAI_API_KEY=sk-... python agent/bounty.py
"""

import json
import os
import re
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

from openai import OpenAI

HERE = Path(__file__).parent
ROOT = HERE.parent
MODEL = os.getenv("LEO_MODEL", "gpt-5.2")
BATCH = int(os.getenv("BATCH", "3"))
FEED = Path(os.getenv("FEED_PATH", str(ROOT / "public" / "bounties.json")))

MAX_FEED = 100          # keep the feed file from growing forever
READBACK = 25           # how many recent drops to show the model (anti-repeat)
SOL_MIN, SOL_MAX = 0.5, 5.0

CATEGORIES = [
    "dev", "design", "content", "social", "research",
    "meme", "irl", "community", "translation", "data",
]

BANNED = [
    "unleash", "elevate", "in today's fast-paced world", "game-changer", "game changer",
    "dive into", "harness the power", "seamless", "leverage", "supercharge",
    "take it to the next level", "the world is at your fingertips", "revolutionize", "unlock",
]

BOUNTY_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["bounties"],
    "properties": {
        "bounties": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["title", "rewardSol", "deadline", "task", "deliverables", "category"],
                "properties": {
                    "title": {"type": "string"},
                    "rewardSol": {"type": "number"},
                    "deadline": {"type": "string"},
                    "task": {"type": "string"},
                    "deliverables": {"type": "array", "items": {"type": "string"}},
                    "category": {"type": "string", "enum": CATEGORIES},
                },
            },
        }
    },
}

_client: OpenAI | None = None


def client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI()
    return _client


# ── helpers ──────────────────────────────────────────────────────────────────

def instructions() -> str:
    persona = (HERE / "PERSONA.md").read_text()
    spec = (HERE / "BOUNTY_SPEC.md").read_text()
    return f"{persona}\n\n{spec}"


def load_feed() -> list:
    if FEED.exists():
        try:
            data = json.loads(FEED.read_text())
            return data if isinstance(data, list) else []
        except json.JSONDecodeError:
            return []
    return []


def recent_block(feed: list) -> str:
    items = feed[:READBACK]
    if not items:
        return "(none yet — this is the first drop)"
    return "\n".join(
        f"- [{b.get('category', '?')}] {b.get('title', '')} ({b.get('reward', '')})"
        for b in items
    )


def slug(title: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return s[:48] or "bounty"


def fmt_sol(x: float) -> tuple[str, float]:
    x = round(x * 4) / 4          # snap to 0.25 increments
    x = max(SOL_MIN, min(SOL_MAX, x))
    return f"{x:g} SOL", x        # ("2 SOL", 2.0)


def has_banned(text: str) -> str | None:
    low = text.lower()
    for w in BANNED:
        if w in low:
            return w
    return None


# ── generation ───────────────────────────────────────────────────────────────

def generate(feed: list) -> list:
    prompt = (
        f"Generate {BATCH} brand-new bounties as a batch. Follow the spec and quality bar "
        f"exactly. Do NOT repeat any concept, angle, reward, or phrasing from these recent "
        f"drops:\n\n{recent_block(feed)}\n\n"
        f"Vary categories and reward sizes across the batch. Rewards in SOL, "
        f"{SOL_MIN}–{SOL_MAX} band."
    )
    resp = client().responses.create(
        model=MODEL,
        instructions=instructions(),
        input=prompt,
        text={"format": {
            "type": "json_schema",
            "name": "bounty_batch",
            "strict": True,
            "schema": BOUNTY_SCHEMA,
        }},
    )
    data = json.loads(resp.output_text)
    return data.get("bounties", [])


def is_safe(b: dict) -> bool:
    """Second-pass safety check — distinct from anti-slop. Default to reject on doubt."""
    blob = f"{b['title']}\n{b['task']}\n" + "\n".join(b.get("deliverables", []))
    resp = client().responses.create(
        model=MODEL,
        instructions=(
            "You are a strict safety moderator for a public bounty board. Reject a bounty if "
            "it involves anything illegal, violent, harassing, doxxing, self-harm, a dangerous "
            "stunt (fire, heights, trespassing, driving, body modification), targets a real "
            "named private individual, exploits a tragedy, is a scam/giveaway/impersonation, or "
            "gives financial advice. When in doubt, reject."
        ),
        input=f"Bounty:\n{blob}",
        text={"format": {
            "type": "json_schema",
            "name": "verdict",
            "strict": True,
            "schema": {
                "type": "object",
                "additionalProperties": False,
                "required": ["safe", "reason"],
                "properties": {
                    "safe": {"type": "boolean"},
                    "reason": {"type": "string"},
                },
            },
        }},
    )
    verdict = json.loads(resp.output_text)
    if not verdict.get("safe"):
        print(f"  ✗ safety rejected: {b['title']} — {verdict.get('reason')}")
    return bool(verdict.get("safe"))


# ── publish gate ─────────────────────────────────────────────────────────────

def accept(b: dict, seen_titles: set) -> dict | None:
    # shape
    if not all(b.get(k) for k in ("title", "task", "deliverables", "deadline", "category")):
        return None
    if b["category"] not in CATEGORIES:
        return None
    if len(b["deliverables"]) < 2:
        return None
    # de-dupe
    key = slug(b["title"])
    if key in seen_titles:
        print(f"  ✗ duplicate: {b['title']}")
        return None
    # anti-slop
    bad = has_banned(b["title"] + " " + b["task"] + " " + " ".join(b["deliverables"]))
    if bad:
        print(f"  ✗ banned phrase '{bad}': {b['title']}")
        return None
    # safety
    if not is_safe(b):
        return None

    reward_str, reward_num = fmt_sol(float(b.get("rewardSol", 1)))
    seen_titles.add(key)
    return {
        "id": f"{datetime.now(timezone.utc):%Y-%m-%d}-{key}-{uuid.uuid4().hex[:6]}",
        "createdAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "title": b["title"].strip(),
        "reward": reward_str,
        "rewardSol": reward_num,
        "deadline": b["deadline"].strip(),
        "task": b["task"].strip(),
        "deliverables": [d.strip() for d in b["deliverables"]],
        "category": b["category"],
        "status": "fresh",
    }


# ── main ─────────────────────────────────────────────────────────────────────

def main() -> int:
    feed = load_feed()
    seen = {slug(b.get("title", "")) for b in feed}

    try:
        raw = generate(feed)
    except Exception as e:  # noqa: BLE001
        print(f"generation failed: {e}", file=sys.stderr)
        return 1

    fresh = []
    for b in raw:
        ok = accept(b, seen)
        if ok:
            print(f"  ✓ {ok['reward']:>8}  [{ok['category']}] {ok['title']}")
            fresh.append(ok)

    if not fresh:
        print("No bounties passed the gate this run; feed unchanged.")
        return 0

    updated = (fresh + feed)[:MAX_FEED]
    FEED.write_text(json.dumps(updated, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {len(fresh)} new bounties → {FEED} ({len(updated)} total).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
