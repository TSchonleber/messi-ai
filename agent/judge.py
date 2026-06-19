"""
Leo judges a bounty submission and recommends a payout — ADVISORY ONLY.

He never moves funds and holds no wallet key. He reads the proof you give him,
checks it against the bounty's deliverables, and recommends pay / partial / reject.
You approve and release the payout yourself on pump.fun GO.

Usage:
    # proof via stdin (paste, then Ctrl-D):
    OPENAI_API_KEY=... python agent/judge.py <bounty-id-or-title-substring>

    # or pass it directly / from a file:
    python agent/judge.py <bounty> --proof "links, notes, what they submitted"
    python agent/judge.py <bounty> --proof-file proof.txt
"""

import argparse
import json
import os
import sys
from pathlib import Path

from openai import OpenAI

HERE = Path(__file__).parent
ROOT = HERE.parent
MODEL = os.getenv("LEO_MODEL") or "gpt-5.4"
FEED = Path(os.getenv("FEED_PATH", str(ROOT / "public" / "bounties.json")))

_client: OpenAI | None = None


def client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI()
    return _client


JUDGE_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["deliverables", "recommendation", "suggested_payout_sol", "confidence", "reasoning"],
    "properties": {
        "deliverables": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["item", "met", "note"],
                "properties": {
                    "item": {"type": "string"},
                    "met": {"type": "boolean"},
                    "note": {"type": "string"},
                },
            },
        },
        "recommendation": {"type": "string", "enum": ["pay_full", "pay_partial", "reject"]},
        "suggested_payout_sol": {"type": "number"},
        "confidence": {"type": "string", "enum": ["high", "medium", "low"]},
        "reasoning": {"type": "string"},
    },
}


def load_bounty(needle: str) -> dict:
    if not FEED.exists():
        sys.exit(f"No feed at {FEED}")
    feed = json.loads(FEED.read_text())
    exact = [b for b in feed if b.get("id") == needle]
    if exact:
        return exact[0]
    matches = [b for b in feed if needle.lower() in b.get("title", "").lower()]
    if len(matches) == 1:
        return matches[0]
    if len(matches) > 1:
        print("Multiple bounties match; be more specific:", file=sys.stderr)
        for b in matches:
            print(f"  {b['id']}  {b['title']}", file=sys.stderr)
        sys.exit(1)
    print("No bounty matched. Available:", file=sys.stderr)
    for b in feed:
        print(f"  {b['id']}  {b['title']}", file=sys.stderr)
    sys.exit(1)


def judge(bounty: dict, proof: str) -> dict:
    persona = (HERE / "PERSONA.md").read_text()
    instructions = (
        persona
        + "\n\nYou are reviewing a submission to one of your bounties. Check the proof against "
        "EACH deliverable, honestly. Be fair to the hunter but protect the treasury: do not "
        "approve missing or unverifiable proof. Be skeptical of things that are easy to fake "
        "(screenshots with no live link, view counts, claims without evidence) and say so. "
        "Recommend pay_full only if every deliverable is clearly met; pay_partial if the core "
        "work is there but something is missing or weak; reject if it doesn't meet the brief. "
        "suggested_payout_sol must be between 0 and the bounty reward. Keep the reasoning short "
        "and in your own voice. This is advice only — the human approves and pays, and pump.fun "
        "moderates the final call. You never move funds."
    )
    deliv = "\n".join(f"- {d}" for d in bounty.get("deliverables", []))
    prompt = (
        f"BOUNTY\nTitle: {bounty['title']}\nReward: {bounty['reward']}\n"
        f"Deadline: {bounty['deadline']}\nTask: {bounty['task']}\nDeliverables:\n{deliv}\n\n"
        f"SUBMITTED PROOF:\n{proof.strip() or '(none provided)'}\n\nJudge it."
    )
    resp = client().responses.create(
        model=MODEL,
        instructions=instructions,
        input=prompt,
        text={"format": {
            "type": "json_schema",
            "name": "verdict",
            "strict": True,
            "schema": JUDGE_SCHEMA,
        }},
    )
    return json.loads(resp.output_text)


REC_LABEL = {"pay_full": "PAY IN FULL", "pay_partial": "PARTIAL PAYOUT", "reject": "REJECT"}


def main() -> int:
    ap = argparse.ArgumentParser(description="Leo's advisory payout recommendation.")
    ap.add_argument("bounty", help="bounty id or a unique part of its title")
    ap.add_argument("--proof", help="the submitted proof as text")
    ap.add_argument("--proof-file", help="path to a file with the submitted proof")
    args = ap.parse_args()

    if args.proof:
        proof = args.proof
    elif args.proof_file:
        proof = Path(args.proof_file).read_text()
    else:
        print("Paste the hunter's proof (links, notes), then Ctrl-D:\n", file=sys.stderr)
        proof = sys.stdin.read()

    bounty = load_bounty(args.bounty)
    v = judge(bounty, proof)

    print(f"\n=== Leo's read on: {bounty['title']} ===")
    print(f"Reward at stake: {bounty['reward']}\n")
    for d in v["deliverables"]:
        mark = "✓" if d["met"] else "✗"
        print(f"  {mark} {d['item']}")
        if d["note"]:
            print(f"      {d['note']}")
    print(f"\nRecommendation: {REC_LABEL.get(v['recommendation'], v['recommendation'])} "
          f"(confidence: {v['confidence']})")
    print(f"Suggested payout: {v['suggested_payout_sol']:g} SOL (of {bounty['rewardSol']} SOL)")
    print(f"\nLeo: {v['reasoning']}")
    print("\n— Advisory only. You approve and pay on pump.fun GO; Leo can't move funds. —")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
