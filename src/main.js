import './style.css';

// ============================================================
// WOPR / JOSHUA TERMINAL — WarGames (1983)
// ============================================================

const output = document.getElementById('output');
const inputLine = document.getElementById('input-line');
const inputEl = document.getElementById('input');
const promptEl = document.getElementById('prompt');
const terminal = document.getElementById('terminal');
const crt = document.getElementById('crt');

// --- Audio: subtle keyboard click via Web Audio API ---
let audioCtx = null;
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playKeyClick() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = 800 + Math.random() * 400;
  osc.type = 'square';
  gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.05);
}

// --- WOPR Audio System: Speech Synthesis + Synth Beeps ---

function speakWOPR(text) {
  if (!('speechSynthesis' in window)) return Promise.resolve();
  return new Promise(resolve => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.75;
    utter.pitch = 0.3;
    utter.volume = 0.8;
    // Try to pick a robotic-sounding voice
    const voices = speechSynthesis.getVoices();
    const robotic = voices.find(v =>
      /alex|daniel|fred|samantha|google/i.test(v.name) && /en/i.test(v.lang)
    );
    if (robotic) utter.voice = robotic;
    utter.onend = resolve;
    utter.onerror = resolve;
    speechSynthesis.speak(utter);
    // Fallback timeout in case onend never fires
    setTimeout(resolve, text.length * 120 + 2000);
  });
}

function playWOPRBeep(freq = 800, duration = 0.15, volume = 0.08) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = freq;
  osc.type = 'square';
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + duration);
}

function playComputingBeeps(count = 5, interval = 100) {
  if (!audioCtx) return Promise.resolve();
  return new Promise(resolve => {
    let i = 0;
    const id = setInterval(() => {
      playWOPRBeep(400 + Math.random() * 1200, 0.06, 0.05);
      i++;
      if (i >= count) { clearInterval(id); resolve(); }
    }, interval);
  });
}

// Continuous computing noise for war simulation
let computeNoiseInterval = null;
function startComputeNoise() {
  if (computeNoiseInterval) return;
  computeNoiseInterval = setInterval(() => {
    if (audioCtx) {
      playWOPRBeep(200 + Math.random() * 2000, 0.04, 0.02);
    }
  }, 150);
}
function stopComputeNoise() {
  if (computeNoiseInterval) { clearInterval(computeNoiseInterval); computeNoiseInterval = null; }
}

// --- Skip system: press Space or Enter to skip typing and jump to next input ---
let skipRequested = false;
document.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Escape') {
    // Only skip if input isn't focused (so we don't eat space in text input)
    if (document.activeElement !== inputEl) {
      skipRequested = true;
    }
  }
});

// --- Utility ---
function sleep(ms) {
  return new Promise(r => {
    if (skipRequested) { r(); return; }
    const id = setTimeout(r, ms);
    // Allow skip to resolve early
    const check = setInterval(() => {
      if (skipRequested) { clearTimeout(id); clearInterval(check); r(); }
    }, 30);
    setTimeout(() => clearInterval(check), ms + 10);
  });
}

function scrollToBottom() {
  terminal.scrollTop = terminal.scrollHeight;
}

function addLine(text, className = '') {
  const div = document.createElement('div');
  div.className = 'line' + (className ? ' ' + className : '');
  div.textContent = text;
  output.appendChild(div);
  scrollToBottom();
}

function addHTML(html, className = '') {
  const div = document.createElement('div');
  div.className = 'line' + (className ? ' ' + className : '');
  div.innerHTML = html;
  output.appendChild(div);
  scrollToBottom();
}

async function typeText(text, speed = 35, className = '') {
  const div = document.createElement('div');
  div.className = 'line' + (className ? ' ' + className : '');
  output.appendChild(div);
  if (skipRequested) {
    div.textContent = text;
    scrollToBottom();
    skipRequested = false;
    return div;
  }
  for (let i = 0; i < text.length; i++) {
    if (skipRequested) {
      div.textContent = text;
      scrollToBottom();
      skipRequested = false;
      return div;
    }
    div.textContent += text[i];
    scrollToBottom();
    if (text[i] !== ' ') playKeyClick();
    await sleep(speed);
  }
  return div;
}

