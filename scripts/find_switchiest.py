from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import click


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
            # Treat missing as 0.0 to keep timeline alignment; unlikely in practice
            s = 0.0
        scores.append(float(s))
    return scores


def _cumulative_max(xs: list[float]) -> list[float]:
    if not xs:
        return []
    out: list[float] = []
    cur = float("-inf")
    for v in xs:
        if v > cur:
            cur = v
        out.append(cur)
    return out


def _rank_positions_at_t(
    model_to_cummax: dict[str, list[float]],
    t: int,
) -> dict[str, int]:
    # Build list of (model, score_at_t)
    snap: list[tuple[str, float]] = []
    for model, cm in model_to_cummax.items():
        if not cm:
            snap.append((model, float("-inf")))
        else:
            idx = min(t, len(cm) - 1)
            snap.append((model, cm[idx]))
    # Sort by score desc, then model name asc for stability
    snap.sort(key=lambda m_s: (-m_s[1], m_s[0]))
    return {m: i + 1 for i, (m, _s) in enumerate(snap)}


def _compute_switchiness_for_group(
    entries: list[dict[str, Any]],
    top_n: int,
) -> tuple[int, int]:
    """Return (total_switches, timeline_len_T).

    - Aggregate all models for this (game, seed)
    - Use cumulative max of scores over runs per model
    - For t = 1..T-1, count models whose rank improves and finish within top_n at t
    """
    # Collect per-model cumulative max score sequences
    model_to_cummax: dict[str, list[float]] = {}
    max_T = 0
    for entry in entries:
        model = _get_model(entry)
        scores = _extract_run_scores(entry)
        cm = _cumulative_max(scores)
        model_to_cummax[model] = cm
        if len(cm) > max_T:
            max_T = len(cm)

    if max_T <= 1 or len(model_to_cummax) <= 1:
        return 0, max_T

    total_switches = 0
    prev_pos: dict[str, int] | None = None

    for t in range(0, max_T):
        pos_t = _rank_positions_at_t(model_to_cummax, t)
        if prev_pos is not None:
            # Count upward moves that land in top_n at current t
            for model, new_pos in pos_t.items():
                old_pos = prev_pos.get(model, len(pos_t) + 1)
                if new_pos <= top_n and new_pos < old_pos:
                    total_switches += 1
        prev_pos = pos_t

    return total_switches, max_T


@click.command()
@click.option(
    "--game-data",
    type=click.Path(path_type=Path, exists=True, dir_okay=False, file_okay=True),
    required=False,
    default=Path("results/benchmarkResults.json"),
    help="Path to the full benchmark JSON to analyze.",
)
@click.option(
    "--top-n",
    type=click.IntRange(min=1),
    default=5,
    show_default=True,
    help="Top-N frontier to evaluate rank improvements.",
)
@click.option(
    "--top-k",
    type=click.IntRange(min=1),
    default=10,
    show_default=True,
    help="How many (game, seed) groups to select for output.",
)
@click.option(
    "--games",
    type=str,
    multiple=True,
    help="Optional filter: only include these game names (repeatable).",
)
@click.option(
    "--output",
    type=click.Path(path_type=Path, dir_okay=False, file_okay=True),
    required=True,
    help="Output JSON file containing only selected game entries.",
)
def main(
    game_data: Path, top_n: int, top_k: int, games: tuple[str, ...], output: Path
) -> None:
    """Find the most switchy (game, seed) groups and write a compact JSON with those entries.

    Switchiness is the sum over timesteps of the number of models whose rank improves
    (with cumulative-max scores) and that are within the top-N frontier at that timestep.
    """
    with game_data.open("r", encoding="utf-8") as f:
        data: dict[str, Any] = json.load(f)

    all_entries: list[dict[str, Any]] = data.get("game_results") or []

    # Optional game filter
    games_filter: set[str] | None = set(games) if games else None
    if games_filter:
        all_entries = [e for e in all_entries if _get_game_name(e) in games_filter]

    # Group entries by (game_name, seed)
    groups: dict[tuple[str, str], list[dict[str, Any]]] = {}
    for e in all_entries:
        key = (_get_game_name(e), _get_seed(e))
        groups.setdefault(key, []).append(e)

    # Compute switchiness per group
    scored: list[tuple[tuple[str, str], int, int, int]] = []
    # each as ((game, seed), total_switches, models_count, timeline_T)
    for key, entries in groups.items():
        total_switches, T = _compute_switchiness_for_group(entries, top_n=top_n)
        models_count = len({_get_model(e) for e in entries})
        scored.append((key, total_switches, models_count, T))

    # Rank by total_switches desc, then by models_count desc, then by T desc
    scored.sort(key=lambda item: (-item[1], -item[2], -item[3], item[0][0], item[0][1]))

    # Select top-k groups
    selected_keys = [key for key, _s, _m, _t in scored[:top_k]]
    selected_set = set(selected_keys)

    # Collect all entries matching selected (game, seed)
    selected_entries: list[dict[str, Any]] = []
    for e in all_entries:
        key = (_get_game_name(e), _get_seed(e))
        if key in selected_set:
            selected_entries.append(e)

    # Write output JSON with only the selected entries
    out_obj: dict[str, Any] = {"game_results": selected_entries}
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8") as f:
        json.dump(out_obj, f)

    # Print brief summary
    click.echo(
        f"Analyzed groups: {len(groups)}. Selected: {len(selected_keys)}. Top-N = {top_n}."
    )
    click.echo("Rank | Switches | Models | T | Game | Seed")
    for rank, (key, switches, mcount, T) in enumerate(scored[:top_k], start=1):
        g, s = key
        click.echo(f"{rank:4d} | {switches:8d} | {mcount:6d} | {T:2d} | {g} | {s}")


if __name__ == "__main__":
    main()
