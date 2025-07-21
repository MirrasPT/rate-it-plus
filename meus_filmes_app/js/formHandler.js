// meus_filmes_app/js/formHandler.js

/**
 * Função Debounce: Atrasada a execução de uma função até que um certo tempo
 * tenha passado sem que ela seja chamada novamente.
 * @param {Function} func - A função a ser executada após o atraso.
 * @param {number} delay - O tempo de espera em milissegundos.
 * @returns {Function} - Uma nova função "debounced".
 */
function debounce(func, delay) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

document.addEventListener('DOMContentLoaded', async () => {
  // --- Elementos do DOM ---
  const form = document.getElementById('itemForm');
  const formTitle = document.getElementById('formTitle');
  const itemIdInput = document.getElementById('itemId');
  const tmdbIdInput = document.getElementById('tmdbId');
  const adicionadoManualmenteInput = document.getElementById('adicionadoManualmente');
  const btnSalvar = document.getElementById('btnSalvar');
  const btnLimparForm = document.getElementById('btnLimparForm');
  const urlImagemInput = document.getElementById('urlImagem');
  const nomeInput = document.getElementById('nome');
  const tipoSelect = document.getElementById('tipo');
  const anoLancamentoInput = document.getElementById('anoLancamento');
  const trailerUrlInput = document.getElementById('trailerUrl');
  const idiomaInput = document.getElementById('idioma');
  const sinopseInput = document.getElementById('sinopse');
  const reviewInput = document.getElementById('review');
  const tmdbSearchSection = document.querySelector('.tmdb-search-section');
  const tmdbSearchQueryInput = document.getElementById('tmdbSearchQuery');
  const tmdbSearchTypeSelect = document.getElementById('tmdbSearchType');
  const btnTmdbSearch = document.getElementById('btnTmdbSearch');
  const tmdbSearchResultsContainer = document.getElementById('tmdbSearchResults');
  const btnAdicionarManualmenteContainer = document.getElementById('btnAdicionarManualmenteContainer');
  const btnAdicionarManualmente = document.getElementById('btnAdicionarManualmente');
  const detalhesItemSection = document.getElementById('detalhesItemSection');
  const avaliacaoSection = document.getElementById('avaliacaoSection');
  const formActionsSection = document.getElementById('formActionsSection');
  const tmdbItemSummarySection = document.getElementById('tmdbItemSummarySection');
  const summaryPoster = document.getElementById('summaryPoster');
  const summaryTitle = document.getElementById('summaryTitle');
  const summaryYear = document.getElementById('summaryYear');
  const summaryType = document.getElementById('summaryType');
  const summarySinopse = document.getElementById('summarySinopse');
  const generoChipsContainer = document.getElementById('generoChips');
  const relacionadoInput = document.getElementById('relacionadoInput');
  const relacionadosChipsContainer = document.getElementById('relacionadosChips');
  const titulosDatalist = document.getElementById('titulosLista');
  
  // --- NOVIDADE: O container para os campos dinâmicos ---
  const gridClassificacoesDinamicas = document.getElementById('grid-classificacoes-dinamicas');

  // --- NOVIDADE: O objeto de campos será populado dinamicamente ---
  let camposClassificacao = {};

  const generosDisponiveis = [
    'Ação & Aventura', 'Comédia', 'Mistério', 'Drama',
    'Fantasia • Ficção Científica • Sobrenatural', 'Horror & Suspense', 'Romance',
    'Biográfico / Histórico / Baseado em Factos Reais', 'Documentário', 'Slice of Life', 'Musical', 'Desporto',
    'Crime', 'Família', 'Animação', 'Guerra', 'Faroeste', 'Thriller'
  ];

  /* ------------------------------------------------------------------
     NOVA FUNÇÃO: Renderizar Campos de Classificação Dinamicamente
  ------------------------------------------------------------------*/
  async function renderizarCamposDeClassificacao() {
    if (!gridClassificacoesDinamicas) return;

    // Vai buscar os critérios personalizados à API (agora vem num formato de array)
    const criteriosArray = await obterCriteriosDoUtilizador(); 

    gridClassificacoesDinamicas.innerHTML = ''; // Limpa o container
    camposClassificacao = {}; // Limpa o objeto de referências

    if (!criteriosArray || criteriosArray.length === 0) {
      gridClassificacoesDinamicas.innerHTML = "<p style='grid-column: 1 / -1; text-align: center;'>Não foi possível carregar os teus critérios. <a href='registo.html'>Configura-os aqui.</a></p>";
      return;
    }

    // Itera sobre o array de critérios recebido da API
    for (const criterio of criteriosArray) {
      const { key, nome } = criterio; // Extrai a chave (ex: historiaEnredo) e o nome (ex: História & Enredo)
      
      const isOpcional = key === 'adaptacaoRemake' ? '(opcional)' : '';

      const div = document.createElement('div');
      div.innerHTML = `
        <label for="${key}">${nome} ${isOpcional}</label> 
        <input type="number" id="${key}" min="0" max="10" step="0.1">
      `;
      gridClassificacoesDinamicas.appendChild(div);

      // Guarda a referência ao novo input no nosso objeto, usando a chave
      camposClassificacao[key] = document.getElementById(key);
    }
  }


  /* ------------------------------------------------------------------
     Controlo de Ecrãs/Secções do Formulário (Sem alterações)
  ------------------------------------------------------------------*/
  function mostrarEcra(ecra) {
    if (tmdbSearchSection) tmdbSearchSection.classList.remove('active');
    if (btnAdicionarManualmenteContainer) btnAdicionarManualmenteContainer.classList.remove('active');
    if (tmdbItemSummarySection) tmdbItemSummarySection.classList.remove('active');
    if (detalhesItemSection) detalhesItemSection.classList.remove('active');
    if (avaliacaoSection) avaliacaoSection.classList.remove('active');
    if (formActionsSection) formActionsSection.classList.remove('active');

    switch (ecra) {
      case 'pesquisaTMDB':
        if (tmdbSearchSection) tmdbSearchSection.classList.add('active');
        if (btnAdicionarManualmenteContainer) btnAdicionarManualmenteContainer.classList.add('active');
        if (formTitle) formTitle.textContent = 'Adicionar Novo Item - Pesquisar';
        break;
      case 'avaliacaoTMDB':
        if (tmdbItemSummarySection) tmdbItemSummarySection.classList.add('active');
        if (avaliacaoSection) avaliacaoSection.classList.add('active');
        if (formActionsSection) formActionsSection.classList.add('active');
        if (formTitle && nomeInput) formTitle.textContent = `Avaliar: ${nomeInput.value || 'Item Selecionado'}`;
        if (adicionadoManualmenteInput) adicionadoManualmenteInput.value = "false";
        break;
      case 'manual':
        if (detalhesItemSection) detalhesItemSection.classList.add('active');
        if (avaliacaoSection) avaliacaoSection.classList.add('active');
        if (formActionsSection) formActionsSection.classList.add('active');
        if (formTitle) formTitle.textContent = 'Adicionar Item Manualmente';
        if (adicionadoManualmenteInput) adicionadoManualmenteInput.value = "true";
        break;
      case 'edicao':
        if (detalhesItemSection) detalhesItemSection.classList.add('active');
        if (avaliacaoSection) avaliacaoSection.classList.add('active');
        if (formActionsSection) formActionsSection.classList.add('active');
        if (formTitle && nomeInput) formTitle.textContent = `Editar: ${nomeInput.value || 'Item'}`;
        if (document.querySelector('.tmdb-search-section')) document.querySelector('.tmdb-search-section').style.display = 'none';
        break;
    }
  }

  /* ------------------------------------------------------------------
     Modo de Edição (Agora depende da renderização dos campos)
  ------------------------------------------------------------------*/
  const params = new URLSearchParams(window.location.search);
  const editId = params.get('id');
  let isEditMode = !!editId;

  async function carregarDadosParaEdicao() {
    if (isEditMode) {
      const itemOriginalParaEdicao = await getItemDaColecaoPorId(editId);
      if (itemOriginalParaEdicao) {
        // A função preencherFormularioComDados agora será chamada DEPOIS
        // de os campos de classificação serem renderizados.
        await preencherFormularioComDados(itemOriginalParaEdicao);
        mostrarEcra('edicao');
      } else {
        alert('Item para edição não encontrado.');
        window.location.href = 'index.html';
      }
    } else {
      mostrarEcra('pesquisaTMDB');
    }
  }

  // ... (As funções de pesquisa TMDB, gestão de chips e submissão do formulário permanecem praticamente iguais,
  // pois já estavam a ler o objeto `camposClassificacao`, que agora é preenchido dinamicamente.
  // Apenas a função de preenchimento e limpeza precisam de ajustes.) ...
  
   // --- LÓGICA DE PESQUISA AUTOMÁTICA (DEBOUNCED) ---

  // 1. A função que efetivamente faz a pesquisa
  const performTmdbSearch = async () => {
    if (!tmdbSearchQueryInput || !tmdbSearchTypeSelect) return;
    
    const query = tmdbSearchQueryInput.value.trim();
    const type = tmdbSearchTypeSelect.value;

    // Só pesquisa se houver pelo menos 2 caracteres, para não sobrecarregar a API
    if (query.length < 2) {
      if (tmdbSearchResultsContainer) tmdbSearchResultsContainer.innerHTML = ''; // Limpa resultados se a pesquisa for curta
      return;
    }

    if (tmdbSearchResultsContainer) {
      tmdbSearchResultsContainer.innerHTML = '<p>A pesquisar...</p>';
    }

    try {
      const resultados = await searchTMDB(query, type);
      exibirResultadosTMDB(resultados);
    } catch (error) {
      console.error("[FORM HANDLER] Erro na pesquisa automática TMDB:", error);
      if (tmdbSearchResultsContainer) {
        tmdbSearchResultsContainer.innerHTML = '<p>Ocorreu um erro ao pesquisar.</p>';
      }
    }
  };

  // 2. Cria uma versão "debounced" da nossa função de pesquisa
  const debouncedSearch = debounce(performTmdbSearch, 400); // Espera 400ms

  // 3. Adiciona os "ouvintes" aos campos de input
  if (tmdbSearchQueryInput) {
    // Chama a função debounced sempre que o utilizador escreve
    tmdbSearchQueryInput.addEventListener('input', debouncedSearch);
  }
  if (tmdbSearchTypeSelect) {
    // Chama a função imediatamente se o utilizador mudar o tipo de media
    tmdbSearchTypeSelect.addEventListener('change', performTmdbSearch);
  }

  // O botão de pesquisa já não é necessário, mas podemos escondê-lo com CSS se quisermos.
  // Por agora, a sua lógica de clique foi removida.
  if (btnTmdbSearch) {
      btnTmdbSearch.style.display = 'none'; // Esconde o botão
  }

    function exibirResultadosTMDB(resultados) {
        if (!tmdbSearchResultsContainer) return;
        tmdbSearchResultsContainer.innerHTML = '';
        if (!resultados || resultados.length === 0) {
        tmdbSearchResultsContainer.innerHTML = '<p>Nenhum resultado encontrado.</p>';
        return;
        }
        resultados.forEach(item => {
        const nomeItem = item.title || item.name;
        const ano = item.release_date ? item.release_date.substring(0, 4) : (item.first_air_date ? item.first_air_date.substring(0, 4) : 'N/A');
        const posterPath = item.poster_path;
        const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
        const resultDiv = document.createElement('div');
        resultDiv.classList.add('search-result-item');
        resultDiv.innerHTML = `
            <img src="${posterPath ? getTMDBImageUrl(posterPath, 'w200') : 'https://via.placeholder.com/200x300.png?text=Sem+Capa'}" alt="${nomeItem}">
            <span>${nomeItem}</span>
            <span class="result-year">(${mediaType === 'movie' ? 'Filme' : 'Série'}, ${ano})</span>
        `;
        resultDiv.addEventListener('click', () => preencherFormularioComDetalhesTMDB(item.id, mediaType));
        tmdbSearchResultsContainer.appendChild(resultDiv);
        });
    }

   async function preencherFormularioComDetalhesTMDB(tmdbItemId, mediaType) {
        form.reset();
        if (generoChipsContainer) {
            generoChipsContainer.querySelectorAll('input[type="checkbox"]').forEach(chk => chk.checked = false);
            generoChipsContainer.querySelectorAll('label.chip').forEach(lbl => lbl.classList.remove('selected'));
        }
        if (relacionadosChipsContainer) relacionadosChipsContainer.innerHTML = '';
        if (adicionadoManualmenteInput) adicionadoManualmenteInput.value = "false";
        
        tmdbSearchResultsContainer.innerHTML = '<p>A carregar detalhes...</p>';
        const detalhes = await getTMDBDetails(tmdbItemId, mediaType);
        tmdbSearchResultsContainer.innerHTML = '';

        if (!detalhes) {
            alert('Não foi possível carregar os detalhes do item selecionado.');
            mostrarEcra('pesquisaTMDB');
            return;
        }

        if (tmdbIdInput) tmdbIdInput.value = detalhes.id;
        if (nomeInput) nomeInput.value = detalhes.title || detalhes.name || '';
        
        let tipoApp = 'Filme';
        if (mediaType === 'tv') tipoApp = 'Série';
        if (tipoSelect) tipoSelect.value = tipoApp;

        if (anoLancamentoInput) anoLancamentoInput.value = detalhes.release_date ? detalhes.release_date.substring(0, 4) : (detalhes.first_air_date ? detalhes.first_air_date.substring(0, 4) : '');
        if (sinopseInput) sinopseInput.value = detalhes.overview || '';
        
        const posterUrl = detalhes.poster_path ? getTMDBImageUrl(detalhes.poster_path, 'original') : '';
        if (urlImagemInput) urlImagemInput.value = posterUrl;
        
        const bgBlurEl = document.getElementById('bgBlur');
        if (posterUrl && bgBlurEl) {
            bgBlurEl.style.backgroundImage = `url(${posterUrl})`;
        } else if (bgBlurEl) {
            bgBlurEl.style.backgroundImage = '';
        }

        if (idiomaInput) idiomaInput.value = detalhes.original_language ? new Intl.DisplayNames(['pt'], { type: 'language' }).of(detalhes.original_language) || detalhes.original_language : '';
        
        if (trailerUrlInput) {
            if (detalhes.videos && detalhes.videos.results.length > 0) {
                const trailer = detalhes.videos.results.find(video => video.site === 'YouTube' && video.type === 'Trailer');
                // Corrigido um pequeno erro de template string que encontrei aqui
                trailerUrlInput.value = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : '';
            } else {
                trailerUrlInput.value = '';
            }
        }

        if (detalhes.genres && Array.isArray(detalhes.genres)) {
            const nomesGenerosTMDB = detalhes.genres.map(g => g.name);
            await selecionarChipsDeGenero(nomesGenerosTMDB);
        }

        if (summaryPoster) summaryPoster.src = detalhes.poster_path ? getTMDBImageUrl(detalhes.poster_path, 'w200') : 'https://via.placeholder.com/200x300.png?text=Sem+Capa';
        if (summaryTitle) summaryTitle.textContent = nomeInput.value;
        if (summaryYear) summaryYear.textContent = anoLancamentoInput.value;
        if (summaryType) summaryType.textContent = tipoSelect.value;
        if (summarySinopse) summarySinopse.textContent = sinopseInput.value.substring(0, 200) + (sinopseInput.value.length > 200 ? '...' : '');

        mostrarEcra('avaliacaoTMDB');
        
        // Foca no primeiro campo de classificação dinâmico, se existir
        const primeiroCriterioKey = Object.keys(camposClassificacao)[0];
        if (primeiroCriterioKey && camposClassificacao[primeiroCriterioKey]) {
            camposClassificacao[primeiroCriterioKey].focus();
        }
        // A LINHA ABAIXO FOI REMOVIDA
        // alert(`"${nomeInput.value}" carregado do TMDB. Por favor, adicione a sua avaliação pessoal.`);
    }

    if (btnAdicionarManualmente) {
        btnAdicionarManualmente.addEventListener('click', async () => {
        await limparFormularioCompleto(true);
        mostrarEcra('manual');
        if (adicionadoManualmenteInput) adicionadoManualmenteInput.value = "true";
        if (nomeInput) nomeInput.focus();
        });
    }

    async function popularChipsDeGenero() {
        if (!generoChipsContainer) return;
        generoChipsContainer.innerHTML = '';
        generosDisponiveis.forEach(g => {
        const checkboxId = 'g_' + g.replace(/[^a-zA-Z0-9]/g, '');
        const chipHtml = `
            <input type="checkbox" id="${checkboxId}" value="${g}" hidden>
            <label class="chip" for="${checkboxId}">${g}</label>
        `;
        generoChipsContainer.insertAdjacentHTML('beforeend', chipHtml);
        const checkbox = generoChipsContainer.querySelector(`#${checkboxId}`);
        const label = generoChipsContainer.querySelector(`label[for="${checkboxId}"]`);
        if (checkbox && label) {
            checkbox.addEventListener('change', () => label.classList.toggle('selected', checkbox.checked));
        }
        });
    }

    async function selecionarChipsDeGenero(nomesGeneros) {
        if (!generoChipsContainer) return;
        const checkboxes = generoChipsContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(chk => {
        chk.checked = false;
        const label = generoChipsContainer.querySelector(`label[for="${chk.id}"]`);
        if (label) label.classList.remove('selected');
        });

        if (nomesGeneros && Array.isArray(nomesGeneros)) {
            nomesGeneros.forEach(nomeGeneroInput => {
            const generoNormalizadoApp = nomeGeneroInput.toLowerCase().replace('&', 'e').replace(' • ', ' ').replace('ficção científica • sobrenatural', 'ficção científica sobrenatural');
            
            const checkbox = Array.from(checkboxes).find(chk => {
                const valorChipNormalizado = chk.value.toLowerCase().replace('&', 'e').replace(' • ', ' ').replace('ficção científica • sobrenatural', 'ficção científica sobrenatural');
                return valorChipNormalizado.includes(generoNormalizadoApp) || generoNormalizadoApp.includes(valorChipNormalizado) || valorChipNormalizado === generoNormalizadoApp;
            });

            if (checkbox) {
                checkbox.checked = true;
                const label = generoChipsContainer.querySelector(`label[for="${checkbox.id}"]`);
                if (label) label.classList.add('selected');
            } else {
                console.warn(`Género do item "${nomeGeneroInput}" (normalizado para "${generoNormalizadoApp}") não encontrado nos chips disponíveis.`);
            }
            });
        }
    }

    async function popularDatalistRelacionados() {
        if (!titulosDatalist) return;
        titulosDatalist.innerHTML = '';
        try {
            const colecaoAtual = await obterColecaoCompleta();
            const idItemAtual = isEditMode ? editId : null;

            if (Array.isArray(colecaoAtual)) {
                colecaoAtual.forEach(item => {
                    if (item && item.id !== idItemAtual) {
                        const option = document.createElement('option');
                        option.value = item.nome;
                        option.dataset.id = item.id;
                        titulosDatalist.appendChild(option);
                    }
                });
            }
        } catch (error) {
            console.error("Erro ao popular datalist de relacionados:", error);
        }
    }
  
    if (relacionadoInput) {
        relacionadoInput.addEventListener('input', (event) => {
            const valorInput = event.target.value;
            const opcaoSelecionada = Array.from(titulosDatalist.options).find(opt => opt.value === valorInput);

            if (opcaoSelecionada) {
            const idSelecionado = opcaoSelecionada.dataset.id;
            const nomeSelecionado = opcaoSelecionada.value;
            
            const jaExiste = Array.from(relacionadosChipsContainer.children).some(chip => chip.dataset.id === idSelecionado);
            const idItemEmEdicao = itemIdInput ? itemIdInput.value : null;
            if (idSelecionado === idItemEmEdicao) {
                console.warn("Não pode relacionar um item com ele mesmo.");
                relacionadoInput.value = '';
                return;
            }
            if (jaExiste) {
                console.warn("Este item já foi adicionado como relacionado.");
                relacionadoInput.value = '';
                return;
            }

            const chip = document.createElement('span');
            chip.className = 'chip selected';
            chip.dataset.id = idSelecionado;
            chip.innerHTML = `${nomeSelecionado}<span class="remove">×</span>`;
            chip.querySelector('.remove').addEventListener('click', () => chip.remove());
            relacionadosChipsContainer.appendChild(chip);
            relacionadoInput.value = '';
            }
        });
    }

    // meus_filmes_app/js/formHandler.js

  if (form) {
    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (btnSalvar) {
            btnSalvar.disabled = true;
            btnSalvar.textContent = isEditMode ? 'A atualizar...' : 'A adicionar...';
        }

        let classificacaoValida = true;
        // Valida os campos de classificação dinâmicos
        for (const key in camposClassificacao) {
            const input = camposClassificacao[key];
            const isOpcional = key === 'adaptacaoRemake';
            if (input && !isOpcional && input.value === '') {
                classificacaoValida = false;
                input.style.borderColor = 'red';
            } else if (input) {
                input.style.borderColor = '';
            }
        }
        if (nomeInput && !nomeInput.value.trim()) {
            if (nomeInput) nomeInput.style.borderColor = 'red';
            classificacaoValida = false;
        } else if (nomeInput) {
            nomeInput.style.borderColor = '';
        }

        if (!classificacaoValida) {
            alert('Por favor, preencha o título e todos os campos de classificação obrigatórios.');
            if (btnSalvar) {
                btnSalvar.disabled = false;
                btnSalvar.textContent = isEditMode ? 'Atualizar' : 'Adicionar';
            }
            return;
        }

        const dadosItem = {
            id: isEditMode ? editId : gerarUniqueId(),
            tmdb_id: tmdbIdInput.value || null,
            urlImagem: urlImagemInput.value.trim(),
            nome: nomeInput.value.trim(),
            tipo: tipoSelect.value,
            anoLancamento: anoLancamentoInput.value ? parseInt(anoLancamentoInput.value) : null,
            trailerUrl: trailerUrlInput.value.trim(),
            idioma: idiomaInput.value.trim(),
            sinopse: sinopseInput.value.trim(),
            review: reviewInput.value.trim(),
            genero: Array.from(generoChipsContainer.querySelectorAll('input[type="checkbox"]:checked')).map(chk => chk.value),
            relacionados: Array.from(relacionadosChipsContainer.children).map(chip => chip.dataset.id),
            classificacoes: {},
            adicionadoManualmente: adicionadoManualmenteInput ? adicionadoManualmenteInput.value === "true" : false
        };
        
        for (const key in camposClassificacao) {
            if (camposClassificacao[key]) {
                const valor = camposClassificacao[key].value;
                dadosItem.classificacoes[key] = valor === '' ? null : parseFloat(valor);
            }
        }

        try {
            if (isEditMode) {
                const itemAtualizado = await atualizarItemNaColecao(editId, dadosItem);
                if (itemAtualizado) {
                    alert('Item atualizado com sucesso!');
                    window.location.href = `detalhes.html?id=${editId}`;
                }
            } else {
                const itemAdicionado = await adicionarItemNaColecao(dadosItem);
                if (itemAdicionado) {
                    alert('Item adicionado com sucesso!');
                    // --- ALTERAÇÃO PRINCIPAL AQUI ---
                    // Em vez de limpar o formulário, redireciona para a página de detalhes do novo item.
                    window.location.href = `detalhes.html?id=${itemAdicionado.id}`;
                }
            }
        } catch (error) {
            console.error("Erro na submissão do formulário:", error);
        } finally {
            if (btnSalvar) {
                btnSalvar.disabled = false;
                btnSalvar.textContent = isEditMode ? 'Atualizar' : 'Adicionar';
            }
        }
    });
  }

    async function preencherFormularioComDados(item) {
        if (!item) return;

        if (itemIdInput) itemIdInput.value = item.id;
        if (tmdbIdInput) tmdbIdInput.value = item.tmdb_id || '';
        if (urlImagemInput) urlImagemInput.value = item.urlImagem || '';
        if (nomeInput) nomeInput.value = item.nome || '';
        if (tipoSelect) tipoSelect.value = item.tipo || 'Filme';
        if (anoLancamentoInput) anoLancamentoInput.value = item.anoLancamento || '';
        if (trailerUrlInput) trailerUrlInput.value = item.trailerUrl || '';
        if (idiomaInput) idiomaInput.value = item.idioma || '';
        if (sinopseInput) sinopseInput.value = item.sinopse || '';
        if (reviewInput) reviewInput.value = item.review || '';
        if (adicionadoManualmenteInput) adicionadoManualmenteInput.value = item.adicionadoManualmente ? "true" : "false";
        if (formTitle) formTitle.textContent = 'Editar Item';
        if (btnSalvar) btnSalvar.textContent = 'Atualizar';

        if (item.genero && Array.isArray(item.genero)) {
          await selecionarChipsDeGenero(item.genero);
        }

        if (relacionadosChipsContainer) relacionadosChipsContainer.innerHTML = '';
        if (item.relacionados && Array.isArray(item.relacionados)) {
          for (const idRelacionado of item.relacionados) {
            const itemRel = await getItemDaColecaoPorId(idRelacionado);
            if (itemRel) {
              const chip = document.createElement('span');
              chip.className = 'chip selected';
              chip.dataset.id = itemRel.id;
              chip.innerHTML = `${itemRel.nome}<span class="remove">×</span>`;
              if (chip.querySelector('.remove')) {
                chip.querySelector('.remove').addEventListener('click', () => chip.remove());
              }
              relacionadosChipsContainer.appendChild(chip);
            }
          }
        }
        
        // --- ATUALIZAÇÃO IMPORTANTE: Preenche os campos de classificação dinâmicos ---
        if (item.classificacoes) {
          for (const key in camposClassificacao) {
            if (camposClassificacao[key] && item.classificacoes[key] !== undefined && item.classificacoes[key] !== null) {
              camposClassificacao[key].value = item.classificacoes[key];
            } else if (camposClassificacao[key]) {
              camposClassificacao[key].value = '';
            }
          }
        }

        const bgBlurElEdicao = document.getElementById('bgBlur');
        if (item.urlImagem && bgBlurElEdicao) {
            bgBlurElEdicao.style.backgroundImage = `url(${item.urlImagem})`;
        } else if (bgBlurElEdicao) {
            bgBlurElEdicao.style.backgroundImage = '';
        }
    }

    if (btnLimparForm) {
        btnLimparForm.addEventListener('click', async () => await limparFormularioCompleto(true));
    }

    async function limparFormularioCompleto(limparPesquisaTMDB = true) {
        if (form) form.reset();
        if (itemIdInput) itemIdInput.value = '';
        if (tmdbIdInput) tmdbIdInput.value = '';
        if (adicionadoManualmenteInput) adicionadoManualmenteInput.value = "false";
        if (urlImagemInput) urlImagemInput.value = '';
        if (nomeInput) nomeInput.value = '';
        if (tipoSelect) tipoSelect.value = 'Filme';
        if (anoLancamentoInput) anoLancamentoInput.value = '';
        if (trailerUrlInput) trailerUrlInput.value = '';
        if (idiomaInput) idiomaInput.value = '';
        if (sinopseInput) sinopseInput.value = '';
        if (reviewInput) reviewInput.value = '';
        if (formTitle) formTitle.textContent = 'Adicionar Novo Item - Pesquisar';
        if (btnSalvar) {
        btnSalvar.textContent = 'Adicionar';
        btnSalvar.disabled = false;
        }
        if (generoChipsContainer) {
            const checkboxesGenero = generoChipsContainer.querySelectorAll('input[type="checkbox"]');
            checkboxesGenero.forEach(chk => {
                chk.checked = false;
                const label = generoChipsContainer.querySelector(`label[for="${chk.id}"]`);
                if(label) label.classList.remove('selected');
            });
        }
        if (relacionadosChipsContainer) relacionadosChipsContainer.innerHTML = '';
        if (relacionadoInput) relacionadoInput.value = '';

        // Limpa os campos de classificação dinâmicos
        for (const key in camposClassificacao) {
        if (camposClassificacao[key]) {
            camposClassificacao[key].value = '';
            camposClassificacao[key].style.borderColor = '';
        }
        }
        if (nomeInput) nomeInput.style.borderColor = '';

        if (limparPesquisaTMDB) {
        if (tmdbSearchQueryInput) tmdbSearchQueryInput.value = '';
        if (tmdbSearchTypeSelect) tmdbSearchTypeSelect.value = 'multi';
        if (tmdbSearchResultsContainer) tmdbSearchResultsContainer.innerHTML = '';
        }
        
        const bgBlurElLimpar = document.getElementById('bgBlur');
        if (bgBlurElLimpar) bgBlurElLimpar.style.backgroundImage = '';

        isEditMode = false;
        const currentUrlParams = new URLSearchParams(window.location.search);
        if (currentUrlParams.has('id')) {
            currentUrlParams.delete('id');
            const newPath = window.location.pathname + (currentUrlParams.toString() ? `?${currentUrlParams.toString()}` : '');
            history.pushState(null, '', newPath);
        }
        
        mostrarEcra('pesquisaTMDB');
    }

  /* ------------------------------------------------------------------
     Inicialização (ATUALIZADA)
  ------------------------------------------------------------------*/
  // 1. Renderiza os campos de avaliação primeiro, pois são necessários para tudo o resto.
  await renderizarCamposDeClassificacao();

  // 2. Popula os outros elementos dinâmicos.
  await popularChipsDeGenero();
  await popularDatalistRelacionados();

  // 3. Verifica se está em modo de edição e carrega os dados do item.
  // Esta função irá preencher os campos que acabaram de ser renderizados.
  await carregarDadosParaEdicao();
});