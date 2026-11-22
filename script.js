
const $ = s => document.querySelector(s);

const boardEl = $('#board');
const padEl = $('#pad');
const dog = $('#dog');

const CLUES = {
  easy: 42,
  medium: 34,
  hard: 28
};

const cells = [];
const padBtns = [];

let sol, grid, given, sel, lives, secs, tick, over, moodTimer;

const pick = a => a[Math.random() * a.length | 0];

const fmt = s =>
  String(s / 60 | 0).padStart(2, '0') + ':' +
  String(s % 60).padStart(2, '0');

const shuffle = a => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.random() * (i + 1) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const bandShuffle = () =>
  shuffle([0, 1, 2]).flatMap(g =>
    shuffle([0, 1, 2]).map(k => g * 3 + k)
  );

// GENERATOR SOLUSI SUDOKU
function makeSolution() {
  const rows = bandShuffle();
  const cols = bandShuffle();
  const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const out = [];

  for (const r of rows) {
    for (const c of cols) {
      out.push(
        nums[(3 * (r % 3) + (r / 3 | 0) + c) % 9]
      );
    }
  }

  return out;
}

const related = (a, b) =>
  (a / 9 | 0) === (b / 9 | 0) ||
  a % 9 === b % 9 ||
  (
    (a / 27 | 0) === (b / 27 | 0) &&
    (a % 9 / 3 | 0) === (b % 9 / 3 | 0)
  );

const full = idx => idx.every(k => grid[k] === sol[k]);

const nine = f => [...Array(9)].map((_, k) => f(k));

function partDone(i) {
  const r = i / 9 | 0;
  const c = i % 9;
  const b0 = (r / 3 | 0) * 27 + (c / 3 | 0) * 3;

  return (
    full(nine(k => r * 9 + k)) ||
    full(nine(k => k * 9 + c)) ||
    full(nine(k => b0 + (k / 3 | 0) * 9 + k % 3))
  );
}

// KARAKTER ANJING
const DOG =
  '<div class="ear l"></div><div class="ear r"></div>' +
  '<div class="head">' +
  '<i class="eye l"></i><i class="eye r"></i>' +
  '<b class="cheek l"></b><b class="cheek r"></b>' +
  '<div class="muzzle"></div>' +
  '<div class="nose"></div>' +
  '<div class="tongue"></div>' +
  '</div><div class="bandana"></div>';

document.querySelectorAll('.dog').forEach(d => {
  d.innerHTML = DOG;
});

function mood(m, text) {
  dog.className = 'dog ' + m;

  if (text) {
    $('#bubble').textContent = text;
  }

  clearTimeout(moodTimer);

  if (m !== 'cheer') {
    moodTimer = setTimeout(() => {
      dog.className = 'dog';
    }, 1500);
  }
}

// MEMBUAT PAPAN SUDOKU
for (let i = 0; i < 81; i++) {
  const r = i / 9 | 0;
  const c = i % 9;
  const el = document.createElement('button');

  el.className =
    'cell b' + ((r / 3 | 0) * 3 + (c / 3 | 0));

  el.onclick = () => {
    sel = i;
    refresh();
  };

  boardEl.append(el);
  cells.push(el);
}

// MEMBUAT TOMBOL ANGKA
for (let n = 1; n <= 9; n++) {
  const b = document.createElement('button');

  b.innerHTML = n + '<small></small>';

  b.onclick = () => place(n);

  padEl.append(b);
  padBtns.push(b);
}

// NYAWA
function showLives() {
  $('#lives').innerHTML =
    '🦴'.repeat(lives) +
    '<s>🦴</s>'.repeat(3 - lives);
}

// MEMPERBARUI PAPAN
function refresh() {
  const sv = sel == null ? 0 : grid[sel];

  cells.forEach((el, i) => {
    el.textContent = grid[i] || '';

    el.classList.toggle('given', given[i]);
    el.classList.toggle('sel', i === sel);

    el.classList.toggle(
      'peer',
      sel != null && i !== sel && related(i, sel)
    );

    el.classList.toggle(
      'same',
      !!sv && i !== sel && grid[i] === sv
    );
  });

  padBtns.forEach((b, k) => {
    const left =
      9 - grid.filter(v => v === k + 1).length;

    b.disabled = left === 0 || over;

    b.querySelector('small').textContent =
      left || '';
  });

  showLives();
}

// ANIMASI
function anim(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);

  setTimeout(() => {
    el.classList.remove(cls);
  }, 450);
}

