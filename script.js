/* ===================================================
   ARCADE HUB — script.js
   All game logic, navigation, and interactions
   =================================================== */

'use strict';

// ─────────────────────────────────────────────
//  GLOBAL STATE
// ─────────────────────────────────────────────
const state = {
  globalScore: 0,
  activeGame: null,
};

// ─────────────────────────────────────────────
//  NAVIGATION
// ─────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  state.activeGame = id.replace('Screen', '');
}

function showHome() {
  stopAllTimers();
  showScreen('homeScreen');
  state.activeGame = null;
}

function stopAllTimers() {
  if (sudoku.timerInterval) clearInterval(sudoku.timerInterval);
  if (memory.timerInterval) clearInterval(memory.timerInterval);
}

// Card buttons → game screens
document.querySelectorAll('.game-card').forEach(card => {
  card.addEventListener('click', () => {
    const game = card.dataset.game;
    showScreen(game + 'Screen');
    launchGame(game);
  });
});

// Back buttons
document.querySelectorAll('[data-back]').forEach(btn => {
  btn.addEventListener('click', showHome);
});

function launchGame(game) {
  const launchers = {
    tictactoe: ttt.init,
    sudoku:    sudoku.init,
    memory:    memory.init,
    rps:       rps.init,
    numguess:  numguess.init,
  };
  if (launchers[game]) launchers[game]();
}

// ─────────────────────────────────────────────
//  THEME TOGGLE
// ─────────────────────────────────────────────
const themeToggle = document.getElementById('themeToggle');
const themeIcon   = document.getElementById('themeIcon');

themeToggle.addEventListener('click', () => {
  const html = document.documentElement;
  const isDark = html.dataset.theme === 'dark';
  html.dataset.theme = isDark ? 'light' : 'dark';
  themeIcon.textContent = isDark ? '☾' : '☀';
});

// ─────────────────────────────────────────────
//  SCORE SYSTEM
// ─────────────────────────────────────────────
function addScore(pts) {
  state.globalScore += pts;
  document.getElementById('scoreValue').textContent = state.globalScore;
  const el = document.getElementById('scoreValue');
  el.classList.remove('flip-in');
  void el.offsetWidth;
  el.classList.add('flip-in');
}

// ─────────────────────────────────────────────
//  WIN OVERLAY
// ─────────────────────────────────────────────
const winOverlay  = document.getElementById('winOverlay');
const winTitle    = document.getElementById('winTitle');
const winSub      = document.getElementById('winSub');
const winEmoji    = document.getElementById('winEmoji');
const winPlayBtn  = document.getElementById('winPlay');
const winHomeBtn  = document.getElementById('winHome');

function showWin({ emoji = '🏆', title = 'YOU WIN!', sub = '', onPlay = null }) {
  winEmoji.textContent  = emoji;
  winTitle.textContent  = title;
  winSub.textContent    = sub;
  winOverlay.classList.remove('hidden');

  winPlayBtn.onclick = () => {
    winOverlay.classList.add('hidden');
    if (onPlay) onPlay();
  };
  winHomeBtn.onclick = () => {
    winOverlay.classList.add('hidden');
    showHome();
  };
}

