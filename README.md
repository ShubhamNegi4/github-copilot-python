# Sudoku Challenge

This project turns the original starter app into a polished Flask Sudoku game with a unique-solution generator, difficulty options, keyboard-friendly validation, hints, timer tracking, and a Top 10 leaderboard stored in local storage.

## Run locally

From the project root:

```bash
cd starter
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

For Fish shell users:

```fish
cd starter
python3 -m venv .venv
source .venv/bin/activate.fish
pip install -r requirements.txt
python app.py
```

Then open http://127.0.0.1:5000 in a browser.

## Test command

```bash
cd starter
.venv/bin/python -m pytest -q
```

## Features

- Unique-solution Sudoku board generation for easy, medium, and hard puzzles
- Live invalid-entry feedback while typing
- Check button and hint support
- Timer with completion tracking
- Dark mode toggle for the full interface
- Persistent Top 10 leaderboard saved in browser local storage
- Responsive board layout with alternating 3x3 box colors

## Project notes

The Python logic is kept separate from the Flask view layer so the puzzle generation and validation can be tested directly with pytest.