"""
LEO — personal companion agent (Lionel Messi persona)
Single agent. OpenAI Responses API. brainctl MCP memory. API-Football live data.

Setup:
    pip install openai mcp httpx python-dotenv

Env (.env):
    OPENAI_API_KEY=sk-...
    APIFOOTBALL_KEY=...                  # api-football.com (free tier fine)
    BRAINCTL_MCP_CMD=brainctl mcp        # command that starts your MCP server (stdio)
    LEO_MODEL=gpt-5.2                    # or whatever you're running

Files (same dir):
    PERSONA.md      — static persona (the one we wrote)
    CONTEXT.md      — dated current-events block (§9), refresh weekly/cron

Run:
    python agent.py
"""

import asyncio
import json
import os
import shlex
import sys
from pathlib import Path

import httpx
from dotenv import load_dotenv
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from openai import OpenAI

load_dotenv()

MODEL = os.getenv("LEO_MODEL", "gpt-5.2")
HERE = Path(__file__).parent
client = OpenAI()

# ─────────────────────────────────────────────────────────────────────────────
# Instructions = static persona + dated context block
# ─────────────────────────────────────────────────────────────────────────────

def load_instructions() -> str:
    persona = (HERE / "PERSONA.md").read_text()
    ctx_file = HERE / "CONTEXT.md"
    context = ctx_file.read_text() if ctx_file.exists() else ""
    return f"{persona}\n\n# LIVE CONTEXT BLOCK\n{context}"

# ─────────────────────────────────────────────────────────────────────────────
# API-Football tool (api-football.com v3)
# ─────────────────────────────────────────────────────────────────────────────

APIFOOTBALL_BASE = "https://v3.football.api-sports.io"

FOOTBALL_TOOL = {
    "type": "function",
    "name": "football_api",
    "description": (
        "Live football data. Endpoints: 'fixtures' (params: team, league, date "
        "YYYY-MM-DD, next, last, live='all'), 'standings' (league, season), "
        "'fixtures/lineups' (fixture), 'fixtures/statistics' (fixture), "
        "'players' (id, season). Key IDs: Argentina NT team=26, Inter Miami "
        "team=9568, World Cup league=1, MLS league=253. Always call this for "
        "any score, fixture, lineup, or result — never guess."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "endpoint": {"type": "string", "description": "e.g. 'fixtures', 'standings'"},
            "params": {"type": "object", "description": "query params as key/value"},
        },
        "required": ["endpoint", "params"],
    },
}

async def call_football_api(endpoint: str, params: dict) -> str:
    async with httpx.AsyncClient(timeout=15) as http:
        r = await http.get(
            f"{APIFOOTBALL_BASE}/{endpoint}",
            params=params,
            headers={"x-apisports-key": os.environ["APIFOOTBALL_KEY"]},
        )
    data = r.json().get("response", r.json())
    return json.dumps(data)[:12000]  # keep tool output sane

# ─────────────────────────────────────────────────────────────────────────────
# brainctl over MCP (stdio) → exposed as OpenAI function tools
# ─────────────────────────────────────────────────────────────────────────────

# Keep the surface small; Leo doesn't need all 196 tools.
BRAINCTL_ALLOWLIST = {
    "agent_orient", "agent_wrap_up",
    "memory_add", "memory_search",
    "trigger_create", "trigger_check",
    "affect_log",
}

class Brainctl:
    def __init__(self):
        self.session: ClientSession | None = None
        self.tools: list[dict] = []
        self._stack = None

    async def start(self):
        cmd = shlex.split(os.getenv("BRAINCTL_MCP_CMD", "brainctl mcp"))
        params = StdioServerParameters(command=cmd[0], args=cmd[1:])
        self._ctx = stdio_client(params)
        read, write = await self._ctx.__aenter__()
        self.session = ClientSession(read, write)
        await self.session.__aenter__()
        await self.session.initialize()
        listed = await self.session.list_tools()
        for t in listed.tools:
            if t.name in BRAINCTL_ALLOWLIST:
                self.tools.append({
                    "type": "function",
                    "name": f"brainctl_{t.name}",
                    "description": t.description or t.name,
                    "parameters": t.inputSchema or {"type": "object", "properties": {}},
                })

    async def call(self, name: str, args: dict) -> str:
        result = await self.session.call_tool(name.removeprefix("brainctl_"), args)
        parts = [c.text for c in result.content if getattr(c, "text", None)]
        return "\n".join(parts)[:12000] or "ok"

    async def stop(self):
        try:
            await self.session.__aexit__(None, None, None)
            await self._ctx.__aexit__(None, None, None)
        except Exception:
            pass

# ─────────────────────────────────────────────────────────────────────────────
# Tool dispatch
# ─────────────────────────────────────────────────────────────────────────────

async def dispatch(brain: Brainctl, name: str, args: dict) -> str:
    try:
        if name == "football_api":
            return await call_football_api(args["endpoint"], args.get("params", {}))
        if name.startswith("brainctl_"):
            return await brain.call(name, args)
        return f"unknown tool: {name}"
    except Exception as e:
        return f"tool error: {e}"

# ─────────────────────────────────────────────────────────────────────────────
# Agent turn: Responses API loop with previous_response_id chaining
# ─────────────────────────────────────────────────────────────────────────────

async def run_turn(brain: Brainctl, tools: list, instructions: str,
                   user_input, prev_id: str | None) -> tuple[str, str]:
    """Returns (assistant_text, response_id)."""
    kwargs = dict(model=MODEL, instructions=instructions, tools=tools)
    resp = client.responses.create(
        input=user_input,
        previous_response_id=prev_id,
        **kwargs,
    )

    # tool loop — keep resolving function calls until Leo speaks
    while True:
        calls = [o for o in resp.output if o.type == "function_call"]
        if not calls:
            break
        outputs = []
        results = await asyncio.gather(*[
            dispatch(brain, c.name, json.loads(c.arguments or "{}")) for c in calls
        ])
        for c, r in zip(calls, results):
            outputs.append({
                "type": "function_call_output",
                "call_id": c.call_id,
                "output": r,
            })
        resp = client.responses.create(
            input=outputs,
            previous_response_id=resp.id,
            **kwargs,
        )

    return resp.output_text, resp.id

# ─────────────────────────────────────────────────────────────────────────────
# Main loop
# ─────────────────────────────────────────────────────────────────────────────

async def main():
    instructions = load_instructions()

    brain = Brainctl()
    try:
        await brain.start()
    except Exception as e:
        print(f"[brainctl offline: {e} — running without memory]", file=sys.stderr)

    tools = [{"type": "web_search"}, FOOTBALL_TOOL, *brain.tools]
    prev_id: str | None = None

    # boot: Leo orients himself and opens the conversation
    text, prev_id = await run_turn(
        brain, tools, instructions,
        "(session start — orient yourself with your memory tools, check today's "
        "football context if relevant, then greet me like you would)",
        None,
    )
    print(f"\nLeo: {text}\n")

    try:
        while True:
            user = input("you: ").strip()
            if not user:
                continue
            if user.lower() in {"/q", "/quit", "exit"}:
                break
            text, prev_id = await run_turn(brain, tools, instructions, user, prev_id)
            print(f"\nLeo: {text}\n")
    except (KeyboardInterrupt, EOFError):
        pass
    finally:
        # closing: let Leo wrap up memory before exit
        try:
            await run_turn(
                brain, tools, instructions,
                "(session end — wrap up your memory, one-line goodbye)",
                prev_id,
            )
        except Exception:
            pass
        await brain.stop()
        print("\n[adiós]")

if __name__ == "__main__":
    asyncio.run(main())