// ─────────────────────────────────────────────
//  GAME 1 — TIC TAC TOE  (1P vs AI + 2P)
// ─────────────────────────────────────────────
const ttt = (() => {
  let board, currentPlayer, gameActive, vsComputer, difficulty;
  const scores = { X: 0, O: 0, draw: 0 };

  const WIN_COMBOS = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  const statusEl    = document.getElementById('tttStatus');
  const cells       = document.querySelectorAll('.ttt-cell');
  const diffRow     = document.getElementById('tttDifficulty');

  // ── Init ──
  function init() {
    if (vsComputer === undefined) vsComputer = true;
    if (!difficulty) difficulty = 'easy';
    board         = Array(9).fill('');
    currentPlayer = 'X';
    gameActive    = true;
    cells.forEach(c => {
      c.textContent = '';
      c.className   = 'ttt-cell';
      c.disabled    = false;
    });
    updateStatus();
  }

  function updateStatus() {
    if (vsComputer && currentPlayer === 'O') {
      statusEl.textContent = 'Computer is thinking…';
      statusEl.style.color = 'var(--muted)';
    } else {
      const label = vsComputer ? 'Your' : `Player ${currentPlayer}'s`;
      statusEl.textContent = `${label} Turn`;
      statusEl.style.color = currentPlayer === 'X' ? 'var(--accent)' : 'var(--accent2)';
    }
  }

  function updateScoreDisplay() {
    document.getElementById('tttScoreX').textContent    = scores.X;
    document.getElementById('tttScoreO').textContent    = scores.O;
    document.getElementById('tttScoreDraw').textContent = scores.draw;
  }

  // ── Human move ──
  function handleCell(e) {
    const idx = +e.currentTarget.dataset.cell;
    if (!gameActive || board[idx]) return;
    if (vsComputer && currentPlayer === 'O') return; // block clicks during AI turn

    placeMarker(idx, currentPlayer);

    if (!gameActive) return; // game ended in placeMarker

    if (vsComputer && currentPlayer === 'O') {
      // lock board, trigger AI
      cells.forEach(c => c.disabled = true);
      updateStatus();
      setTimeout(doAIMove, 450);
    }
  }

  // ── Place a marker and check result ──
  function placeMarker(idx, player) {
    board[idx] = player;
    cells[idx].textContent = player;
    cells[idx].classList.add(player.toLowerCase());

    const winCombo = checkWin(board);
    if (winCombo) {
      winCombo.forEach(i => cells[i].classList.add('winner'));
      cells.forEach(c => c.disabled = true);
      gameActive = false;
      scores[player]++;
      updateScoreDisplay();

      const winnerLabel = vsComputer
        ? (player === 'X' ? 'YOU WIN! 🎉' : 'COMPUTER WINS!')
        : `PLAYER ${player} WINS! 🎉`;

      statusEl.textContent = winnerLabel;
      statusEl.style.color = 'var(--accent3)';
      addScore(player === 'X' ? 100 : 0);

      setTimeout(() => {
        showWin({
          emoji: player === 'X' ? '❌' : '⭕',
          title: winnerLabel,
          sub: `Score → X: ${scores.X} | O: ${scores.O} | Draws: ${scores.draw}`,
          onPlay: init,
        });
      }, 600);
      return;
    }

    if (board.every(Boolean)) {
      gameActive = false;
      scores.draw++;
      updateScoreDisplay();
      statusEl.textContent = "It's a Draw!";
      statusEl.style.color = 'var(--accent3)';
      setTimeout(() => {
        showWin({
          emoji: '🤝',
          title: "IT'S A DRAW!",
          sub: `Score → X: ${scores.X} | O: ${scores.O} | Draws: ${scores.draw}`,
          onPlay: init,
        });
      }, 400);
      return;
    }

    currentPlayer = player === 'X' ? 'O' : 'X';
    updateStatus();
    if (!vsComputer) cells.forEach(c => { if (!board[+c.dataset.cell]) c.disabled = false; });
  }

  // ── AI dispatcher ──
  function doAIMove() {
    if (!gameActive) return;
    let idx;
    if (difficulty === 'easy')     idx = aiEasy();
    else if (difficulty === 'moderate') idx = aiModerate();
    else                           idx = aiBestMove(board, 'O');

    cells.forEach(c => { if (!board[+c.dataset.cell]) c.disabled = false; });
    placeMarker(idx, 'O');
  }

  // Easy: fully random
  function aiEasy() {
    const empty = board.map((v, i) => v === '' ? i : -1).filter(i => i >= 0);
    return empty[Math.floor(Math.random() * empty.length)];
  }

  // Moderate: win/block 60% of the time, random otherwise
  function aiModerate() {
    if (Math.random() < 0.6) {
      const smart = aiSmartMove();
      if (smart !== -1) return smart;
    }
    return aiEasy();
  }

  // Smart one-step look-ahead: win if possible, else block
  function aiSmartMove() {
    // Try to win
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = 'O';
        if (checkWin(board)) { board[i] = ''; return i; }
        board[i] = '';
      }
    }
    // Try to block
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = 'X';
        if (checkWin(board)) { board[i] = ''; return i; }
        board[i] = '';
      }
    }
    // Prefer center
    if (!board[4]) return 4;
    return -1;
  }

  // Hard: full minimax (unbeatable)
  function aiBestMove(b, player) {
    let bestScore = -Infinity, bestIdx = -1;
    for (let i = 0; i < 9; i++) {
      if (!b[i]) {
        b[i] = 'O';
        const score = minimax(b, 0, false);
        b[i] = '';
        if (score > bestScore) { bestScore = score; bestIdx = i; }
      }
    }
    return bestIdx;
  }

  function minimax(b, depth, isMax) {
    const winner = checkWin(b);
    if (winner) {
      // checkWin returns combo array; we need to know who won
      const w = b[winner[0]];
      return w === 'O' ? 10 - depth : depth - 10;
    }
    if (b.every(Boolean)) return 0;

    if (isMax) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!b[i]) { b[i] = 'O'; best = Math.max(best, minimax(b, depth+1, false)); b[i] = ''; }
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!b[i]) { b[i] = 'X'; best = Math.min(best, minimax(b, depth+1, true)); b[i] = ''; }
      }
      return best;
    }
  }

  // ── Check win on any board snapshot ──
  function checkWin(b) {
    for (const combo of WIN_COMBOS) {
      const [a, c1, c2] = combo;
      if (b[a] && b[a] === b[c1] && b[c1] === b[c2]) return combo;
    }
    return null;
  }

  // ── Mode toggle ──
  document.getElementById('tttVsCPU').addEventListener('click', () => {
    vsComputer = true;
    document.getElementById('tttVsCPU').classList.add('active');
    document.getElementById('tttVsPlayer').classList.remove('active');
    diffRow.classList.remove('hidden');
    Object.assign(scores, { X: 0, O: 0, draw: 0 });
    updateScoreDisplay();
    init();
  });

  document.getElementById('tttVsPlayer').addEventListener('click', () => {
    vsComputer = false;
    document.getElementById('tttVsPlayer').classList.add('active');
    document.getElementById('tttVsCPU').classList.remove('active');
    diffRow.classList.add('hidden');
    Object.assign(scores, { X: 0, O: 0, draw: 0 });
    updateScoreDisplay();
    init();
  });

  // ── Difficulty buttons ──
  diffRow.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      diffRow.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      difficulty = btn.dataset.diff;
      Object.assign(scores, { X: 0, O: 0, draw: 0 });
      updateScoreDisplay();
      init();
    });
  });

  cells.forEach(c => c.addEventListener('click', handleCell));
  document.getElementById('tttRestart').addEventListener('click', init);

  return { init };
})();

