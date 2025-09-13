// Arquivo: static/js/epi_crud.js (VERSÃO VERIFICADA)

document.addEventListener('DOMContentLoaded', () => {
    // --- Seletores de Elementos ---
    const epiModal = document.getElementById('epi-modal');
    const modalTitle = document.getElementById('modal-title');
    const epiForm = document.getElementById('epi-form');
    const epiTableBody = document.getElementById('epi-table-body');
    const addEpiBtn = document.getElementById('add-epi-btn');
    const closeModalBtn = epiModal.querySelector('.close-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const submitBtn = epiForm.querySelector('button[type="submit"]');
    const csrfToken = epiForm.querySelector('[name=csrfmiddlewaretoken]').value;
    const searchInput = document.getElementById('search-input');

    const baseUrl = '/menu/epis/';

    let currentEditEpiId = null;

    // --- Função de Notificação ---
    const showNotification = (message, type = 'success') => {
        const notification = document.createElement('div');
        notification.className = 'notification-toast';
        notification.textContent = message;

        Object.assign(notification.style, {
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            padding: '12px 24px',
            borderRadius: '6px',
            color: 'white',
            backgroundColor: type === 'success' ? '#28a745' : '#dc3545',
            zIndex: '1050',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            opacity: '0',
            transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
            transform: 'translateX(-50%) translateY(20px)'
        });
        
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(-50%) translateY(0)';
        }, 10);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(20px)';
            notification.addEventListener('transitionend', () => notification.remove());
        }, 3000);
    };

    // --- Funções Auxiliares ---
    const resetForm = () => {
        epiForm.reset();
        currentEditEpiId = null;
        modalTitle.textContent = 'Adicionar Novo EPI';
        submitBtn.textContent = 'Salvar';
        clearFormErrors();
    };

    const openModal = () => { epiModal.style.display = 'flex'; };
    const closeModal = () => { epiModal.style.display = 'none'; resetForm(); };

    const clearFormErrors = () => {
        epiForm.querySelectorAll('.error-message').forEach(el => el.remove());
        epiForm.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    };

    const displayFormErrors = (errors) => {
        clearFormErrors();
        for (const field in errors) {
            const input = document.getElementById(`id_${field}`);
            if (input) {
                input.classList.add('is-invalid');
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = errors[field][0];
                input.parentElement.appendChild(errorDiv);
            }
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('pt-BR');
    };

    // --- Lógica de CRUD (Fetch API) ---
    const handleFormSubmit = async (event) => {
        event.preventDefault();
        const isUpdating = !!currentEditEpiId;
        const url = isUpdating ? `${baseUrl}update/${currentEditEpiId}/` : baseUrl;
        
        try {
            let response;
            if (isUpdating) {
                const data = Object.fromEntries(new FormData(epiForm).entries());
                response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
                    body: JSON.stringify(data)
                });
            } else {
                response = await fetch(url, {
                    method: 'POST',
                    headers: { 'X-CSRFToken': csrfToken },
                    body: new FormData(epiForm)
                });
            }

            const result = await response.json();

            if (result.success) {
                if (isUpdating) {
                    updateTableRow(result.epi);
                    showNotification('EPI atualizado com sucesso!');
                } else {
                    appendTableRow(result.epi);
                    showNotification('EPI adicionado com sucesso!');
                }
                closeModal();
            } else {
                displayFormErrors(result.errors);
            }
        } catch (error) {
            console.error('Falha na requisição:', error);
            showNotification('Ocorreu um erro na comunicação com o servidor.', 'error');
        }
    };

    // --- Manipulação da Tabela (DOM) ---
    const createTableRowHTML = (epi) => `
        <td>${epi.nome_equipamento}</td>
        <td>${epi.ca_numero}</td>
        <td>${formatDate(epi.data_validade_ca)}</td>
        <td>${epi.quantidade_disponivel} / ${epi.quantidade_total}</td>
        <td class="action-buttons">
            <button class="btn-icon btn-edit" title="Editar"><i class="bi bi-pencil-fill"></i></button>
            <button class="btn-icon btn-delete" title="Deletar"><i class="bi bi-trash-fill"></i></button>
        </td>
    `;

    const appendTableRow = (epi) => {
        const newRow = document.createElement('tr');
        newRow.setAttribute('data-id', epi.id);
        newRow.innerHTML = createTableRowHTML(epi);
        epiTableBody.appendChild(newRow);
    };

    const updateTableRow = (epi) => {
        const row = epiTableBody.querySelector(`tr[data-id='${epi.id}']`);
        if (row) row.innerHTML = createTableRowHTML(epi);
    };
    
    // --- Listeners de Eventos ---
    addEpiBtn.addEventListener('click', () => { resetForm(); openModal(); });
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => { if (e.target === epiModal) closeModal(); });
    epiForm.addEventListener('submit', handleFormSubmit);

    epiTableBody.addEventListener('click', async (event) => {
        const button = event.target.closest('.btn-edit, .btn-delete');
        if (!button) return;

        const row = button.closest('tr');
        const epiId = row.dataset.id;

        if (button.classList.contains('btn-edit')) {
            try {
                const response = await fetch(`${baseUrl}dados/${epiId}/`);
                if (!response.ok) throw new Error('Dados do EPI não encontrados.');
                const data = await response.json();
                
                for (const key in data) {
                    const field = epiForm.elements[key];
                    if (field) {
                        field.type === 'checkbox' ? field.checked = data[key] : field.value = data[key];
                    }
                }
                currentEditEpiId = epiId;
                modalTitle.textContent = 'Editar EPI';
                submitBtn.textContent = 'Atualizar';
                openModal();
            } catch (error) {
                console.error('Erro ao buscar dados para edição:', error);
                showNotification(error.message, 'error');
            }
        }
        
        if (button.classList.contains('btn-delete')) {
            if (confirm('Tem certeza que deseja excluir este equipamento?')) {
                try {
                    const response = await fetch(`${baseUrl}delete/${epiId}/`, {
                        method: 'DELETE',
                        headers: { 'X-CSRFToken': csrfToken }
                    });
                    
                    if (!response.ok) throw new Error('Falha ao deletar EPI.');
                    
                    const result = await response.json();
                    if (result.success) {
                        row.remove();
                        showNotification('EPI excluído com sucesso!');
                    } else {
                        throw new Error(result.error || 'Erro desconhecido ao deletar.');
                    }
                } catch(error) {
                    console.error('Erro ao deletar:', error);
                    showNotification(error.message, 'error');
                }
            }
        }
    });

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        epiTableBody.querySelectorAll('tr').forEach(row => {
            const nome = row.children[0].textContent.toLowerCase();
            const ca = row.children[1].textContent.toLowerCase();
            row.style.display = (nome.includes(searchTerm) || ca.includes(searchTerm)) ? '' : 'none';
        });
    });
});