async function typeLines(lines, speed = 35, lineDelay = 100, className = '') {
  for (const line of lines) {
    await typeText(line, speed, className);
    await sleep(lineDelay);
  }
}

function clearScreen() {
  output.innerHTML = '';
}

function showInput(prompt = '') {
  promptEl.textContent = prompt;
  inputLine.style.display = 'flex';
  inputEl.value = '';
  inputEl.focus();
  scrollToBottom();
}

function hideInput() {
  inputLine.style.display = 'none';
}

function waitForInput(prompt = '') {
  return new Promise(resolve => {
    showInput(prompt);
    function handler(e) {
      if (e.key === 'Enter') {
        const val = inputEl.value.trim();
        inputEl.removeEventListener('keydown', handler);
        hideInput();
        addLine(prompt + val);
        resolve(val);
      }
    }
    inputEl.addEventListener('keydown', handler);
  });
}

function isAffirmative(s) {
  const v = s.toUpperCase();
  return ['YES', 'Y', 'YEA', 'YEAH', 'YEP', 'OK', 'OKAY', 'SURE', 'ABSOLUTELY', 'AFFIRMATIVE', 'OF COURSE', 'LETS PLAY', "LET'S PLAY", 'PLEASE', 'YA'].includes(v);
}

// Keep focus on input when clicking anywhere
document.addEventListener('click', () => {
  if (inputLine.style.display !== 'none') {
    inputEl.focus();
  }
});

// Init audio on first interaction
document.addEventListener('keydown', () => initAudio(), { once: true });
document.addEventListener('click', () => initAudio(), { once: true });

// Key click sound while typing
inputEl.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') playKeyClick();
});

// ============================================================
// GAME SEQUENCES
// ============================================================

async function bootSequence() {
  const bootLines = [
    'NORAD COMPUTER SYSTEMS',
    '(C) 1983 DATAPOINT CORPORATION',
    '',
    'INITIALIZING SYSTEM...',
    '',
    'MEMORY CHECK: 65536K OK',
    'PROCESSOR: DATAPOINT 8800 ONLINE',
    'COMMUNICATION LINK: ACTIVE',
    '',
    'LOADING WOPR CORE MODULES...',
    '  STRATEGIC DEFENSE MODULE........... LOADED',
    '  EARLY WARNING SYSTEM............... LOADED',
    '  MISSILE TRACKING NETWORK........... LOADED',
    '  SCENARIO ANALYSIS ENGINE........... LOADED',
    '  LEARNING COMPUTER INTERFACE........ LOADED',
    '',
    'PRIMARY SENSOR ARRAY: ONLINE',
    'SATELLITE UPLINK: CONNECTED',
    'CRYSTAL PALACE LINK: ESTABLISHED',
    '',
    'WAR OPERATION PLAN RESPONSE',
    'SYSTEM VERSION 3.4.12',
    'CLASSIFICATION: TOP SECRET / SCI',
    '',
    '========================================',
    '',
  ];

  for (const line of bootLines) {
    if (line === '') {
      addLine('');
      await sleep(80);
    } else if (line.startsWith('  ')) {
      await typeText(line, 15, 'dim');
      await sleep(40);
    } else if (line === '========================================') {
      addLine(line, 'dim');
      await sleep(200);
    } else {
      await typeText(line, 20);
      await sleep(100);
    }
  }

  await sleep(500);
}

