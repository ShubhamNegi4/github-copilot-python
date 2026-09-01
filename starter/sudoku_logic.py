import copy
import random

SIZE = 9
BOX_SIZE = 3
EMPTY = 0
DIFFICULTY_CLUES = {
    "easy": 40,
    "medium": 32,
    "hard": 26,
}


def deep_copy(board):
    return copy.deepcopy(board)


def create_empty_board():
    return [[EMPTY for _ in range(SIZE)] for _ in range(SIZE)]


def is_safe(board, row, col, num):
    if not 1 <= num <= SIZE:
        return False

    for index in range(SIZE):
        if board[row][index] == num or board[index][col] == num:
            return False

    start_row = row - row % BOX_SIZE
    start_col = col - col % BOX_SIZE
    for row_offset in range(BOX_SIZE):
        for col_offset in range(BOX_SIZE):
            if board[start_row + row_offset][start_col + col_offset] == num:
                return False
    return True


def find_empty_cell(board):
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                return row, col
    return None


def fill_board(board):
    empty_cell = find_empty_cell(board)
    if empty_cell is None:
        return True

    row, col = empty_cell
    for candidate in random.sample(range(1, SIZE + 1), SIZE):
        if is_safe(board, row, col, candidate):
            board[row][col] = candidate
            if fill_board(board):
                return True
            board[row][col] = EMPTY
    return False


def count_solutions(board, limit=2):
    working_board = deep_copy(board)
    solutions = 0

    def backtrack():
        nonlocal solutions
        if solutions >= limit:
            return

        empty_cell = find_empty_cell(working_board)
        if empty_cell is None:
            solutions += 1
            return

        row, col = empty_cell
        for num in range(1, SIZE + 1):
            if is_safe(working_board, row, col, num):
                working_board[row][col] = num
                backtrack()
                working_board[row][col] = EMPTY
                if solutions >= limit:
                    return

    backtrack()
    return solutions


def generate_puzzle(difficulty="easy"):
    difficulty_key = (difficulty or "easy").lower()
    target_clues = DIFFICULTY_CLUES.get(difficulty_key, DIFFICULTY_CLUES["easy"])

    board = create_empty_board()
    if not fill_board(board):
        raise ValueError("Unable to generate a valid Sudoku board.")

    solution = deep_copy(board)
    puzzle = deep_copy(board)
    cells = [(row, col) for row in range(SIZE) for col in range(SIZE)]
    random.shuffle(cells)

    while sum(cell != EMPTY for row in puzzle for cell in row) > target_clues:
        row, col = cells.pop()
        previous = puzzle[row][col]
        puzzle[row][col] = EMPTY
        if count_solutions(puzzle) != 1:
            puzzle[row][col] = previous

    return puzzle, solution
