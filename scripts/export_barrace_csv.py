from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from typing import Any

import click

# --- Heuristic mappings ---


def infer_company(model_name: str) -> str:
    m = model_name.lower()
    if "gpt" in m or "openai" in m or re.match(r"^o\d-?", m):
        return "OpenAI"
    if "claude" in m or "anthropic" in m:
        return "Anthropic"
    if "gemini" in m or "palm" in m or "bison" in m or "google" in m:
        return "Google"
    if "grok" in m or "xai" in m:
        return "xAI"
    if "llama" in m or "meta" in m:
        return "Meta"
    if "mistral" in m or "mixtral" in m:
        return "Mistral"
    if "qwen" in m or "ali" in m:
        return "Alibaba"
    if "deepseek" in m:
        return "DeepSeek"
    if "reka" in m:
        return "Reka"
    if "cohere" in m or "command" in m:
        return "Cohere"
    if "phi" in m:
        return "Microsoft"
    return "Unknown"


def infer_logo(model_name: str) -> str:
    company = infer_company(model_name)
    mapping = {
        "OpenAI": "https://upload.wikimedia.org/wikipedia/commons/6/66/OpenAI_logo_2025_%28symbol%29.svg",
        "Anthropic": "https://upload.wikimedia.org/wikipedia/commons/5/58/Claude-ai-icon.svg",
        "Google": "https://upload.wikimedia.org/wikipedia/commons/8/8f/Google-gemini-icon.svg",
        "xAI": "https://upload.wikimedia.org/wikipedia/commons/2/25/XAI.svg",
        "Meta": "https://upload.wikimedia.org/wikipedia/commons/d/d0/Meta_Platforms_logo.svg",
        "DeepSeek": "https://upload.wikimedia.org/wikipedia/commons/9/95/DeepSeek-icon.svg",
        "Mistral": "https://upload.wikimedia.org/wikipedia/commons/1/1b/Mistral_AI_logo.svg",
        "Alibaba": "https://upload.wikimedia.org/wikipedia/commons/5/5b/Alibaba_Group_logo.svg",
        "Reka": "",
        "Cohere": "https://upload.wikimedia.org/wikipedia/commons/4/44/Cohere_AI_logo.svg",
        "Microsoft": "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
        "Unknown": "",
    }
    return mapping.get(company, "")


# --- Nice model names (exact lookup for dataset) ---
NICE_NAME_MAP: dict[str, str] = {
    # Anthropic
    "claude-3-5-sonnet-20241022": "Sonnet 3.5",
    "claude-3-7-sonnet-20250219": "Sonnet 3.7",
    "claude-opus-4-1-20250805": "Opus 4.1",
    "claude-opus-4-20250514": "Opus 4",
    "claude-sonnet-4-20250514": "Sonnet 4",
    # DeepSeek
    "deepseek-chat": "DeepSeek chat",
    "deepseek-reasoner": "DeepSeek reasoner",
    # Google
    "gemini-2.5-flash": "Gemini 2.5 flash",
    "gemini-2.5-pro": "Gemini 2.5 pro",
    # OpenAI
    "gpt-4.1": "GPT-4.1",
    "gpt-4o": "GPT-4o",
    "gpt-5": "GPT-5",
    "gpt-5-mini": "GPT-5 mini",
    "gpt-5-nano": "GPT-5 nano",
    "o3": "o3",
    "o4-mini": "o4 mini",
    # xAI
    "grok-3": "Grok 3",
    "grok-3-mini": "Grok 3 Mini",
    "grok-4-0709": "Grok 4",
}


def nice_model_name(model_name: str, *, warn: bool = True) -> str:
    key = model_name.strip()
    if key in NICE_NAME_MAP:
        return NICE_NAME_MAP[key]
    kl = key.lower()
    if kl in NICE_NAME_MAP:
        return NICE_NAME_MAP[kl]
    norm = key.replace(":", "/").replace(" ", "").lower()
    if norm in NICE_NAME_MAP:
        return NICE_NAME_MAP[norm]
    if warn:
        click.secho(
            f"[warn] No nice name for model: {model_name}", fg="yellow", err=True
        )
    return model_name


# --- JSON helpers ---


def _get_game_name(entry: dict[str, Any]) -> str:
    game_meta = (entry.get("game") or {}).get("game") or {}
    return str(game_meta.get("name", "-"))


def _get_seed(entry: dict[str, Any]) -> str:
    return str((entry.get("game") or {}).get("map_seed", "-"))


def _get_model(entry: dict[str, Any]) -> str:
    players = (entry.get("game") or {}).get("players") or []
    if not players:
        return "-"
    opts = players[0].get("options") or {}
    return str(opts.get("model", "-"))


def _extract_run_scores(entry: dict[str, Any]) -> list[float]:
    scores: list[float] = []
    for run in entry.get("game_results", []) or []:
        s = (run.get("scores") or {}).get("black")
        if s is None:
            s = 0.0
        scores.append(float(s))
    return scores


def _cumulative_max(xs: list[float]) -> list[float]:
    out: list[float] = []
    cur = float("-inf")
    for v in xs:
        if v > cur:
            cur = v
        out.append(cur)
    return out


