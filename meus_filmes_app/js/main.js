// meus_filmes_app/js/main.js

document.addEventListener('DOMContentLoaded', async () => {
  const btnAdicionarNovo = document.getElementById('btnAdicionarNovo');
  // const btnCarregarJson = document.getElementById('btnCarregarJson');         // Comentado ou Removido
  // const jsonUploadInput = document.getElementById('jsonUpload');             // Comentado ou Removido
  // const btnDescarregarJson = document.getElementById('btnDescarregarJson');   // Comentado ou Removido
  const tabButtons = document.querySelectorAll('.tab-button');

  // Navegação para adicionar novo item
  if (btnAdicionarNovo) {
    btnAdicionarNovo.addEventListener('click', () => {
      window.location.href = 'formulario.html';
    });
  }

  // Carregar coleção (JSON) - Bloco a ser removido ou comentado
  /*
  if (btnCarregarJson && jsonUploadInput) {
    btnCarregarJson.addEventListener('click', () => jsonUploadInput.click());
    jsonUploadInput.addEventListener('change', async event => {
      const file = event.target.files[0];
      if (file) {
        try {
          alert('A importação de JSON para o backend ainda não está implementada.');
        } catch (e) {
          alert(`Erro ao processar ficheiro JSON: ${e.message}`);
        }
        event.target.value = null;
      }
    });
  }
  */

  // Descarregar coleção para arquivo - Bloco a ser removido ou comentado
  /*
  if (btnDescarregarJson) {
    btnDescarregarJson.addEventListener('click', () => {
      alert('O descarregamento de JSON a partir do backend ainda não está implementado.');
    });
  }
  */


  // Filtro por abas (tabs)
  let currentFilter = 'all';
  tabButtons.forEach(btn => {
    btn.addEventListener('click', async () => { // async aqui também
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      await renderAll(); // Re-renderiza com o novo filtro
    });
  });

  // Re-render de Top5 e Grid (agora assíncrono)
  async function renderAll() {
    // Mostrar um indicador de loading, se desejado
    const top5Container = document.querySelector('.top5-cards');
    const gridContainer = document.getElementById('colecaoGrid'); // definido em uiUtils.js, mas podemos pegar aqui também
    
    if(top5Container) top5Container.innerHTML = '<p>A carregar Top 5...</p>';
    if(gridContainer) gridContainer.innerHTML = '<p>A carregar coleção...</p>';

    try {
      await renderTop5();
      await renderGrid();
    } catch (error) {
      console.error("Erro ao renderizar tudo:", error);
      if(top5Container) top5Container.innerHTML = '<p style="color:red;">Erro ao carregar Top 5.</p>';
      if(gridContainer) gridContainer.innerHTML = '<p style="color:red;">Erro ao carregar coleção.</p>';
    }
  }

  // Renderiza Top 5 conforme filtro atual (agora assíncrono)
  async function renderTop5() {
    const top5Container = document.querySelector('.top5-cards');
    if (!top5Container) return;
    top5Container.innerHTML = ''; // Limpa antes de popular

    let items = await obterColecaoCompleta(); // Chama a função assíncrona de dataManager.js
    
    // Ordena os itens. Certifica-te que scoreFinal é um número.
    items = items.sort((a, b) => parseFloat(b.scoreFinal) - parseFloat(a.scoreFinal));

    if (currentFilter !== 'all') {
      items = items.filter(i => i.tipo === currentFilter);
    }

    if (items.length === 0 && currentFilter !== 'all') {
        top5Container.innerHTML = `<p>Nenhum item do tipo "${currentFilter}" no Top 5.</p>`;
        return;
    } else if (items.length === 0) {
        top5Container.innerHTML = `<p>A tua coleção está vazia ou não foi possível carregar o Top 5.</p>`;
        return;
    }
    
    const top5 = items.slice(0, 5);
    top5.forEach((item, idx) => {
      const isPrincipal = idx === 0;
      const card = document.createElement('div');
      card.className = isPrincipal ? 'card-principal' : 'card-menor';
      card.innerHTML = `
        <span class="badge">No ${idx + 1}</span>
        <img src="${item.urlImagem || 'https://via.placeholder.com/250x375.png?text=Sem+Imagem'}" alt="${item.nome}">
        ${isPrincipal
          ? `<h3>${item.nome}</h3><p class="score">${parseFloat(item.scoreFinal).toFixed(1)}</p>`
          : `<h4>${item.nome}</h4><p class="score">${parseFloat(item.scoreFinal).toFixed(1)}</p>`
        }
        <p class="sinopse">${item.sinopse || 'Sem sinopse disponível.'}</p>
      `;
      card.addEventListener('click', () => {
        window.location.href = `detalhes.html?id=${item.id}`; //
      });
      top5Container.appendChild(card);
    });
  }

  // Renderiza o restante da coleção, mostrando rank e excluindo os Top 5 (agora assíncrono)
  async function renderGrid() {
    let items = await obterColecaoCompleta(); // Chama a função assíncrona de dataManager.js

    // Ordena os itens. Certifica-te que scoreFinal é um número.
    items = items.sort((a, b) => parseFloat(b.scoreFinal) - parseFloat(a.scoreFinal));

    if (currentFilter !== 'all') {
      items = items.filter(i => i.tipo === currentFilter);
    }
    
    // Obtém os IDs dos itens que já estão no Top 5 (baseado no filtro atual)
    const top5Ids = items.slice(0, 5).map(item => item.id);
    // Filtra os itens da grelha para não incluir os que já estão no Top 5
    const gridItems = items.filter(item => !top5Ids.includes(item.id));

    // A função exibirColecaoNaGrid já está em uiUtils.js
    // Ela espera `items` e `startRank`.
    // O `startRank` será 6, pois os 5 primeiros já estão no Top 5.
    exibirColecaoNaGrid(gridItems, 6, 'colecaoGrid'); //
  }

  // Inicialização ao carregar página (agora assíncrona)
  await renderAll();
});