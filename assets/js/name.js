// Adicione no início com as outras variáveis globais
let userName = '';

// Função para salvar o nome no localStorage
function saveUserName() {
    const nameInput = document.getElementById('user-name');
    userName = nameInput.value.trim();
    
    if (userName) {
        localStorage.setItem('typingExerciseUserName', userName);
        document.getElementById('name-feedback').textContent = `Nome salvo: ${userName}`;
    } else {
        document.getElementById('name-feedback').textContent = 'Por favor, digite um nome válido';
    }
}

// Função para carregar o nome salvo quando a página carrega
function loadUserName() {
    const savedName = localStorage.getItem('typingExerciseUserName');
    if (savedName) {
        userName = savedName;
        document.getElementById('user-name').value = userName;
        document.getElementById('name-feedback').textContent = `Bem-vindo de volta, ${userName}!`;
    }
}

// Modifique a função saveToGoogleSheets para incluir o nome
async function saveToGoogleSheets(data) {
    data.userName = userName; // Adiciona o nome aos dados
    
    try {
        const scriptUrl = 'SUA_URL_DE_APPS_SCRIPT';
        const response = await fetch(scriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Falha ao salvar dados');
        }

        return await response.json();
    } catch (error) {
        console.error('Erro ao salvar no Google Sheets:', error);
    }
}

// Modifique a função loadWords para carregar o nome também
async function loadWords() {
    loadUserName(); // Carrega o nome salvo
    // ... restante da sua função loadWords ...
}

// Atualize o objeto metricsData para incluir o nome
const metricsData = {
    date: new Date().toISOString(),
    exercise: exerciseName,
    userName: userName, // Adiciona o nome aqui
    attempt: attemptCount,
    word: currentWord,
    time: timeTaken.toFixed(2),
    wpm: wpm,
    accuracy: accuracy,
    errors: errorCount
};