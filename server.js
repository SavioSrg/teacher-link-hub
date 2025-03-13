// Importando as dependências
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Middleware para tratar os dados recebidos como JSON
app.use(bodyParser.json());
app.use(express.static('public'));  // Serve arquivos estáticos (HTML, CSS, JS)

// Caminhos para os arquivos de dados
const dataFilePath = path.join(__dirname, 'data', 'users.json');
const responsesFilePath = path.join(__dirname, 'data', 'responses.json');
const typingResultsFilePath = path.join(__dirname, 'data', 'typingResults.json');

// Função para garantir que os arquivos JSON existam
function checkFile(filePath) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([]));  // Inicializa com um array vazio
    }
}

// Função para ler dados de um arquivo JSON
function readJSONFile(filePath, res) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                res.status(500).json({ success: false, error: 'Erro ao ler o arquivo' });
                reject(err);
            } else {
                resolve(JSON.parse(data));
            }
        });
    });
}

// Função para escrever dados em um arquivo JSON
function writeJSONFile(filePath, data, res) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
            if (err) {
                res.status(500).json({ success: false, error: 'Erro ao salvar os dados' });
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

// Rota para cadastro de usuário
app.post('/cadastrar', async (req, res) => {
    checkFile(dataFilePath);

    const newUser = req.body;
    console.log('Tentativa de cadastro:', newUser);  // Log para depuração

    try {
        const users = await readJSONFile(dataFilePath, res);

        // Verifica se já existe um usuário com o mesmo grupo e data de nascimento
        const userExists = users.some(user => user.group === newUser.group && user.dob === newUser.dob);

        if (userExists) {
            return res.status(400).json({ success: false, error: 'Usuário já cadastrado!' });
        }

        users.push(newUser);
        await writeJSONFile(dataFilePath, users, res);

        res.status(200).json({ success: true, message: 'Usuário cadastrado com sucesso!' });
    } catch (err) {
        console.error('Erro no cadastro:', err);
    }
});

// Rota de login
app.post('/login', async (req, res) => {
    checkFile(dataFilePath);

    const { username, password } = req.body;
    console.log('Tentativa de login:', { username, password });

    try {
        const users = await readJSONFile(dataFilePath, res);
        const user = users.find(u => u.name === username && u.dob === password);

        if (user) {
            res.status(200).json({ success: true, group: user.group }); // Agora enviamos o grupo
        } else {
            res.status(401).json({ success: false, error: 'Nome de usuário ou senha incorretos' });
        }
    } catch (err) {
        console.error('Erro no login:', err);
    }
});

// Rota para salvar respostas das atividades
app.post('/salvar-resposta', async (req, res) => {
    checkFile(responsesFilePath);

    const newResponse = req.body;

    try {
        const responses = await readJSONFile(responsesFilePath, res);
        responses.push(newResponse);
        await writeJSONFile(responsesFilePath, responses, res);

        res.status(200).json({ message: 'Resposta salva com sucesso!' });
    } catch (err) {
        console.error('Erro ao salvar resposta:', err);
    }
});

// Rota para salvar os resultados de digitação
app.post('/save-typing-results', async (req, res) => {
    checkFile(typingResultsFilePath);

    const { user, time, keystrokes, errors, wpm, date } = req.body;

    if (!user) {
        return res.status(400).json({ success: false, error: 'Usuário não fornecido' });
    }

    console.log('Recebendo dados para usuário:', user); // Log para depuração

    try {
        const typingResults = await readJSONFile(typingResultsFilePath, res);
        typingResults.push({ user, time, keystrokes, errors, wpm, date });
        await writeJSONFile(typingResultsFilePath, typingResults, res);

        res.json({ success: true, message: 'Resultados salvos com sucesso!' });
    } catch (err) {
        console.error('Erro ao salvar resultados de digitação:', err);
    }
});

// Inicializar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});