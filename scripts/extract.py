#! /usr/bin/env -S uv run -s
# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "InquirerPy",
#     "typer",
# ]
# ///

import json
from pathlib import Path

import typer
from InquirerPy import inquirer


app = typer.Typer()


@app.command()
def extract_gamee_data(benchmark: Path, game: str = "", seed: str = "") -> None:
    data = json.load(benchmark.open())
    game_results = data["game_results"]

    game_names = {result["game"]["game"]["name"] for result in game_results}

    if not game:
        game = inquirer.fuzzy(
            message="Select a game",
            choices=list(game_names),
        ).execute()

    if game not in game_names:
        raise typer.Exit(f"Game name {game} not found in benchmark")

    seeds = {
        result["game"]["game"]["map_seed"]
        for result in game_results
        if result["game"]["game"]["name"] == game
    }
    if not seed:
        seed = inquirer.fuzzy(
            message="Select a seed",
            choices=sorted(seeds),
        ).execute()
    if seed not in seeds:
        raise typer.Exit(f"Seed {seed} for game {game} not found in benchmark")

    # Collect the data
    games = [
        result
        for result in game_results
        if result["game"]["game"]["name"] == game
        and result["game"]["game"]["map_seed"] == seed
    ]

    # Save the data
    output = benchmark.parent / benchmark.stem / f"{game}_{seed}.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    if output.exists():
        print(f"File {output} already exists, skipping")
    else:
        output.write_text(json.dumps(games, indent=1))

    print(f"Saved data to {output}")

if __name__ == "__main__":
    app()