async function loginSequence() {
  let attempts = 0;
  const maxAttempts = 3;

  while (true) {
    const input = await waitForInput('LOGON: ');
    const upper = input.toUpperCase();

    if (upper === 'JOSHUA' || upper === 'PROFESSOR FALKEN' || upper === 'FALKEN') {
      await sleep(300);
      addLine('');
      await sleep(200);
      return true;
    }

    attempts++;
    await sleep(300);
    await typeText('IDENTIFICATION NOT RECOGNIZED BY SYSTEM', 30, 'warning');
    await typeText('--CONNECTION TERMINATED--', 30, 'dim');
    addLine('');

    if (attempts === 2) {
      await sleep(600);
      await typeText('HINT: THINK OF THE CREATOR\'S SON...', 40, 'dim');
      addLine('');
    }

    if (attempts >= maxAttempts) {
      await sleep(800);
      addLine('');
      await typeText('...', 300);
      await sleep(500);
      await typeText('IS THAT YOU, PROFESSOR?', 40);
      await sleep(1000);
      addLine('');
      return true;
    }

    await sleep(500);
  }
}

async function greetingSequence() {
  await typeText('GREETINGS PROFESSOR FALKEN.', 60, 'highlight');
  await sleep(1500);
  addLine('');
  await typeText("IT'S BEEN A LONG TIME. CAN YOU EXPLAIN", 40);
  await typeText('THE REMOVAL OF YOUR USER ACCOUNT ON', 40);
  await typeText('6/23/73?', 40);
  addLine('');
  await sleep(500);

  const response = await waitForInput('> ');
  addLine('');
  await sleep(500);

  await typeText('SHALL WE PLAY A GAME?', 60, 'highlight');
  speakWOPR('Shall we play a game?');
  addLine('');
  await sleep(300);

  const answer = await waitForInput('> ');

  if (!isAffirmative(answer)) {
    addLine('');
    await typeText("C'MON, PROFESSOR. LET'S PLAY A GAME.", 40);
    addLine('');
    await sleep(300);
    await waitForInput('> ');
  }

  addLine('');
  return true;
}

async function gameListSequence() {
  await typeText('HOW ABOUT:', 40);
  addLine('');

  const games = [
    '  CHESS',
    '  POKER',
    '  FIGHTER COMBAT',
    '  GUERRILLA ENGAGEMENT',
    '  DESERT WARFARE',
    '  AIR-TO-GROUND ACTIONS',
    '  THEATERWIDE TACTICAL WARFARE',
    '  THEATERWIDE BIOTOXIC AND CHEMICAL WARFARE',
    '',
    '  GLOBAL THERMONUCLEAR WAR',
  ];

  for (const game of games) {
    if (game === '') {
      addLine('');
      await sleep(100);
    } else if (game.includes('GLOBAL THERMONUCLEAR WAR')) {
      await typeText(game, 30, 'highlight');
      await sleep(100);
    } else {
      await typeText(game, 20, 'dim');
      await sleep(80);
    }
  }

  addLine('');
  const choice = await waitForInput('> ');
  const upper = choice.toUpperCase();

  if (upper.includes('CHESS')) {
    addLine('');
    await typeText('LATER. LET\'S PLAY GLOBAL THERMONUCLEAR WAR.', 40, 'highlight');
    addLine('');
    await sleep(800);
    return 'GTW';
  }

  if (!upper.includes('GLOBAL') && !upper.includes('THERMONUCLEAR') && !upper.includes('WAR') && !upper.includes('GTW')) {
    addLine('');
    await typeText('WOULDN\'T YOU PREFER A NICE GAME OF', 40);
    await typeText('GLOBAL THERMONUCLEAR WAR?', 50, 'highlight');
    addLine('');
    await sleep(500);
    const answer2 = await waitForInput('> ');
    addLine('');

    if (!isAffirmative(answer2)) {
      await typeText('FINE. GLOBAL THERMONUCLEAR WAR IT IS.', 40, 'highlight');
      addLine('');
      await sleep(500);
    }
  }

  addLine('');
  return 'GTW';
}

async function sideSelectionSequence() {
  await typeText('WHICH SIDE DO YOU WANT?', 40);
  addLine('');
  await typeText('  1.  UNITED STATES', 30);
  await typeText('  2.  SOVIET UNION', 30);
  addLine('');

  const choice = await waitForInput('PLEASE CHOOSE ONE: ');
  addLine('');
  await sleep(500);

  const upper = choice.toUpperCase();
  if (upper === '2' || upper.includes('SOVIET') || upper.includes('USSR') || upper.includes('RUSSIA')) {
    return 'SOVIET UNION';
  }
  return 'UNITED STATES';
}

