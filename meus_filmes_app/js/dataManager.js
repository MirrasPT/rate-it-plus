// meus_filmes_app/js/dataManager.js

const BACKEND_URL = 'http://localhost:3000/api';

// ... (PESOS_PADRAO, gerarUniqueId, calcularScoreFinal como antes) ...
const PESOS_PADRAO = { /* ... */ };
function gerarUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
function calcularScoreFinal(classificacoes, pesos = PESOS_PADRAO) { /* ... */ }


// Função auxiliar para obter os cabeçalhos com o token
function getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

// ------------------------- CRUD com Backend -------------------------

async function adicionarItemNaColecao(item) {
  if (!item.id) item.id = gerarUniqueId();

  try {
    const response = await fetch(`${BACKEND_URL}/colecao`, {
      method: 'POST',
      headers: getAuthHeaders(), // USA A FUNÇÃO AUXILIAR
      body: JSON.stringify(item),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText || 'Falha ao adicionar item ao backend' }));
      throw new Error(errorData.message);
    }
    const resultado = await response.json();
    console.log('Item adicionado via backend:', resultado);
    return mapearItemDoBackendParaFrontend(resultado.item);
  } catch (error) {
    console.error('Erro em adicionarItemNaColecao:', error);
    alert(`Erro ao adicionar item: ${error.message}`);
    throw error;
  }
}

async function atualizarItemNaColecao(id, dadosItem) {
  try {
    const response = await fetch(`${BACKEND_URL}/colecao/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(), // USA A FUNÇÃO AUXILIAR
      body: JSON.stringify(dadosItem),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText || 'Falha ao atualizar item no backend' }));
      throw new Error(errorData.message);
    }
    const resultado = await response.json();
    console.log('Item atualizado via backend:', resultado);
    return mapearItemDoBackendParaFrontend(resultado.item);
  } catch (error) {
    console.error('Erro em atualizarItemNaColecao:', error);
    alert(`Erro ao atualizar item: ${error.message}`);
    throw error;
  }
}

async function eliminarItemDaColecao(id) {
  try {
    const response = await fetch(`${BACKEND_URL}/colecao/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(), // USA A FUNÇÃO AUXILIAR (embora DELETE possa não ter corpo, o token ainda é necessário)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText || 'Falha ao eliminar item no backend' }));
      throw new Error(errorData.message);
    }
    const resultado = await response.json();
    console.log('Item eliminado via backend:', resultado.id);
    return true;
  } catch (error) {
    console.error('Erro em eliminarItemDaColecao:', error);
    alert(`Erro ao eliminar item: ${error.message}`);
    return false;
  }
}

// ------------------------- Getters com Backend e Mapeamento -------------------------

function mapearItemDoBackendParaFrontend(itemDoBackend) {
    // ... (função como antes)
    if (!itemDoBackend) return null;
    return {
        id: itemDoBackend.id,
        id_utilizador: itemDoBackend.id_utilizador, // Inclui se o backend enviar
        tmdb_id: itemDoBackend.tmdb_id,
        nome: itemDoBackend.nome,
        tipo: itemDoBackend.tipo,
        urlImagem: itemDoBackend.url_imagem,
        anoLancamento: itemDoBackend.ano_lancamento,
        trailerUrl: itemDoBackend.trailer_url,
        idioma: itemDoBackend.idioma_original,
        sinopse: itemDoBackend.sinopse,
        review: itemDoBackend.review_pessoal,
        scoreFinal: parseFloat(itemDoBackend.score_final_calculado),
        classificacoes: itemDoBackend.classificacoes || {},
        genero: itemDoBackend.generos || [],
        relacionados: itemDoBackend.relacionados || [],
        data_adicao: itemDoBackend.data_adicao,
        data_ultima_modificacao: itemDoBackend.data_ultima_modificacao
    };
}

async function getItemDaColecaoPorId(id) {
  try {
    const response = await fetch(`${BACKEND_URL}/colecao/${id}`, {
        headers: getAuthHeaders() // USA A FUNÇÃO AUXILIAR
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) { // Erro de autenticação/autorização
          alert("Sessão expirada ou não autorizado. Por favor, faz login novamente.");
          localStorage.removeItem('accessToken'); // Limpa token inválido
          localStorage.removeItem('nomeUtilizador');
          localStorage.removeItem('idUtilizador');
          window.location.href = 'auth.html'; // Redireciona para login
          return null; 
      }
      if (response.status === 404) return null;
      const errorData = await response.json().catch(() => ({ message: response.statusText || `Falha ao obter item ${id}` }));
      throw new Error(errorData.message);
    }
    const itemDoBackend = await response.json();
    return mapearItemDoBackendParaFrontend(itemDoBackend);
  } catch (error) {
    console.error(`Erro em getItemDaColecaoPorId (id: ${id}):`, error);
    return null;
  }
}

/**
 * Obtém os critérios e pesos personalizados do utilizador autenticado.
 * Retorna um objeto no formato { historiaEnredo: 9, ritmo: 7, ... }
 */
async function obterCriteriosDoUtilizador() {
  try {
    const response = await fetch(`${BACKEND_URL}/criterios`, {
        headers: getAuthHeaders() // Reutiliza a função que já temos para adicionar o token
    });
    if (!response.ok) {
        // Se a resposta for 401/403, a lógica dentro de getAuthHeaders ou obterColecaoCompleta já lida com o redirecionamento
        const errorData = await response.json().catch(() => ({ message: 'Falha ao obter critérios do utilizador.' }));
        throw new Error(errorData.message);
    }
    const criterios = await response.json();
    console.log("Critérios personalizados do utilizador obtidos:", criterios);
    return criterios;
  } catch (error) {
    console.error('Erro em obterCriteriosDoUtilizador:', error);
    alert(`Erro ao carregar os seus critérios personalizados: ${error.message}`);
    return null; // Retorna null em caso de erro para o formHandler saber que algo correu mal
  }
}

async function obterColecaoCompleta() {
  try {
    const response = await fetch(`${BACKEND_URL}/colecao`, {
        headers: getAuthHeaders() // USA A FUNÇÃO AUXILIAR
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
          alert("Sessão expirada ou não autorizado. Por favor, faz login novamente.");
          localStorage.removeItem('accessToken');
          localStorage.removeItem('nomeUtilizador');
          localStorage.removeItem('idUtilizador');
          window.location.href = 'auth.html';
          return []; // Retorna array vazio para evitar mais erros no main.js
      }
      const errorData = await response.json().catch(() => ({ message: response.statusText || 'Falha ao obter coleção do backend' }));
      throw new Error(errorData.message);
    }
    const colecaoDoBackend = await response.json();
    return colecaoDoBackend.map(item => ({ // Mapeamento simplificado para a lista principal
        id: item.id,
        nome: item.nome,
        tipo: item.tipo,
        urlImagem: item.url_imagem,
        anoLancamento: item.ano_lancamento,
        scoreFinal: parseFloat(item.score_final_calculado),
        sinopse: item.sinopse
    }));
  } catch (error) {
    console.error('Erro em obterColecaoCompleta:', error);
    // O alert já estava na versão anterior, mas vamos personalizar um pouco.
    // O erro "Unexpected token 'U', "Unauthorized" is not valid JSON" vinha daqui.
    if (error.message.includes("Unexpected token")) {
        // Este erro específico já não deve acontecer se o tratamento 401/403 funcionar
        alert("Erro de comunicação com o servidor. Tenta fazer login novamente.");
    } else {
        alert(`Erro ao carregar coleção: ${error.message}`);
    }
    return [];
  }
}