// ─────────────────────────────────────────────
//  GAME 2 — SUDOKU
// ─────────────────────────────────────────────
const sudoku = (() => {
  let puzzle, solution, selectedCell;
  let timerInterval, seconds;

  const PUZZLE_BANK = [
    // Easy puzzle
    [
      5,3,0, 0,7,0, 0,0,0,
      6,0,0, 1,9,5, 0,0,0,
      0,9,8, 0,0,0, 0,6,0,

      8,0,0, 0,6,0, 0,0,3,
      4,0,0, 8,0,3, 0,0,1,
      7,0,0, 0,2,0, 0,0,6,

      0,6,0, 0,0,0, 2,8,0,
      0,0,0, 4,1,9, 0,0,5,
      0,0,0, 0,8,0, 0,7,9,
    ],
    // Medium puzzle
    [
      0,0,0, 2,6,0, 7,0,1,
      6,8,0, 0,7,0, 0,9,0,
      1,9,0, 0,0,4, 5,0,0,

      8,2,0, 1,0,0, 0,4,0,
      0,0,4, 6,0,2, 9,0,0,
      0,5,0, 0,0,3, 0,2,8,

      0,0,9, 3,0,0, 0,7,4,
      0,4,0, 0,5,0, 0,3,6,
      7,0,3, 0,1,8, 0,0,0,
    ],
  ];

  const SOLUTIONS = [
    [
      5,3,4, 6,7,8, 9,1,2,
      6,7,2, 1,9,5, 3,4,8,
      1,9,8, 3,4,2, 5,6,7,

      8,5,9, 7,6,1, 4,2,3,
      4,2,6, 8,5,3, 7,9,1,
      7,1,3, 9,2,4, 8,5,6,

      9,6,1, 5,3,7, 2,8,4,
      2,8,7, 4,1,9, 6,3,5,
      3,4,5, 2,8,6, 1,7,9,
    ],
    [
      4,3,5, 2,6,9, 7,8,1,
      6,8,2, 5,7,1, 4,9,3,
      1,9,7, 8,3,4, 5,6,2,

      8,2,6, 1,9,5, 3,4,7,
      3,7,4, 6,8,2, 9,1,5,
      9,5,1, 7,4,3, 6,2,8,

      5,1,9, 3,2,6, 8,7,4,
      2,4,8, 9,5,7, 1,3,6,
      7,6,3, 4,1,8, 2,5,9,
    ],
  ];

  function init() {
    const idx = Math.floor(Math.random() * PUZZLE_BANK.length);
    puzzle   = [...PUZZLE_BANK[idx]];
    solution = [...SOLUTIONS[idx]];
    selectedCell = null;
    seconds = 0;
    clearInterval(timerInterval);
    timerInterval = setInterval(tickTimer, 1000);
    renderGrid();
  }

  function tickTimer() {
    seconds++;
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    document.getElementById('sudokuTimer').textContent = `${m}:${s}`;
  }

  function renderGrid() {
    const grid = document.getElementById('sudokuGrid');
    grid.innerHTML = '';
    puzzle.forEach((val, idx) => {
      const cell = document.createElement('button');
      cell.className = 'sudoku-cell';
      cell.dataset.idx = idx;

      const col = idx % 9;
      const row = Math.floor(idx / 9);
      if (col === 2 || col === 5) cell.classList.add('box-right');
      if (row === 2 || row === 5) cell.classList.add('box-bottom');

      if (val !== 0) {
        cell.textContent = val;
        cell.classList.add('prefilled');
        cell.disabled = true;
      }
      cell.addEventListener('click', () => selectCell(cell, idx));
      grid.appendChild(cell);
    });
  }

  function selectCell(cell, idx) {
    if (cell.classList.contains('prefilled')) return;
    document.querySelectorAll('.sudoku-cell.selected').forEach(c => c.classList.remove('selected'));
    selectedCell = idx;
    cell.classList.add('selected');
  }

  function inputNumber(num) {
    if (selectedCell === null) return;
    if (puzzle[selectedCell] !== 0 && document.querySelector(`.sudoku-cell[data-idx="${selectedCell}"]`).classList.contains('prefilled')) return;

    const cell = document.querySelector(`.sudoku-cell[data-idx="${selectedCell}"]`);
    if (num === 0) {
      puzzle[selectedCell] = 0;
      cell.textContent = '';
      cell.classList.remove('error');
      return;
    }

    puzzle[selectedCell] = num;
    cell.textContent = num;
    if (num !== solution[selectedCell]) {
      cell.classList.add('error');
    } else {
      cell.classList.remove('error');
    }
    checkSudokuWin();
  }

  function checkSudokuWin() {
    const allFilled    = puzzle.every(v => v !== 0);
    const allCorrect   = puzzle.every((v, i) => v === solution[i]);
    if (allFilled && allCorrect) {
      clearInterval(timerInterval);
      addScore(500);
      const m = String(Math.floor(seconds / 60)).padStart(2, '0');
      const s = String(seconds % 60).padStart(2, '0');
      showWin({
        emoji: '🧩',
        title: 'PUZZLE SOLVED!',
        sub: `Completed in ${m}:${s}`,
        onPlay: init,
      });
    }
  }

  function solve() {
    puzzle = [...solution];
    renderGrid();
    clearInterval(timerInterval);
  }

  document.querySelectorAll('.numpad-btn').forEach(btn => {
    btn.addEventListener('click', () => inputNumber(+btn.dataset.num));
  });

  document.getElementById('sudokuNew').addEventListener('click', init);
  document.getElementById('sudokuSolve').addEventListener('click', solve);

  return { init, timerInterval };
})();

