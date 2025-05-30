// meus_filmes_app/js/formHandler.js

document.addEventListener('DOMContentLoaded', async () => {
  /* ------------------------------------------------------------------
     Elementos do DOM (Adicionar referência para a nova secção de resumo)
  ------------------------------------------------------------------*/
  // ... (outros elementos do DOM como definidos anteriormente) ...
  const form = document.getElementById('itemForm'); //
  const formTitle = document.getElementById('formTitle'); //
  const itemIdInput = document.getElementById('itemId'); //
  const tmdbIdInput = document.getElementById('tmdbId'); //
  const adicionadoManualmenteInput = document.getElementById('adicionadoManualmente');

  const btnSalvar = document.getElementById('btnSalvar'); //
  const btnLimparForm = document.getElementById('btnLimparForm'); //

  const urlImagemInput = document.getElementById('urlImagem'); //
  const nomeInput = document.getElementById('nome'); //
  const tipoSelect = document.getElementById('tipo'); //
  const anoLancamentoInput = document.getElementById('anoLancamento'); //
  const trailerUrlInput = document.getElementById('trailerUrl'); //
  const idiomaInput = document.getElementById('idioma'); //
  const sinopseInput = document.getElementById('sinopse'); //
  const reviewInput = document.getElementById('review'); //

  const tmdbSearchSection = document.querySelector('.tmdb-search-section');
  const tmdbSearchQueryInput = document.getElementById('tmdbSearchQuery'); //
  const tmdbSearchTypeSelect = document.getElementById('tmdbSearchType'); //
  const btnTmdbSearch = document.getElementById('btnTmdbSearch'); //
  const tmdbSearchResultsContainer = document.getElementById('tmdbSearchResults'); //
  const btnAdicionarManualmenteContainer = document.getElementById('btnAdicionarManualmenteContainer');
  const btnAdicionarManualmente = document.getElementById('btnAdicionarManualmente');

  const detalhesItemSection = document.getElementById('detalhesItemSection');
  const avaliacaoSection = document.getElementById('avaliacaoSection');
  const formActionsSection = document.getElementById('formActionsSection');
  
  // NOVA referência para a secção de resumo TMDB
  const tmdbItemSummarySection = document.getElementById('tmdbItemSummarySection');
  // Referências para os elementos dentro da secção de resumo (se ainda não existirem)
  const summaryPoster = document.getElementById('summaryPoster');
  const summaryTitle = document.getElementById('summaryTitle');
  const summaryYear = document.getElementById('summaryYear');
  const summaryType = document.getElementById('summaryType');
  const summarySinopse = document.getElementById('summarySinopse');


  const generoChipsContainer = document.getElementById('generoChips'); //
  const relacionadoInput = document.getElementById('relacionadoInput'); //
  const relacionadosChipsContainer = document.getElementById('relacionadosChips'); //
  const titulosDatalist = document.getElementById('titulosLista'); //


  const camposClassificacao = {
    historiaEnredo: document.getElementById('historiaEnredo'),
    roteiroDialogos: document.getElementById('roteiroDialogos'),
    construcaoMundo: document.getElementById('construcaoMundo'),
    desenvolvimentoPersonagens: document.getElementById('desenvolvimentoPersonagens'),
    musica: document.getElementById('musica'),
    efeitosSonoros: document.getElementById('efeitosSonoros'),
    artesVisuais: document.getElementById('artesVisuais'),
    impactoEmocional: document.getElementById('impactoEmocional'),
    originalidade: document.getElementById('originalidade'),
    ritmo: document.getElementById('ritmo'),
    humor: document.getElementById('humor'),
    adaptacaoRemake: document.getElementById('adaptacaoRemake')
  };
  const generosDisponiveis = [
    'Ação & Aventura', 'Comédia', 'Mistério', 'Drama',
    'Fantasia • Ficção Científica • Sobrenatural', 'Horror & Suspense', 'Romance',
    'Biográfico / Histórico / Baseado em Factos Reais', 'Documentário', 'Slice of Life', 'Musical', 'Desporto',
    'Crime', 'Família', 'Animação', 'Guerra', 'Faroeste', 'Thriller'
  ];


  /* ------------------------------------------------------------------
     Controlo de Ecrãs/Secções do Formulário (AJUSTADO)
  ------------------------------------------------------------------*/
  function mostrarEcra(ecra) {
    // Oculta todas as secções principais primeiro
    if (tmdbSearchSection) tmdbSearchSection.classList.remove('active');
    if (btnAdicionarManualmenteContainer) btnAdicionarManualmenteContainer.classList.remove('active');
    if (tmdbItemSummarySection) tmdbItemSummarySection.classList.remove('active'); // Oculta resumo TMDB
    if (detalhesItemSection) detalhesItemSection.classList.remove('active');   // Oculta campos de detalhe input
    if (avaliacaoSection) avaliacaoSection.classList.remove('active');
    if (formActionsSection) formActionsSection.classList.remove('active');

    // ... (lógica para tornar campos editáveis/não editáveis pode vir aqui se necessário no futuro)

    switch (ecra) {
      case 'pesquisaTMDB': // Ecrã 1
        if (tmdbSearchSection) tmdbSearchSection.classList.add('active');
        if (btnAdicionarManualmenteContainer) btnAdicionarManualmenteContainer.classList.add('active');
        if (formTitle) formTitle.textContent = 'Adicionar Novo Item - Pesquisar';
        if (document.querySelector('.tmdb-search-section')) document.querySelector('.tmdb-search-section').style.display = 'block';
        break;
      case 'avaliacaoTMDB': // Ecrã 2: Resumo TMDB + Avaliação
        if (tmdbItemSummarySection) tmdbItemSummarySection.classList.add('active'); // MOSTRA resumo
        // detalhesItemSection permanece OCULTA (os inputs)
        if (avaliacaoSection) avaliacaoSection.classList.add('active');    // MOSTRA campos de avaliação
        if (formActionsSection) formActionsSection.classList.add('active'); // MOSTRA botões de submissão
        if (formTitle && nomeInput) formTitle.textContent = `Avaliar: ${nomeInput.value || 'Item Selecionado'}`; // Usa o nome do input oculto
        if (adicionadoManualmenteInput) adicionadoManualmenteInput.value = "false";
        break;
      case 'manual': // Ecrã 3: Adição manual completa
        if (detalhesItemSection) detalhesItemSection.classList.add('active');    // MOSTRA campos de detalhe input
        if (avaliacaoSection) avaliacaoSection.classList.add('active');     // MOSTRA campos de avaliação
        if (formActionsSection) formActionsSection.classList.add('active');  // MOSTRA botões de submissão
        if (formTitle) formTitle.textContent = 'Adicionar Item Manualmente';
        if (adicionadoManualmenteInput) adicionadoManualmenteInput.value = "true";
        // Garante que a pesquisa TMDB e o resumo TMDB estão ocultos
        if (tmdbSearchSection) tmdbSearchSection.classList.remove('active');
        if (btnAdicionarManualmenteContainer) btnAdicionarManualmenteContainer.classList.remove('active');
        if (tmdbItemSummarySection) tmdbItemSummarySection.classList.remove('active');
        break;
      case 'edicao': // Modo de edição existente
        if (detalhesItemSection) detalhesItemSection.classList.add('active');
        if (avaliacaoSection) avaliacaoSection.classList.add('active');
        if (formActionsSection) formActionsSection.classList.add('active');
        if (formTitle && nomeInput) formTitle.textContent = `Editar: ${nomeInput.value || 'Item'}`;
        if (document.querySelector('.tmdb-search-section')) document.querySelector('.tmdb-search-section').style.display = 'none';
        if (tmdbItemSummarySection) tmdbItemSummarySection.classList.remove('active'); // Garante que o resumo não apareça na edição direta
        // 'adicionadoManualmenteInput.value' será definido em preencherFormularioComDados
        break;
    }
  }

  /* ------------------------------------------------------------------
     Modo de Edição (como na tua versão atual, mas chama mostrarEcra('edicao'))
  ------------------------------------------------------------------*/
  const params = new URLSearchParams(window.location.search); //
  const editId = params.get('id'); //
  let isEditMode = !!editId; //
  let itemOriginalParaEdicao = null; //

  async function carregarDadosParaEdicao() { //
    if (isEditMode) {
      itemOriginalParaEdicao = await getItemDaColecaoPorId(editId); //
      if (itemOriginalParaEdicao) {
        // preencherFormularioComDados irá definir títulos e botões
        await preencherFormularioComDados(itemOriginalParaEdicao); //
        mostrarEcra('edicao'); // Chama para configurar visibilidade correta para edição
      } else {
        alert('Item para edição não encontrado.'); //
        isEditMode = false; //
        window.location.href = 'index.html'; //
      }
    } else {
      mostrarEcra('pesquisaTMDB'); // Estado inicial para adicionar novo item
    }
  }
// meus_filmes_app/js/formHandler.js
// ... (no início, as definições de constantes como tmdbSearchQueryInput, tmdbSearchTypeSelect, btnTmdbSearch, tmdbSearchResultsContainer) ...

  /* ------------------------------------------------------------------
     Funcionalidades de Pesquisa TMDB
  ------------------------------------------------------------------*/
  if (btnTmdbSearch) { // Verifica se o botão existe na página
    btnTmdbSearch.addEventListener('click', async () => {
      // Verifica se os inputs de query e tipo existem antes de aceder aos seus valores
      if (!tmdbSearchQueryInput || !tmdbSearchTypeSelect) {
        console.error("Elementos de input da pesquisa TMDB não encontrados no DOM.");
        return;
      }
      const query = tmdbSearchQueryInput.value.trim();
      const type = tmdbSearchTypeSelect.value;

      if (!query) {
        alert('Por favor, insira um termo para pesquisar.');
        return;
      }
      
      console.log(`[FORM HANDLER] A pesquisar TMDB por (ao clicar): "${query}", tipo: "${type}"`); 

      btnTmdbSearch.textContent = 'A pesquisar...';
      btnTmdbSearch.disabled = true;
      if (tmdbSearchResultsContainer) {
        tmdbSearchResultsContainer.innerHTML = '<p>A carregar resultados...</p>';
      }

      try {
        const resultados = await searchTMDB(query, type); // Chama a função em apiService.js
        console.log("[FORM HANDLER] Resultados do TMDB recebidos (ao clicar):", resultados); 
        
        exibirResultadosTMDB(resultados); // Função para mostrar os resultados
      } catch (error) {
        console.error("[FORM HANDLER] Erro ao pesquisar no TMDB (ao clicar):", error);
        if (tmdbSearchResultsContainer) {
          tmdbSearchResultsContainer.innerHTML = '<p>Ocorreu um erro ao realizar a pesquisa. Tente novamente.</p>';
        }
      } finally {
        btnTmdbSearch.textContent = 'Pesquisar';
        btnTmdbSearch.disabled = false;
      }
    });
  }

  // Função exibirResultadosTMDB - certifica-te que está como na tua versão completa
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

  // ... (resto do formHandler.js, incluindo preencherFormularioComDetalhesTMDB e outras funções)


  // ... (resto do teu formHandler.js, incluindo preencherFormularioComDetalhesTMDB) ...
  async function preencherFormularioComDetalhesTMDB(tmdbItemId, mediaType) { //
    // Resetar campos antes de preencher para evitar acumular dados
    form.reset(); //
    if (generoChipsContainer) { //
        generoChipsContainer.querySelectorAll('input[type="checkbox"]').forEach(chk => chk.checked = false); //
        generoChipsContainer.querySelectorAll('label.chip').forEach(lbl => lbl.classList.remove('selected')); //
    }
    if (relacionadosChipsContainer) relacionadosChipsContainer.innerHTML = ''; //
    if (adicionadoManualmenteInput) adicionadoManualmenteInput.value = "false"; // Item do TMDB não é manual

    tmdbSearchResultsContainer.innerHTML = '<p>A carregar detalhes...</p>'; //

    const detalhes = await getTMDBDetails(tmdbItemId, mediaType); //
    tmdbSearchResultsContainer.innerHTML = ''; //

    if (!detalhes) {
      alert('Não foi possível carregar os detalhes do item selecionado.'); //
      mostrarEcra('pesquisaTMDB'); // Volta para a pesquisa se falhar
      return;
    }

    // 1. Preenche os campos de INPUT (que podem estar ocultos no Ecrã 2)
    if (tmdbIdInput) tmdbIdInput.value = detalhes.id; //
    if (nomeInput) nomeInput.value = detalhes.title || detalhes.name || ''; //
    
    let tipoApp = 'Filme'; //
    if (mediaType === 'tv') tipoApp = 'Série'; //
    if (tipoSelect) tipoSelect.value = tipoApp; //

    if (anoLancamentoInput) anoLancamentoInput.value = detalhes.release_date ? detalhes.release_date.substring(0, 4) : (detalhes.first_air_date ? detalhes.first_air_date.substring(0, 4) : ''); //
    if (sinopseInput) sinopseInput.value = detalhes.overview || ''; //
    const posterUrl = detalhes.poster_path ? getTMDBImageUrl(detalhes.poster_path, 'original') : ''; //
    if (urlImagemInput) urlImagemInput.value = posterUrl; //
    
    const bgBlurEl = document.getElementById('bgBlur');
    if (posterUrl && bgBlurEl) { //
        bgBlurEl.style.backgroundImage = `url(${posterUrl})`;
    } else if (bgBlurEl) {
        bgBlurEl.style.backgroundImage = '';
    }

    if (idiomaInput) idiomaInput.value = detalhes.original_language ? new Intl.DisplayNames(['pt'], { type: 'language' }).of(detalhes.original_language) || detalhes.original_language : ''; //
    
    if (trailerUrlInput) { //
        if (detalhes.videos && detalhes.videos.results.length > 0) {
            const trailer = detalhes.videos.results.find(video => video.site === 'YouTube' && video.type === 'Trailer');
            trailerUrlInput.value = trailer ? `https://www.youtube.com/watch?v=$${trailer.key}` : '';
        } else {
            trailerUrlInput.value = '';
        }
    }

    if (detalhes.genres && Array.isArray(detalhes.genres)) { //
      const nomesGenerosTMDB = detalhes.genres.map(g => g.name); //
      await selecionarChipsDeGenero(nomesGenerosTMDB); //
    }

    // 2. Preenche a secção de RESUMO COMPACTO (que será visível no Ecrã 2)
    if (summaryPoster) summaryPoster.src = detalhes.poster_path ? getTMDBImageUrl(detalhes.poster_path, 'w200') : 'https://via.placeholder.com/200x300.png?text=Sem+Capa';
    if (summaryTitle) summaryTitle.textContent = nomeInput.value; // Usa o valor já definido no input
    if (summaryYear) summaryYear.textContent = anoLancamentoInput.value;
    if (summaryType) summaryType.textContent = tipoSelect.value;
    if (summarySinopse) summarySinopse.textContent = sinopseInput.value.substring(0, 200) + (sinopseInput.value.length > 200 ? '...' : ''); // Limita sinopse no resumo


    mostrarEcra('avaliacaoTMDB'); // Transita para o ecrã de avaliação TMDB
    if (camposClassificacao.historiaEnredo) camposClassificacao.historiaEnredo.focus(); //
    alert(`"${nomeInput.value}" carregado do TMDB. Por favor, adicione a sua avaliação pessoal.`); //
  }

  /* ------------------------------------------------------------------
     Botão Adicionar Manualmente
  ------------------------------------------------------------------*/
  if (btnAdicionarManualmente) {
    btnAdicionarManualmente.addEventListener('click', async () => {
      await limparFormularioCompleto(true); // Limpa tudo, incluindo pesquisa TMDB
      // limparFormularioCompleto já define o ecrã para 'pesquisaTMDB'
      // e adicionadoManualmenteInput para "false".
      // Precisamos de os sobrepor para o modo manual:
      mostrarEcra('manual');
      if (adicionadoManualmenteInput) adicionadoManualmenteInput.value = "true";
      if (nomeInput) nomeInput.focus();
    });
  }

 /* ------------------------------------------------------------------
     Gestão de Chips
  ------------------------------------------------------------------*/
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
        nomesGeneros.forEach(nomeGeneroInput => { // Renomeado para clareza
        // Normalização do género vindo do item. Assume que já está no formato correto da app.
        const generoNormalizadoApp = nomeGeneroInput.toLowerCase().replace('&', 'e').replace(' • ', ' ').replace('ficção científica • sobrenatural', 'ficção científica sobrenatural');
        
        const checkbox = Array.from(checkboxes).find(chk => {
            const valorChipNormalizado = chk.value.toLowerCase().replace('&', 'e').replace(' • ', ' ').replace('ficção científica • sobrenatural', 'ficção científica sobrenatural');
            // Tenta uma correspondência mais flexível ou exata
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
        const colecaoAtual = await obterColecaoCompleta(); //
        const idItemAtual = isEditMode && itemOriginalParaEdicao ? itemOriginalParaEdicao.id : null;

        if (Array.isArray(colecaoAtual)) {
            colecaoAtual.forEach(item => {
                if (item && item.id !== idItemAtual) { // Adicionada verificação de 'item'
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
        const idItemEmEdicao = itemIdInput ? itemIdInput.value : null; // Verifica se itemIdInput existe
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

  /* ------------------------------------------------------------------
     Submissão do Formulário e Guardar Dados (adiciona 'adicionadoManualmente')
  ------------------------------------------------------------------*/
  if (form) {
    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (btnSalvar) {
            btnSalvar.disabled = true;
            btnSalvar.textContent = isEditMode ? 'A atualizar...' : 'A adicionar...';
        }

        let classificacaoValida = true;
        // Validação dos campos de classificação e do nome
        for (const key in camposClassificacao) {
            if (camposClassificacao[key] && camposClassificacao[key].id !== 'adaptacaoRemake' && camposClassificacao[key].value === '') {
                classificacaoValida = false;
                camposClassificacao[key].style.borderColor = 'red';
            } else if (camposClassificacao[key]) {
                camposClassificacao[key].style.borderColor = '';
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

        // Construção do objeto dadosItem
        const dadosItem = {
            id: isEditMode && itemOriginalParaEdicao ? itemOriginalParaEdicao.id : gerarUniqueId(),
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

        // Lógica para adicionar ou atualizar o item no backend
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
                    await limparFormularioCompleto(true); 
                    // window.location.href = 'index.html'; // Removido para testar o fluxo no mesmo ecrã
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

/* ------------------------------------------------------------------
     Preencher Formulário (Modo de Edição)
  ------------------------------------------------------------------*/
  async function preencherFormularioComDados(item) {
    if (!item) return;

    // Preenchimento dos campos do formulário com os dados do item
    if (itemIdInput) itemIdInput.value = item.id;
    if (tmdbIdInput) tmdbIdInput.value = item.tmdb_id || item.tmdbId || ''; // A DB usa tmdb_id, o objeto pode ter tmdbId
    if (urlImagemInput) urlImagemInput.value = item.urlImagem || '';
    if (nomeInput) nomeInput.value = item.nome || '';
    if (tipoSelect) tipoSelect.value = item.tipo || 'Filme';
    if (anoLancamentoInput) anoLancamentoInput.value = item.anoLancamento || '';
    if (trailerUrlInput) trailerUrlInput.value = item.trailerUrl || '';
    if (idiomaInput) idiomaInput.value = item.idioma || '';
    if (sinopseInput) sinopseInput.value = item.sinopse || '';
    if (reviewInput) reviewInput.value = item.review || '';

    // Define o campo hidden 'adicionadoManualmente' com base no item carregado
    if (adicionadoManualmenteInput) adicionadoManualmenteInput.value = item.adicionadoManualmente ? "true" : "false";

    if (formTitle) formTitle.textContent = 'Editar Item'; // Define título para modo edição
    if (btnSalvar) btnSalvar.textContent = 'Atualizar'; // Define texto do botão para modo edição

    // Preenche chips de género
    if (item.genero && Array.isArray(item.genero)) {
      await selecionarChipsDeGenero(item.genero);
    }

    // Preenche chips de relacionados
    if (relacionadosChipsContainer) relacionadosChipsContainer.innerHTML = '';
    if (item.relacionados && Array.isArray(item.relacionados)) {
      for (const idRelacionado of item.relacionados) {
        const itemRel = await getItemDaColecaoPorId(idRelacionado);
        if (itemRel) {
          const chip = document.createElement('span');
          chip.className = 'chip selected';
          chip.dataset.id = itemRel.id;
          chip.innerHTML = `${itemRel.nome}<span class="remove">×</span>`;
          if (chip.querySelector('.remove')) { // Adiciona verificação antes de adicionar listener
            chip.querySelector('.remove').addEventListener('click', () => chip.remove());
          }
          relacionadosChipsContainer.appendChild(chip);
        }
      }
    }

    // Preenche campos de classificação
    if (item.classificacoes) {
      for (const key in camposClassificacao) {
        if (camposClassificacao[key] && item.classificacoes[key] !== undefined && item.classificacoes[key] !== null) {
          camposClassificacao[key].value = item.classificacoes[key];
        } else if (camposClassificacao[key]) {
          camposClassificacao[key].value = '';
        }
      }
    }

    // Define o background blur também no modo de edição
    const bgBlurElEdicao = document.getElementById('bgBlur');
    if (item.urlImagem && bgBlurElEdicao) {
        bgBlurElEdicao.style.backgroundImage = `url(${item.urlImagem})`;
    } else if (bgBlurElEdicao) {
        bgBlurElEdicao.style.backgroundImage = '';
    }
  }

// meus_filmes_app/js/formHandler.js
// ... (todo o código anterior do formHandler.js) ...

  /* ------------------------------------------------------------------
     Limpar Formulário (AJUSTADO para sempre voltar ao Ecrã 1)
  ------------------------------------------------------------------*/
  if (btnLimparForm) {
    btnLimparForm.addEventListener('click', async () => await limparFormularioCompleto(true));
  }

  async function limparFormularioCompleto(limparPesquisaTMDB = true) {
    if (form) form.reset(); // Reseta os valores nativos do formulário
    
    // Reset explícito dos campos de input e hidden
    if (itemIdInput) itemIdInput.value = '';
    if (tmdbIdInput) tmdbIdInput.value = '';
    if (adicionadoManualmenteInput) adicionadoManualmenteInput.value = "false"; // Redefine para o padrão
    
    if (urlImagemInput) urlImagemInput.value = '';
    if (nomeInput) nomeInput.value = '';
    if (tipoSelect) tipoSelect.value = 'Filme'; // Valor padrão para o select
    if (anoLancamentoInput) anoLancamentoInput.value = '';
    if (trailerUrlInput) trailerUrlInput.value = ''; // <--- CORRETO
    if (idiomaInput) idiomaInput.value = '';       // <--- CORRETO
    if (sinopseInput) sinopseInput.value = '';     // <--- CORRETO
    if (reviewInput) reviewInput.value = '';       // <--- CORRETO

    // Redefine título e botão de salvar para o estado de "Adicionar Novo"
    if (formTitle) formTitle.textContent = 'Adicionar Novo Item - Pesquisar';
    if (btnSalvar) {
      btnSalvar.textContent = 'Adicionar';
      btnSalvar.disabled = false;
    }

    // Limpa chips de género
    if (generoChipsContainer) {
        const checkboxesGenero = generoChipsContainer.querySelectorAll('input[type="checkbox"]');
        checkboxesGenero.forEach(chk => {
            chk.checked = false;
            const label = generoChipsContainer.querySelector(`label[for="${chk.id}"]`);
            if(label) label.classList.remove('selected');
        });
    }

    // Limpa chips de relacionados
    if (relacionadosChipsContainer) relacionadosChipsContainer.innerHTML = '';
    if (relacionadoInput) relacionadoInput.value = '';

    // Limpa valores e estilos dos campos de classificação
    for (const key in camposClassificacao) {
      if (camposClassificacao[key]) {
        camposClassificacao[key].value = '';
        camposClassificacao[key].style.borderColor = '';
      }
    }
    if (nomeInput) nomeInput.style.borderColor = ''; // Remove borda vermelha do nome, se houver

    // Limpa pesquisa TMDB se solicitado
    if (limparPesquisaTMDB) {
      if (tmdbSearchQueryInput) tmdbSearchQueryInput.value = '';
      if (tmdbSearchTypeSelect) tmdbSearchTypeSelect.value = 'multi';
      if (tmdbSearchResultsContainer) tmdbSearchResultsContainer.innerHTML = '';
    }
    
    // Limpa o background blur
    const bgBlurElLimpar = document.getElementById('bgBlur');
    if (bgBlurElLimpar) bgBlurElLimpar.style.backgroundImage = '';

    // Reseta o modo de edição e URL
    isEditMode = false;
    itemOriginalParaEdicao = null;
    const currentUrlParams = new URLSearchParams(window.location.search);
    if (currentUrlParams.has('id')) {
        currentUrlParams.delete('id');
        const newPath = window.location.pathname + (currentUrlParams.toString() ? `?${currentUrlParams.toString()}` : '');
        history.pushState(null, '', newPath);
    }
    
    // Volta para o ecrã de pesquisa TMDB por defeito ao limpar.
    mostrarEcra('pesquisaTMDB');
  }

// ... (resto do formHandler.js, especialmente a secção de Inicialização no final) ...

  /* ------------------------------------------------------------------
     Inicialização
  ------------------------------------------------------------------*/
  await popularChipsDeGenero(); //
  await popularDatalistRelacionados(); //
  await carregarDadosParaEdicao(); // Define o ecrã inicial (edição ou pesquisaTMDB) //

});