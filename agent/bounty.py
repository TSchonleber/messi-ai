"""
Leo's autonomous bounty generator for pump.fun GO.

Generates a small batch of fresh, on-brand bounties in Leo's voice, runs each through a
publish gate (anti-slop + an LLM safety pass), and prepends the survivors to
public/bounties.json. Run by .github/workflows/bounty-drop.yml on a schedule.

Treasury-aware: if TREASURY_ADDRESS is set, Leo reads the treasury's public SOL balance
(read-only, no private key) and sizes the batch to a spend budget — a reserve fraction of
the treasury minus what's already committed to open (unfunded) bounties. Code enforces the
ceiling so the model can never propose more than the treasury can back.

Env:
    OPENAI_API_KEY    required
    LEO_MODEL         generation model (default: gpt-5.4)
    BATCH             max bounties to ask for per run (default: 3)
    FEED_PATH         path to the feed JSON (default: ../public/bounties.json)
    TREASURY_ADDRESS  Solana pubkey of the bounty treasury (optional; enables budgeting)
    SOLANA_RPC_URL    RPC endpoint (default: public mainnet-beta)
    COMMIT_FRACTION   max share of treasury allowed open at once (default: 0.5)

Local run:
    pip install -r agent/requirements.txt
    OPENAI_API_KEY=sk-... python agent/bounty.py
"""

import json
import os
import re
import sys
import urllib.request
import uuid
from datetime import datetime, timezone
from pathlib import Path

from openai import OpenAI

HERE = Path(__file__).parent
ROOT = HERE.parent
MODEL = os.getenv("LEO_MODEL") or "gpt-5.4"
BATCH = int(os.getenv("BATCH", "3"))
FEED = Path(os.getenv("FEED_PATH", str(ROOT / "public" / "bounties.json")))

TREASURY_ADDRESS = os.getenv("TREASURY_ADDRESS", "").strip()
SOLANA_RPC_URL = os.getenv("SOLANA_RPC_URL") or "https://api.mainnet-beta.solana.com"
COMMIT_FRACTION = float(os.getenv("COMMIT_FRACTION") or "0.5")

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


def treasury_sol(address: str) -> float | None:
    """Read-only SOL balance of the treasury via public RPC. No private key involved."""
    payload = json.dumps(
        {"jsonrpc": "2.0", "id": 1, "method": "getBalance", "params": [address]}
    ).encode()
    req = urllib.request.Request(
        SOLANA_RPC_URL, data=payload, headers={"Content-Type": "application/json"}
    )
    last = None
    for _ in range(3):
        try:
            with urllib.request.urlopen(req, timeout=15) as r:
                data = json.loads(r.read())
            return data["result"]["value"] / 1e9
        except Exception as e:  # noqa: BLE001
            last = e
    print(f"treasury balance fetch failed: {last}", file=sys.stderr)
    return None


def open_value(feed: list) -> float:
    """Total reward already committed to open (generated-but-unfunded) bounties."""
    return sum(float(b.get("rewardSol", 0)) for b in feed if b.get("status") == "fresh")


def slug(title: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return s[:48] or "bounty"


def fmt_sol(x: float, cap: float = SOL_MAX) -> tuple[str, float]:
    hi = min(SOL_MAX, cap)
    x = round(x * 4) / 4          # snap to 0.25 increments
    x = max(SOL_MIN, min(hi, x))
    return f"{x:g} SOL", x        # ("2 SOL", 2.0)


def has_banned(text: str) -> str | None:
    low = text.lower()
    for w in BANNED:
        if w in low:
            return w
    return None


# ── generation ───────────────────────────────────────────────────────────────

def generate(feed: list, count: int, budget: float | None, balance: float | None) -> list:
    if budget is not None:
        money = (
            f"Your treasury holds about {balance:g} SOL. You have a budget of {budget:g} SOL "
            f"for this whole batch — the sum of all rewards must NOT exceed it. Size rewards to "
            f"the runway: lean and few when funds are tight, more generous when there's room. "
            f"Each reward stays in the {SOL_MIN}–{SOL_MAX} SOL band."
        )
    else:
        money = f"Vary reward sizes across the batch, in the {SOL_MIN}–{SOL_MAX} SOL band."

    prompt = (
        f"Generate up to {count} brand-new bounties as a batch. Follow the spec and quality "
        f"bar exactly. Do NOT repeat any concept, angle, reward, or phrasing from these recent "
        f"drops:\n\n{recent_block(feed)}\n\n"
        f"Vary categories. {money}"
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
            "You are a safety moderator for a public bounty board on pump.fun GO, a Solana crypto "
            "bounty marketplace. Crypto, memecoin, Solana, and pump.fun-related tasks are the norm "
            "and are FINE — do not reject something just for mentioning or promoting the platform. "
            "Reject a bounty ONLY if it clearly involves: anything illegal; violence, harassment, "
            "doxxing, or self-harm; a physically dangerous stunt (fire, heights, trespassing, "
            "driving, weapons, body modification); targeting or exposing a real named private "
            "individual; exploiting a tragedy; a scam, rug, fake giveaway, or impersonation of a "
            "real person or brand; or explicit financial/investment advice (telling people what to "
            "buy or sell, price predictions, or promises of returns). Marketing, content, design, "
            "dev, research, memes, translation, and explaining how the platform works are all fine. "
            "Approve unless it clearly hits one of those."
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

def accept(b: dict, seen_titles: set, cap: float = SOL_MAX) -> dict | None:
    # budget: can't fund even a minimum bounty within the remaining cap
    if cap < SOL_MIN:
        return None
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

    reward_str, reward_num = fmt_sol(float(b.get("rewardSol", 1)), cap)
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

    # Treasury-aware budgeting (read-only; no private key).
    budget: float | None = None
    balance: float | None = None
    count = BATCH
    if TREASURY_ADDRESS:
        balance = treasury_sol(TREASURY_ADDRESS)
        if balance is None:
            print("Treasury unreadable; skipping run to stay safe.")
            return 0
        max_open = balance * COMMIT_FRACTION
        committed = open_value(feed)
        budget = max(0.0, max_open - committed)
        print(
            f"Treasury {balance:g} SOL · max open {max_open:g} · already open {committed:g} "
            f"· budget this run {budget:g} SOL"
        )
        if budget < SOL_MIN:
            print("No budget headroom for new bounties this run; feed unchanged.")
            return 0
        count = max(1, min(BATCH, int(budget // SOL_MIN)))

    try:
        raw = generate(feed, count, budget, balance)
    except Exception as e:  # noqa: BLE001
        print(f"generation failed: {e}", file=sys.stderr)
        return 1

    fresh = []
    spent = 0.0
    for b in raw:
        remaining = (budget - spent) if budget is not None else SOL_MAX
        if remaining < SOL_MIN:
            print("  budget exhausted for this run")
            break
        ok = accept(b, seen, cap=remaining)
        if ok:
            spent += ok["rewardSol"]
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