// ─────────────────────────────────────────────
//  GAME 3 — MEMORY MATCH
// ─────────────────────────────────────────────
const memory = (() => {
  const EMOJIS = ['🐉','🦊','🌙','⚡','💎','🔥','🎸','🍄'];
  let cards, flipped, matched, moves, timerInterval, seconds, canFlip;

  function init() {
    clearInterval(timerInterval);
    const pairs = [...EMOJIS, ...EMOJIS].sort(() => Math.random() - 0.5);
    cards   = pairs;
    flipped = [];
    matched = [];
    moves   = 0;
    seconds = 0;
    canFlip = true;

    document.getElementById('memMoves').textContent = '0';
    document.getElementById('memPairs').textContent = `0/${EMOJIS.length}`;
    document.getElementById('memTimer').textContent = '00:00';

    timerInterval = setInterval(() => {
      seconds++;
      const m = String(Math.floor(seconds / 60)).padStart(2, '0');
      const s = String(seconds % 60).padStart(2, '0');
      document.getElementById('memTimer').textContent = `${m}:${s}`;
    }, 1000);

    renderGrid();
  }

  function renderGrid() {
    const grid = document.getElementById('memoryGrid');
    grid.innerHTML = '';
    cards.forEach((emoji, idx) => {
      const card = document.createElement('div');
      card.className = 'mem-card';
      card.dataset.idx = idx;
      card.innerHTML = `
        <div class="mem-card-inner">
          <div class="mem-card-back">?</div>
          <div class="mem-card-front">${emoji}</div>
        </div>`;
      card.addEventListener('click', () => flipCard(card, idx, emoji));
      grid.appendChild(card);
    });
  }

  function flipCard(card, idx, emoji) {
    if (!canFlip) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

    card.classList.add('flipped');
    flipped.push({ card, idx, emoji });

    if (flipped.length === 2) {
      canFlip = false;
      moves++;
      document.getElementById('memMoves').textContent = moves;

      if (flipped[0].emoji === flipped[1].emoji) {
        flipped.forEach(({ card: c }) => c.classList.add('matched'));
        matched.push(flipped[0].emoji);
        document.getElementById('memPairs').textContent = `${matched.length}/${EMOJIS.length}`;
        flipped = [];
        canFlip = true;
        addScore(50);

        if (matched.length === EMOJIS.length) {
          clearInterval(timerInterval);
          addScore(200);
          const m = String(Math.floor(seconds / 60)).padStart(2, '0');
          const s = String(seconds % 60).padStart(2, '0');
          showWin({
            emoji: '🃏',
            title: 'ALL MATCHED!',
            sub: `${moves} moves · Time: ${m}:${s}`,
            onPlay: init,
          });
        }
      } else {
        setTimeout(() => {
          flipped.forEach(({ card: c }) => c.classList.remove('flipped'));
          flipped = [];
          canFlip = true;
        }, 900);
      }
    }
  }

  document.getElementById('memoryRestart').addEventListener('click', init);

  return { init, timerInterval };
})();

