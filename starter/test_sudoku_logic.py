import pytest

from sudoku_logic import SIZE, EMPTY, create_empty_board, is_safe, fill_board, generate_puzzle, count_solutions


def test_create_empty_board_has_9x9_grid():
    board = create_empty_board()
    assert len(board) == SIZE
    assert all(len(row) == SIZE for row in board)
    assert all(cell == EMPTY for row in board for cell in row)


def test_is_safe_rejects_dupes_in_row_column_and_box():
    board = create_empty_board()
    board[0][0] = 5
    board[0][1] = 1
    board[0][2] = 2
    board[1][0] = 3
    board[1][1] = 4
    board[1][2] = 5
    board[2][0] = 6
    board[2][1] = 7
    board[2][2] = 8

    assert is_safe(board, 0, 3, 5) is False
    assert is_safe(board, 3, 3, 5) is True


def test_fill_board_solves_complete_valid_grid():
    board = create_empty_board()
    assert fill_board(board) is True
    assert sum(sum(row) for row in board) > 0

    for row in board:
        assert sorted(row) == list(range(1, SIZE + 1))

    for col in range(SIZE):
        values = [board[row][col] for row in range(SIZE)]
        assert sorted(values) == list(range(1, SIZE + 1))

    for box_row in range(0, SIZE, 3):
        for box_col in range(0, SIZE, 3):
            values = []
            for row in range(box_row, box_row + 3):
                for col in range(box_col, box_col + 3):
                    values.append(board[row][col])
            assert sorted(values) == list(range(1, SIZE + 1))


def test_generate_puzzle_returns_puzzle_and_solution_for_difficulty():
    for difficulty in ("easy", "medium", "hard"):
        puzzle, solution = generate_puzzle(difficulty)
        assert len(puzzle) == SIZE
        assert len(solution) == SIZE
        assert any(cell == EMPTY for row in puzzle for cell in row)
        assert all(cell != EMPTY for row in solution for cell in row)
        assert puzzle != solution
        assert count_solutions(puzzle) == 1


def test_generate_puzzle_respects_expected_clue_ranges():
    easy_puzzle, _ = generate_puzzle("easy")
    medium_puzzle, _ = generate_puzzle("medium")
    hard_puzzle, _ = generate_puzzle("hard")

    assert 35 <= sum(cell != EMPTY for row in easy_puzzle for cell in row) <= 45
    assert 28 <= sum(cell != EMPTY for row in medium_puzzle for cell in row) <= 36
    assert 22 <= sum(cell != EMPTY for row in hard_puzzle for cell in row) <= 30
