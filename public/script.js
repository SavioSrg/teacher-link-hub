// Função para alternar entre cadastro e login
function toggleForms() {
    const loginForm = document.getElementById("login-container");
    const signupForm = document.getElementById("signup-container");
    loginForm.style.display = loginForm.style.display === "none" ? "block" : "none";
    signupForm.style.display = signupForm.style.display === "none" ? "block" : "none";
}

// Função de cadastro
function signup() {
    const name = document.getElementById("signup-name").value;
    const group = document.getElementById("signup-group").value;
    const dob = document.getElementById("signup-dob").value;

    if (name && group && dob) {
        const userData = { name, group, dob };

        // Enviar os dados para o servidor
        fetch("/cadastrar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(userData)
        }).then(response => response.json())
          .then(data => {
              if (data.success) {
                  alert("Cadastro realizado com sucesso!");
                  toggleForms(); // Troca para a tela de login
              } else {
                  alert("Erro ao cadastrar.");
              }
          });
    } else {
        alert("Por favor, preencha todos os campos.");
    }
}

// Função de login
function login() {
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;

    const loginData = { username, password };

    // Enviar dados de login para o servidor
    fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(loginData)
    }).then(response => response.json())
      .then(data => {
          if (data.success) {
              alert("Login bem-sucedido!");

              // Remover usuário anterior do localStorage e salvar novo usuário
              localStorage.removeItem("loggedUser");
              localStorage.setItem("loggedUser", JSON.stringify({ username, group: data.group }));

              // Redireciona para a página de aulas do grupo correspondente
              window.location.href = `/aulas/${data.group}.html`;
          } else {
              alert("Nome de usuário ou senha incorretos.");
          }
      })
      .catch(error => console.error("Erro ao fazer login:", error));
}
