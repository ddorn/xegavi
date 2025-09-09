#! /usr/bin/env -S uv run -s
# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "typer",
# ]
# ///

import json
import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import typer


app = typer.Typer(add_completion=False)


def load_benchmark_data(benchmark_file: Path) -> list[dict[str, Any]]:
    """Load and parse a benchmark file, extracting all games."""
    with benchmark_file.open() as f:
        data = json.load(f)

    if 'game_results' not in data:
        raise ValueError(f"Invalid benchmark file format: {benchmark_file}")

    game_results = data['game_results']
    if not game_results or not isinstance(game_results, list):
        raise ValueError(f"No game results found in {benchmark_file}")

    # Group results by game and seed
    games_by_key = {}
    for result in game_results:
        if 'game' not in result or 'scores' not in result:
            continue

        game_info = result['game']['game']
        game_type = game_info['name']
        map_seed = game_info['map_seed']
        game_key = f"{game_type}_{map_seed}"

        if game_key not in games_by_key:
            games_by_key[game_key] = []
        games_by_key[game_key].append(result)

    # Process each game to find the best model and extract metadata
    processed_games = []
    for game_key, results in games_by_key.items():
        # Find the best model (highest score)
        best_score = float('-inf')
        best_model = None

        for result in results:
            if 'scores' in result and 'black' in result['scores']:
                score = result['scores']['black']
                if score > best_score:
                    best_score = score
                    # Extract model from the first player
                    if 'game' in result and 'players' in result['game'] and result['game']['players']:
                        best_model = result['game']['players'][0]['options']['model']

        if best_model is None:
            print(f"Warning: Could not find valid model data for {game_key}")
            continue

        # Extract game metadata
        game_info = results[0]['game']['game']
        game_type = game_info['name']
        map_seed = game_info['map_seed']
        game_id = f"{game_type.lower()}_{map_seed}"

        processed_games.append({
            'gameId': game_id,
            'gameUrl': f"/games/{game_type}_{map_seed}.json",
            'gameType': game_type,
            'bestModel': best_model,
            'bestScore': best_score,
            'data': results  # Include the full data for extraction
        })

    return processed_games


def get_days_in_month(year: int, month: int) -> list[str]:
    """Get all days in a month as YYYY-MM-DD strings."""
    # Get the first day of the month
    first_day = datetime(year, month, 1)

    # Generate all days in the month
    days = []
    current = first_day
    while current.month == month:
        days.append(current.strftime('%Y-%m-%d'))
        current += timedelta(days=1)

    return days


def generate_month_file(
    year: int,
    month: int,
    available_games: list[dict[str, Any]],
    used_games: set[str],
    output_dir: Path
) -> None:
    """Generate a month file with daily game assignments."""
    month_file = output_dir / f"{year:04d}-{month:02d}.json"

    # Get all days in the month
    days = get_days_in_month(year, month)

    # Create a copy of available games that haven't been used
    available_unused = [game for game in available_games if game['gameId'] not in used_games]

    # Only assign games if we have enough unused games
    if len(available_unused) < len(days):
        print(f"Not enough unused games for {len(days)} days (have {len(available_unused)}, need {len(days)})")
        # Only assign the games we have
        days_to_assign = days[:len(available_unused)]
    else:
        days_to_assign = days

    # Assign games to days (no cycling/reuse)
    month_data = {}
    for i, day in enumerate(days_to_assign):
        game = available_unused[i]

        month_data[day] = {
            'gameId': game['gameId'],
            'gameUrl': game['gameUrl'],
            'gameType': game['gameType'],
            'bestModel': game['bestModel'],
            'bestScore': game['bestScore']
        }

        used_games.add(game['gameId'])

    # Write the month file atomically
    temp_file = month_file.with_suffix('.tmp')
    with temp_file.open('w') as f:
        json.dump(month_data, f)

    temp_file.replace(month_file)
    print(f"Generated {month_file} with {len(month_data)} days")

def round_floats(obj):
    """Round floats to 3 decimal places for smaller game files."""
    if isinstance(obj, float):
        return round(obj, 3)
    elif isinstance(obj, dict):
        return {k: round_floats(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [round_floats(x) for x in obj]
    else:
        return obj

THIS_YEAR = datetime.now().year
THIS_MONTH = datetime.now().month

@app.command()
def generate_daily_games(
    benchmark_file: Path = typer.Option(Path("../xega/results/benchmarkResults.json"), help="Path to benchmark JSON file"),
    output_dir: Path = typer.Option(Path("public/daily"), help="Output directory for daily files"),
    games_dir: Path = typer.Option(Path("public/games"), help="Output directory for extracted game files"),
    year: int = typer.Option(THIS_YEAR, help="Year to generate"),
    month: int = typer.Option(THIS_MONTH, help="Month to generate (1-12)"),
    seed: int = typer.Option(42, help="Random seed for reproducible results")
) -> None:
    """
    Generate daily games rotation files from benchmark data.

    This script processes a benchmark JSON file and creates monthly rotation files
    for the daily games feature. Each month file contains a mapping of dates to
    game metadata including the best performing model and score.
    """
    # Set random seed for reproducibility
    random.seed(seed)

    # Validate inputs
    if not benchmark_file.exists():
        raise typer.Exit(f"Benchmark file does not exist: {benchmark_file}")

    if not (1 <= month <= 12):
        raise typer.Exit(f"Month must be between 1 and 12, got: {month}")

    # Create output directories
    output_dir.mkdir(parents=True, exist_ok=True)
    games_dir.mkdir(parents=True, exist_ok=True)

    print(f"Loading benchmark data from {benchmark_file}")

    # Load and process all games from benchmark
    try:
        available_games = load_benchmark_data(benchmark_file)
    except Exception as e:
        raise typer.Exit(f"Error loading benchmark data: {e}")

    if not available_games:
        raise typer.Exit("No valid games could be loaded from benchmark")

    print(f"Found {len(available_games)} games in benchmark")

    # Extract games and process metadata
    used_games = set()
    processed_games = []

    for game_data in available_games:
        # Extract the game file to games_dir
        game_file = games_dir / f"{game_data['gameType']}_{game_data['gameId'].split('_')[1]}.json"
        if not game_file.exists():
            with game_file.open('w') as f:
                json.dump(round_floats(game_data['data']), f, indent=0)
            print(f"Extracted {game_file}")

        # Remove the data from game_data to keep it clean
        del game_data['data']
        processed_games.append(game_data)
        print(f"Loaded {game_data['gameId']} - {game_data['gameType']} (best: {game_data['bestModel']}, score: {game_data['bestScore']:.2f})")

    print(f"Successfully processed {len(processed_games)} games")

    # Shuffle games for random assignment
    random.shuffle(processed_games)

    # Generate the month file
    generate_month_file(year, month, processed_games, used_games, output_dir)

    print("Daily games generation completed!")


if __name__ == "__main__":
    app()