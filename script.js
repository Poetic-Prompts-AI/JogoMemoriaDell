/* ====== Elementos ====== */
const overlay = document.getElementById('loginOverlay');
const form = document.getElementById('loginForm');
const erro = document.getElementById('loginErro');
const gameContainer = document.getElementById('gameContainer');
const playerDisplay = document.getElementById('player');
const logoBtn = document.getElementById('logoBtn');

const resultOverlay = document.getElementById('resultOverlay');
const lastResult = document.getElementById('lastResult');
const btnVoltar = document.getElementById('btnVoltar');
const btnSalvarBaixar = document.getElementById('btnSalvarBaixar');

const nomeInput = document.getElementById('nome');
const empresaInput = document.getElementById('empresa');

/* ====== Pré-preenche (sem auto-login) ====== */
(function prefillSaved() {
  try {
    const raw = localStorage.getItem('jogador_memoria');
    if (!raw) return;
    const dados = JSON.parse(raw);
    if (dados?.nome) nomeInput.value = dados.nome;
    if (dados?.empresa) empresaInput.value = dados.empresa;
  } catch (_) {}
})();

/* Validações */
function validarNome(nome) {
  return typeof nome === 'string' && nome.trim().length >= 3;
}
function validarEmpresa(empresa) {
  return typeof empresa === 'string' && empresa.trim().length >= 2;
}

/* Fullscreen pela logo */
logoBtn.addEventListener('click', async () => {
  const elem = document.documentElement;
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen?.();
    } else {
      await (elem.requestFullscreen?.() ||
             elem.webkitRequestFullscreen?.() ||
             elem.msRequestFullscreen?.());
    }
  } catch (_) {}
});

/* Login */
form.addEventListener('submit', (e) => {
  e.preventDefault();
  erro.classList.add('hidden');

  const nome = nomeInput.value.trim();
  const empresa = empresaInput.value.trim();

  if (!validarNome(nome) || !validarEmpresa(empresa)) {
    erro.textContent = 'Informe um nome e uma empresa válidos.';
    erro.classList.remove('hidden');
    return;
  }

  localStorage.setItem('jogador_memoria', JSON.stringify({ nome, empresa, ts: Date.now() }));
  liberarJogo(nome);
});

function liberarJogo(nome) {
  overlay.classList.add('hidden');
  resultOverlay.classList.add('hidden');
  gameContainer.classList.remove('hidden');
  playerDisplay.textContent = `Jogador: ${nome}`;
  initGame(nome);
}

/* Botões finais */
btnVoltar.addEventListener('click', () => {
  overlay.classList.remove('hidden');
  resultOverlay.classList.add('hidden');
  gameContainer.classList.add('hidden');
});

/* Salvar + Baixar JSON no final */
function salvarEBaixarDados() {
  let nome = nomeInput?.value?.trim() || '';
  let empresa = empresaInput?.value?.trim() || '';

  const salvo = JSON.parse(localStorage.getItem('jogador_memoria') || '{}');
  if (!nome && salvo?.nome) nome = salvo.nome;
  if (!empresa && salvo?.empresa) empresa = salvo.empresa;

  const payload = { nome: nome || '', empresa: empresa || '', ts: Date.now() };
  try { localStorage.setItem('jogador_memoria', JSON.stringify(payload)); } catch (_) {}

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'dados_jogador.json';
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  a.remove();
}
btnSalvarBaixar?.addEventListener('click', salvarEBaixarDados);

/* ====== Jogo da Memória ====== */
function initGame(nomeJogador) {
  const cardsArray = [
    '01.png','02.png','03.png','04.png',
    '05.png','06.png','07.png','08.png'
  ];
  let cards = [...cardsArray, ...cardsArray].sort(() => 0.5 - Math.random());

  const gameBoard = document.getElementById('gameBoard');
  const scoreDisplay = document.getElementById('score');
  const timerDisplay = document.getElementById('timer');
  const winMessage = document.getElementById('winMessage');

  let revealedCards = [];
  let matched = [];
  let score = 0;
  let startTime = Date.now();
  let gameEnded = false;
  const maxTime = 30;

  gameBoard.innerHTML = '';
  winMessage.classList.add('hidden');
  scoreDisplay.textContent = 'Pontos: 0';
  timerDisplay.textContent = `Tempo: ${maxTime}s`;

  const timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const remaining = maxTime - elapsed;
    timerDisplay.textContent = `Tempo: ${remaining}s`;
    if (remaining <= 0 && !gameEnded) endGame(false);
  }, 1000);

  function createBoard() {
    cards.forEach((symbol, index) => {
      const card = document.createElement('div');
      card.classList.add('card');               // verso vem do CSS (CONTRA.png)
      card.dataset.symbol = symbol;
      card.dataset.index = index;
      card.addEventListener('click', flipCard);
      gameBoard.appendChild(card);
    });
  }

  function flipCard() {
    const card = this;
    if (gameEnded ||
        revealedCards.length >= 2 ||
        card.classList.contains('revealed') ||
        card.classList.contains('matched')) return;

    const img = document.createElement('img');
    img.src = card.dataset.symbol;
    img.alt = 'carta';
    card.innerHTML = '';
    card.appendChild(img);
    card.classList.add('revealed');  // esconde o verso via CSS
    revealedCards.push(card);

    if (revealedCards.length === 2) checkMatch();
  }

  function checkMatch() {
    const [first, second] = revealedCards;

    if (first.dataset.symbol === second.dataset.symbol) {
      first.classList.add('matched');
      second.classList.add('matched');
      matched.push(first.dataset.symbol);
      score += 10;
    } else {
      score = Math.max(0, score - 2);
    }

    scoreDisplay.textContent = `Pontos: ${score}`;

    setTimeout(() => {
      revealedCards.forEach(card => {
        if (!card.classList.contains('matched')) {
          card.innerHTML = '';
          card.classList.remove('revealed'); // volta a mostrar o verso
        }
      });
      revealedCards = [];
      checkWin();
    }, 800);
  }

  function checkWin() {
    if (matched.length === cardsArray.length) endGame(true);
  }

  function endGame(victory) {
    gameEnded = true;
    clearInterval(timerInterval);
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const msg = victory
      ? `Parabéns! Você venceu com ${score} pontos em ${elapsed}s.`
      : `Tempo esgotado! Você fez ${score} pontos.`;

    showFinal(msg);
  }

  function showFinal(text) {
    lastResult.textContent = text;
    gameContainer.classList.add('hidden');
    overlay.classList.add('hidden');
    resultOverlay.classList.remove('hidden');
  }

  createBoard();
}