// ─────────────────────────────────────────────
//  GAME 4 — ROCK PAPER SCISSORS  (1P + 2P, AI difficulty)
// ─────────────────────────────────────────────
const rps = (() => {
  const CHOICES   = { rock: '✊', paper: '✋', scissors: '✌' };
  const BEATS     = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
  const LOSES_TO  = { rock: 'paper',    paper: 'scissors', scissors: 'rock' };

  let scores, vsComputer, p1Choice, rpsDifficulty;
  // Track player's last N choices for hard AI pattern analysis
  let playerHistory = [];

  function init() {
    scores       = { p1: 0, p2: 0 };
    vsComputer   = true;
    p1Choice     = null;
    rpsDifficulty = 'easy';
    playerHistory = [];
    updateUI();
    resetArena();
  }

  function updateUI() {
    document.getElementById('rpsP1Name').textContent = 'PLAYER 1';
    document.getElementById('rpsP2Name').textContent = vsComputer ? 'COMPUTER' : 'PLAYER 2';
    document.getElementById('rpsScore1').textContent = scores.p1;
    document.getElementById('rpsScore2').textContent = scores.p2;

    const btn2      = document.getElementById('rpsButtons2');
    const diffPanel = document.getElementById('rpsDifficulty');
    if (vsComputer) {
      btn2.classList.add('hidden');
      diffPanel.classList.remove('hidden');
    } else {
      btn2.classList.remove('hidden');
      diffPanel.classList.add('hidden');
    }
  }

  function resetArena() {
    document.getElementById('rpsChoice1').textContent = '?';
    document.getElementById('rpsChoice2').textContent = '?';
    document.getElementById('rpsResult').textContent  = 'CHOOSE YOUR WEAPON';
    document.getElementById('rpsTurnLabel').textContent = 'PLAYER 1';
    p1Choice = null;
    setButtonsDisabled(false, 1);
    if (!vsComputer) setButtonsDisabled(false, 2);
  }

  function setButtonsDisabled(disabled, player) {
    document.querySelectorAll(`.rps-btn[data-player="${player}"]`).forEach(b => b.disabled = disabled);
  }

  // ── AI choice based on difficulty ──
  function cpuChoice(playerMove) {
    const opts = Object.keys(CHOICES);

    if (rpsDifficulty === 'easy') {
      // Fully random
      return opts[Math.floor(Math.random() * opts.length)];
    }

    if (rpsDifficulty === 'moderate') {
      // 50% chance of smart play (counter player's last move), else random
      if (playerHistory.length > 0 && Math.random() < 0.5) {
        const last = playerHistory[playerHistory.length - 1];
        return LOSES_TO[last]; // counter what player just played
      }
      return opts[Math.floor(Math.random() * opts.length)];
    }

    // Hard: analyse player's most frequent choice and counter it
    if (rpsDifficulty === 'hard') {
      if (playerHistory.length < 3) {
        // Not enough data — counter current move most of the time
        return Math.random() < 0.8
          ? LOSES_TO[playerMove]
          : opts[Math.floor(Math.random() * opts.length)];
      }
      // Find most frequent choice in player's history
      const freq = { rock: 0, paper: 0, scissors: 0 };
      playerHistory.forEach(c => freq[c]++);
      const mostFreq = Object.keys(freq).reduce((a, b) => freq[a] >= freq[b] ? a : b);
      // 80% counter the predicted move, 20% random to stay unpredictable
      return Math.random() < 0.8
        ? LOSES_TO[mostFreq]
        : opts[Math.floor(Math.random() * opts.length)];
    }
  }

  function resolve(c1, c2) {
    if (c1 === c2) return 'draw';
    if (BEATS[c1] === c2) return 'p1';
    return 'p2';
  }

  function handleChoice(choice, player) {
    if (vsComputer) {
      playerHistory.push(choice);
      if (playerHistory.length > 10) playerHistory.shift(); // keep last 10

      const cpu = cpuChoice(choice);
      document.getElementById('rpsChoice1').textContent = CHOICES[choice];
      document.getElementById('rpsChoice2').textContent = '⏳';
      setButtonsDisabled(true, 1);

      setTimeout(() => {
        document.getElementById('rpsChoice2').textContent = CHOICES[cpu];
        const winner = resolve(choice, cpu);
        let msg;
        if (winner === 'draw') {
          msg = "IT'S A DRAW!";
        } else if (winner === 'p1') {
          scores.p1++;
          msg = 'YOU WIN! 🎉';
          addScore(30);
        } else {
          scores.p2++;
          msg = rpsDifficulty === 'hard' ? 'OUTSMARTED! 🤖' : 'COMPUTER WINS!';
        }
        document.getElementById('rpsResult').textContent = msg;
        document.getElementById('rpsScore1').textContent = scores.p1;
        document.getElementById('rpsScore2').textContent = scores.p2;
        setTimeout(() => resetArena(), 1600);
      }, 600);

    } else {
      // 2-player pass-and-play
      if (player === 1 && !p1Choice) {
        p1Choice = choice;
        document.getElementById('rpsChoice1').textContent = '🤫';
        setButtonsDisabled(true, 1);
        document.getElementById('rpsTurnLabel').textContent = 'PLAYER 2';
      } else if (player === 2 && p1Choice) {
        document.getElementById('rpsChoice1').textContent = CHOICES[p1Choice];
        document.getElementById('rpsChoice2').textContent = CHOICES[choice];
        setButtonsDisabled(true, 2);

        setTimeout(() => {
          const winner = resolve(p1Choice, choice);
          let msg;
          if (winner === 'draw') { msg = "IT'S A DRAW!"; }
          else if (winner === 'p1') { scores.p1++; msg = 'PLAYER 1 WINS! 🎉'; addScore(30); }
          else { scores.p2++; msg = 'PLAYER 2 WINS! 🎉'; addScore(30); }
          document.getElementById('rpsResult').textContent = msg;
          document.getElementById('rpsScore1').textContent = scores.p1;
          document.getElementById('rpsScore2').textContent = scores.p2;
          setTimeout(() => resetArena(), 1500);
        }, 400);
      }
    }
  }

  document.querySelectorAll('.rps-btn').forEach(btn => {
    btn.addEventListener('click', () => handleChoice(btn.dataset.choice, +btn.dataset.player));
  });

  document.getElementById('rpsVsCPU').addEventListener('click', () => {
    vsComputer = true;
    document.getElementById('rpsVsCPU').classList.add('active');
    document.getElementById('rpsVsPlayer').classList.remove('active');
    scores = { p1: 0, p2: 0 };
    playerHistory = [];
    updateUI();
    resetArena();
  });

  document.getElementById('rpsVsPlayer').addEventListener('click', () => {
    vsComputer = false;
    document.getElementById('rpsVsPlayer').classList.add('active');
    document.getElementById('rpsVsCPU').classList.remove('active');
    scores = { p1: 0, p2: 0 };
    updateUI();
    resetArena();
  });

  document.querySelectorAll('[data-rps-diff]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-rps-diff]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      rpsDifficulty = btn.dataset.rpsDiff;
      scores = { p1: 0, p2: 0 };
      playerHistory = [];
      document.getElementById('rpsScore1').textContent = 0;
      document.getElementById('rpsScore2').textContent = 0;
      resetArena();
    });
  });

  document.getElementById('rpsRestart').addEventListener('click', () => {
    scores = { p1: 0, p2: 0 };
    playerHistory = [];
    updateUI();
    resetArena();
  });

  return { init };
})();