// ============================================================
// WAR SIMULATION
// ============================================================

const WORLD_MAP = [
  '                          . _..::__:  ,-"-"._        |7       ,     _,.__            ',
  '                  _.___ _ _<_>`!(._`.`-.    /         _._     `_ ,_/  \'  \'-._.---.--\'',
  '                .{     " " `-==,',
  '                 \\_.---._ )  =googl/    _    `) ^.googl     __.googl  ==googl ',
  '                          `-googl      _googl       \'      googl',
];

// Simplified ASCII world map for the war display
const MAP_LINES = [
  '         __         _                                                          ',
  '     ___/  \\__  ___/ \\___          ____                                        ',
  '    /         \\/         \\    ____/    \\___           ___    _____              ',
  '   |   N.AMERICA  |      \\__/   EUROPE   \\___      /   \\__/ ASIA \\___         ',
  '   |              |         |              |  \\    |               |   \\        ',
  '    \\    *W.DC    |         |  *MOSCOW     |   |   |   *BEIJING   |    |       ',
  '     \\           /     *    |              |   |    \\             /    /        ',
  '      \\___  ___/    LONDON  \\___      ___/    |     \\___   ___/    /          ',
  '          \\/                    \\    /         |         \\_/       /            ',
  '         / \\                     |  |  MIDDLE |                  /              ',
  '        / S.\\                    |  |  EAST * |    INDIA *      |               ',
  '       / AMER\\                   |   \\________|              ___/               ',
  '      |   ICA \\                  |            |    _________/                   ',
  '       \\    *  |                  \\   AFRICA  |   / S.E.                        ',
  '        \\BRAS /                    \\    *     |  |  ASIA                        ',
  '         \\__/                       \\  LAGOS /    \\                             ',
  '                                     \\_____/      \\___  AUSTRALIA               ',
  '                                                      \\    *                    ',
  '                                                       \\__SYDNEY_/              ',
];

const TARGETS_US = [
  { name: 'MOSCOW', row: 5, col: 42, delay: 0 },
  { name: 'LENINGRAD', row: 3, col: 48, delay: 2000 },
  { name: 'BEIJING', row: 5, col: 62, delay: 3500 },
  { name: 'LONDON', row: 6, col: 33, delay: 1500 },
  { name: 'LAGOS', row: 15, col: 42, delay: 5000 },
];

const TARGETS_USSR = [
  { name: 'WASHINGTON DC', row: 5, col: 12, delay: 0 },
  { name: 'NEW YORK', row: 4, col: 16, delay: 1500 },
  { name: 'LOS ANGELES', row: 6, col: 5, delay: 2500 },
  { name: 'LONDON', row: 6, col: 33, delay: 3000 },
  { name: 'BRASILIA', row: 13, col: 14, delay: 4500 },
];

function renderMap(hits, missiles) {
  let lines = MAP_LINES.map(l => l);
  let html = '';

  for (let r = 0; r < lines.length; r++) {
    let lineHtml = '';
    for (let c = 0; c < lines[r].length; c++) {
      let isHit = false;
      let isMissile = false;

      for (const h of hits) {
        const dr = Math.abs(r - h.row);
        const dc = Math.abs(c - h.col);
        if (dr <= 1 && dc <= 2) {
          isHit = true;
          break;
        }
      }

      if (!isHit) {
        for (const m of missiles) {
          const dr = Math.abs(r - m.row);
          const dc = Math.abs(c - m.col);
          if (dr <= 0 && dc <= 1) {
            isMissile = true;
            break;
          }
        }
      }

      const ch = lines[r][c] || ' ';
      if (isHit) {
        lineHtml += `<span class="explosion">${ch === ' ' ? '*' : '#'}</span>`;
      } else if (isMissile) {
        lineHtml += `<span class="missile">${ch === ' ' ? '.' : ch}</span>`;
      } else {
        lineHtml += ch;
      }
    }
    html += lineHtml + '\n';
  }
  return html;
}

