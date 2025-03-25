const words = ["teclado", "computador", "digitação", "aprendizado", "programação"];
let index = 0;

function showWord() {
    if (index < words.length) {
        document.getElementById("word").textContent = words[index];
        document.getElementById("input").value = "";
        document.getElementById("message").textContent = "";
    } else {
        document.body.innerHTML = "<h1 style='color: #007BFF;'>Parabéns! Você concluiu o exercício.</h1>";
    }
}

function checkWord() {
    const input = document.getElementById("input").value;
    if (input === words[index]) {
        document.getElementById("message").textContent = "Correto!";
        setTimeout(() => {
            index++;
            showWord();
        }, 1000);
    }
}

showWord();