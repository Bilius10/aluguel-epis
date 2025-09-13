// Arquivo: static/js/emprestimo_crud.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Seletores de Elementos ---
    const emprestimoModal = document.getElementById('emprestimo-modal');
    const modalTitle = document.getElementById('modal-title');
    const emprestimoForm = document.getElementById('emprestimo-form');
    const emprestimoTableBody = document.getElementById('emprestimo-table-body');
    const addEmprestimoBtn = document.getElementById('add-emprestimo-btn');
    const closeModalBtn = emprestimoModal.querySelector('.close-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const submitBtn = emprestimoForm.querySelector('button[type="submit"]');
    const csrfToken = emprestimoForm.querySelector('[name=csrfmiddlewaretoken]').value;
    const searchInput = document.getElementById('search-input');

    const baseUrl = '/menu/emprestimos/';

    let currentEditEmprestimoId = null;

    // --- Função de Notificação --- (Reaproveitada)
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
        emprestimoForm.reset();
        currentEditEmprestimoId = null;
        modalTitle.textContent = 'Registrar Novo Empréstimo';
        submitBtn.textContent = 'Salvar Empréstimo';
        clearFormErrors();
    };

    const openModal = () => { emprestimoModal.style.display = 'flex'; };
    const closeModal = () => { emprestimoModal.style.display = 'none'; resetForm(); };

    const clearFormErrors = () => {
        emprestimoForm.querySelectorAll('.error-message').forEach(el => el.remove());
        emprestimoForm.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
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

    // Função para formatar data (se necessário, adapta para a saída do backend)
    const formatDateTime = (dateString) => {
        if (!dateString) return '';
        // Supondo que o backend retorna no formato 'DD/MM/YYYY HH:MM' ou algo similar
        // Se retornar ISO, você pode criar um objeto Date e formatar
        // const date = new Date(dateString);
        // return date.toLocaleString('pt-BR');
        return dateString; // Por enquanto, apenas retorna como vem do backend
    };

    // --- Lógica de CRUD (Fetch API) ---
    const handleFormSubmit = async (event) => {
        event.preventDefault();
        const isUpdating = !!currentEditEmprestimoId;
        const url = isUpdating ? `${baseUrl}update/${currentEditEmprestimoId}/` : baseUrl;
        const method = 'POST';
        
        try {
            const formData = new FormData(emprestimoForm);
            const data = Object.fromEntries(formData.entries()); // Converte para JSON para PUT/PATCH

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                if (isUpdating) {
                    updateTableRow(result.emprestimo);
                    showNotification('Empréstimo atualizado com sucesso!');
                } else {
                    appendTableRow(result.emprestimo);
                    showNotification('Empréstimo registrado com sucesso!');
                }
                closeModal();
            } else {
                displayFormErrors(result.errors || { general: [result.error] }); // Exibe erros gerais também
            }
        } catch (error) {
            console.error('Falha na requisição:', error);
            showNotification('Ocorreu um erro na comunicação com o servidor.', 'error');
        }
    };

    // --- Manipulação da Tabela (DOM) ---
    const createTableRowHTML = (emprestimo) => `
        <td>${emprestimo.colaborador_nome}</td>
        <td>${emprestimo.epi_nome}</td>
        <td>${formatDateTime(emprestimo.data_retirada)}</td>
        <td>${emprestimo.status}</td>
        <td class="action-buttons">
            <button class="btn-icon btn-edit" title="Editar">
                <i class="bi bi-pencil-fill"></i>
            </button>
            <button class="btn-icon btn-delete" title="Registrar Devolução / Excluir">
                <i class="bi bi-check-circle-fill text-success"></i>
            </button>
        </td>
    `;

    const appendTableRow = (emprestimo) => {
        const newRow = document.createElement('tr');
        newRow.setAttribute('data-id', emprestimo.id);
        newRow.innerHTML = createTableRowHTML(emprestimo);
        emprestimoTableBody.appendChild(newRow);
    };

    const updateTableRow = (emprestimo) => {
        const row = emprestimoTableBody.querySelector(`tr[data-id='${emprestimo.id}']`);
        if (row) row.innerHTML = createTableRowHTML(emprestimo);
    };
    
    // --- Listeners de Eventos ---
    addEmprestimoBtn.addEventListener('click', () => { resetForm(); openModal(); });
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => { if (e.target === emprestimoModal) closeModal(); });
    emprestimoForm.addEventListener('submit', handleFormSubmit);

    emprestimoTableBody.addEventListener('click', async (event) => {
        const button = event.target.closest('.btn-edit, .btn-delete');
        if (!button) return;

        const row = button.closest('tr');
        const emprestimoId = row.dataset.id;

        if (button.classList.contains('btn-edit')) {
            try {
                const response = await fetch(`${baseUrl}dados/${emprestimoId}/`);
                if (!response.ok) throw new Error('Dados do empréstimo não encontrados.');
                const data = await response.json();
                
                // Preencher o formulário com os dados
                for (const key in data) {
                    const field = emprestimoForm.elements[key];
                    if (field) {
                        field.value = data[key];
                    }
                }
                currentEditEmprestimoId = emprestimoId;
                modalTitle.textContent = 'Editar Empréstimo';
                submitBtn.textContent = 'Atualizar Empréstimo';
                openModal();
            } catch (error) {
                console.error('Erro ao buscar dados para edição:', error);
                showNotification(error.message, 'error');
            }
        }
        
        if (button.classList.contains('btn-delete')) {
            // Ação de Devolução/Exclusão
            if (confirm('Deseja registrar a devolução deste EPI ou excluí-lo permanentemente do registro de empréstimo? (Isso irá retornar o EPI ao estoque)')) {
                try {
                    const response = await fetch(`${baseUrl}delete/${emprestimoId}/`, {
                        method: 'DELETE',
                        headers: { 'X-CSRFToken': csrfToken }
                    });
                    
                    if (!response.ok) throw new Error('Falha ao registrar devolução/excluir empréstimo.');
                    
                    const result = await response.json();
                    if (result.success) {
                        row.remove();
                        showNotification('Empréstimo excluído/devolvido com sucesso!');
                    } else {
                        throw new Error(result.error || 'Erro desconhecido ao registrar devolução.');
                    }
                } catch(error) {
                    console.error('Erro ao deletar/devolver:', error);
                    showNotification(error.message, 'error');
                }
            }
        }
    });

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        emprestimoTableBody.querySelectorAll('tr').forEach(row => {
            const colaboradorNome = row.children[0].textContent.toLowerCase();
            const epiNome = row.children[1].textContent.toLowerCase();
            const isVisible = colaboradorNome.includes(searchTerm) || epiNome.includes(searchTerm);
            row.style.display = isVisible ? '' : 'none';
        });
    });
});