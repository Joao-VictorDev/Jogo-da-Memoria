// gamer.js
document.addEventListener('DOMContentLoaded', () => {
  // Configurações do jogo
  const gameConfig = {
      emojis: ['🍎', '🍎', '🍌', '🍌', '🍒', '🍒', '🍓', '🍓',
              '🍉', '🍉', '🍇', '🍇', '🍍', '🍍', '🍑', '🍑'],
      initialTime: '00:00',
      initialMoves: 0
  };

  // Estado do jogo
  const gameState = {
      cards: [],
      flippedCards: [],
      matchedCards: [],
      moves: gameConfig.initialMoves,
      timer: 0,
      isPlaying: false,
      timerInterval: null
  };

  // Elementos da UI
  const UI = {
      board: document.getElementById('game-board'),
      restartBtn: document.getElementById('restart-btn'),
      movesDisplay: document.getElementById('moves'),
      timerDisplay: document.getElementById('timer'),
      winScreen: document.getElementById('win-screen'),
      finalTime: document.getElementById('final-time'),
      finalMoves: document.getElementById('final-moves'),
      playAgainBtn: document.getElementById('play-again-btn'),
      fireworksCanvas: document.getElementById('fireworks-canvas')
  };

  // Sistema de áudio
  const audioSystem = {
      background: new Howl({
          src: ['sounds/fundo.mp3'],
          volume: 0.4,
          loop: true
      }),
      
      playBackground() {
          this.background.play();
      },
      
      stopBackground() {
          this.background.stop();
      }
  };

  // Inicialização do jogo
  function initGame() {
      setupGameBoard();
      setupEventListeners();
      audioSystem.playBackground();
  }

  // Configura o tabuleiro
  function setupGameBoard() {
      gameState.cards = shuffleArray([...gameConfig.emojis]);
      renderBoard();
      resetGameState();
  }

  // Embaralha as cartas
  function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
  }

  // Renderiza o tabuleiro
  function renderBoard() {
      UI.board.innerHTML = '';
      
      gameState.cards.forEach((emoji, index) => {
          const card = document.createElement('div');
          card.className = 'card';
          card.dataset.index = index;
          card.dataset.value = emoji;
          card.innerHTML = `
              <div class="card-face card-back"></div>
              <div class="card-face card-front">${emoji}</div>
          `;
          card.addEventListener('click', () => handleCardClick(card));
          UI.board.appendChild(card);
      });
  }

  // Reseta o estado do jogo
  function resetGameState() {
      gameState.flippedCards = [];
      gameState.matchedCards = [];
      gameState.moves = gameConfig.initialMoves;
      gameState.timer = 0;
      gameState.isPlaying = false;
      
      clearInterval(gameState.timerInterval);
      UI.movesDisplay.textContent = gameConfig.initialMoves;
      UI.timerDisplay.textContent = gameConfig.initialTime;
      UI.winScreen.style.display = 'none';
  }

  // Manipulador de clique na carta
  function handleCardClick(card) {
      if (!canFlipCard(card)) return;
      
      flipCard(card);
      
      if (gameState.flippedCards.length === 2) {
          gameState.moves++;
          UI.movesDisplay.textContent = gameState.moves;
          setTimeout(checkForMatch, 500);
      }
  }

  // Verifica se a carta pode ser virada
  function canFlipCard(card) {
      return (
          !card.classList.contains('flipped') && 
          !gameState.matchedCards.includes(card) &&
          gameState.flippedCards.length < 2
      );
  }

  // Vira a carta
  function flipCard(card) {
      card.classList.add('flipped');
      gameState.flippedCards.push(card);
      
      if (!gameState.isPlaying) {
          startGameTimer();
      }
  }

  // Inicia o temporizador
  function startGameTimer() {
      gameState.isPlaying = true;
      gameState.timerInterval = setInterval(() => {
          gameState.timer++;
          updateTimerDisplay();
      }, 1000);
  }

  // Atualiza o display do tempo
  function updateTimerDisplay() {
      const minutes = Math.floor(gameState.timer / 60).toString().padStart(2, '0');
      const seconds = (gameState.timer % 60).toString().padStart(2, '0');
      UI.timerDisplay.textContent = `${minutes}:${seconds}`;
  }

  // Verifica por combinação
  function checkForMatch() {
      const [card1, card2] = gameState.flippedCards;
      
      if (card1.dataset.value === card2.dataset.value) {
          handleMatch(card1, card2);
      } else {
          handleMismatch(card1, card2);
      }
  }

  // Manipula acerto
  function handleMatch(card1, card2) {
      gameState.matchedCards.push(card1, card2);
      card1.classList.add('matched');
      card2.classList.add('matched');
      gameState.flippedCards = [];
      
      if (gameState.matchedCards.length === gameState.cards.length) {
          endGame();
      }
  }

  // Manipula erro
  function handleMismatch(card1, card2) {
      setTimeout(() => {
          card1.classList.remove('flipped');
          card2.classList.remove('flipped');
          gameState.flippedCards = [];
      }, 500);
  }

  // Finaliza o jogo
  function endGame() {
      clearInterval(gameState.timerInterval);
      gameState.isPlaying = false;
      audioSystem.stopBackground();
      
      UI.finalTime.textContent = UI.timerDisplay.textContent;
      UI.finalMoves.textContent = gameState.moves;
      UI.winScreen.style.display = 'flex';
      
      startFireworks();
  }

  // Fogos de artifício
  function startFireworks() {
      const canvas = UI.fireworksCanvas;
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      class Firework {
          constructor() {
              this.reset();
          }
          
          reset() {
              this.x = Math.random() * canvas.width;
              this.y = canvas.height;
              this.speed = 2 + Math.random() * 3;
              this.size = 2;
              this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
              this.particles = [];
              this.exploded = false;
          }
          
          update() {
              if (!this.exploded) {
                  this.y -= this.speed;
                  if (this.y <= canvas.height * 0.6) {
                      this.explode();
                  }
              }
              
              this.particles.forEach((p, i) => {
                  p.update();
                  if (p.alpha <= 0) this.particles.splice(i, 1);
              });
              
              if (this.exploded && this.particles.length === 0) {
                  this.reset();
              }
          }
          
          explode() {
              this.exploded = true;
              for (let i = 0; i < 100; i++) {
                  this.particles.push(new Particle(this.x, this.y, this.color));
              }
          }
          
          draw() {
              if (!this.exploded) {
                  ctx.beginPath();
                  ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                  ctx.fillStyle = this.color;
                  ctx.fill();
              }
              
              this.particles.forEach(p => p.draw(ctx));
          }
      }

      class Particle {
          constructor(x, y, color) {
              this.x = x;
              this.y = y;
              this.color = color;
              this.velocity = {
                  x: -5 + Math.random() * 10,
                  y: -5 + Math.random() * 10
              };
              this.alpha = 1;
              this.decay = 0.015 + Math.random() * 0.02;
              this.size = 2 + Math.random() * 2;
          }
          
          update() {
              this.x += this.velocity.x;
              this.y += this.velocity.y;
              this.velocity.y += 0.05;
              this.alpha -= this.decay;
          }
          
          draw(ctx) {
              ctx.save();
              ctx.globalAlpha = this.alpha;
              ctx.beginPath();
              ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
              ctx.fillStyle = this.color;
              ctx.fill();
              ctx.restore();
          }
      }

      const fireworks = Array(5).fill().map(() => new Firework());

      function animate() {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          fireworks.forEach(f => {
              f.update();
              f.draw();
          });
          
          if (UI.winScreen.style.display === 'flex') {
              requestAnimationFrame(animate);
          }
      }
      
      animate();
  }

  // Configura listeners de eventos
  function setupEventListeners() {
      UI.restartBtn.addEventListener('click', resetGame);
      UI.playAgainBtn.addEventListener('click', resetGame);
      
      window.addEventListener('resize', () => {
          if (UI.winScreen.style.display === 'flex') {
              UI.fireworksCanvas.width = window.innerWidth;
              UI.fireworksCanvas.height = window.innerHeight;
          }
      });
  }

  // Reinicia o jogo
  function resetGame() {
      audioSystem.stopBackground();
      setupGameBoard();
      audioSystem.playBackground();
  }

  // Inicia o jogo
  initGame();
});