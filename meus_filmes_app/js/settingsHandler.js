// settingsHandler.js

const API_URL = 'http://localhost:3001/api'; // Adjust if your API URL is different

function getToken() {
    return localStorage.getItem('token');
}

async function fetchAndDisplaySettings() {
    console.log('[SettingsHandler - fetchAndDisplaySettings] Attempting to fetch settings.');
    const token = getToken(); 
    console.log('[SettingsHandler - fetchAndDisplaySettings] Token for API call:', token ? 'Yes' : 'No');
    if (!token) {
        const redirectTo = 'auth.html'; // Simplified redirect
        console.log('[SettingsHandler - fetchAndDisplaySettings] No token, redirecting to:', redirectTo);
        window.location.href = redirectTo;
        return; 
    }

    const fieldsListDiv = document.getElementById('fields-list');
    fieldsListDiv.innerHTML = '<p>Carregando seus critérios...</p>'; // Show loading message

    try {
        const response = await fetch(`${API_URL}/settings/evaluation-fields`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            logout(); // Token invalid or expired
            return;
        }
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Erro ao buscar configurações: ${response.status}`);
        }

        const settings = await response.json();

        if (settings.length === 0) {
            fieldsListDiv.innerHTML = '<p>Você ainda não configurou nenhum critério personalizado. Adicione um abaixo!</p>';
            return;
        }

        fieldsListDiv.innerHTML = ''; // Clear loading message
        const ul = document.createElement('ul');
        ul.className = 'settings-ul';

        settings.forEach(setting => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span><strong>${escapeHTML(setting.field_name)}:</strong> ${escapeHTML(setting.weight.toString())}/10</span>
                <div>
                    <button class="edit-btn" data-field="${escapeHTML(setting.field_name)}" data-weight="${escapeHTML(setting.weight.toString())}">Editar</button>
                    <button class="delete-btn" data-field="${escapeHTML(setting.field_name)}">Excluir</button>
                </div>
            `;
            ul.appendChild(li);
        });
        fieldsListDiv.appendChild(ul);

        // Add event listeners for edit and delete buttons
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const fieldName = e.target.getAttribute('data-field');
                const currentWeight = parseInt(e.target.getAttribute('data-weight'), 10);
                handleEditField(fieldName, currentWeight);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const fieldName = e.target.getAttribute('data-field');
                handleDeleteField(fieldName);
            });
        });

    } catch (error) {
        console.error('Erro em fetchAndDisplaySettings:', error);
        fieldsListDiv.innerHTML = `<p class="error-message">Não foi possível carregar suas configurações: ${error.message}</p>`;
    }
}

async function handleAddField(event) {
    event.preventDefault();
    const token = getToken();
    const form = event.target;
    const fieldNameInput = form.elements.field_name;
    const weightInput = form.elements.weight;
    const errorMessageElement = document.getElementById('add-field-error');

    errorMessageElement.style.display = 'none';
    errorMessageElement.textContent = '';

    const field_name = fieldNameInput.value.trim();
    const weight = parseInt(weightInput.value, 10);

    if (!field_name) {
        errorMessageElement.textContent = 'O nome do critério não pode estar vazio.';
        errorMessageElement.style.display = 'block';
        return;
    }

    if (isNaN(weight) || weight < 1 || weight > 10) {
        errorMessageElement.textContent = 'O peso deve ser um número entre 1 e 10.';
        errorMessageElement.style.display = 'block';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/settings/evaluation-fields`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ field_name, weight })
        });

        if (response.status === 401 || response.status === 403) {
            logout();
            return;
        }
        
        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.message || `Erro ao adicionar critério: ${response.status}`);
        }

        if (response.status === 201) {
            form.reset(); // Clear form
            fetchAndDisplaySettings(); // Refresh list
        } else {
             errorMessageElement.textContent = responseData.message || 'Ocorreu um erro desconhecido.';
             errorMessageElement.style.display = 'block';
        }
    } catch (error) {
        console.error('Erro em handleAddField:', error);
        errorMessageElement.textContent = error.message;
        errorMessageElement.style.display = 'block';
    }
}

async function handleEditField(fieldName, currentWeight) {
    const token = getToken();
    const newWeightString = prompt(`Editar peso para "${fieldName}" (atual: ${currentWeight}):`, currentWeight.toString());

    if (newWeightString === null) return; // User cancelled

    const newWeight = parseInt(newWeightString, 10);

    if (isNaN(newWeight) || newWeight < 1 || newWeight > 10) {
        alert('Erro: O peso deve ser um número entre 1 e 10.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/settings/evaluation-fields/${encodeURIComponent(fieldName)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ weight: newWeight })
        });
        
        if (response.status === 401 || response.status === 403) {
            logout();
            return;
        }

        const responseData = await response.json();

        if (!response.ok) {
             throw new Error(responseData.message || `Erro ao atualizar critério: ${response.status}`);
        }
        
        fetchAndDisplaySettings(); // Refresh list

    } catch (error) {
        console.error('Erro em handleEditField:', error);
        alert(`Erro ao atualizar: ${error.message}`);
    }
}

async function handleDeleteField(fieldName) {
    const token = getToken();
    if (!confirm(`Tem certeza que deseja excluir o critério "${fieldName}"?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/settings/evaluation-fields/${encodeURIComponent(fieldName)}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            logout();
            return;
        }
        
        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.message || `Erro ao excluir critério: ${response.status}`);
        }

        fetchAndDisplaySettings(); // Refresh list

    } catch (error) {
        console.error('Erro em handleDeleteField:', error);
        alert(`Erro ao excluir: ${error.message}`);
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('id_utilizador');
    localStorage.removeItem('nome_utilizador');
    window.location.href = 'auth.html';
}

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return str.toString().replace(/[&<>"']/g, function (match) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[match];
    });
}


window.addEventListener('DOMContentLoaded', () => {
    console.log('[SettingsHandler] Page loaded. Performing simplified token check.');
    const token = localStorage.getItem('token'); // Using localStorage.getItem directly for simplicity here
    console.log('[SettingsHandler] Token found in localStorage:', token ? 'Yes' : 'No');

    if (!token) {
        // Always redirect to auth.html without any extra parameters for now,
        // to ensure the basic login flow is restored.
        // We will rely on authHandler to redirect to index.html after login.
        const redirectTo = 'auth.html'; 
        console.log('[SettingsHandler] No token, redirecting to:', redirectTo);
        window.location.href = redirectTo;
        // No return here, as the redirect will stop script execution. If it didn't, a return would be needed.
    } else {
        console.log('[SettingsHandler] Token exists, proceeding to load settings.');
        // Ensure fetchAndDisplaySettings (or the function that loads settings data) is called here.
        // This function should also ideally verify the token or handle API errors related to auth.
        if (typeof fetchAndDisplaySettings === 'function') {
            fetchAndDisplaySettings();
        } else {
            console.error('[SettingsHandler] fetchAndDisplaySettings function not found!');
        }
    }

    const addFieldForm = document.getElementById('add-field-form');
    if (addFieldForm) {
        addFieldForm.addEventListener('submit', handleAddField);
    }

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
});