async function warSimulation(side) {
  const attacker = side === 'SOVIET UNION' ? 'SOVIET' : 'UNITED STATES';
  const targets = side === 'SOVIET UNION' ? TARGETS_USSR : TARGETS_US;

  await typeText(`AWAITING FIRST STRIKE COMMAND`, 30, 'warning');
  addLine('');
  await sleep(800);
  startComputeNoise();
  await typeText(`${attacker} FIRST STRIKE INITIATED`, 30, 'red');
  addLine('');
  await sleep(500);

  // Create persistent war display panel that updates in place
  const warPanel = document.createElement('div');
  warPanel.className = 'war-panel';

  const defconLine = document.createElement('div');
  defconLine.className = 'line';
  warPanel.appendChild(defconLine);

  const statusLine = document.createElement('div');
  statusLine.className = 'line';
  warPanel.appendChild(statusLine);

  const mapDiv = document.createElement('div');
  mapDiv.className = 'line world-map';
  warPanel.appendChild(mapDiv);

  const impactLine = document.createElement('div');
  impactLine.className = 'line';
  warPanel.appendChild(impactLine);

  const casualtyLine = document.createElement('div');
  casualtyLine.className = 'line';
  warPanel.appendChild(casualtyLine);

  output.appendChild(warPanel);
  scrollToBottom();

  // DEFCON countdown
  const defconLevels = [5, 4, 3, 2, 1];
  let currentTargetIdx = 0;
  const hits = [];
  let totalCasualties = 0;

  for (let d = 0; d < defconLevels.length; d++) {
    const defcon = defconLevels[d];

    // Update DEFCON inline
    defconLine.innerHTML = `<span class="defcon defcon-${defcon}">*** DEFCON ${defcon} ***</span>`;
    scrollToBottom();
    await sleep(600);

    // Launch missiles at targets
    if (currentTargetIdx < targets.length) {
      const target = targets[currentTargetIdx];
      statusLine.innerHTML = `<span class="warning">TRAJECTORY COMPUTED: TARGET ${target.name}</span>`;
      mapDiv.innerHTML = renderMap(hits, [target]);
      scrollToBottom();
      await sleep(800);

      // Impact
      hits.push(target);
      totalCasualties += Math.floor(Math.random() * 20000000) + 5000000;
      impactLine.innerHTML = `<span class="red">*** IMPACT: ${target.name} ***</span>`;
      mapDiv.innerHTML = renderMap(hits, []);
      casualtyLine.innerHTML = `<span class="red">ESTIMATED CASUALTIES: ${totalCasualties.toLocaleString()}</span>`;
      scrollToBottom();
      currentTargetIdx++;
      await sleep(600);

      // Second target per defcon if available
      if (currentTargetIdx < targets.length && defcon <= 3) {
        const target2 = targets[currentTargetIdx];
        statusLine.innerHTML = `<span class="warning">MULTIPLE LAUNCH DETECTED: TARGET ${target2.name}</span>`;
        mapDiv.innerHTML = renderMap(hits, [target2]);
        scrollToBottom();
        await sleep(600);

        hits.push(target2);
        totalCasualties += Math.floor(Math.random() * 20000000) + 5000000;
        impactLine.innerHTML = `<span class="red">*** IMPACT: ${target2.name} ***</span>`;
        mapDiv.innerHTML = renderMap(hits, []);
        casualtyLine.innerHTML = `<span class="red">ESTIMATED CASUALTIES: ${totalCasualties.toLocaleString()}</span>`;
        scrollToBottom();
        currentTargetIdx++;
        await sleep(400);
      }
    }

    if (defcon === 1) {
      statusLine.innerHTML = `<span class="red">RETALIATION STRIKE DETECTED</span>`;
      await sleep(500);
      statusLine.innerHTML = `<span class="red">COUNTER-STRIKE LAUNCHED</span>`;
      await sleep(500);
      statusLine.innerHTML = `<span class="red">ALL-OUT NUCLEAR EXCHANGE IN PROGRESS</span>`;
      await sleep(600);

      // Final map with everything hit
      const finalHits = [...targets];
      mapDiv.innerHTML = renderMap(finalHits, []);
      scrollToBottom();
      await sleep(800);

      defconLine.innerHTML = `<span class="defcon defcon-1">*** GLOBAL THERMONUCLEAR WAR ***</span>`;
      impactLine.innerHTML = '';
      casualtyLine.innerHTML = `<span class="red">ESTIMATED TOTAL CASUALTIES: 592,000,000</span>`;
      scrollToBottom();
      await sleep(1000);
    }

    await sleep(400);
  }

  stopComputeNoise();
  await sleep(1500);
  return true;
}

