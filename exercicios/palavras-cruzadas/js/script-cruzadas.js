// Dados das palavras cruzadas em formato JSON
const crosswordData = [
    {
        "pergunta": "Capital da França",
        "resposta": "PARIS",
        "dica": "Cidade do amor"
    },
    {
        "pergunta": "Maior planeta do sistema solar",
        "resposta": "JUPITER",
        "dica": "Nome do deus romano do céu e do trovão"
    },
    {
        "pergunta": "Linguagem de programação desta aplicação",
        "resposta": "JAVASCRIPT",
        "dica": "Não confundir com Java"
    },
    {
        "pergunta": "Animal conhecido como 'rei da selva'",
        "resposta": "LEAO",
        "dica": "Vive em grupos chamados 'alcateias'"
    },
    {
        "pergunta": "Cor do céu em um dia claro",
        "resposta": "AZUL",
        "dica": "Cor do mar em um dia de sol"
    },
    {
        "pergunta": "Autor de Dom Quixote",
        "resposta": "CERVANTES",
        "dica": "Escritor espanhol do século XVI"
    },
    {
        "pergunta": "País da Torre Eiffel",
        "resposta": "FRANCA",
        "dica": "Também conhecido por seus vinhos"
    },
    {
        "pergunta": "Satélite natural da Terra",
        "resposta": "LUA",
        "dica": "Responsável pelas marés"
    },
    {
        "pergunta": "Principal componente do Sol",
        "resposta": "HIDROGENIO",
        "dica": "Elemento mais abundante no universo"
    },
    {
        "pergunta": "Instrumento musical de teclas",
        "resposta": "PIANO",
        "dica": "Inventado por Bartolomeo Cristofori"
    }
];

// Classe para representar a grade de palavras cruzadas
class Crossword {
    constructor(data) {
        this.words = data.map(item => ({
            question: item.pergunta,
            answer: item.resposta.toUpperCase(),
            hint: item.dica || '',
            placed: false,
            x: 0,
            y: 0,
            direction: 0, // 0 = horizontal, 1 = vertical
            number: 0,
            userAnswer: null,
            revealedLetters: 0
        }));

        this.gridSize = 15;
        this.grid = this.createGrid();
        this.numberedGrid = [];
        this.currentNumber = 1;
        this.startTime = null;
        this.timerInterval = null;
        this.hintCount = 0;
        this.completed = false;
        this.resizeTimeout = null;
    }

    // ========== Métodos de inicialização ==========
    
