// meus_filmes_app/js/detailsHandler.js

document.addEventListener('DOMContentLoaded', async () => {
  // --- Elementos principais do DOM ---
  const itemNameH1 = document.getElementById('itemName');
  const itemImagem = document.getElementById('itemImagem');
  const itemSinopse = document.getElementById('itemSinopse');
  const itemReview = document.getElementById('itemReview');
  const itemGenero = document.getElementById('itemGenero');
  const itemTipo = document.getElementById('itemTipo');
  const itemIdioma = document.getElementById('itemIdioma');
  const itemAnoLancamento = document.getElementById('itemAnoLancamento');
  
  // Elementos para o Score e Ranking
  const scorePrincipalEl = document.getElementById('itemScoreFinal'); // O score grande e em destaque
  const rankBadgeEl = document.getElementById('rankBadge');
  
  // Elementos Meta (na secção de grelha de detalhes)
  const itemScoreFinalMetaEl = document.getElementById('itemScoreFinalMeta');
  const itemAnoLancamentoMetaEl = document.getElementById('itemAnoLancamentoMeta');
  const itemGeneroMetaEl = document.getElementById('itemGeneroMeta');

  const btnTrailer = document.getElementById('btnTrailer');
  const bgBlur = document.getElementById('bgBlur');

  // Spans de classificações
  const classSpans = {
    historiaEnredo: document.getElementById('classHistoriaEnredo'),
    roteiroDialogos: document.getElementById('classRoteiroDialogos'),
    construcaoMundo: document.getElementById('classConstrucaoMundo'),
    desenvolvimentoPersonagens: document.getElementById('classDesenvolvimentoPersonagens'),
    musica: document.getElementById('classMusica'),
    efeitosSonoros: document.getElementById('classEfeitosSonoros'),
    artesVisuais: document.getElementById('classArtesVisuais'),
    impactoEmocional: document.getElementById('classImpactoEmocional'),
    originalidade: document.getElementById('classOriginalidade'),
    ritmo: document.getElementById('classRitmo'),
    humor: document.getElementById('classHumor'),
    adaptacaoRemake: document.getElementById('classAdaptacaoRemake')
  };

  // Botões de Ação
  const btnEditarItem = document.getElementById('btnEditarItem');
  const btnEliminarItem = document.getElementById('btnEliminarItem');
  const btnVoltarLista = document.getElementById('btnVoltarLista');

  // Secção de Relacionados
  const relacionadosSection = document.getElementById('relacionadosSection');
  const relacionadosGrid = document.getElementById('relacionadosGrid');

  // --- Obter ID do item e carregar dados ---
  const params = new URLSearchParams(window.location.search);
  const itemId = params.get('id');

  if (!itemId) {
    alert('ID do item não fornecido.');
    window.location.href = 'index.html'; //
    return;
  }

  if(itemNameH1) itemNameH1.textContent = 'A carregar detalhes...';
  if(relacionadosSection) relacionadosSection.style.display = 'none'; // Esconder por defeito

  try {
    const item = await getItemDaColecaoPorId(itemId); //
    // ADICIONE ESTA LINHA PARA DEPURAÇÃO:
    console.log('[Details Handler] Dados do item recebidos:', JSON.stringify(item, null, 2));

    if (!item) {
      alert('Item não encontrado ou falha ao carregar.');
      if(itemNameH1) itemNameH1.textContent = 'Item não encontrado.';
      // window.location.href = 'index.html'; // // Redirecionar pode ser muito abrupto
      return;
    }

    // --- Preencher dados na UI ---
    document.title = `Detalhes: ${item.nome || 'Item'}`;
    if (bgBlur && item.urlImagem) {
      bgBlur.style.backgroundImage = `url(${item.urlImagem})`;
    }

    if(itemNameH1) itemNameH1.textContent = item.nome || 'Nome Indisponível';
    if(itemImagem) {
        itemImagem.src = item.urlImagem || 'https://via.placeholder.com/400x600.png?text=Capa';
        itemImagem.alt = `Capa de ${item.nome || 'item desconhecido'}`;
    }
    if(itemSinopse) itemSinopse.textContent = item.sinopse || 'Sem sinopse disponível.';
    if(itemReview) itemReview.textContent = item.review || ''; // Review pessoal

    const generosArray = item.genero || []; // Vem como array do dataManager
    const generosTexto = generosArray.length > 0 ? generosArray.join(', ') : 'N/A';
    if(itemGenero) itemGenero.textContent = generosTexto;
    if(itemGeneroMetaEl) itemGeneroMetaEl.textContent = generosTexto;

    if(itemTipo) itemTipo.textContent = item.tipo || '—';
    if(itemIdioma) itemIdioma.textContent = item.idioma || '—';
    
    const ano = item.anoLancamento || 'N/A';
    if(itemAnoLancamento) itemAnoLancamento.textContent = ano;
    if(itemAnoLancamentoMetaEl) itemAnoLancamentoMetaEl.textContent = ano;

    const scoreValorNumerico = parseFloat(item.scoreFinal);
    const scoreFormatado = isNaN(scoreValorNumerico) ? 'N/A' : scoreValorNumerico.toFixed(1);
    if(scorePrincipalEl) scorePrincipalEl.textContent = scoreFormatado;
    if(itemScoreFinalMetaEl) itemScoreFinalMetaEl.textContent = scoreFormatado;

    // Calcular e exibir ranking
    if (rankBadgeEl) { // Apenas tenta calcular se o elemento existir
        try {
            const todosItens = await obterColecaoCompleta(); //
            const rankingOrdenado = todosItens
                .filter(it => typeof it.scoreFinal === 'number' && !isNaN(it.scoreFinal))
                .sort((a, b) => b.scoreFinal - a.scoreFinal);
            
            const indexNoRanking = rankingOrdenado.findIndex(it => it.id === item.id);
            const pos = indexNoRanking !== -1 ? indexNoRanking + 1 : 0;
            rankBadgeEl.textContent = pos > 0 ? `Rank #${pos}` : 'N/R';
        } catch (error) {
            console.error("Erro ao calcular ranking:", error);
            rankBadgeEl.textContent = 'Rank N/D';
        }
    }

    // Trailer
    if (btnTrailer) {
      if (item.trailerUrl) {
        btnTrailer.href = item.trailerUrl;
        btnTrailer.style.display = 'inline-block';
      } else {
        btnTrailer.style.display = 'none';
      }
    }

    // Classificações
    // O objeto item.classificacoes já deve vir mapeado do dataManager
    const c = item.classificacoes || {}; 
    for (const key in classSpans) {
      if (classSpans[key]) {
        const nota = c[key];
        // Trata notas como números e formata para uma casa decimal, ou exibe N/A
        const notaNumerica = parseFloat(nota);
        classSpans[key].textContent = (nota !== undefined && nota !== null && nota !== '' && !isNaN(notaNumerica)) 
                                      ? notaNumerica.toFixed(1) 
                                      : 'N/A';
      }
    }
    // Tratamento específico para adaptacaoRemake se for opcional e puder ser null/vazio e não queremos "0.0"
    if (classSpans.adaptacaoRemake && (c.adaptacaoRemake === null || c.adaptacaoRemake === undefined || c.adaptacaoRemake === '')) {
        classSpans.adaptacaoRemake.textContent = 'N/A';
    }


    // Preencher Relacionados (se existirem e a secção estiver no HTML)
    if (relacionadosGrid && relacionadosSection && Array.isArray(item.relacionados) && item.relacionados.length > 0) {
      relacionadosGrid.innerHTML = ''; // Limpa antes de popular
      let relacionadosEncontradosCount = 0;
      for (const relId of item.relacionados) {
        const relItem = await getItemDaColecaoPorId(relId); //
        if (relItem) {
          relacionadosEncontradosCount++;
          const card = document.createElement('div');
          card.className = 'rel-card'; //
          card.innerHTML = `
            <img src="${relItem.urlImagem || 'https://via.placeholder.com/150x225.png?text=Sem+Capa'}" alt="${relItem.nome}">
            <span>${relItem.nome}</span>
          `;
          card.addEventListener('click', () => {
            window.location.href = `detalhes.html?id=${relItem.id}`; //
          });
          relacionadosGrid.appendChild(card);
        }
      }
      if (relacionadosEncontradosCount > 0) {
          relacionadosSection.style.display = 'block';
      } else {
          relacionadosSection.style.display = 'none';
      }
    } else if (relacionadosSection) {
      relacionadosSection.style.display = 'none';
    }

    // --- Event Listeners para Botões ---
    if (btnEditarItem) {
      btnEditarItem.addEventListener('click', () => {
        window.location.href = `formulario.html?id=${itemId}`; //
      });
    }

    if (btnEliminarItem) {
      btnEliminarItem.addEventListener('click', async () => {
        if (confirm(`Tem a certeza que quer eliminar "${item.nome || 'este item'}"?`)) {
          btnEliminarItem.disabled = true; // Desabilitar para evitar cliques múltiplos
          btnEliminarItem.textContent = 'A eliminar...';
          try {
            const sucesso = await eliminarItemDaColecao(itemId); //
            if (sucesso) {
              alert('Item eliminado com sucesso.');
              window.location.href = 'index.html'; //
            } else {
              // A função dataManager já deve ter dado um alert
              btnEliminarItem.disabled = false;
              btnEliminarItem.textContent = '🗑'; // Reset texto do botão
            }
          } catch (error) {
            console.error("Erro ao tentar eliminar item:", error);
            alert("Ocorreu um erro ao eliminar o item. Tente novamente.");
            btnEliminarItem.disabled = false;
            btnEliminarItem.textContent = '🗑'; // Reset texto do botão
          }
        }
      });
    }

    if (btnVoltarLista) {
      btnVoltarLista.addEventListener('click', () => {
        window.location.href = 'index.html'; //
      });
    }

  } catch (error) {
    console.error('Erro fatal ao carregar detalhes do item:', error);
    if(itemNameH1) itemNameH1.textContent = 'Erro ao carregar item.';
    // Poderia adicionar uma mensagem de erro mais visível para o utilizador na página
  }
});