async function carregarPerguntas(categoria) {
    try {
        // Carrega os dados do arquivo JSON
        let resposta = await fetch("dados/perguntas.json");
        let dados = await resposta.json();

        let perguntas = dados[categoria] || [];
        let container = document.getElementById("exercicios");
        let menu = document.getElementById("menu-questoes");
        let tituloCategoria = document.getElementById("titulo-categoria");

        tituloCategoria.textContent = `Exercícios de ${categoria.charAt(0).toUpperCase() + categoria.slice(1)}`;

        container.innerHTML = "";
        menu.innerHTML = "";

        perguntas.forEach((questao, index) => {
            // Se a pergunta for do tipo "digitacao", insira o exercício de digitação
            if (questao.tipo === "digitacao") {
                // Adiciona o exercício de digitação
                let div = document.createElement("div");
                div.classList.add("pergunta", "digitacao");
                div.setAttribute("data-index", index);

                div.innerHTML = `
                    <h3>Exercício de Digitação</h3>
                    <p>Digite as palavras corretamente:</p>
                    <div class="container">
                        <p id="word"></p>
                        <input type="text" id="input" oninput="checkWord()" autofocus>
                        <p class="message" id="message"></p>
                    </div>
                `;
                container.appendChild(div);

                // Função de digitação
                const words = ["teclado", "computador", "digitação", "aprendizado", "programação"];
                let indexDigitacao = 0;

                function showWord() {
                    if (indexDigitacao < words.length) {
                        document.getElementById("word").textContent = words[indexDigitacao];
                        document.getElementById("input").value = "";
                        document.getElementById("message").textContent = "";
                    } else {
                        document.body.innerHTML = "<h1 style='color: #007BFF;'>Parabéns! Você concluiu o exercício.</h1>";
                    }
                }

                function checkWord() {
                    const input = document.getElementById("input").value;
                    if (input === words[indexDigitacao]) {
                        document.getElementById("message").textContent = "Correto!";
                        setTimeout(() => {
                            indexDigitacao++;
                            showWord();
                        }, 1000);
                    }
                }

                showWord();

            } else {
                // Para perguntas comuns, como alternativas
                let div = document.createElement("div");
                div.classList.add("pergunta");
                div.setAttribute("data-index", index);

                let html = `<h3>${index + 1}. ${questao.pergunta}</h3><ul>`;
                questao.alternativas.forEach((alt, i) => {
                    html += `<li><button class="opcao" data-escolhida="${i}" data-correta="${parseInt(questao.correta)}">${alt}</button></li>`;
                });
                html += `</ul><p class="resposta"></p>`;

                div.innerHTML = html;
                container.appendChild(div);

                // Adiciona o evento de clique para verificar a resposta
                document.querySelectorAll(".opcao").forEach(botao => {
                    botao.addEventListener("click", function () {
                        verificarResposta(this, parseInt(this.dataset.escolhida), parseInt(this.dataset.correta));
                    });
                });
            }

            // Adiciona o item no menu
            let menuItem = document.createElement("button");
            menuItem.textContent = index + 1;
            menuItem.classList.add("menu-item");
            menuItem.setAttribute("data-index", index);
            menuItem.addEventListener("click", () => mostrarQuestao(index));

            menu.appendChild(menuItem);
        });

        // Exibe a primeira questão por padrão
        mostrarQuestao(0);

    } catch (erro) {
        console.error("Erro ao carregar perguntas:", erro);
    }
}