    // Cria uma grade vazia
    createGrid() {
        return Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(null));
    }

    // Inicializa os eventos
    initEvents() {
        document.getElementById('checkAnswers').addEventListener('click', () => this.checkAnswers());
        
        document.getElementById('resetGame').addEventListener('click', () => {
            this.showConfirmation('Tem certeza que deseja reiniciar o jogo? Todo o progresso será perdido.', 
                () => this.resetGame());
        });
        
        document.getElementById('hintButton').addEventListener('click', () => {
            this.showConfirmation('Deseja revelar uma letra como dica?', 
                () => this.giveHint());
        });

        // Adiciona evento para tecla Enter verificar respostas
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.checkAnswers();
            }
        });
    }

    // Mostra modal de confirmação
    showConfirmation(message, confirmCallback) {
        const modal = document.getElementById('confirmationModal');
        document.getElementById('modalMessage').textContent = message;
        modal.style.display = 'block';
        
        document.getElementById('modalConfirm').onclick = () => {
            modal.style.display = 'none';
            confirmCallback();
        };
        
        document.getElementById('modalCancel').onclick = () => {
            modal.style.display = 'none';
        };
    }

    // ========== Temporizador ==========
    
    // Inicia o timer
    startTimer() {
        this.startTime = new Date();
        this.timerInterval = setInterval(() => this.updateTimer(), 1000);
    }

    // Atualiza o timer
    updateTimer() {
        if (!this.startTime) return;

        const now = new Date();
        const elapsed = new Date(now - this.startTime);
        const minutes = elapsed.getUTCMinutes().toString().padStart(2, '0');
        const seconds = elapsed.getUTCSeconds().toString().padStart(2, '0');

        document.getElementById('timeDisplay').textContent = `${minutes}:${seconds}`;
    }

    // Para o timer
    stopTimer() {
        clearInterval(this.timerInterval);
    }

    // Formata o tempo decorrido
    getElapsedTime() {
        if (!this.startTime) return '00:00';

        const now = new Date();
        const elapsed = new Date(now - this.startTime);
        const minutes = elapsed.getUTCMinutes().toString().padStart(2, '0');
        const seconds = elapsed.getUTCSeconds().toString().padStart(2, '0');

        return `${minutes}:${seconds}`;
    }

    // ========== Geração da Grade ==========
    
    // Calcula potencial de conexão de uma palavra
    calculateConnectionPotential(word) {
        const letterFrequency = {};
        for (const letter of word) {
            letterFrequency[letter] = (letterFrequency[letter] || 0) + 1;
        }

        let score = 0;
        for (const letter in letterFrequency) {
            const letterValues = {
                'A': 1, 'E': 1, 'I': 1, 'O': 1, 'U': 1,
                'Q': 5, 'X': 4, 'Z': 4, 'J': 4, 'K': 3,
                'W': 3, 'Y': 2, 'V': 2, 'M': 2, 'N': 2
            };
            score += (letterValues[letter] || 1) * letterFrequency[letter];
        }
        return score;
    }

    // Tenta posicionar todas as palavras na grade
    generate() {
        // Ordena palavras por comprimento e potencial de conexão
        this.words.sort((a, b) => {
            const lengthDiff = b.answer.length - a.answer.length;
            if (lengthDiff !== 0) return lengthDiff;

            const aScore = this.calculateConnectionPotential(a.answer);
            const bScore = this.calculateConnectionPotential(b.answer);
            return bScore - aScore;
        });

        // Posiciona a primeira palavra no centro
        const firstWord = this.words[0];
        firstWord.x = Math.floor((this.gridSize - firstWord.answer.length) / 2);
        firstWord.y = Math.floor(this.gridSize / 2);
        firstWord.direction = 0;
        firstWord.placed = true;
        this.placeWord(firstWord);

        // Tenta posicionar as demais palavras
        for (let i = 1; i < this.words.length; i++) {
            if (!this.placeWordOptimally(this.words[i])) {
                this.placeWordAsLastResort(this.words[i]);
            }
        }

        // Verifica palavras não colocadas
        const unplacedWords = this.words.filter(w => !w.placed);
        if (unplacedWords.length > 0) {
            console.warn(`${unplacedWords.length} palavras não puderam ser colocadas na grade`);
        }

        // Numera as palavras e preenche células vazias
        this.numberWords();
        this.fillEmptyCells();
    }

    // Preenche células vazias com blocos pretos
    fillEmptyCells() {
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.grid[y][x] === null) {
                    let isolated = true;

                    // Verifica células adjacentes
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dy === 0 && dx === 0) continue;

                            const nx = x + dx;
                            const ny = y + dy;

                            if (nx >= 0 && nx < this.gridSize && ny >= 0 && ny < this.gridSize) {
                                if (this.grid[ny][nx] !== null) {
                                    isolated = false;
                                    break;
                                }
                            }
                        }
                        if (!isolated) break;
                    }

                    if (isolated) {
                        this.grid[y][x] = 'BLACK';
                    }
                }
            }
        }
    }

    // Posiciona palavras de forma otimizada
    placeWordOptimally(word) {
        const bestPlacement = {
            score: -1,
            x: 0,
            y: 0,
            direction: 0,
            connectedWords: []
        };

        for (const placedWord of this.words.filter(w => w.placed)) {
            for (let direction of [0, 1]) {
                if (direction === placedWord.direction) continue;

                for (let i = 0; i < placedWord.answer.length; i++) {
                    for (let j = 0; j < word.answer.length; j++) {
                        if (placedWord.answer[i] === word.answer[j]) {
                            let x, y;
                            if (direction === 0) {
                                x = placedWord.x + (placedWord.direction === 0 ? i : -j);
                                y = placedWord.y + (placedWord.direction === 0 ? -j : i);
                            } else {
                                x = placedWord.x + (placedWord.direction === 0 ? i : j);
                                y = placedWord.y + (placedWord.direction === 0 ? j : -i);
                            }

                            word.x = x;
                            word.y = y;
                            word.direction = direction;

                            const placementScore = this.calculatePlacementScore(word, placedWord);

                            if (placementScore > bestPlacement.score) {
                                bestPlacement.score = placementScore;
                                bestPlacement.x = x;
                                bestPlacement.y = y;
                                bestPlacement.direction = direction;
                                bestPlacement.connectedWords = [placedWord];
                            }
                        }
                    }
                }
            }
        }

        if (bestPlacement.score > 0) {
            word.x = bestPlacement.x;
            word.y = bestPlacement.y;
            word.direction = bestPlacement.direction;
            word.placed = true;
            this.placeWord(word);
            return true;
        }

        return false;
    }

    // Calcula a qualidade de uma posição potencial
    calculatePlacementScore(word, connectedWord) {
        if (!this.canPlaceWord(word)) return -1;

        let score = 0;
        const length = word.answer.length;

        // Pontua por conexões existentes
        for (let i = 0; i < length; i++) {
            const currentX = word.direction === 0 ? word.x + i : word.x;
            const currentY = word.direction === 0 ? word.y : word.y + i;

            if (this.grid[currentY][currentX] !== null &&
                this.grid[currentY][currentX] !== 'BLACK' &&
                !(currentX === connectedWord.x && currentY === connectedWord.y)) {
                score += 5;
            }
        }

        // Pontua por proximidade com outras palavras
        for (const placedWord of this.words.filter(w => w.placed && w !== connectedWord)) {
            const distance = this.calculateWordDistance(word, placedWord);
            if (distance < 3) score += (3 - distance);
        }

        return score;
    }

    // Método de último recurso para palavras difíceis de posicionar
    placeWordAsLastResort(word) {
        const center = Math.floor(this.gridSize / 2);

        for (let direction of [0, 1]) {
            word.direction = direction;

            for (let y = center - 3; y <= center + 3; y++) {
                for (let x = center - 3; x <= center + 3; x++) {
                    word.x = x;
                    word.y = y;

                    if (this.canPlaceWord(word)) {
                        word.placed = true;
                        this.placeWord(word);
                        return true;
                    }
                }
            }
        }

        return false;
    }

    // Calcula distância entre duas palavras
    calculateWordDistance(word1, word2) {
        const x1 = word1.x + (word1.direction === 0 ? word1.answer.length / 2 : 0);
        const y1 = word1.y + (word1.direction === 1 ? word1.answer.length / 2 : 0);
        const x2 = word2.x + (word2.direction === 0 ? word2.answer.length / 2 : 0);
        const y2 = word2.y + (word2.direction === 1 ? word2.answer.length / 2 : 0);

        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    // Verifica se uma palavra pode ser colocada na posição atual
    canPlaceWord(word) {
        const length = word.answer.length;
        let x = word.x;
        let y = word.y;

        // Verifica limites da grade
        if (word.direction === 0) {
            if (x < 0 || x + length > this.gridSize || y < 0 || y >= this.gridSize) {
                return false;
            }
        } else {
            if (y < 0 || y + length > this.gridSize || x < 0 || x >= this.gridSize) {
                return false;
            }
        }

        let crossCount = 0;
        for (let i = 0; i < length; i++) {
            const currentX = word.direction === 0 ? x + i : x;
            const currentY = word.direction === 0 ? y : y + i;

            const cell = this.grid[currentY][currentX];

            // Verifica conflito com letras existentes
            if (cell !== null && cell !== 'BLACK' && cell !== word.answer[i]) {
                return false;
            }

            // Conta cruzamentos válidos
            if (cell !== null && cell !== 'BLACK') {
                crossCount++;
            }

            // Verifica células adjacentes
            if (cell === null || cell === 'BLACK') {
                if (word.direction === 0) {
                    // Verifica acima e abaixo
                    if (currentY > 0 && this.grid[currentY - 1][currentX] !== null && this.grid[currentY - 1][currentX] !== 'BLACK') {
                        if (i > 0 && i < length - 1) return false;
                    }
                    if (currentY < this.gridSize - 1 && this.grid[currentY + 1][currentX] !== null && this.grid[currentY + 1][currentX] !== 'BLACK') {
                        if (i > 0 && i < length - 1) return false;
                    }

                    // Verifica início e fim da palavra
                    if (i === 0 && currentX > 0 && this.grid[currentY][currentX - 1] !== null && this.grid[currentY][currentX - 1] !== 'BLACK') return false;
                    if (i === length - 1 && currentX < this.gridSize - 1 && this.grid[currentY][currentX + 1] !== null && this.grid[currentY][currentX + 1] !== 'BLACK') return false;
                } else {
                    // Verifica esquerda e direita
                    if (currentX > 0 && this.grid[currentY][currentX - 1] !== null && this.grid[currentY][currentX - 1] !== 'BLACK') {
                        if (i > 0 && i < length - 1) return false;
                    }
                    if (currentX < this.gridSize - 1 && this.grid[currentY][currentX + 1] !== null && this.grid[currentY][currentX + 1] !== 'BLACK') {
                        if (i > 0 && i < length - 1) return false;
                    }

                    // Verifica início e fim da palavra
                    if (i === 0 && currentY > 0 && this.grid[currentY - 1][currentX] !== null && this.grid[currentY - 1][currentX] !== 'BLACK') return false;
                    if (i === length - 1 && currentY < this.gridSize - 1 && this.grid[currentY + 1][currentX] !== null && this.grid[currentY + 1][currentX] !== 'BLACK') return false;
                }
            }
        }

        // Garante que há pelo menos um cruzamento se já houver palavras colocadas
        if (this.words.some(w => w.placed) && crossCount === 0) {
            return false;
        }

        return true;
    }

    // Coloca uma palavra na grade
    placeWord(word) {
        const length = word.answer.length;
        let x = word.x;
        let y = word.y;

        for (let i = 0; i < length; i++) {
            const currentX = word.direction === 0 ? x + i : x;
            const currentY = word.direction === 0 ? y : y + i;

            this.grid[currentY][currentX] = word.answer[i];
        }
    }

    // Numera as palavras na grade
    numberWords() {
        this.numberedGrid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(0));
        this.currentNumber = 1;

        for (let word of this.words) {
            if (!word.placed) continue;

            const x = word.x;
            const y = word.y;

            if (this.numberedGrid[y][x] === 0) {
                let isStartHorizontal = word.direction === 0 && (
                    x === 0 ||
                    this.grid[y][x - 1] === null ||
                    this.grid[y][x - 1] === 'BLACK'
                );

                let isStartVertical = word.direction === 1 && (
                    y === 0 ||
                    this.grid[y - 1][x] === null ||
                    this.grid[y - 1][x] === 'BLACK'
                );

                if (isStartHorizontal || isStartVertical) {
                    this.numberedGrid[y][x] = this.currentNumber;
                    word.number = this.currentNumber;
                    this.currentNumber++;
                }
            }
        }
    }

    // ========== Renderização ==========
    
    // Renderiza a grade no HTML
    renderGrid() {
        const gridElement = document.getElementById('crosswordGrid');
        gridElement.innerHTML = '';

        // Configura o grid
        gridElement.style.gridTemplateColumns = `repeat(${this.gridSize}, var(--cell-size))`;
        gridElement.style.gridTemplateRows = `repeat(${this.gridSize}, var(--cell-size))`;

        // Usa DocumentFragment para melhor performance
        const fragment = document.createDocumentFragment();

        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                cell.setAttribute('role', 'gridcell');
                cell.setAttribute('aria-label', this.grid[y][x] === null || this.grid[y][x] === 'BLACK' ? 
                    'Célula preta' : `Célula ${x}, ${y}`);

                if (this.grid[y][x] === null || this.grid[y][x] === 'BLACK') {
                    cell.classList.add('black');
                } else {
                    const number = this.numberedGrid[y][x];
                    if (number > 0) {
                        const numberSpan = document.createElement('span');
                        numberSpan.className = 'cell-number';
                        numberSpan.textContent = number;
                        cell.appendChild(numberSpan);
                    }

                    const input = document.createElement('input');
                    input.type = 'text';
                    input.maxLength = 1;
                    input.dataset.x = x;
                    input.dataset.y = y;
                    input.setAttribute('aria-label', `Letra para ${x}, ${y}`);

                    input.addEventListener('keydown', (e) => this.handleInputNavigation(e));
                    input.addEventListener('input', (e) => this.handleInput(e));
                    input.addEventListener('focus', () => {
                        this.highlightWordAtPosition(x, y);
                    });

                    cell.appendChild(input);
                }

                fragment.appendChild(cell);
            }
        }

        gridElement.appendChild(fragment);
    }

    // Renderiza as perguntas no HTML
    renderQuestions() {
        const horizontalQuestionsElement = document.getElementById('horizontalQuestions');
        const verticalQuestionsElement = document.getElementById('verticalQuestions');

        horizontalQuestionsElement.innerHTML = '';
        verticalQuestionsElement.innerHTML = '';

        // Ordena palavras por número
        const sortedWords = [...this.words].filter(w => w.placed).sort((a, b) => a.number - b.number);

        for (let word of sortedWords) {
            const questionElement = document.createElement('div');
            questionElement.className = 'question';
            questionElement.dataset.number = word.number;
            questionElement.dataset.direction = word.direction;
            questionElement.title = word.hint;
            questionElement.setAttribute('role', 'button');
            questionElement.setAttribute('aria-label', `${word.number}. ${word.question}. Dica: ${word.hint}`);

            const directionSpan = document.createElement('span');
            directionSpan.className = 'direction';
            directionSpan.textContent = word.direction === 0 ? '→' : '↓';
            directionSpan.setAttribute('aria-hidden', 'true');

            const numberSpan = document.createElement('span');
            numberSpan.textContent = `${word.number}. `;

            const textSpan = document.createElement('span');
            textSpan.textContent = word.question;

            questionElement.appendChild(directionSpan);
            questionElement.appendChild(numberSpan);
            questionElement.appendChild(textSpan);

            questionElement.addEventListener('click', () => this.highlightWord(word.number, word.direction));

            if (word.direction === 0) {
                horizontalQuestionsElement.appendChild(questionElement);
            } else {
                verticalQuestionsElement.appendChild(questionElement);
            }
        }
    }

    // ========== Manipulação de Input ==========
    
    // Manipula a entrada do usuário
    handleInput(event) {
        const input = event.target;
        const x = parseInt(input.dataset.x);
        const y = parseInt(input.dataset.y);

        // Converte para maiúsculas automaticamente
        input.value = input.value.toUpperCase();
        
        this.updateProgress();
    }

    // Atualiza a exibição do progresso
    updateProgress() {
        let filledCells = 0;
        let totalCells = 0;

        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.grid[y][x] !== null && this.grid[y][x] !== 'BLACK') {
                    totalCells++;
                    const input = document.querySelector(`.cell input[data-x="${x}"][data-y="${y}"]`);
                    if (input && input.value.trim() !== '') {
                        filledCells++;
                    }
                }
            }
        }

        const progress = Math.round((filledCells / totalCells) * 100);
        document.getElementById('progress').textContent = progress;

        if (filledCells === totalCells) {
            this.checkAnswers();
        }
    }

    // Manipula a navegação entre campos de entrada
    handleInputNavigation(event) {
        const input = event.target;
        const x = parseInt(input.dataset.x);
        const y = parseInt(input.dataset.y);

        let nextX = x;
        let nextY = y;

        switch (event.key) {
            case 'ArrowLeft':
                nextX--;
                break;
            case 'ArrowRight':
                nextX++;
                break;
            case 'ArrowUp':
                nextY--;
                break;
            case 'ArrowDown':
                nextY++;
                break;
            case 'Backspace':
                if (input.value === '') {
                    switch (event.shiftKey ? 'ArrowUp' : 'ArrowLeft') {
                        case 'ArrowLeft':
                            nextX--;
                            break;
                        case 'ArrowUp':
                            nextY--;
                            break;
                    }
                }
                break;
            case 'Tab':
                // Permite navegação por tabulação
                if (event.shiftKey) {
                    nextX--;
                } else {
                    nextX++;
                }
                break;
            default:
                if (!/[a-zA-Z]/.test(event.key) || event.ctrlKey || event.altKey || event.metaKey) {
                    return;
                }

                switch (event.shiftKey ? 'ArrowUp' : 'ArrowRight') {
                    case 'ArrowRight':
                        nextX++;
                        break;
                    case 'ArrowDown':
                        nextY++;
                        break;
                }
                break;
        }

        if (nextX < 0 || nextX >= this.gridSize || nextY < 0 || nextY >= this.gridSize) {
            return;
        }

        const nextCell = document.querySelector(`.cell input[data-x="${nextX}"][data-y="${nextY}"]`);
        if (nextCell) {
            nextCell.focus();
            if (event.key === 'Backspace' && input.value === '') {
                nextCell.value = '';
            }
            event.preventDefault();
        }
    }

    // ========== Destaque e Navegação ==========
    
    // Destaca uma palavra na grade pelo número e direção
    highlightWord(number, direction) {
        document.querySelectorAll('.question').forEach(q => {
            q.classList.remove('highlighted');
        });

        const questionElement = document.querySelector(`.question[data-number="${number}"][data-direction="${direction}"]`);
        if (questionElement) {
            questionElement.classList.add('highlighted');
            questionElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        const word = this.words.find(w => w.number === number && w.direction === direction);
        if (!word) return;

        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('highlighted');
        });

        for (let i = 0; i < word.answer.length; i++) {
            const x = word.direction === 0 ? word.x + i : word.x;
            const y = word.direction === 0 ? word.y : word.y + i;

            const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
            if (cell) {
                cell.classList.add('highlighted');
            }
        }

        const firstCell = document.querySelector(`.cell[data-x="${word.x}"][data-y="${word.y}"] input`);
        if (firstCell) {
            firstCell.focus();
        }
    }

    // Destaca palavra na posição atual
    highlightWordAtPosition(x, y) {
        // Encontra todas as palavras que passam por esta posição
        const wordsAtPosition = this.words.filter(word => {
            if (!word.placed) return false;
            
            if (word.direction === 0) { // Horizontal
                return word.y === y && x >= word.x && x < word.x + word.answer.length;
            } else { // Vertical
                return word.x === x && y >= word.y && y < word.y + word.answer.length;
            }
        });

        if (wordsAtPosition.length > 0) {
            // Dá preferência para palavras horizontais
            const wordToHighlight = wordsAtPosition.find(w => w.direction === 0) || wordsAtPosition[0];
            this.highlightWord(wordToHighlight.number, wordToHighlight.direction);
        }
    }

    // ========== Verificação de Respostas ==========
    
    // Verifica as respostas do usuário
    checkAnswers() {
        let allCorrect = true;
        let correctWords = 0;
        let totalWords = 0;

        for (let word of this.words) {
            if (!word.placed) continue;

            totalWords++;
            let wordCorrect = true;

            for (let i = 0; i < word.answer.length; i++) {
                const x = word.direction === 0 ? word.x + i : word.x;
                const y = word.direction === 0 ? word.y : word.y + i;

                const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
                if (!cell || cell.classList.contains('black')) continue;

                const input = cell.querySelector('input');
                if (!input) continue;

                const userAnswer = input.value.toUpperCase();
                const correctAnswer = this.grid[y][x];

                if (userAnswer === correctAnswer) {
                    cell.classList.add('correct');
                    cell.classList.remove('incorrect');
                } else if (userAnswer !== '') {
                    cell.classList.add('incorrect');
                    cell.classList.remove('correct');
                    wordCorrect = false;
                    allCorrect = false;
                } else {
                    cell.classList.remove('correct', 'incorrect');
                    wordCorrect = false;
                    allCorrect = false;
                }
            }

            if (wordCorrect) {
                correctWords++;
            }
        }

        // Anuncia progresso para leitores de tela
        this.announceToScreenReader(`Você completou ${correctWords} de ${totalWords} palavras. ${allCorrect ? 'Parabéns, todas corretas!' : ''}`);

        if (allCorrect && !this.completed) {
            this.completed = true;
            this.stopTimer();
            document.getElementById('completionTime').textContent = this.getElapsedTime();
            document.getElementById('successMessage').style.display = 'block';
            document.getElementById('successMessage').scrollIntoView({ behavior: 'smooth' });
            
            // Anuncia conclusão
            this.announceToScreenReader(`Parabéns! Você completou todas as palavras corretamente em ${this.getElapsedTime()}!`);
        }

        return allCorrect;
    }

    // ========== Controles do Jogo ==========
    
    // Reseta o jogo
    resetGame() {
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
                if (!cell || cell.classList.contains('black')) continue;

                const input = cell.querySelector('input');
                if (input) input.value = '';

                cell.classList.remove('correct', 'incorrect', 'highlighted');
            }
        }

        document.querySelectorAll('.question').forEach(q => {
            q.classList.remove('highlighted');
        });

        document.getElementById('progress').textContent = '0';
        document.getElementById('successMessage').style.display = 'none';
        document.querySelector('#hintCounter span').textContent = '0';

        this.stopTimer();
        this.startTime = null;
        document.getElementById('timeDisplay').textContent = '00:00';
        this.completed = false;
        this.hintCount = 0;

        if (this.timerInterval === null) {
            this.startTimer();
        }
        
        this.announceToScreenReader('Jogo reiniciado. Todas as respostas foram limpas.');
    }

    // Fornece uma dica (revela uma letra)
    giveHint() {
        // Prioriza palavras com mais letras faltando
        const incompleteWords = this.words
            .filter(word => {
                if (!word.placed) return false;

                let missingLetters = 0;
                for (let i = 0; i < word.answer.length; i++) {
                    const x = word.direction === 0 ? word.x + i : word.x;
                    const y = word.direction === 0 ? word.y : word.y + i;

                    const input = document.querySelector(`.cell input[data-x="${x}"][data-y="${y}"]`);
                    if (input && input.value.toUpperCase() !== word.answer[i]) {
                        missingLetters++;
                    }
                }
                
                word.missingLetters = missingLetters;
                return missingLetters > 0;
            })
            .sort((a, b) => b.missingLetters - a.missingLetters);

        if (incompleteWords.length === 0) {
            this.announceToScreenReader('Todas as palavras já estão completas!');
            return;
        }

        // Escolhe a palavra com mais letras faltando
        const selectedWord = incompleteWords[0];

        // Encontra índices das letras não reveladas
        const unrevealedIndices = [];
        for (let i = 0; i < selectedWord.answer.length; i++) {
            const x = selectedWord.direction === 0 ? selectedWord.x + i : selectedWord.x;
            const y = selectedWord.direction === 0 ? selectedWord.y : selectedWord.y + i;

            const input = document.querySelector(`.cell input[data-x="${x}"][data-y="${y}"]`);
            if (input && input.value.toUpperCase() !== selectedWord.answer[i]) {
                unrevealedIndices.push(i);
            }
        }

        if (unrevealedIndices.length === 0) return;

        // Escolhe uma letra aleatória para revelar
        const randomIndex = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
        const x = selectedWord.direction === 0 ? selectedWord.x + randomIndex : selectedWord.x;
        const y = selectedWord.direction === 0 ? selectedWord.y : selectedWord.y + randomIndex;

        const input = document.querySelector(`.cell input[data-x="${x}"][data-y="${y}"]`);
        if (input) {
            input.value = selectedWord.answer[randomIndex];
            input.classList.add('hint-letter');
            input.focus();

            setTimeout(() => {
                this.handleInputNavigation({
                    target: input,
                    key: selectedWord.direction === 0 ? 'ArrowRight' : 'ArrowDown',
                    preventDefault: () => { }
                });
            }, 0);

            this.updateProgress();
            this.hintCount++;
            document.querySelector('#hintCounter span').textContent = this.hintCount;
            
            // Anuncia a dica
            this.announceToScreenReader(`Dica revelada: letra ${randomIndex + 1} da palavra ${selectedWord.number} é ${selectedWord.answer[randomIndex]}`);
        }
    }

    // ========== Acessibilidade ==========
    
    // Anuncia mensagens para leitores de tela
    announceToScreenReader(message) {
        const liveRegion = document.getElementById('a11y-live-region');
        if (!liveRegion) {
            const region = document.createElement('div');
            region.id = 'a11y-live-region';
            region.setAttribute('aria-live', 'polite');
            region.style.position = 'absolute';
            region.style.left = '-9999px';
            document.body.appendChild(region);
        }
        
        liveRegion.textContent = message;
    }
}