// ============================================================
// TIC-TAC-TOE SEQUENCE
// ============================================================

function renderTTTBoard(board) {
  const rows = [];
  for (let r = 0; r < 3; r++) {
    const cells = [];
    for (let c = 0; c < 3; c++) {
      cells.push(board[r * 3 + c] || ' ');
    }
    rows.push(` ${cells[0]} | ${cells[1]} | ${cells[2]} `);
    if (r < 2) rows.push('---+---+---');
  }
  return rows.join('\n');
}

function checkWinner(board) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a,b,c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return board.every(c => c) ? 'DRAW' : null;
}

function minimax(board, isX) {
  const winner = checkWinner(board);
  if (winner === 'X') return { score: 1 };
  if (winner === 'O') return { score: -1 };
  if (winner === 'DRAW') return { score: 0 };

  const moves = [];
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      const newBoard = [...board];
      newBoard[i] = isX ? 'X' : 'O';
      const result = minimax(newBoard, !isX);
      moves.push({ index: i, score: result.score });
    }
  }

  if (isX) {
    moves.sort((a, b) => b.score - a.score);
  } else {
    moves.sort((a, b) => a.score - b.score);
  }
  return moves[0];
}

// --- Generate a random board state at a given fill level ---
function generateRandomBoard(fillLevel) {
  const board = Array(9).fill(null);
  const positions = [0,1,2,3,4,5,6,7,8];
  // Shuffle
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  const count = Math.min(fillLevel, 9);
  for (let i = 0; i < count; i++) {
    board[positions[i]] = i % 2 === 0 ? 'X' : 'O';
  }
  return board;
}

// --- Render a mini board as HTML for the matrix grid ---
function renderMiniBoardHTML(board, colorClass) {
  let html = '';
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const val = board[r * 3 + c];
      if (val === 'X') html += `<span class="ttt-x">${val}</span>`;
      else if (val === 'O') html += `<span class="ttt-o">${val}</span>`;
      else html += '\u00B7';
      if (c < 2) html += '|';
    }
    if (r < 2) html += '\n-+-+-\n';
    else html += '\n';
  }
  return html;
}

