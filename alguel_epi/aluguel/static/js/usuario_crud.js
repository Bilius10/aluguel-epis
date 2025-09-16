document.addEventListener('DOMContentLoaded', () => {

    const userModal = document.getElementById('user-modal');
    const modalTitle = document.getElementById('modal-title');
    const userForm = document.getElementById('user-form');
    const userTableBody = document.getElementById('user-table-body');
    const addUserBtn = document.getElementById('add-user-btn');
    const closeModalBtn = userModal.querySelector('.close-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const submitBtn = userForm.querySelector('button[type="submit"]');
    const csrfToken = userForm.querySelector('[name=csrfmiddlewaretoken]').value;
    const searchInput = document.getElementById('search-input');

    const baseUrl = '/menu/usuarios/';

    let currentEditUserId = null;

    // --- Função de Notificação --- // <-- ADICIONADO
    const showNotification = (message, type = 'success') => {
        const notification = document.createElement('div');
        notification.className = 'notification-toast';
        notification.textContent = message;

        // Estilos básicos para a notificação
        Object.assign(notification.style, {
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            borderRadius: '6px',
            color: 'white',
            backgroundColor: type === 'success' ? '#28a745' : '#dc3545', // Verde para sucesso, vermelho para erro
            zIndex: '1050', // Garante que fique acima de outros elementos
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            opacity: '0',
            transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
            transform: 'translateX(-50%) translateY(20px)'
        });
        
        document.body.appendChild(notification);

        // Animação de entrada
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(-50%) translateY(0)';
        }, 10);

        // Animação de saída e remoção após 3 segundos
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(20px)';
            notification.addEventListener('transitionend', () => notification.remove());
        }, 3000);
    };

    const resetForm = () => {
        userForm.reset();
        currentEditUserId = null;
        modalTitle.textContent = 'Adicionar Novo Colaborador';
        submitBtn.textContent = 'Salvar';
        clearFormErrors();
    };

    const openModal = () => {
        userModal.style.display = 'flex';
    };

    const closeModal = () => {
        userModal.style.display = 'none';
        resetForm();
    };

    const clearFormErrors = () => {
        userForm.querySelectorAll('.error-message').forEach(el => el.remove());
        userForm.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
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
                input.parentNode.appendChild(errorDiv);
            }
        }
    };

    const handleFormSubmit = async (event) => {
        event.preventDefault();
    
        const isUpdating = !!currentEditUserId;
        const url = isUpdating ? `${baseUrl}update/${currentEditUserId}/` : baseUrl;
        
        try {
            // 1. Sempre comece com FormData
            const formData = new FormData(userForm);
    
            // 2. Manipule campos especiais, se necessário.
            // O FormData não inclui checkboxes desmarcados, então podemos garantir que o valor seja enviado.
            // O backend do Django interpretará 'true'/'false' corretamente.
            const ativoCheckbox = document.getElementById('id_ativo');
            formData.set('ativo', ativoCheckbox.checked);
    
            // 3. O fetch agora é o mesmo para criar e atualizar
            const response = await fetch(url, {
                method: 'POST',
                headers: { 
                    'X-CSRFToken': csrfToken 
                    // Sem 'Content-Type', o navegador cuida disso
                },
                body: formData
            });
    
            const result = await response.json();
    
            if (result.success) {
                const usuario = result.usuario;
                if (isUpdating) {
                    updateTableRow(usuario);
                    showNotification('Colaborador atualizado com sucesso!');
                } else {
                    appendTableRow(usuario);
                    showNotification('Colaborador adicionado com sucesso!');
                }
                closeModal();
            } else {
                displayFormErrors(result.errors);
            }
    
        } catch (error) {
            console.error('Falha na requisição:', error);
            // Mudei o alert para usar a função de notificação de erro
            showNotification('Ocorreu um erro na comunicação com o servidor.', 'error');
        }
    };

    // --- Manipulação da Tabela (DOM) ---

    const appendTableRow = (usuario) => {
        const newRow = document.createElement('tr');
        newRow.setAttribute('data-id', usuario.id);
        newRow.innerHTML = `
            <td>${usuario.nome_completo}</td>
            <td>${usuario.matricula}</td>
            <td class="action-buttons">
                <button class="btn-icon btn-edit" title="Editar">
                    <i class="bi bi-pencil-fill"></i>
                </button>
                <button class="btn-icon btn-delete" title="Deletar">
                    <i class="bi bi-trash-fill"></i>
                </button>
            </td>
        `;
        userTableBody.appendChild(newRow);
    };

    const updateTableRow = (usuario) => {
        const row = userTableBody.querySelector(`tr[data-id='${usuario.id}']`);
        if (row) {
            row.children[0].textContent = usuario.nome_completo;
            row.children[1].textContent = usuario.matricula;
        }
    };
    
    // --- Listeners de Eventos ---

    addUserBtn.addEventListener('click', () => {
        resetForm();
        openModal();
    });

    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === userModal) closeModal();
    });

    userForm.addEventListener('submit', handleFormSubmit);

    userTableBody.addEventListener('click', async (event) => {
        const editButton = event.target.closest('.btn-edit');
        const deleteButton = event.target.closest('.btn-delete');
        
        if (!editButton && !deleteButton) return;

        const row = (editButton || deleteButton).closest('tr');
        const userId = row.dataset.id;

        if (editButton) {
            try {
                const response = await fetch(`${baseUrl}dados/${userId}/`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();

                for (const key in data) {
                    const field = userForm.elements[key];
                    if (field) {
                        if (field.type === 'checkbox') {
                            field.checked = data[key];
                        } else {
                            field.value = data[key];
                        }
                    }
                }
                
                currentEditUserId = userId;
                modalTitle.textContent = 'Editar Colaborador';
                submitBtn.textContent = 'Atualizar';
                openModal();

            } catch (error) {
                console.error('Erro ao buscar dados para edição:', error);
                alert('Não foi possível carregar os dados do usuário.');
            }
        }

        if (deleteButton) {
            if (confirm('Tem certeza que deseja excluir este colaborador?')) {
                try {
                    const response = await fetch(`${baseUrl}delete/${userId}/`, {
                        method: 'DELETE',
                        headers: { 'X-CSRFToken': csrfToken }
                    });
                    
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    
                    const result = await response.json();

                    if (result.success) {
                        row.remove();
                        showNotification('Colaborador excluído com sucesso!'); // <-- ADICIONADO
                    } else {
                        alert('Ocorreu um erro ao excluir: ' + (result.error || 'Erro desconhecido.'));
                    }
                } catch(error) {
                    console.error('Erro ao deletar:', error);
                    alert('Ocorreu um erro na comunicação com o servidor ao tentar deletar.');
                }
            }
        }
    });

    // --- Listener para a barra de pesquisa ---
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const rows = userTableBody.querySelectorAll('tr');

        rows.forEach(row => {
            const nome = row.children[0].textContent.toLowerCase();
            const matricula = row.children[1].textContent.toLowerCase();
            const isVisible = nome.includes(searchTerm) || matricula.includes(searchTerm);
            row.style.display = isVisible ? '' : 'none';
        });
    });
});