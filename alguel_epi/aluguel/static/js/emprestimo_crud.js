

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM carregado. Script 'emprestimo_crud.js' iniciado.");

    
    const searchInput = document.getElementById('search-input');
    const filterEpiInput = document.getElementById('id_filtro_equipamento');
    const filterColaboradorInput = document.getElementById('id_filtro_colaborador');
    const filterStatusSelect = document.getElementById('id_filtro_status');
    const filterForm = document.getElementById('filtro-form');
    const clearFilterBtn = document.getElementById('filtro-limpar-btn'); 
    const tableBody = document.getElementById('emprestimo-table-body');
    const noResultsRow = document.getElementById('no-results-row');

    if (!searchInput || !filterEpiInput || !filterColaboradorInput || !filterStatusSelect || !tableBody || !noResultsRow) {
        console.error("ERRO CRÍTICO: Um ou mais elementos do DOM não foram encontrados. Verifique os IDs no seu HTML.");
        return;
    }
    function normalizeText(text) {
        if (!text) return '';
        return text.toString().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    }
    function applyFilters() {
        const globalSearchText = normalizeText(searchInput.value);
        const epiFilter = normalizeText(filterEpiInput.value);
        const colaboradorFilter = normalizeText(filterColaboradorInput.value);
        const statusFilterValue = filterStatusSelect.value;
        const allDataRows = tableBody.querySelectorAll('tr[data-id]');
        let visibleRowCount = 0;
        allDataRows.forEach(row => {
            const colaboradorCell = normalizeText(row.querySelector('.col-colaborador')?.textContent);
            const epiCell = normalizeText(row.querySelector('.col-epi')?.textContent);
            const dataCell = normalizeText(row.querySelector('.col-data')?.textContent);
            const statusSpan = row.querySelector('.col-status .status');
            const statusClass = statusSpan ? Array.from(statusSpan.classList).find(c => c.startsWith('status-')) : '';
            const statusCellText = statusClass.replace('status-', '').toUpperCase();
            const rowTextForGlobalSearch = `${colaboradorCell} ${epiCell} ${dataCell}`;
            const conditions = [
                globalSearchText === '' || rowTextForGlobalSearch.includes(globalSearchText),
                epiFilter === '' || epiCell.includes(epiFilter),
                colaboradorFilter === '' || colaboradorCell.includes(colaboradorFilter),
                statusFilterValue === '' || statusCellText === statusFilterValue
            ];
            const shouldShowRow = conditions.every(condition => condition === true);
            if (shouldShowRow) {
                row.style.display = '';
                visibleRowCount++;
            } else {
                row.style.display = 'none';
            }
        });
        if (allDataRows.length > 0) {
            noResultsRow.style.display = visibleRowCount === 0 ? '' : 'none';
        }
    }
    searchInput.addEventListener('input', applyFilters);
    filterEpiInput.addEventListener('input', applyFilters);
    filterColaboradorInput.addEventListener('input', applyFilters);
    filterStatusSelect.addEventListener('change', applyFilters);
    if (clearFilterBtn) {
        clearFilterBtn.addEventListener('click', function() {
            if (filterForm) filterForm.reset();
            searchInput.value = '';
            applyFilters();
        });
    }

    
    
    
    const addEmprestimoBtn = document.getElementById('add-emprestimo-btn');
    const emprestimoModal = document.getElementById('emprestimo-modal');
    const emprestimoForm = document.getElementById('emprestimo-form');
    const modalTitle = document.getElementById('modal-title');
    const closeModalBtns = emprestimoModal.querySelectorAll('.close-btn, #cancel-btn');
    const statusSelect = document.getElementById('id_status');
    const camposDevolucao = document.getElementById('campos-devolucao');

    let editingId = null;

    function openEmprestimoModal(id = null) {
        emprestimoForm.reset();
        editingId = id;

        if (id) {
            modalTitle.textContent = 'Editar Empréstimo';
            fetch(`/menu/emprestimos/dados/${id}/`) 
                .then(response => response.json())
                .then(data => {
                    document.getElementById('id_epi').value = data.epi;
                    document.getElementById('id_colaborador').value = data.colaborador;
                    document.getElementById('id_tecnico').value = data.tecnico;
                    document.getElementById('id_data_retirada').value = data.data_retirada;
                    document.getElementById('id_data_prevista_devolucao').value = data.data_prevista_devolucao;
                    document.getElementById('id_status').value = data.status;
                    document.getElementById('id_condicoes_emprestimo').value = data.condicoes_emprestimo;
                    
                    statusSelect.dispatchEvent(new Event('change'));
                    
                    document.getElementById('id_data_devolucao').value = data.data_devolucao || '';
                    document.getElementById('id_observacao_devolucao').value = data.observacao_devolucao || '';
                })
                .catch(error => console.error('Erro ao buscar dados do empréstimo:', error));
        } else {
            modalTitle.textContent = 'Adicionar Novo Empréstimo';
            camposDevolucao.style.display = 'none';
        }
        emprestimoModal.style.display = 'block';
    }

    function closeEmprestimoModal() {
        emprestimoModal.style.display = 'none';
        emprestimoForm.reset();
        editingId = null;
    }

    addEmprestimoBtn.addEventListener('click', () => openEmprestimoModal());
    closeModalBtns.forEach(btn => btn.addEventListener('click', closeEmprestimoModal));
    window.addEventListener('click', function(event) {
        if (event.target === emprestimoModal) {
            closeEmprestimoModal();
        }
    });

    if (statusSelect) {
        statusSelect.addEventListener('change', function() {
            if (['DEVOLVIDO', 'DANIFICADO', 'PERDIDO'].includes(this.value)) {
                camposDevolucao.style.display = 'block';
            } else {
                camposDevolucao.style.display = 'none';
            }
        });
    }

    emprestimoForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = new FormData(emprestimoForm);
        const data = Object.fromEntries(formData.entries());
        
        const isEditing = editingId !== null;
        
        const url = isEditing ? `/menu/emprestimos/update/${editingId}/` : `/menu/emprestimos/`; 
        const method = isEditing ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw err; });
            }
            return response.json();
        })
        .then(emprestimo => {
            console.log('Empréstimo salvo:', emprestimo);
            closeEmprestimoModal();
            location.reload();
        })
        .catch(error => {
            console.error('Erro ao salvar empréstimo:', error);
            alert('Erro ao salvar empréstimo: ' + (error.detail || JSON.stringify(error)));
        });
    });

    tableBody.addEventListener('click', function(event) {
        const target = event.target;
        const row = target.closest('tr[data-id]');
        if (!row) return;

        const emprestimoId = row.dataset.id;

        if (target.closest('.btn-edit')) {
            openEmprestimoModal(emprestimoId);
        } else if (target.closest('.btn-delete')) {
            if (confirm('Tem certeza que deseja excluir este empréstimo?')) {
                
                fetch(`/menu/emprestimos/delete/${emprestimoId}/`, { 
                    method: 'DELETE',
                    headers: {
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                    }
                })
                .then(response => {
                    if (response.ok) {
                        row.remove();
                        applyFilters();
                        alert('Empréstimo excluído com sucesso!');
                    } else {
                        alert('Erro ao excluir empréstimo.');
                    }
                })
                .catch(error => console.error('Erro ao excluir empréstimo:', error));
            }
        }
    });
});