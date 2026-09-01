from flask import Flask, render_template, jsonify, request

import sudoku_logic

app = Flask(__name__)

CURRENT = {
    "puzzle": None,
    "solution": None,
    "difficulty": "easy",
}


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/new")
def new_game():
    difficulty = request.args.get("difficulty", "easy").lower()
    puzzle, solution = sudoku_logic.generate_puzzle(difficulty)
    CURRENT["puzzle"] = puzzle
    CURRENT["solution"] = solution
    CURRENT["difficulty"] = difficulty
    return jsonify({"puzzle": puzzle, "solution": solution, "difficulty": difficulty})


@app.route("/hint")
def request_hint():
    puzzle = CURRENT.get("puzzle")
    solution = CURRENT.get("solution")

    if puzzle is None or solution is None:
        return jsonify({"error": "No game in progress."}), 400

    for row in range(sudoku_logic.SIZE):
        for col in range(sudoku_logic.SIZE):
            if puzzle[row][col] == sudoku_logic.EMPTY:
                puzzle[row][col] = solution[row][col]
                return jsonify({"row": row, "col": col, "value": solution[row][col]})

    return jsonify({"error": "No empty cells left."}), 400


@app.route("/check", methods=["POST"])
def check_solution():
    data = request.get_json(silent=True) or {}
    board = data.get("board")
    solution = CURRENT.get("solution")

    if solution is None:
        return jsonify({"error": "No game in progress."}), 400

    if not isinstance(board, list) or len(board) != sudoku_logic.SIZE:
        return jsonify({"error": "Board data is missing or invalid."}), 400

    incorrect = []
    solved = True
    for row in range(sudoku_logic.SIZE):
        if not isinstance(board[row], list) or len(board[row]) != sudoku_logic.SIZE:
            return jsonify({"error": "Board row data is invalid."}), 400
        for col in range(sudoku_logic.SIZE):
            value = board[row][col]
            if value != solution[row][col]:
                incorrect.append([row, col])
                solved = False

    return jsonify({"incorrect": incorrect, "solved": solved})


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=8000)