// ========== Inicialização do Jogo ==========

// Inicializa o jogo quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    try {
        const crossword = new Crossword(crosswordData);
        crossword.generate();
        
        // Função para ajustar o tamanho da grade dinamicamente
        function adjustGridSize() {
            const gridContainer = document.querySelector('.grid-container');
            const availableWidth = gridContainer.offsetWidth;
            const cellSize = Math.min(Math.floor(availableWidth / 15), 40); // Máximo de 40px
            
            // Ajusta as variáveis CSS
            document.documentElement.style.setProperty('--cell-size', `${cellSize}px`);
            document.documentElement.style.setProperty('--font-size', `${Math.floor(cellSize * 0.7)}px`);
            
            // Re-renderiza a grade com os novos tamanhos
            crossword.renderGrid();
        }

        // Renderiza primeiro as perguntas
        crossword.renderQuestions();
        
        // Ajusta o tamanho inicial e configura o redimensionamento com debounce
        adjustGridSize();
        window.addEventListener('resize', () => {
            clearTimeout(crossword.resizeTimeout);
            crossword.resizeTimeout = setTimeout(() => adjustGridSize(), 200);
        });
        
        // Inicia o timer
        crossword.startTimer();

        // Configura os eventos
        crossword.initEvents();

        // Adiciona contador de dicas ao DOM
        const hintCounter = document.createElement('div');
        hintCounter.id = 'hintCounter';
        hintCounter.className = 'hint-counter';
        hintCounter.innerHTML = 'Dicas usadas: <span>0</span>';
        document.querySelector('.controls').appendChild(hintCounter);

        // Anuncia que o jogo está pronto
        setTimeout(() => {
            crossword.announceToScreenReader('Jogo de palavras cruzadas carregado. Use as setas para navegar entre as células.');
        }, 1000);

    } catch (error) {
        console.error('Erro ao inicializar o jogo:', error);
        alert('Ocorreu um erro ao carregar o jogo. Por favor, recarregue a página.');
    }
});