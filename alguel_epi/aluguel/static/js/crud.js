document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('user-form');
    const formTitle = document.getElementById('form-title');
    const userIdInput = document.getElementById('user-id');
    const userList = document.getElementById('user-list');
    const btnCancel = document.getElementById('btn-cancel');
    const btnSubmit = document.getElementById('btn-submit');
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    // Pega a URL de criação do atributo data-* do formulário
    const createUrl = form.dataset.createUrl;

    // Função para redefinir o formulário
    function resetForm() {
        form.reset();
        userIdInput.value = '';
        formTitle.textContent = 'Cadastrar Novo Usuário';
        btnSubmit.textContent = 'Salvar';
        btnCancel.style.display = 'none';
    }

    // Evento para o botão "Cancelar"
    btnCancel.addEventListener('click', () => {
        resetForm();
    });

    // Evento para o botão "Editar"
    document.querySelectorAll('.btn-edit').forEach((btn) => {
        btn.addEventListener('click', (event) => {
            const userId = event.target.dataset.id;
            const userName = event.target.closest('li').querySelector('strong').textContent;

            // Preencher o formulário com os dados do usuário
            userIdInput.value = userId;
            formTitle.textContent = `Editar Usuário: ${userName}`;
            btnSubmit.textContent = 'Atualizar';
            btnCancel.style.display = 'inline-block';
        });
    });

    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        const userId = userIdInput.value;
        const isUpdating = !!userId;
        const url = isUpdating ? `/usuarios/atualizar/${userId}/` : createUrl;
        
        const formData = new FormData(form);
        let response;
        
        if (isUpdating) {
            const data = Object.fromEntries(formData.entries());
            data.ativo = document.getElementById('id_ativo').checked;
            
            response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify(data)
            });
        } else {
            response = await fetch(url, {
                method: 'POST',
                headers: { 'X-CSRFToken': csrfToken },
                body: formData
            });
        }

        const result = await response.json();

        if (result.success) {
            const usuario = result.usuario;
            if (isUpdating) {
                const userElement = document.querySelector(`#user-${usuario.id} span`);
                userElement.innerHTML = `<strong>${usuario.nome_completo}</strong> (Matrícula: ${usuario.matricula})`;
            } else {
                const newItem = document.createElement('li');
                newItem.className = 'list-group-item d-flex justify-content-between align-items-center';
                newItem.id = `user-${usuario.id}`;
                newItem.innerHTML = `
                    <span>
                        <strong>${usuario.nome_completo}</strong> (Matrícula: ${usuario.matricula})
                    </span>
                    <div>
                        <button class="btn btn-sm btn-warning btn-edit" data-id="${usuario.id}">
                            <i class="bi bi-pencil-fill"></i> Editar
                        </button>
                        <button class="btn btn-sm btn-danger btn-delete" data-id="${usuario.id}">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    </div>`;
                userList.appendChild(newItem);
            }
            resetForm();
            // Pequena melhoria: pode-se usar uma notificação mais elegante aqui
            alert('Operação realizada com sucesso!');
        } else {
            alert('Ocorreu um erro: ' + JSON.stringify(result.errors));
        }
    });

    userList.addEventListener('click', async function(event) {
        const target = event.target.closest('button');
        if (!target) return;

        const id = target.dataset.id;

        if (target.classList.contains('btn-edit')) {
            const response = await fetch(`/usuarios/dados/${id}/`);
            const data = await response.json();

            for (const key in data) {
                const field = form.elements[key];
                if (field) {
                    if (field.type === 'checkbox') {
                        field.checked = data[key];
                    } else {
                        field.value = data[key];
                    }
                }
            }

            userIdInput.value = id;
            formTitle.textContent = 'Editar Usuário';
            btnSubmit.textContent = 'Atualizar';
            btnCancel.style.display = 'inline-block';
        }

        if (target.classList.contains('btn-delete')) {
            if (confirm('Tem certeza que deseja excluir este usuário?')) {
                const response = await fetch(`/usuarios/deletar/${id}/`, {
                    method: 'DELETE',
                    headers: { 'X-CSRFToken': csrfToken }
                });
                const result = await response.json();
                if (result.success) {
                    document.getElementById(`user-${id}`).remove();
                    alert('Usuário excluído com sucesso!');
                    resetForm();
                } else {
                    alert('Erro ao excluir usuário.');
                }
            }
        }
    });

    btnCancel.addEventListener('click', resetForm);
});