// ─────────────────────────────────────────────
//  GAME 5 — NUMBER QUEST
// ─────────────────────────────────────────────
const numguess = (() => {
  let secret, range, attempts, rangeLow, rangeHigh, gameOver;

  function init() {
    range    = 100;
    rangeLow = 1;
    rangeHigh = range;
    newGame();
    document.querySelectorAll('.diff-btn').forEach(b => {
      if (+b.dataset.range === range) b.classList.add('active');
      else b.classList.remove('active');
    });
  }

  function newGame() {
    secret   = Math.floor(Math.random() * range) + 1;
    attempts = 0;
    rangeLow = 1;
    rangeHigh = range;
    gameOver = false;

    document.getElementById('numAttempts').textContent = '0';
    document.getElementById('numFeedback').textContent = "I'm thinking of a number…";
    document.getElementById('numFeedback').style.color = 'var(--text)';
    document.getElementById('numInput').value = '';
    document.getElementById('numInput').disabled = false;
    document.getElementById('numGuessBtn').disabled = false;
    document.getElementById('numHistory').innerHTML = '';
    document.getElementById('numRangeLow').textContent  = 1;
    document.getElementById('numRangeHigh').textContent = range;
    document.getElementById('numInput').max = range;
    document.getElementById('numInput').min = 1;
    document.getElementById('numBarFill').style.transform = 'scaleX(1)';
  }

  function guess() {
    if (gameOver) return;
    const input = document.getElementById('numInput');
    const val   = parseInt(input.value, 10);

    if (isNaN(val) || val < 1 || val > range) {
      document.getElementById('numFeedback').textContent = `Enter a number between 1 and ${range}!`;
      document.getElementById('numFeedback').style.color = 'var(--accent2)';
      return;
    }

    attempts++;
    document.getElementById('numAttempts').textContent = attempts;
    input.value = '';

    const diff = Math.abs(val - secret);
    let hint, hintClass, emoji;

    if (val === secret) {
      gameOver = true;
      document.getElementById('numFeedback').textContent = `🎯 CORRECT! It was ${secret}!`;
      document.getElementById('numFeedback').style.color = 'var(--accent)';
      document.getElementById('numInput').disabled  = true;
      document.getElementById('numGuessBtn').disabled = true;
      const pts = Math.max(100, 500 - attempts * 30);
      addScore(pts);
      addHistoryItem(val, '🎯 CORRECT!', 'hint-warm');
      setTimeout(() => {
        showWin({
          emoji: '🎯',
          title: 'CORRECT!',
          sub: `The number was ${secret}. Solved in ${attempts} attempt${attempts === 1 ? '' : 's'}. +${pts} pts`,
          onPlay: newGame,
        });
      }, 500);
      return;
    }

    if (diff <= Math.ceil(range * 0.05))   { hint = 'SCORCHING HOT 🔥'; hintClass = 'hint-warm'; }
    else if (diff <= Math.ceil(range * 0.1)) { hint = 'VERY WARM 🌡️'; hintClass = 'hint-warm'; }
    else if (diff <= Math.ceil(range * 0.2)) { hint = 'WARM'; hintClass = 'hint-warm'; }
    else if (diff <= Math.ceil(range * 0.4)) { hint = 'COOL'; hintClass = 'hint-low'; }
    else { hint = 'FREEZING COLD 🧊'; hintClass = 'hint-low'; }

    if (val < secret) {
      emoji = '↑ GO HIGHER';
      rangeLow = Math.max(rangeLow, val + 1);
    } else {
      emoji = '↓ GO LOWER';
      rangeHigh = Math.min(rangeHigh, val - 1);
    }

    document.getElementById('numFeedback').textContent = `${emoji} — ${hint}`;
    document.getElementById('numFeedback').style.color = hintClass === 'hint-warm' ? 'var(--accent3)' : 'var(--accent4)';
    document.getElementById('numRangeLow').textContent  = rangeLow;
    document.getElementById('numRangeHigh').textContent = rangeHigh;

    const fillRatio = (rangeHigh - rangeLow + 1) / range;
    document.getElementById('numBarFill').style.transform = `scaleX(${Math.max(0.02, fillRatio)})`;

    addHistoryItem(val, `${emoji} · ${hint}`, hintClass);
  }

  function addHistoryItem(val, msg, cls) {
    const list = document.getElementById('numHistory');
    const li   = document.createElement('li');
    li.innerHTML = `<span>#${attempts} — <strong>${val}</strong></span><span class="${cls}">${msg}</span>`;
    list.prepend(li);
  }

  document.getElementById('numGuessBtn').addEventListener('click', guess);
  document.getElementById('numInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') guess();
  });
  document.getElementById('numRestart').addEventListener('click', newGame);

  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      range = +btn.dataset.range;
      newGame();
    });
  });

  return { init };
})();
