// js/apiService.js

// As tuas chaves de API
const TMDB_API_KEY = '17efc96f62709ba35198919bfe486b56';
const TMDB_READ_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxN2VmYzk2ZjYyNzA5YmEzNTE5ODkxOWJmZTQ4NmI1NiIsIm5iZiI6MTc0Nzk0NjAzNy4xNSwic3ViIjoiNjgyZjhhMzVlNTgxMjU0NmI3ODM2Y2FjIiwic2NvcGVzIjpbImFwaV9yZWFkIl0sInZlcnNpb24iOjF9.yZXbTnz5Mq_ADpvsklL7JNB0ugVdiLyK8xUTQNoP9zc';
const RATINGPOSTERDB_API_KEY = 't0-free-rpdb'; // Usaremos esta mais tarde

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/'; // ex: w500 ou original para tamanhos

/**
 * Pesquisa itens no TMDB.
 * @param {string} query - O termo de pesquisa.
 * @param {string} type - O tipo de media a pesquisar ('movie', 'tv', 'multi'). 'multi' pesquisa em filmes e séries.
 * @returns {Promise<Array>} - Uma promessa que resolve para uma lista de resultados.
 */
async function searchTMDB(query, type = 'multi') {
  if (!query.trim()) {
    return [];
  }
  const url = `${TMDB_BASE_URL}/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-PT&include_adult=false`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Erro na resposta da API TMDB:', response.status, await response.text());
      return [];
    }
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Erro ao pesquisar no TMDB:', error);
    return [];
  }
}

/**
 * Obtém detalhes de um item específico do TMDB.
 * @param {string|number} itemId - O ID do item no TMDB.
 * @param {string} type - O tipo de media ('movie' ou 'tv').
 * @returns {Promise<Object|null>} - Uma promessa que resolve para os detalhes do item ou null em caso de erro.
 */
async function getTMDBDetails(itemId, type) {
  if (!itemId || !type) {
    console.error('ID do item ou tipo não fornecido para getTMDBDetails');
    return null;
  }
  const url = `${TMDB_BASE_URL}/${type}/${itemId}?api_key=${TMDB_API_KEY}&language=pt-PT&append_to_response=credits,videos,images`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Erro ao obter detalhes do TMDB para ${type} ID ${itemId}:`, response.status, await response.text());
      return null;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Erro ao obter detalhes do TMDB para ${type} ID ${itemId}:`, error);
    return null;
  }
}

// Função para construir URL completo da imagem do TMDB
function getTMDBImageUrl(path, size = 'w500') {
  if (!path) return null; // Ou uma imagem placeholder
  return `${TMDB_IMAGE_BASE_URL}${size}${path}`;
}

// Mais tarde adicionaremos aqui funções para o RatingPosterDB.