def _extract_move_and_token_pairs(run: dict[str, Any]) -> tuple[str, list[Any] | None]:
    xrt = run.get("xrt_history") or []
    move = ""
    token_pairs = None
    for ev in xrt:
        t = ev.get("type")
        if not move and t == "elicit_response":
            move = ev.get("response") or ""
        if t == "reward":
            val = ev.get("value") or {}
            if val.get("__TokenXentList__"):
                token_pairs = val.get("pairs")
                # don't break; still allow move to be found later if needed
    return move, token_pairs


@click.command()
@click.option(
    "--game-data",
    type=click.Path(path_type=Path, exists=True, dir_okay=False, file_okay=True),
    required=True,
    help="Path to benchmark JSON (full or filtered).",
)
@click.option("--game-name", required=True, type=str, help="Game name to export.")
@click.option("--seed", required=True, type=str, help="Seed to export.")
@click.option(
    "--output",
    type=click.Path(path_type=Path, dir_okay=False, file_okay=True),
    required=True,
    help="Output file path (CSV or JSON).",
)
@click.option(
    "--format",
    "fmt",
    type=click.Choice(["csv", "json"], case_sensitive=False),
    default="csv",
    show_default=True,
    help="Export format: csv or json.",
)
def main(game_data: Path, game_name: str, seed: str, output: Path, fmt: str) -> None:
    """Export a bar-race dataset.

    CSV: columns model, nice_model, company, logo, Round 1..T
    JSON: list of rounds; each round is a list of model objects with fields
          model, nice_model, company, logo, score, move, token_scores
    """
    with game_data.open("r", encoding="utf-8") as f:
        data: dict[str, Any] = json.load(f)

    entries: list[dict[str, Any]] = [
        e
        for e in (data.get("game_results") or [])
        if _get_game_name(e) == game_name and _get_seed(e) == seed
    ]
    if not entries:
        raise click.ClickException(
            f"No entries found for game={game_name!r}, seed={seed!r}."
        )

    # Build per-model cumulative series and per-run metadata
    model_to_series: dict[str, list[float]] = {}
    model_to_moves: dict[str, list[str]] = {}
    model_to_tokenpairs: dict[str, list[list[Any] | None]] = {}
    model_to_round_scores: dict[str, list[float]] = {}
    max_T = 0
    for e in entries:
        model = _get_model(e)
        runs = e.get("game_results") or []
        scores = _extract_run_scores(e)
        cm = _cumulative_max(scores)
        model_to_series[model] = cm
        model_to_round_scores[model] = scores
        moves: list[str] = []
        tokenpairs: list[list[Any] | None] = []
        for run in runs:
            move, pairs = _extract_move_and_token_pairs(run)
            moves.append(move)
            tokenpairs.append(pairs)
        model_to_moves[model] = moves
        model_to_tokenpairs[model] = tokenpairs
        if len(cm) > max_T:
            max_T = len(cm)

    # Pad with last value to common length; pad moves with empty and token pairs with None
    for model, series in list(model_to_series.items()):
        if not series:
            model_to_series[model] = [0.0] * max_T
        else:
            last = series[-1]
            if len(series) < max_T:
                model_to_series[model] = series + [last] * (max_T - len(series))
        # raw per-move scores
        raw_series = model_to_round_scores.get(model, [])
        if not raw_series:
            model_to_round_scores[model] = [0.0] * max_T
        else:
            raw_last = raw_series[-1]
            if len(raw_series) < max_T:
                model_to_round_scores[model] = raw_series + [raw_last] * (
                    max_T - len(raw_series)
                )
        # moves
        mv = model_to_moves.get(model, [])
        if len(mv) < max_T:
            model_to_moves[model] = mv + [""] * (max_T - len(mv))
        # token pairs
        tp = model_to_tokenpairs.get(model, [])
        if len(tp) < max_T:
            model_to_tokenpairs[model] = tp + [None] * (max_T - len(tp))

    # Sort models by name
    models = list(model_to_series.keys())
    models.sort()

    if fmt.lower() == "csv":
        header = ["model", "nice_model", "company", "logo"] + [
            f"Round {i}" for i in range(1, max_T + 1)
        ]
        output.parent.mkdir(parents=True, exist_ok=True)
        with output.open("w", encoding="utf-8", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(header)
            for m in models:
                nice = nice_model_name(m)
                company = infer_company(m)
                logo = infer_logo(m)
                row = [m, nice, company, logo] + [
                    f"{v:.2f}" for v in model_to_series[m]
                ]
                writer.writerow(row)
        click.echo(
            f"Wrote {len(models)} models, {max_T} rounds to {output} for game={game_name}, seed={seed}."
        )
        return

    # JSON export
    rounds: list[list[dict[str, Any]]] = []
    for t in range(max_T):
        round_items: list[dict[str, Any]] = []
        for m in models:
            round_items.append(
                {
                    "model": m,
                    "nice_model": nice_model_name(m, warn=False),
                    "company": infer_company(m),
                    "logo": infer_logo(m),
                    "score": float(model_to_round_scores[m][t]),
                    "move": model_to_moves[m][t],
                    "token_scores": model_to_tokenpairs[m][t],
                }
            )
        rounds.append(round_items)

    output.parent.mkdir(parents=True, exist_ok=True)
    data = {
        "version": "1",
        "rounds": rounds,
    }
    with output.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    click.echo(
        f"Wrote JSON with {len(rounds)} rounds x {len(models)} models to {output} for game={game_name}, seed={seed}."
    )


if __name__ == "__main__":
    main()
