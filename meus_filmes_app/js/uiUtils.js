// meus_filmes_app/js/uiUtils.js

function renderizarItemGrid(item, rank) {
  const itemCard = document.createElement('div');
  itemCard.classList.add('item-card');
  itemCard.dataset.id = item.id;

  const img = document.createElement('img');
  img.src = item.urlImagem || 'https://via.placeholder.com/250x375.png?text=Sem+Imagem';
  img.alt = `Capa de ${item.nome}`;

  const nomeH3 = document.createElement('h3'); // Renomeado para clareza, já que 'nome' é uma propriedade do item
  nomeH3.textContent = item.nome;

  // Container para score + rank
  const scoreContainer = document.createElement('div');
  scoreContainer.classList.add('score-container');

  const scoreSpan = document.createElement('span'); // Renomeado para clareza
  scoreSpan.classList.add('score');
  const scoreValue = parseFloat(item.scoreFinal);
  scoreSpan.textContent = `Score: ${isNaN(scoreValue) ? 'N/A' : scoreValue.toFixed(1)}`;


  const rankSpan = document.createElement('span');
  rankSpan.classList.add('rank');
  rankSpan.textContent = `#${rank}`;

  scoreContainer.appendChild(scoreSpan);
  scoreContainer.appendChild(rankSpan);

  itemCard.appendChild(img);
  itemCard.appendChild(nomeH3);
  itemCard.appendChild(scoreContainer);

  itemCard.addEventListener('click', () => {
    window.location.href = `detalhes.html?id=${item.id}`; //
  });

  return itemCard;
}

function exibirColecaoNaGrid(items, startRank = 1, containerId = 'colecaoGrid') {
  const gridContainer = document.getElementById(containerId);
  if (!gridContainer) {
    console.error(`Container da grid com ID '${containerId}' não encontrado.`);
    return;
  }
  gridContainer.innerHTML = ''; // Limpa o conteúdo anterior

  if (!items || items.length === 0) {
    // Ajusta a mensagem para ser mais genérica, pois o contexto (se é coleção completa ou filtrada) é dado por quem chama.
    gridContainer.innerHTML = '<p>Nenhum item para exibir nesta grelha.</p>';
    return;
  }

  items.forEach((item, idx) => {
    const rankCalculado = startRank + idx; // Renomeado para clareza
    const itemElement = renderizarItemGrid(item, rankCalculado);
    gridContainer.appendChild(itemElement);
  });
}