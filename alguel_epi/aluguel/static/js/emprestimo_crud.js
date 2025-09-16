document.addEventListener('DOMContentLoaded', () => {

    // --- SELETORES GLOBAIS ---
    // Modal principal de Adicionar/Editar
    const emprestimoModal = document.getElementById('emprestimo-modal');
    const modalTitle = document.getElementById('modal-title');
    const emprestimoForm = document.getElementById('emprestimo-form');
    const addEmprestimoBtn = document.getElementById('add-emprestimo-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const submitBtn = emprestimoForm.querySelector('button[type="submit"]');

    // Tabela e Pesquisa
    const emprestimoTableBody = document.getElementById('emprestimo-table-body');
    const searchInput = document.getElementById('search-input');
    const noResultsRow = document.getElementById('no-results-row');
    const noInitialDataRow = document.getElementById('no-initial-data-row');

    // NOVO: Seletores para a regra de exibição condicional
    const statusField = document.getElementById('id_status');
    const camposDevolucao = document.getElementById('campos-devolucao');

    // Outros
    const csrfToken = emprestimoForm.querySelector('[name=csrfmiddlewaretoken]').value;
    const baseUrl = '/menu/emprestimos/';
    let currentEditEmprestimoId = null;

    // --- FUNÇÕES AUXILIARES ---

    const showNotification = (message, type = 'success') => {
        const notification = document.createElement('div');
        notification.className = `notification-toast ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                notification.addEventListener('transitionend', () => notification.remove());
            }, 3000);
        }, 10);
    };

    const resetForm = () => {
        emprestimoForm.reset();
        currentEditEmprestimoId = null;
        modalTitle.textContent = 'Adicionar Novo Empréstimo';
        submitBtn.textContent = 'Salvar';
        submitBtn.disabled = false;
        emprestimoForm.querySelectorAll('.error-message').forEach(el => el.remove());
        emprestimoForm.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    };

    const openModal = (modalElement) => {
        if (modalElement) modalElement.style.display = 'flex';
    };

    const closeModal = (modalElement) => {
        if (modalElement) {
            modalElement.style.display = 'none';
            if (modalElement.id === 'emprestimo-modal') {
                resetForm();
            }
        }
    };

    // NOVO: Função que contém a lógica para mostrar/esconder os campos de devolução
    const toggleCamposDevolucao = () => {
        if (!statusField || !camposDevolucao) return; // Checagem de segurança

        const statusValue = statusField.value;
        // ATENÇÃO: Estes valores devem corresponder exatamente aos valores do seu models.py
        const statusFinais = ['DEVOLVIDO', 'DANIFICADO', 'PERDIDO'];

        if (statusFinais.includes(statusValue)) {
            camposDevolucao.style.display = 'block'; // Mostra o container
        } else {
            camposDevolucao.style.display = 'none'; // Esconde o container
        }
    };

    const displayFormErrors = (errors) => {
        emprestimoForm.querySelectorAll('.error-message').forEach(el => el.remove());
        emprestimoForm.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        for (const field in errors) {
            const input = document.getElementById(`id_${field}`);
            if (input) {
                input.classList.add('is-invalid');
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = errors[field][0];
                input.parentNode.appendChild(errorDiv);
            }
        }
    };

    // --- FUNÇÃO DE FILTRAGEM (Simplificada apenas para a busca rápida) ---

    const applyQuickFilter = () => {
        const quickFilter = searchInput.value.toLowerCase();
        const rows = emprestimoTableBody.querySelectorAll('tr:not(#no-results-row):not(#no-initial-data-row)');
        let visibleRows = 0;

        rows.forEach(row => {
            const colaboradorCell = row.querySelector('.col-colaborador')?.textContent.toLowerCase() || '';
            const epiCell = row.querySelector('.col-epi')?.textContent.toLowerCase() || '';
            
            const quickMatch = quickFilter === '' || colaboradorCell.includes(quickFilter) || epiCell.includes(quickFilter);

            if (quickMatch) {
                row.style.display = '';
                visibleRows++;
            } else {
                row.style.display = 'none';
            }
        });

        if (noResultsRow) {
            const hasInitialData = !noInitialDataRow || noInitialDataRow.style.display === 'none';
            noResultsRow.style.display = (visibleRows === 0 && hasInitialData) ? '' : 'none';
        }
    };

    // --- LÓGICA DE CRUD ---

    const handleFormSubmit = async (event) => {
        event.preventDefault();
        submitBtn.disabled = true;
        submitBtn.textContent = 'Salvando...';

        const isUpdating = !!currentEditEmprestimoId;
        const url = isUpdating ? `${baseUrl}update/${currentEditEmprestimoId}/` : `${baseUrl}`;
        const formData = new FormData(emprestimoForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 
                    'X-CSRFToken': csrfToken, 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            });
            const result = await response.json();

            if (result.success) {
                const emprestimo = result.emprestimo;
                if (isUpdating) {
                    updateTableRow(emprestimo);
                    showNotification('Empréstimo atualizado com sucesso!');
                } else {
                    appendTableRow(emprestimo);
                    showNotification('Empréstimo registrado com sucesso!');
                }
                closeModal(emprestimoModal);
            } else {
                result.errors ? displayFormErrors(result.errors) : showNotification(result.error || 'Ocorreu um erro desconhecido.', 'error');
            }
        } catch (error) {
            console.error('Falha na requisição:', error);
            showNotification('Erro de comunicação com o servidor.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = isUpdating ? 'Atualizar' : 'Salvar';
        }
    };

    const getStatusHtml = (status) => `<span class="status status-${String(status).toLowerCase()}">${status}</span>`;

    const appendTableRow = (emprestimo) => {
        if (noInitialDataRow) noInitialDataRow.style.display = 'none';
        const newRow = document.createElement('tr');
        newRow.dataset.id = emprestimo.id;
        newRow.innerHTML = `
            <td class="col-colaborador">${emprestimo.colaborador_nome}</td>
            <td class="col-epi">${emprestimo.epi_nome}</td>
            <td class="col-data">${emprestimo.data_retirada}</td>
            <td class="col-status">${getStatusHtml(emprestimo.status)}</td>
            <td class="action-buttons">
                <button class="btn-icon btn-edit" title="Editar"><i class="bi bi-pencil-fill"></i></button>
                <button class="btn-icon btn-delete" title="Excluir"><i class="bi bi-trash-fill"></i></button>
            </td>
        `;
        emprestimoTableBody.prepend(newRow);
        applyQuickFilter();
    };

    const updateTableRow = (emprestimo) => {
        const row = emprestimoTableBody.querySelector(`tr[data-id='${emprestimo.id}']`);
        if (row) {
            row.querySelector('.col-colaborador').textContent = emprestimo.colaborador_nome;
            row.querySelector('.col-epi').textContent = emprestimo.epi_nome;
            row.querySelector('.col-data').textContent = emprestimo.data_retirada;
            row.querySelector('.col-status').innerHTML = getStatusHtml(emprestimo.status);
            applyQuickFilter();
        }
    };

    // --- LISTENERS DE EVENTOS ---

    addEmprestimoBtn.addEventListener('click', () => {
        resetForm();
        openModal(emprestimoModal);
        // MODIFICADO: Chama a função para garantir que os campos comecem escondidos
        toggleCamposDevolucao();
    });

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => closeModal(emprestimoModal));
    }

    // NOVO: Listener que ativa a regra sempre que o status for alterado
    if (statusField) {
        statusField.addEventListener('change', toggleCamposDevolucao);
    }

    document.querySelectorAll('.modal .close-btn').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.closest('.modal')));
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) closeModal(e.target);
    });

    emprestimoForm.addEventListener('submit', handleFormSubmit);

    emprestimoTableBody.addEventListener('click', async (event) => {
        const target = event.target;
        const editButton = target.closest('.btn-edit');
        const deleteButton = target.closest('.btn-delete');

        if (!editButton && !deleteButton) return;

        const row = target.closest('tr');
        const emprestimoId = row.dataset.id;

        if (editButton) {
            try {
                const response = await fetch(`${baseUrl}dados/${emprestimoId}/`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();

                for (const key in data) {
                    const field = emprestimoForm.elements[key];
                    if (field) field.value = data[key];
                }

                currentEditEmprestimoId = emprestimoId;
                modalTitle.textContent = 'Editar Empréstimo';
                submitBtn.textContent = 'Atualizar';
                openModal(emprestimoModal);
                
                // MODIFICADO: Chama a função para mostrar/esconder os campos com base nos dados carregados
                toggleCamposDevolucao();

            } catch (error) {
                console.error('Erro ao buscar dados para edição:', error);
                showNotification('Não foi possível carregar os dados para edição.', 'error');
            }
        }

        if (deleteButton) {
            if (confirm('Tem certeza que deseja excluir este empréstimo?')) {
                try {
                    const response = await fetch(`${baseUrl}delete/${emprestimoId}/`, {
                        method: 'DELETE',
                        headers: { 'X-CSRFToken': csrfToken }
                    });

                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    
                    const result = await response.json();

                    if (result.success) {
                        row.remove();
                        showNotification('Empréstimo excluído com sucesso!');
                        applyQuickFilter();
                    } else {
                        showNotification(result.error || 'Falha ao excluir o empréstimo.', 'error');
                    }
                } catch (error) {
                    console.error('Erro ao deletar:', error);
                    showNotification('Erro de comunicação ao tentar excluir.', 'error');
                }
            }
        }
    });

    searchInput.addEventListener('input', applyQuickFilter);

});