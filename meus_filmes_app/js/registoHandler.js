// meus_filmes_app/js/registoHandler.js

document.addEventListener('DOMContentLoaded', async () => {
    // --- Referências aos Elementos do DOM ---
    const form = document.getElementById('criteriosForm');
    const errorMessageDiv = document.getElementById('errorMessage');
    const criteriosCheckboxContainer = document.getElementById('criterios-checkbox-lista');
    const novoCriterioInput = document.getElementById('novoCriterioNome');
    const btnAdicionarCriterio = document.getElementById('btnAdicionarCriterio');
    const pesosSlidersContainer = document.getElementById('pesos-sliders-lista');
    const btnSalvarCriterios = document.getElementById('btnSalvarCriterios');

    // --- Funções ---

    function displayError(message) {
        errorMessageDiv.textContent = message;
        errorMessageDiv.style.display = 'block';
    }

    /**
     * Vai buscar os critérios padrão à API e renderiza-os como checkboxes.
     * Também chama a função para renderizar os sliders de peso.
     */
    async function fetchAndRenderCriteria() {
        criteriosCheckboxContainer.innerHTML = '<p>A carregar...</p>';
        try {
            const response = await fetch('http://localhost:3000/api/criterios-padrao');
            if (!response.ok) throw new Error('Falha ao carregar critérios.');
            
            const criterios = await response.json();
            criteriosCheckboxContainer.innerHTML = '';
            criterios.forEach(criterio => renderCheckboxItem(criterio.nome_criterio, true)); // Pré-selecionados por defeito
        
            renderWeightSliders(); // Renderiza os sliders assim que os critérios são carregados

        } catch (error) {
            console.error(error);
            criteriosCheckboxContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
        }
    }

    /**
     * Renderiza um único critério como uma checkbox.
     */
    function renderCheckboxItem(nome, isChecked = false) {
        const uniqueId = 'crit_' + nome.replace(/[^a-zA-Z0-9]/g, '');
        const div = document.createElement('div');
        div.className = 'form-group-checkbox';
        div.innerHTML = `
            <input type="checkbox" id="${uniqueId}" value="${nome}" ${isChecked ? 'checked' : ''}>
            <label for="${uniqueId}">${nome}</label>
        `;
        criteriosCheckboxContainer.appendChild(div);

        // Adiciona um listener para atualizar os sliders sempre que uma checkbox muda
        const checkbox = div.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', renderWeightSliders);
    }

    /**
     * Renderiza os sliders de peso com base nos critérios selecionados.
     */
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

            const slider = div.querySelector('input[type="range"]');
            const valueSpan = div.querySelector('.slider-value');
            slider.addEventListener('input', () => {
                valueSpan.textContent = parseFloat(slider.value).toFixed(1);
            });

            pesosSlidersContainer.appendChild(div);
        });
    }

    // --- Event Listeners ---

    btnAdicionarCriterio.addEventListener('click', () => {
        const nomeNovoCriterio = novoCriterioInput.value.trim();
        if (nomeNovoCriterio) {
            const jaExiste = !!criteriosCheckboxContainer.querySelector(`input[value="${nomeNovoCriterio}"]`);
            if (jaExiste) {
                displayError(`O critério "${nomeNovoCriterio}" já existe.`);
                return;
            }
            renderCheckboxItem(nomeNovoCriterio, true); // Adiciona e marca como selecionado
            renderWeightSliders(); // Atualiza os sliders
            novoCriterioInput.value = '';
        }
    });
    
    /**
     * Submissão do formulário para guardar os critérios personalizados do utilizador.
     */
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const anyChecked = criteriosCheckboxContainer.querySelector('input[type="checkbox"]:checked');
        if (!anyChecked) {
            displayError('Por favor, seleciona pelo menos um critério.');
            return;
        }
        
        btnSalvarCriterios.disabled = true;
        btnSalvarCriterios.textContent = 'A guardar...';

        const criteriosParaEnviar = [];
        const sliders = pesosSlidersContainer.querySelectorAll('.criterio-peso-slider');
        sliders.forEach(slider => {
            criteriosParaEnviar.push({
                nome_criterio: slider.dataset.nome,
                peso: parseFloat(slider.value)
            });
        });

        // Envia os dados para o novo endpoint
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('http://localhost:3000/api/criterios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Envia o token de autenticação
                },
                body: JSON.stringify({ criterios: criteriosParaEnviar })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Ocorreu um erro.');
            }

            // Sucesso!
            alert('Critérios guardados com sucesso!');
            window.location.href = 'index.html'; // Redireciona para a página principal

        } catch (error) {
            displayError(error.message);
            btnSalvarCriterios.disabled = false;
            btnSalvarCriterios.textContent = 'Guardar e Continuar';
        }
    });

    // --- Inicialização ---
    // Verifica se o utilizador está autenticado antes de carregar
    const token = localStorage.getItem('accessToken');
    if (!token) {
        alert("Sessão inválida. Por favor, faz login.");
        window.location.href = 'auth.html';
    } else {
        fetchAndRenderCriteria();
    }
});