// meus_filmes_app/js/registoHandler.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Referências aos Elementos do DOM ---
    const form = document.getElementById('registoForm');
    const formTitle = document.getElementById('registo-title');
    const errorMessageDiv = document.getElementById('errorMessage');

    // Referências aos 4 passos do formulário
    const step1 = document.getElementById('step1-dados-utilizador');
    const step2 = document.getElementById('step2-selecionar-criterios');
    const step3 = document.getElementById('step3-ajustar-pesos');
    const step4 = document.getElementById('step4-primeiro-filme');
    const allSteps = [step1, step2, step3, step4];

    // Campos do Passo 1
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    // Elementos do Passo 2
    const criteriosCheckboxContainer = document.getElementById('criterios-checkbox-lista');
    const novoCriterioInput = document.getElementById('novoCriterioNome');
    const btnAdicionarCriterio = document.getElementById('btnAdicionarCriterio');

    // Elemento do Passo 3
    const pesosSlidersContainer = document.getElementById('pesos-sliders-lista');

    // Botões de Navegação
    const btnAnterior = document.getElementById('btnAnterior');
    const btnProximo = document.getElementById('btnProximo');
    const btnFinalizar = document.getElementById('btnFinalizar');

    // --- Estado do Formulário ---
    let currentStep = 1;
    let criteriosCarregados = false;

    // --- Funções de Navegação e Validação ---

    async function navigateToStep(stepNumber) {
        // --- LÓGICA DE TRANSIÇÃO (ANTES DE NAVEGAR) ---
        if (stepNumber === 2 && !criteriosCarregados) {
            await fetchAndRenderCriteriaSelection();
            criteriosCarregados = true;
        }
        if (stepNumber === 3) {
            renderWeightSliders();
        }

        currentStep = stepNumber;
        
        // Mostra o passo correto e esconde os outros
        allSteps.forEach((step, index) => {
            step.classList.toggle('active', (index + 1) === currentStep);
        });

        formTitle.textContent = `Cria a tua Conta (Passo ${currentStep} de 4)`;
        
        // Atualiza a visibilidade dos botões de navegação
        btnAnterior.style.visibility = currentStep > 1 ? 'visible' : 'hidden';
        btnProximo.style.display = currentStep < allSteps.length ? 'inline-block' : 'none';
        btnFinalizar.style.display = currentStep === allSteps.length ? 'inline-block' : 'none';
        
        errorMessageDiv.style.display = 'none';
    }

    function displayError(message) {
        errorMessageDiv.textContent = message;
        errorMessageDiv.style.display = 'block';
    }

    function validateStep1() {
        if (!usernameInput.value.trim() || !passwordInput.value || !confirmPasswordInput.value) {
            displayError('Por favor, preencha todos os campos.');
            return false;
        }
        if (passwordInput.value.length < 6) {
            displayError('A palavra-passe deve ter pelo menos 6 caracteres.');
            return false;
        }
        if (passwordInput.value !== confirmPasswordInput.value) {
            displayError('As palavras-passe não coincidem.');
            return false;
        }
        return true;
    }
    
    function validateStep2() {
        const anyChecked = criteriosCheckboxContainer.querySelector('input[type="checkbox"]:checked');
        if (!anyChecked) {
            displayError('Por favor, seleciona pelo menos um critério.');
            return false;
        }
        return true;
    }

    // --- Funções de Renderização dos Passos 2 e 3 ---

    async function fetchAndRenderCriteriaSelection() {
        criteriosCheckboxContainer.innerHTML = '<p>A carregar critérios...</p>';
        try {
            const response = await fetch('http://localhost:3000/api/criterios-padrao');
            if (!response.ok) throw new Error('Falha ao carregar critérios.');
            
            const criterios = await response.json();
            criteriosCheckboxContainer.innerHTML = '';
            criterios.forEach(criterio => renderCheckboxItem(criterio.nome_criterio, true)); // Pré-selecionados por defeito
        
        } catch (error) {
            console.error(error);
            criteriosCheckboxContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
        }
    }

    function renderCheckboxItem(nome, isChecked = false) {
        const uniqueId = 'crit_' + nome.replace(/[^a-zA-Z0-9]/g, '');
        const div = document.createElement('div');
        div.className = 'form-group-checkbox';
        div.innerHTML = `
            <input type="checkbox" id="${uniqueId}" value="${nome}" ${isChecked ? 'checked' : ''}>
            <label for="${uniqueId}">${nome}</label>
        `;
        criteriosCheckboxContainer.appendChild(div);
    }

    function renderWeightSliders() {
        pesosSlidersContainer.innerHTML = ''; // Limpa antes de renderizar
        const checkedCriterios = criteriosCheckboxContainer.querySelectorAll('input[type="checkbox"]:checked');
        
        checkedCriterios.forEach(checkbox => {
            const nomeCriterio = checkbox.value;
            const uniqueId = 'peso_' + nomeCriterio.replace(/[^a-zA-Z0-9]/g, '');

            const div = document.createElement('div');
            div.className = 'form-group-slider';
            div.innerHTML = `
                <label for="${uniqueId}">${nomeCriterio}</label>
                <input type="range" class="criterio-peso-slider" id="${uniqueId}" min="0" max="10" step="0.5" value="5" data-nome="${nomeCriterio}">
                <span class="slider-value">5.0</span>
            `;

            // Adiciona um event listener para atualizar o valor do span em tempo real
            const slider = div.querySelector('input[type="range"]');
            const valueSpan = div.querySelector('.slider-value');
            slider.addEventListener('input', () => {
                valueSpan.textContent = parseFloat(slider.value).toFixed(1);
            });

            pesosSlidersContainer.appendChild(div);
        });
    }

    // --- Event Listeners ---

    btnProximo.addEventListener('click', async () => {
        let isValid = false;
        if (currentStep === 1) {
            isValid = validateStep1();
        } else if (currentStep === 2) {
            isValid = validateStep2();
        } else if (currentStep === 3) {
            // A validação do passo 3 (pesos) não é estritamente necessária, pois têm valores padrão.
            isValid = true;
        }

        if (isValid && currentStep < allSteps.length) {
            await navigateToStep(currentStep + 1);
        }
    });

    btnAnterior.addEventListener('click', () => {
        if (currentStep > 1) {
            navigateToStep(currentStep - 1);
        }
    });

    btnAdicionarCriterio.addEventListener('click', () => {
        const nomeNovoCriterio = novoCriterioInput.value.trim();
        if (nomeNovoCriterio) {
            const jaExiste = !!criteriosCheckboxContainer.querySelector(`input[value="${nomeNovoCriterio}"]`);
            if (jaExiste) {
                displayError(`O critério "${nomeNovoCriterio}" já existe.`);
                return;
            }
            renderCheckboxItem(nomeNovoCriterio, true); // Adiciona e marca como selecionado
            novoCriterioInput.value = '';
        }
    });
    
    // --- Submissão Final do Formulário ---
    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Impede o envio padrão do formulário
        
        btnFinalizar.disabled = true;
        btnFinalizar.textContent = 'A criar conta...';

        // 1. Obter os dados do utilizador do Passo 1
        const nome_utilizador = usernameInput.value;
        const palavra_passe = passwordInput.value;

        // 2. Obter os critérios e pesos do Passo 3
        const criteriosParaEnviar = [];
        const sliders = pesosSlidersContainer.querySelectorAll('.criterio-peso-slider');
        sliders.forEach(slider => {
            criteriosParaEnviar.push({
                nome_criterio: slider.dataset.nome,
                peso: parseFloat(slider.value)
            });
        });

        // 3. Enviar os dados para o backend
        try {
            const response = await fetch('http://localhost:3000/api/auth/registo-completo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome_utilizador,
                    palavra_passe,
                    criterios: criteriosParaEnviar
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Ocorreu um erro desconhecido.');
            }

            // Sucesso!
            alert('Conta criada com sucesso! Por favor, faz login para continuar.');
            window.location.href = 'auth.html'; // Redireciona para a página de login

        } catch (error) {
            displayError(error.message);
            btnFinalizar.disabled = false;
            btnFinalizar.textContent = 'Criar Conta';
        }
    });


    // --- Inicialização ---
    navigateToStep(1);
});