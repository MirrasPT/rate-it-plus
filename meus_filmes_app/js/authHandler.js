
// meus_filmes_app/js/authHandler.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Handle redirect_to parameter
    const queryParams = new URLSearchParams(window.location.search);
    const redirectTo = queryParams.get('redirect_to');
    if (redirectTo) {
        sessionStorage.setItem('loginRedirectUrl', redirectTo);
    }

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
                    localStorage.setItem('accessToken', data.accessToken);
                    localStorage.setItem('nomeUtilizador', data.nome_utilizador); // Guarda nome do utilizador
                    localStorage.setItem('idUtilizador', data.id_utilizador); // Guarda ID do utilizador

                    // 2. Handle redirect after successful login
                    const redirectUrl = sessionStorage.getItem('loginRedirectUrl');
                    if (redirectUrl) {
                        sessionStorage.removeItem('loginRedirectUrl');
                        // Basic validation to prevent open redirect if possible, e.g., ensure it's a relative path or specific known paths
                        if (redirectUrl.startsWith('/') || redirectUrl.startsWith('http') === false) {
                             window.location.href = redirectUrl;
                        } else {
                            console.warn(`Blocked potentially unsafe redirect to: ${redirectUrl}`);
                            window.location.href = 'index.html'; // Fallback to default
                        }
                    } else {
                        window.location.href = 'index.html'; // Redireciona para a página principal padrão
                    }
                    // alert('Login efetuado com sucesso!'); // Alert can be shown by the target page if needed
                } else {
                    // Erro de login
                    displayError(data.message || 'Falha no login. Verifica as tuas credenciais.');
                }
            } catch (error) {
                console.error('Erro ao tentar fazer login:', error);
                displayError('Erro de ligação ao servidor. Tenta novamente mais tarde.');
            }
        } else {
            // --- Lógica de Registo ---
            const confirmar_palavra_passe = confirmPasswordInput.value;
            if (palavra_passe !== confirmar_palavra_passe) {
                displayError('As palavras-passe não coincidem.');
                authButton.disabled = false;
                authButton.textContent = 'Registar';
                return;
            }
            if (palavra_passe.length < 6) { // Exemplo de validação de password
                displayError('A palavra-passe deve ter pelo menos 6 caracteres.');
                authButton.disabled = false;
                authButton.textContent = 'Registar';
                return;
            }

            try {
                const response = await fetch(`${BACKEND_AUTH_URL}/registo`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ nome_utilizador, palavra_passe })
                });

                const data = await response.json();

                if (response.status === 201) { // 201 Created
                    // Registo bem-sucedido
                    console.log('Registo bem-sucedido:', data);
                    alert('Registo efetuado com sucesso! Por favor, faz login.');
                    setAuthMode(true); // Volta para o modo de login
                    usernameInput.value = nome_utilizador; // Preenche o username para facilitar o login
                    passwordInput.value = '';
                    confirmPasswordInput.value = '';
                } else {
                    // Erro de registo
                    displayError(data.message || 'Falha no registo. Tenta novamente.');
                }
            } catch (error) {
                console.error('Erro ao tentar registar:', error);
                displayError('Erro de ligação ao servidor. Tenta novamente mais tarde.');
            }
        }
        authButton.disabled = false;
        authButton.textContent = isLoginMode ? 'Entrar' : 'Registar';
    });

    // Define o modo inicial (Login)
    setAuthMode(true);
});