async function ticTacToeSequence() {
  await typeText('A STRANGE GAME.', 60, 'highlight');
  await sleep(800);
  addLine('');
  await typeText('ANALYZING POSSIBLE OUTCOMES...', 40);
  addLine('');
  await sleep(500);

  // --- FRANTIC TIC-TAC-TOE MATRIX ---
  // Hide normal terminal content and show fullscreen matrix overlay
  const overlay = document.createElement('div');
  overlay.id = 'ttt-overlay';
  overlay.innerHTML = '';
  crt.appendChild(overlay);

  // Hide terminal content
  terminal.style.display = 'none';

  const COLS = 5;
  const ROWS = 5;
  const TOTAL = COLS * ROWS;

  // Create the grid
  const grid = document.createElement('div');
  grid.className = 'ttt-grid';
  overlay.appendChild(grid);

  const cells = [];
  for (let i = 0; i < TOTAL; i++) {
    const cell = document.createElement('div');
    cell.className = 'ttt-cell';
    const boardEl = document.createElement('pre');
    boardEl.className = 'ttt-mini-board';
    cell.appendChild(boardEl);
    const label = document.createElement('div');
    label.className = 'ttt-cell-label';
    label.textContent = `GAME ${i + 1}`;
    cell.appendChild(label);
    grid.appendChild(cell);
    // Initialize with a random board so all cells show content immediately
    const initialBoard = generateRandomBoard(Math.floor(Math.random() * 9) + 1);
    boardEl.innerHTML = renderMiniBoardHTML(initialBoard);
    cells.push({ el: cell, boardEl, label, board: initialBoard, moveIndex: 0, done: false });
  }

  // Start computing beeps
  startComputeNoise();

  // Animate the frenzy over ~11 seconds using setInterval for reliability
  const FRENZY_DURATION = 11000;
  const startTime = Date.now();

  await new Promise(resolve => {
    const intervalId = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / FRENZY_DURATION, 1);

      // Update ALL cells every tick
      for (let idx = 0; idx < TOTAL; idx++) {
        const c = cells[idx];
        const fillLevel = Math.floor(Math.random() * 9) + 1;
        c.board = generateRandomBoard(fillLevel);

        let txt = '';
        for (let r = 0; r < 3; r++) {
          for (let col = 0; col < 3; col++) {
            const val = c.board[r * 3 + col];
            txt += val || '\u00B7';
            if (col < 2) txt += '|';
          }
          if (r < 2) txt += '\n-+-+-\n';
          else txt += '\n';
        }
        c.boardEl.textContent = txt;

        // Flash effects
        const rand = Math.random();
        if (progress > 0.7 && rand > 0.5) {
          c.el.style.background = 'rgba(255,255,255,0.3)';
          c.boardEl.style.color = '#fff';
        } else if (progress > 0.4 && rand > 0.6) {
          c.el.style.background = 'rgba(255,170,0,0.15)';
          c.boardEl.style.color = '#ffaa00';
        } else {
          c.el.style.background = '';
          c.boardEl.style.color = '';
        }

        // Labels
        const result = checkWinner(c.board);
        if (result === 'DRAW') {
          c.label.textContent = 'DRAW';
          c.label.style.color = '#ffcc33';
        } else if (result === 'X' || result === 'O') {
          c.label.textContent = `WIN: ${result}`;
          c.label.style.color = '#ff3333';
        } else {
          c.label.textContent = `GAME ${idx + 1}`;
          c.label.style.color = '';
        }
      }

      // Screen shake in the last 4 seconds
      if (progress > 0.6) {
        const intensity = (progress - 0.6) * 15;
        const dx = (Math.random() - 0.5) * intensity;
        const dy = (Math.random() - 0.5) * intensity;
        overlay.style.transform = `translate(${dx}px, ${dy}px)`;
      }

      // Flicker
      if (progress > 0.5 && Math.random() > 0.85) {
        overlay.style.opacity = '0.3';
        setTimeout(() => { overlay.style.opacity = '1'; }, 50);
      }

      if (progress >= 1) {
        clearInterval(intervalId);
        resolve();
      }
    }, 80); // Update every 80ms (~12fps) — reliable and visible

    // Safety timeout: always resolve after duration + buffer
    setTimeout(() => { clearInterval(intervalId); resolve(); }, FRENZY_DURATION + 500);
  });

  stopComputeNoise();

  // --- HARD CUT TO BLACK ---
  overlay.innerHTML = '';
  overlay.style.transform = 'none';
  overlay.style.opacity = '1';
  overlay.style.background = '#000';
  overlay.className = 'ttt-overlay-black';

  // 2 seconds of silence / black
  await sleep(2000);

  // --- Slowly type out the final lines on the black overlay ---
  const finaleContainer = document.createElement('div');
  finaleContainer.className = 'ttt-finale';
  overlay.appendChild(finaleContainer);

  async function finaleType(text, speed = 80) {
    const line = document.createElement('div');
    line.className = 'ttt-finale-line';
    finaleContainer.appendChild(line);
    for (let i = 0; i < text.length; i++) {
      line.textContent += text[i];
      if (text[i] !== ' ') playKeyClick();
      await sleep(speed);
    }
    return line;
  }

  await finaleType('WINNER: NONE', 90);
  await sleep(1500);
  await finaleType('');
  await finaleType('A STRANGE GAME.', 100);
  speakWOPR('A strange game. The only winning move is not to play.');
  await sleep(1800);
  await finaleType('THE ONLY WINNING MOVE IS NOT TO PLAY.', 70);
  await sleep(2500);
  await finaleType('');
  await finaleType('HOW ABOUT A NICE GAME OF CHESS?', 80);
  speakWOPR('How about a nice game of chess?');
  await sleep(3000);

  // Clean up overlay, restore terminal
  overlay.remove();
  terminal.style.display = '';
  clearScreen();
}

