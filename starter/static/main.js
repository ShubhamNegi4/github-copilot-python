const STORAGE_KEY = 'sudoku-top-10';
const SIZE = 9;

let solution = [];
let difficulty = 'easy';
let timerId = null;
let elapsedSeconds = 0;
let hintsUsed = 0;

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function setMessage(text, tone = 'info') {
  const message = document.getElementById('message');
  message.textContent = text;
  message.dataset.tone = tone;
}

function startTimer() {
  stopTimer();
  timerId = window.setInterval(() => {
    elapsedSeconds += 1;
    document.getElementById('timer').textContent = formatTime(elapsedSeconds);
  }, 1000);
}

function stopTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

function collectBoard() {
  const board = [];
  const inputs = document.querySelectorAll('.sudoku-cell');

  for (let row = 0; row < SIZE; row += 1) {
    board[row] = [];
    for (let col = 0; col < SIZE; col += 1) {
      const input = inputs[row * SIZE + col];
      const value = input.value.trim();
      board[row][col] = value ? Number(value) : 0;
    }
  }

  return board;
}

function syncDifficultyLabel() {
  const label = document.getElementById('difficulty-label');
  const select = document.getElementById('difficulty-select');
  const value = select.value;
  label.textContent = value.charAt(0).toUpperCase() + value.slice(1);
  difficulty = value;
}

function buildBoard() {
  const boardDiv = document.getElementById('sudoku-board');
  boardDiv.innerHTML = '';

  for (let row = 0; row < SIZE; row += 1) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'sudoku-row';

    for (let col = 0; col < SIZE; col += 1) {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.inputMode = 'numeric';
      input.className = 'sudoku-cell';
      input.dataset.row = String(row);
      input.dataset.col = String(col);
      input.setAttribute('aria-label', `Row ${row + 1} column ${col + 1}`);

      const boxTheme = (Math.floor(row / 3) + Math.floor(col / 3)) % 2 === 0 ? 'box-light' : 'box-dark';
      input.classList.add(boxTheme);

      input.addEventListener('input', (event) => {
        const value = event.target.value.replace(/[^1-9]/g, '').slice(0, 1);
        event.target.value = value;
        const rowIndex = Number(event.target.dataset.row);
        const colIndex = Number(event.target.dataset.col);

        event.target.classList.remove('invalid', 'valid');
        if (!value) {
          return;
        }

        if (Number(value) === solution[rowIndex][colIndex]) {
          event.target.classList.add('valid');
        } else {
          event.target.classList.add('invalid');
        }
      });

      rowDiv.appendChild(input);
    }

    boardDiv.appendChild(rowDiv);
  }
}

function renderPuzzle(board) {
  const inputs = document.querySelectorAll('.sudoku-cell');

  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const input = inputs[row * SIZE + col];
      const value = board[row][col];
      input.value = value === 0 ? '' : String(value);
      input.disabled = value !== 0;
      input.classList.remove('prefilled', 'hint', 'invalid', 'valid');
      input.classList.add(value !== 0 ? 'prefilled' : 'editable');
    }
  }
}

function renderScoreboard() {
  const list = document.getElementById('scoreboard-list');
  const scores = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

  list.innerHTML = '';

  if (!scores.length) {
    const emptyItem = document.createElement('li');
    emptyItem.textContent = 'No scores yet';
    list.appendChild(emptyItem);
    return;
  }

  scores.slice(0, 10).forEach((entry, index) => {
    const item = document.createElement('li');
    item.innerHTML = `<span>#${index + 1}</span><strong>${entry.name}</strong><span>${entry.difficulty}</span><span>${formatTime(entry.time)}</span>`;
    list.appendChild(item);
  });
}

function getTopScores() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveScore(name, time, difficultyName) {
  const scores = getTopScores();
  scores.push({
    name,
    time,
    difficulty: difficultyName,
    hints: hintsUsed,
  });

  scores.sort((left, right) => left.time - right.time || left.hints - right.hints);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores.slice(0, 10)));
  renderScoreboard();
}

