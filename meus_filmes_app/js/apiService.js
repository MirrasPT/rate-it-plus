// js/apiService.js

// Note: TMDB API calls are proxied through the backend (e.g., /api/tmdb/search/*, /api/tmdb/details/*)
// to protect the TMDB API key. The backend server handles attaching the API key to requests made to TMDB.
// Ensure your TMDB_API_KEY is set in the backend's .env file.

// The TMDB_IMAGE_BASE_URL is still used directly as it's for constructing public image URLs and doesn't involve secret keys.
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/'; // ex: w500 ou original para tamanhos

// The RATINGPOSTERDB_API_KEY is kept here for potential future direct use if it's a public/non-sensitive key
// or if its usage pattern differs from TMDB's.
const RATINGPOSTERDB_API_KEY = 't0-free-rpdb';

/**
 * Pesquisa itens no TMDB através do proxy backend.
 * @param {string} query - O termo de pesquisa.
 * @param {string} type - O tipo de media a pesquisar ('movie', 'tv', 'multi'). 'multi' pesquisa em filmes e séries.
 * @returns {Promise<Array>} - Uma promessa que resolve para uma lista de resultados.
 */
async function searchTMDB(query, type = 'multi') {
    if (!query.trim()) {
        return [];
    }
    // O backend agora handles the TMDB API key and base URL
    const url = `/api/tmdb/search/${type}/${encodeURIComponent(query)}?language=pt-PT`; // Adjust query params as needed, backend has defaults

    const token = localStorage.getItem('accessToken');
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, { headers }); // Send token
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            console.error(`Error fetching search from backend proxy for query "${query}": ${response.status}`, errorData.message);
            // Optionally, display a user-friendly message or handle specific error codes (e.g., 401 for auth)
            if (response.status === 401 || response.status === 403) {
               alert("Sessão expirada ou não autorizado para pesquisar. Por favor, faz login novamente.");
               localStorage.removeItem('accessToken');
               localStorage.removeItem('nomeUtilizador');
               localStorage.removeItem('idUtilizador');
               window.location.href = 'auth.html'; // Redirect to login
            }
            return [];
        }
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error(`Error calling backend proxy for search TMDB for query "${query}":`, error);
        return [];
    }
}

/**
 * Obtém detalhes de um item específico do TMDB através do proxy backend.
 * @param {string|number} itemId - O ID do item no TMDB.
 * @param {string} type - O tipo de media ('movie' ou 'tv').
 * @returns {Promise<Object|null>} - Uma promessa que resolve para os detalhes do item ou null em caso de erro.
 */
async function getTMDBDetails(itemId, type) {
    if (!itemId || !type) {
        console.error('ID do item ou tipo não fornecido para getTMDBDetails');
        return null;
    }
    // Backend handles TMDB API key, base URL, and append_to_response defaults
    const url = `/api/tmdb/details/${type}/${itemId}?language=pt-PT`; // Adjust query params if needed

    const token = localStorage.getItem('accessToken');
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, { headers }); // Send token
        if (!response.ok) {
           const errorData = await response.json().catch(() => ({ message: response.statusText }));
           console.error(`Error fetching details from backend proxy for ${type} ID ${itemId}: ${response.status}`, errorData.message);
           // Optionally, display a user-friendly message or handle specific error codes
           if (response.status === 401 || response.status === 403) {
               alert("Sessão expirada ou não autorizado para obter detalhes. Por favor, faz login novamente.");
               localStorage.removeItem('accessToken');
               localStorage.removeItem('nomeUtilizador');
               localStorage.removeItem('idUtilizador');
               window.location.href = 'auth.html'; // Redirect to login
            }
           return null;
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error calling backend proxy for TMDB details for ${type} ID ${itemId}:`, error);
        return null;
    }
}

// Função para construir URL completo da imagem do TMDB
function getTMDBImageUrl(path, size = 'w500') {
  if (!path) return null; // Ou uma imagem placeholder
  return `${TMDB_IMAGE_BASE_URL}${size}${path}`;
}

// Mais tarde adicionaremos aqui funções para o RatingPosterDB.