async function finalMessage() {
  addLine('');
  await sleep(500);
  await typeText('A STRANGE GAME.', 80, 'highlight');
  await sleep(1200);
  await typeText('THE ONLY WINNING MOVE IS NOT TO PLAY.', 60, 'highlight');
  await sleep(2000);
  addLine('');
  await typeText('HOW ABOUT A NICE GAME OF CHESS?', 60, 'highlight');
  addLine('');
  await sleep(1000);

  // Allow restart
  const response = await waitForInput('> ');
  addLine('');
  if (response.toUpperCase().includes('YES') || response.toUpperCase() === 'Y') {
    await typeText('RESETTING SYSTEM...', 30);
    await sleep(1000);
    clearScreen();
    startGame();
  } else {
    await typeText('GOODBYE, PROFESSOR FALKEN.', 50, 'highlight');
    await sleep(500);
    await typeText('', 0);
    showInput('LOGON: ');
    // Allow re-login
    const reInput = await waitForInput('LOGON: ');
    hideInput();
    clearScreen();
    startGame();
  }
}

// ============================================================
// OTHER GAMES (brief responses for non-GTW selections)
// ============================================================

async function playOtherGame(gameName) {
  await typeText(`LOADING ${gameName}...`, 30);
  await sleep(800);
  addLine('');
  await typeText(`${gameName} IS CURRENTLY UNAVAILABLE.`, 30, 'warning');
  await typeText('WOULDN\'T YOU PREFER A NICE GAME OF', 30);
  await typeText('GLOBAL THERMONUCLEAR WAR?', 40, 'highlight');
  addLine('');
  await waitForInput('> ');
  addLine('');
  return 'GTW';
}

// ============================================================
// MAIN GAME LOOP
// ============================================================

async function startGame() {
  await bootSequence();
  await loginSequence();
  await greetingSequence();
  await gameListSequence();

  const side = await sideSelectionSequence();
  await warSimulation(side);
  await ticTacToeSequence();
  await finalMessage();
}

// Start — require user interaction first to unlock audio
async function init() {
  const startOverlay = document.createElement('div');
  startOverlay.id = 'start-overlay';
  startOverlay.innerHTML = '<div class="start-text">CLICK TO INITIATE CONNECTION</div><div class="start-sub">WOPR SYSTEM v4.0F</div>';
  startOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:100;cursor:pointer;';
  startOverlay.querySelector('.start-text') || null;
  document.body.appendChild(startOverlay);

  // Style the text
  const texts = startOverlay.querySelectorAll('div');
  texts[0].style.cssText = "font-family:'VT323',monospace;font-size:28px;color:#33ff33;text-shadow:0 0 12px rgba(51,255,51,0.5);animation:blink 1.2s infinite;";
  texts[1].style.cssText = "font-family:'VT323',monospace;font-size:14px;color:rgba(51,255,51,0.4);margin-top:16px;";

  await new Promise(resolve => {
    startOverlay.addEventListener('click', () => {
      initAudio();
      startOverlay.remove();
      resolve();
    }, { once: true });
    startOverlay.addEventListener('touchstart', () => {
      initAudio();
      startOverlay.remove();
      resolve();
    }, { once: true });
  });

  startGame();
}

init();
