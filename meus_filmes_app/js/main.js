
// meus_filmes_app/js/main.js

document.addEventListener('DOMContentLoaded', async () => {
  // --- Referências aos Elementos do DOM ---
  const btnAdicionarNovo = document.getElementById('btnAdicionarNovo');
  const tabButtons = document.querySelectorAll('.tab-button');

  // NOVO: Elementos do menu do utilizador
  const welcomeMessageEl = document.getElementById('welcomeMessage');
  const btnLogout = document.getElementById('btnLogout');
  const btnDeleteAccount = document.getElementById('btnDeleteAccount'); // Para o próximo passo

  // --- LÓGICA DE GESTÃO DO UTILIZADOR ---

  // Verifica se o utilizador está logado
  const nomeUtilizador = localStorage.getItem('nomeUtilizador');
  if (!nomeUtilizador) {
    // Se não houver nome de utilizador, redireciona para a página de autenticação
    alert("Por favor, faz login para aceder à tua coleção.");
    window.location.href = 'auth.html';
    return; // Pára a execução do resto do script
  }

  // Mostra a mensagem de boas-vindas
  if (welcomeMessageEl) {
    welcomeMessageEl.textContent = `Olá, ${nomeUtilizador}!`;
  }

  // Adiciona a funcionalidade de Logout
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      // Limpa todos os dados do utilizador guardados localmente
      localStorage.removeItem('accessToken');
      localStorage.removeItem('nomeUtilizador');
      localStorage.removeItem('idUtilizador');
      
      // Redireciona para a página de login
      alert("Sessão terminada.");
      window.location.href = 'auth.html';
    });
  }


  // meus_filmes_app/js/main.js

// ... (logo a seguir ao listener do btnLogout)

  // Adiciona a funcionalidade de Eliminar Conta
  if (btnDeleteAccount) {
    btnDeleteAccount.addEventListener('click', async () => {
      // Pede uma dupla confirmação para uma ação tão destrutiva
      const confirm1 = confirm("Tem a certeza ABSOLUTA que quer eliminar a sua conta? Todos os seus dados (coleção, critérios, etc.) serão perdidos para sempre. Esta ação não pode ser desfeita.");
      if (!confirm1) {
        return; // Utilizador cancelou
      }

      const confirm2 = prompt("Para confirmar, por favor escreva o seu nome de utilizador: '" + nomeUtilizador + "'");
      if (confirm2 !== nomeUtilizador) {
        alert("O nome de utilizador não corresponde. A eliminação foi cancelada.");
        return;
      }

      // Se ambas as confirmações passarem, procede com a eliminação
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${BACKEND_URL}/utilizador`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (response.ok) {
          alert("A sua conta foi eliminada com sucesso.");
          // Limpa o localStorage e redireciona, tal como no logout
          localStorage.clear(); // Limpa tudo
          window.location.href = 'auth.html';
        } else {
          throw new Error(data.message || 'Ocorreu um erro ao tentar eliminar a conta.');
        }

      } catch (error) {
        console.error('Erro ao eliminar conta:', error);
        alert(`Erro: ${error.message}`);
      }
    });
  }


  // --- LÓGICA EXISTENTE DA PÁGINA ---
// ... (resto do ficheiro)

  // Navegação para adicionar novo item
  if (btnAdicionarNovo) {
    btnAdicionarNovo.addEventListener('click', () => {
      window.location.href = 'formulario.html';
    });
  }

  // Filtro por abas (tabs)
  let currentFilter = 'all';
  tabButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      await renderAll();
    });
  });

  // Re-render de Top5 e Grid
  async function renderAll() {
    const top5Container = document.querySelector('.top5-cards');
    const gridContainer = document.getElementById('colecaoGrid');
    
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

  // Renderiza Top 5
  async function renderTop5() {
    const top5Container = document.querySelector('.top5-cards');
    if (!top5Container) return;
    top5Container.innerHTML = '';

    let items = await obterColecaoCompleta();
    items = items.sort((a, b) => parseFloat(b.scoreFinal) - parseFloat(a.scoreFinal));

    if (currentFilter !== 'all') {
      items = items.filter(i => i.tipo === currentFilter);
    }

    if (items.length === 0) {
        top5Container.innerHTML = `<p>A tua coleção está vazia.</p>`;
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
        window.location.href = `detalhes.html?id=${item.id}`;
      });
      top5Container.appendChild(card);
    });
  }

  // Renderiza o restante da coleção
  async function renderGrid() {
    let items = await obterColecaoCompleta();
    items = items.sort((a, b) => parseFloat(b.scoreFinal) - parseFloat(a.scoreFinal));

    if (currentFilter !== 'all') {
      items = items.filter(i => i.tipo === currentFilter);
    }
    
    const top5Ids = items.slice(0, 5).map(item => item.id);
    const gridItems = items.filter(item => !top5Ids.includes(item.id));

    exibirColecaoNaGrid(gridItems, 6, 'colecaoGrid');
  }

  // Inicialização ao carregar página
  await renderAll();
});