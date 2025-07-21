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
  
  const scorePrincipalEl = document.getElementById('itemScoreFinal');
  const rankBadgeEl = document.getElementById('rankBadge');
  
  const itemScoreFinalMetaEl = document.getElementById('itemScoreFinalMeta');
  const itemAnoLancamentoMetaEl = document.getElementById('itemAnoLancamentoMeta');
  const itemGeneroMetaEl = document.getElementById('itemGeneroMeta');

  const btnTrailer = document.getElementById('btnTrailer');
  const bgBlur = document.getElementById('bgBlur');

  // --- NOVIDADE: Container para as classificações dinâmicas ---
  const gridClassificacoesContainer = document.getElementById('grid-classificacoes-detalhes');

  const btnEditarItem = document.getElementById('btnEditarItem');
  const btnEliminarItem = document.getElementById('btnEliminarItem');
  const btnVoltarLista = document.getElementById('btnVoltarLista');

  const relacionadosSection = document.getElementById('relacionadosSection');
  const relacionadosGrid = document.getElementById('relacionadosGrid');

  // --- Obter ID do item e carregar dados ---
  const params = new URLSearchParams(window.location.search);
  const itemId = params.get('id');

  if (!itemId) {
    alert('ID do item não fornecido.');
    window.location.href = 'index.html';
    return;
  }

  if(itemNameH1) itemNameH1.textContent = 'A carregar detalhes...';
  if(relacionadosSection) relacionadosSection.style.display = 'none';

  /**
   * NOVA FUNÇÃO: Renderiza as classificações dinamicamente
   * @param {Object} classificacoes - Objeto com as classificações, ex: { historiaEnredo: 9.0, ... }
   */
  function renderizarClassificacoes(classificacoes) {
    if (!gridClassificacoesContainer) return;
    gridClassificacoesContainer.innerHTML = ''; // Limpa o container

    if (!classificacoes || Object.keys(classificacoes).length === 0) {
      gridClassificacoesContainer.innerHTML = '<p>Nenhuma classificação pessoal adicionada.</p>';
      return;
    }

    // Ordena as chaves para uma exibição consistente
    const chavesOrdenadas = Object.keys(classificacoes).sort();

    for (const key of chavesOrdenadas) {
      const nota = classificacoes[key];
      const notaFormatada = (nota !== null && nota !== undefined) ? parseFloat(nota).toFixed(1) : 'N/A';
      
      // Recria o nome "legível" a partir da chave (ex: 'historiaEnredo' -> 'Historia Enredo')
      const nomeCriterio = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());

      const div = document.createElement('div');
      div.innerHTML = `<strong>${nomeCriterio}:</strong><span>${notaFormatada}</span>`;
      gridClassificacoesContainer.appendChild(div);
    }
  }

  try {
    const item = await getItemDaColecaoPorId(itemId);
    console.log('[Details Handler] Dados do item recebidos:', JSON.stringify(item, null, 2));

    if (!item) {
      alert('Item não encontrado ou falha ao carregar.');
      if(itemNameH1) itemNameH1.textContent = 'Item não encontrado.';
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
    if(itemReview) itemReview.textContent = item.review || '';

    const generosArray = item.genero || [];
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

    if (rankBadgeEl) {
        try {
            const todosItens = await obterColecaoCompleta();
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

    if (btnTrailer) {
      if (item.trailerUrl) {
        btnTrailer.href = item.trailerUrl;
        btnTrailer.style.display = 'inline-block';
      } else {
        btnTrailer.style.display = 'none';
      }
    }

    // --- NOVIDADE: Chama a nova função para renderizar as classificações ---
    renderizarClassificacoes(item.classificacoes);


    // Preencher Relacionados (se existirem)
    if (relacionadosGrid && relacionadosSection && Array.isArray(item.relacionados) && item.relacionados.length > 0) {
      relacionadosGrid.innerHTML = '';
      let relacionadosEncontradosCount = 0;
      for (const relId of item.relacionados) {
        const relItem = await getItemDaColecaoPorId(relId);
        if (relItem) {
          relacionadosEncontradosCount++;
          const card = document.createElement('div');
          card.className = 'rel-card';
          card.innerHTML = `
            <img src="${relItem.urlImagem || 'https://via.placeholder.com/150x225.png?text=Sem+Capa'}" alt="${relItem.nome}">
            <span>${relItem.nome}</span>
          `;
          card.addEventListener('click', () => {
            window.location.href = `detalhes.html?id=${relItem.id}`;
          });
          relacionadosGrid.appendChild(card);
        }
      }
      if (relacionadosEncontradosCount > 0) {
          relacionadosSection.style.display = 'block';
      }
    } else if (relacionadosSection) {
      relacionadosSection.style.display = 'none';
    }

    // --- Event Listeners para Botões ---
    if (btnEditarItem) {
      btnEditarItem.addEventListener('click', () => {
        window.location.href = `formulario.html?id=${itemId}`;
      });
    }

    if (btnEliminarItem) {
      btnEliminarItem.addEventListener('click', async () => {
        if (confirm(`Tem a certeza que quer eliminar "${item.nome || 'este item'}"?`)) {
          btnEliminarItem.disabled = true;
          btnEliminarItem.textContent = 'A eliminar...';
          try {
            const sucesso = await eliminarItemDaColecao(itemId);
            if (sucesso) {
              alert('Item eliminado com sucesso.');
              window.location.href = 'index.html';
            } else {
              btnEliminarItem.disabled = false;
              btnEliminarItem.textContent = '🗑';
            }
          } catch (error) {
            alert("Ocorreu um erro ao eliminar o item. Tente novamente.");
            btnEliminarItem.disabled = false;
            btnEliminarItem.textContent = '🗑';
          }
        }
      });
    }

    if (btnVoltarLista) {
      btnVoltarLista.addEventListener('click', () => {
        window.location.href = 'index.html';
      });
    }

  } catch (error) {
    console.error('Erro fatal ao carregar detalhes do item:', error);
    if(itemNameH1) itemNameH1.textContent = 'Erro ao carregar item.';
  }
});