async function newGame() {
  try {
    const response = await fetch(`/new?difficulty=${encodeURIComponent(difficulty)}`);
    const data = await response.json();
    solution = data.solution;
    renderPuzzle(data.puzzle);
    elapsedSeconds = 0;
    hintsUsed = 0;
    document.getElementById('timer').textContent = formatTime(elapsedSeconds);
    document.getElementById('hint-count').textContent = String(hintsUsed);
    setMessage('New puzzle ready. Good luck!', 'success');
    startTimer();
  } catch (error) {
    setMessage('Unable to load a new puzzle.', 'error');
  }
}

async function requestHint() {
  try {
    const response = await fetch('/hint');
    const data = await response.json();

    if (data.error) {
      setMessage(data.error, 'error');
      return;
    }

    const input = document.querySelector(`.sudoku-cell[data-row="${data.row}"][data-col="${data.col}"]`);
    if (!input) {
      return;
    }

    input.value = String(data.value);
    input.disabled = true;
    input.classList.remove('invalid', 'valid');
    input.classList.add('hint', 'prefilled');
    hintsUsed += 1;
    document.getElementById('hint-count').textContent = String(hintsUsed);
    setMessage(`Hint placed at row ${data.row + 1}, column ${data.col + 1}.`, 'success');
  } catch (error) {
    setMessage('Unable to provide a hint right now.', 'error');
  }
}

async function checkSolution() {
  const board = collectBoard();

  try {
    const response = await fetch('/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ board }),
    });
    const data = await response.json();

    if (data.error) {
      setMessage(data.error, 'error');
      return;
    }

    const inputs = document.querySelectorAll('.sudoku-cell');
    const wrongCells = new Set(data.incorrect.map(([row, col]) => `${row}-${col}`));

    inputs.forEach((input) => {
      const row = Number(input.dataset.row);
      const col = Number(input.dataset.col);
      const isFixed = input.disabled && input.classList.contains('prefilled');
      input.classList.remove('invalid', 'valid', 'hint');

      // Skip prefilled cells—they are always correct
      if (isFixed) {
        return;
      }

      // Any incorrect cell (including empty ones) should be marked red
      if (wrongCells.has(`${row}-${col}`)) {
        input.classList.add('invalid');
      } else if (input.value) {
        // Only mark non-empty correct cells as valid
        input.classList.add('valid');
      }
    });

    if (data.solved) {
      stopTimer();
      setMessage(`Solved! Final time: ${formatTime(elapsedSeconds)}.`, 'success');
      const playerName = window.prompt('Congratulations! Enter your name for the Top 10 leaderboard:', 'Player');
      if (playerName && playerName.trim()) {
        saveScore(playerName.trim(), elapsedSeconds, difficulty);
      }
      return;
    }

    setMessage('Some entries are incorrect. Keep going!', 'error');
  } catch (error) {
    setMessage('Could not validate the puzzle.', 'error');
  }
}

function toggleTheme() {
  const body = document.body;
  const nextTheme = body.dataset.theme === 'dark' ? 'light' : 'dark';
  body.dataset.theme = nextTheme;
  localStorage.setItem('sudoku-theme', nextTheme);
  document.getElementById('dark-toggle').textContent = nextTheme === 'dark' ? 'Light mode' : 'Dark mode';
}

window.addEventListener('load', () => {
  const preferredTheme = localStorage.getItem('sudoku-theme') || 'light';
  document.body.dataset.theme = preferredTheme;
  document.getElementById('dark-toggle').textContent = preferredTheme === 'dark' ? 'Light mode' : 'Dark mode';

  buildBoard();
  renderScoreboard();
  syncDifficultyLabel();

  document.getElementById('difficulty-select').addEventListener('change', () => {
    syncDifficultyLabel();
    newGame();
  });

  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('check-solution').addEventListener('click', checkSolution);
  document.getElementById('hint-button').addEventListener('click', requestHint);
  document.getElementById('dark-toggle').addEventListener('click', toggleTheme);

  newGame();
});