// ATURAN PERMAINAN
function place(n) {
  if (
    over ||
    sel == null ||
    given[sel] ||
    grid[sel] === sol[sel]
  ) return;

  const el = cells[sel];

  if (n === sol[sel]) {
    grid[sel] = n;

    refresh();
    anim(el, 'pop');

    if (grid.every((v, i) => v === sol[i])) {
      return finish(true);
    }

    mood(
      'happy',
      partDone(sel)
        ? pick([
            'Wuf wuf! Satu bagian beres!',
            'Guk guk! Rapi banget!'
          ])
        : pick([
            'Guk guk! Betul!',
            'Pintar banget~',
            'Wuf! Mantap!'
          ])
    );

  } else {
    lives--;

    showLives();

    el.textContent = n;
    anim(el, 'wrong');

    setTimeout(refresh, 450);

    if (lives <= 0) {
      return finish(false);
    }

    mood(
      'sad',
      pick([
        'Kuing... bukan itu.',
        'Hmm, aku ragu nih.',
        'Aduh, nyaris!'
      ])
    );
  }
}

// FITUR BOCORAN
function hint() {
  if (over) return;

  if (sel == null || grid[sel] === sol[sel]) {
    const empty = grid
      .map((v, i) => (v ? -1 : i))
      .filter(i => i >= 0);

    if (!empty.length) return;

    sel = pick(empty);
  }

  grid[sel] = sol[sel];

  refresh();
  anim(cells[sel], 'pop');

  if (grid.every((v, i) => v === sol[i])) {
    return finish(true);
  }

  mood('happy', 'Ini bocoran dari aku, guk!');
}

// MENYELESAIKAN PERMAINAN
function finish(won) {
  over = true;

  clearInterval(tick);
  refresh();

  mood(won ? 'cheer' : 'sad');

  $('#winTitle').textContent =
    won
      ? 'Yeay, kamu menang! 🎉'
      : 'Kuing, tulangnya habis 🥺';

  $('#winText').textContent =
    won
      ? 'Selesai dalam ' + fmt(secs)
      : 'Tenang, coba lagi yuk!';

  $('#bubble').textContent =
    won
      ? 'Guk guk guk!! Kamu hebat!'
      : 'Aku tetap sayang kamu~';

  if (won) {
    confetti();
  }

  setTimeout(() => {
    $('#win').classList.remove('hidden');
  }, 700);
}

// MEMULAI PERMAINAN BARU
function newGame() {
  sol = makeSolution();

  grid = Array(81).fill(0);
  given = Array(81).fill(false);

  shuffle([...Array(81).keys()])
    .slice(0, CLUES[$('#level').value])
    .forEach(i => {
      grid[i] = sol[i];
      given[i] = true;
    });

  sel = null;
  lives = 3;
  secs = 0;
  over = false;

  $('#timer').textContent = '00:00';

  clearInterval(tick);

  tick = setInterval(() => {
    secs++;
    $('#timer').textContent = fmt(secs);
  }, 1000);

  $('#win').classList.add('hidden');

  mood('happy', 'Guk! Yuk isi angkanya bareng aku!');

  refresh();
}

// PINDAH HALAMAN
function show(screen) {
  $('#home').classList.toggle(
    'hidden',
    screen !== 'home'
  );

  $('#game').classList.toggle(
    'hidden',
    screen !== 'game'
  );

  window.scrollTo(0, 0);
}

// CONFETTI KEMENANGAN
function confetti() {
  for (let i = 0; i < 70; i++) {
    const s = document.createElement('span');

    s.className = 'cf';

    s.textContent = pick([
      '🎉', '🦴', '🐾', '⭐', '💖'
    ]);

    s.style.cssText =
      `left:${Math.random() * 100}vw;` +
      `font-size:${14 + Math.random() * 16}px;` +
      `animation-duration:${2 + Math.random() * 2}s;` +
      `animation-delay:${Math.random()}s`;

    document.body.append(s);

    setTimeout(() => s.remove(), 5500);
  }
}

// HIASAN LATAR
for (let i = 0; i < 14; i++) {
  const s = document.createElement('span');

  s.textContent = pick([
    '🦴', '🐾', '☁️', '⭐', '✨'
  ]);

  s.style.cssText =
    `left:${Math.random() * 100}%;` +
    `font-size:${16 + Math.random() * 20}px;` +
    `animation-duration:${14 + Math.random() * 14}s;` +
    `animation-delay:${-Math.random() * 20}s`;

  $('#bg').append(s);
}

// KONTROL PERMAINAN
document.querySelectorAll('.go').forEach(b => {
  b.onclick = () => {
    $('#level').value = b.dataset.level;

    show('game');
    newGame();
  };
});

$('#back').onclick = () => {
  clearInterval(tick);
  show('home');
};

$('#hint').onclick = hint;
$('#new').onclick = newGame;
$('#again').onclick = newGame;

$('#level').onchange = newGame;

// KONTROL KEYBOARD
document.addEventListener('keydown', e => {
  if ($('#game').classList.contains('hidden')) {
    return;
  }

  if (e.key >= '1' && e.key <= '9') {
    return place(+e.key);
  }

  const move = {
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: -9,
    ArrowDown: 9
  }[e.key];

  if (move) {
    e.preventDefault();

    const n = (sel ?? 40) + move;

    if (
      n >= 0 &&
      n < 81 &&
      !(move === -1 && sel % 9 === 0) &&
      !(move === 1 && sel % 9 === 8)
    ) {
      sel = n;
      refresh();
    }
  }
});
