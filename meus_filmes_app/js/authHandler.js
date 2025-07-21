
// meus_filmes_app/js/authHandler.js

document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('authForm');
    const authTitle = document.getElementById('authTitle');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const authButton = document.getElementById('authButton');
    const toggleLink = document.getElementById('toggleLink');
    const toggleText = document.getElementById('toggleText'); // O <p> que contém o toggleLink
    const errorMessageDiv = document.getElementById('errorMessage');

    const BACKEND_AUTH_URL = 'http://localhost:3000/api/auth'; // Ajusta se o URL base do backend for diferente

    let isLoginMode = true; // Começa em modo de login

    function setAuthMode(loginMode) {
        isLoginMode = loginMode;
        if (isLoginMode) {
            authTitle.textContent = 'Login';
            authButton.textContent = 'Entrar';
            confirmPasswordGroup.style.display = 'none';
            confirmPasswordInput.required = false;
            toggleText.innerHTML = 'Não tens conta? <a href="#" id="toggleLink">Regista-te aqui</a>';
        } else {
            authTitle.textContent = 'Registo';
            authButton.textContent = 'Registar';
            confirmPasswordGroup.style.display = 'block';
            confirmPasswordInput.required = true;
            toggleText.innerHTML = 'Já tens conta? <a href="#" id="toggleLink">Faz login aqui</a>';
        }
        // Precisamos de re-adicionar o event listener ao novo toggleLink
        document.getElementById('toggleLink').addEventListener('click', toggleMode);
        errorMessageDiv.style.display = 'none'; // Esconde mensagens de erro ao mudar de modo
        errorMessageDiv.textContent = '';
    }

    function toggleMode(event) {
        event.preventDefault();
        setAuthMode(!isLoginMode);
    }

    // Event listener inicial para o link de alternância
    toggleLink.addEventListener('click', toggleMode);

    function displayError(message) {
        errorMessageDiv.textContent = message;
        errorMessageDiv.style.display = 'block';
    }

 // meus_filmes_app/js/authHandler.js

    authForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        errorMessageDiv.style.display = 'none'; // Limpa erros anteriores
        authButton.disabled = true;
        authButton.textContent = isLoginMode ? 'A entrar...' : 'A registar...';

        const nome_utilizador = usernameInput.value.trim();
        const palavra_passe = passwordInput.value;

        if (isLoginMode) {
            // --- Lógica de Login ---
            try {
                const response = await fetch(`${BACKEND_AUTH_URL}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ nome_utilizador, palavra_passe })
                });

                const data = await response.json();

                if (response.ok) {
                    // Login bem-sucedido
                    console.log('Login bem-sucedido:', data);
                    localStorage.setItem('accessToken', data.accessToken);
                    localStorage.setItem('nomeUtilizador', data.nome_utilizador); // Guarda nome do utilizador
                    localStorage.setItem('idUtilizador', data.id_utilizador); // Guarda ID do utilizador
                    alert('Login efetuado com sucesso!');
                    window.location.href = 'index.html'; // Redireciona para a página principal
                } else {
                    // Erro de login
                    displayError(data.message || 'Falha no login. Verifica as tuas credenciais.');
                }
            } catch (error) {
                console.error('Erro ao tentar fazer login:', error);
                displayError('Erro de ligação ao servidor. Tenta novamente mais tarde.');
            }
        } else { // <-- CHAVETA DE FECHO ADICIONADA AQUI
            // --- Lógica de Registo ---
            const confirmar_palavra_passe = confirmPasswordInput.value;
            if (palavra_passe !== confirmar_palavra_passe) {
                displayError('As palavras-passe não coincidem.');
                authButton.disabled = false;
                authButton.textContent = 'Registar';
                return;
            }
            if (palavra_passe.length < 6) {
                displayError('A palavra-passe deve ter pelo menos 6 caracteres.');
                authButton.disabled = false;
                authButton.textContent = 'Registar';
                return;
            }

            try {
                // PASSO 1: Tenta registar o utilizador
                const registoResponse = await fetch(`${BACKEND_AUTH_URL}/registo`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome_utilizador, palavra_passe })
                });

                const registoData = await registoResponse.json();

                if (!registoResponse.ok) { // Se o registo falhar (ex: user já existe)
                    throw new Error(registoData.message || 'Falha no registo.');
                }

                // PASSO 2: Se o registo for bem sucedido, tenta fazer login automaticamente
                console.log('Registo bem-sucedido. A tentar fazer login automático...');
                const loginResponse = await fetch(`${BACKEND_AUTH_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome_utilizador, palavra_passe })
                });

                const loginData = await loginResponse.json();

                if (!loginResponse.ok) {
                    // Isto não deveria acontecer, mas é uma salvaguarda
                    throw new Error(loginData.message || 'Erro ao fazer login após o registo.');
                }
                
                // PASSO 3: Login bem sucedido, guardar dados e redirecionar
                console.log('Login automático bem-sucedido:', loginData);
                localStorage.setItem('accessToken', loginData.accessToken);
                localStorage.setItem('nomeUtilizador', loginData.nome_utilizador);
                localStorage.setItem('idUtilizador', loginData.id_utilizador);
                
                // Redireciona para a nova página de configuração de critérios
                alert('Conta criada com sucesso! Vamos agora configurar os teus critérios de avaliação.');
                window.location.href = 'registo.html'; // Usaremos esta página temporariamente para os critérios

            } catch (error) {
                console.error('Erro no processo de registo e login:', error);
                displayError(error.message);
            }
        }
        
        authButton.disabled = false;
        authButton.textContent = isLoginMode ? 'Entrar' : 'Registar';
    });
    // Define o modo inicial (Login)
    setAuthMode(true);
});