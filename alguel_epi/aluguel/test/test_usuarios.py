# aluguel/tests/test_views_usuarios.py

import pytest
from django.urls import reverse
from django.contrib.auth.hashers import check_password
from aluguel.models import Usuarios  # Usando import absoluto

# O decorator garante que cada teste use um banco de dados limpo.
# A fixture 'client' é injetada para simular requisições HTTP.
@pytest.mark.django_db
def test_ct001_cadastrar_usuario_com_sucesso(client):
    """
    Objetivo: Verificar se um novo usuário pode ser cadastrado com sucesso.
    Corresponde ao CT-001.
    """
    # Arrange: Prepara os dados de entrada e a URL do endpoint.
    url = reverse('aluguel:usuario_crud')
    data = {
        "nome_completo": "João da Silva",
        "cpf": "123.456.789-00",
        "matricula": "98765",
        "cargo": "Operador",
        "tipo_usuario": "COLABORADOR",
        "login": "joao.silva@teste.com"
    }

    # Act: Executa a requisição POST para criar o usuário.
    response = client.post(url, data=data)

    # Assert: Verifica se o resultado é o esperado.
    assert response.status_code == 200
    response_data = response.json()
    assert response_data['success'] is True

    # Verifica se o usuário foi realmente criado no banco de dados.
    usuario_criado = Usuarios.objects.get(cpf=data['cpf'])
    assert usuario_criado.nome_completo == "João da Silva"

    # Verifica se a senha foi gerada a partir do CPF.
    cpf_limpo = "12345678900"
    assert check_password(cpf_limpo, usuario_criado.senha_hash)


@pytest.mark.django_db
def test_ct002_cadastrar_usuario_cpf_duplicado(client):
    """
    Objetivo: Verificar se o sistema impede o cadastro com CPF duplicado.
    Corresponde ao CT-002.
    """
    # Arrange: Cria um usuário inicial para satisfazer o pré-requisito.
    Usuarios.objects.create(
        nome_completo="Usuário Existente",
        cpf="123.456.789-00",
        matricula="11111"
    )

    url = reverse('aluguel:usuario_crud')
    data_duplicada = {
        "nome_completo": "Ana Pereira",
        "cpf": "123.456.789-00",  # CPF já existente
        "matricula": "54321",
        "cargo": "Auxiliar",
        "tipo_usuario": "Colaborador",
        "login": "ana.pereira"
    }

    # Act: Tenta criar um novo usuário com o mesmo CPF.
    response = client.post(url, data=data_duplicada)

    # Assert: Verifica se a resposta indica um erro.
    assert response.status_code == 200  # Sua view retorna 200 mesmo em erro de form
    response_data = response.json()
    assert response_data['success'] is False
    assert 'cpf' in response_data['errors']  # Verifica se o erro é no campo CPF

    # Garante que o segundo usuário não foi criado.
    assert Usuarios.objects.count() == 1


@pytest.mark.django_db
def test_ct003_editar_usuario_existente(client):
    """
    Objetivo: Garantir que os dados de um usuário possam ser atualizados.
    Corresponde ao CT-003.
    """
    # Arrange: Cria o usuário que será editado.
    usuario = Usuarios.objects.create(
        nome_completo="João da Silva",
        cpf="123.456.789-00",
        matricula="98765",
        cargo="Operador",  # Valor antigo
        tipo_usuario="Colaborador", # Valor antigo
        login="teste@teste.com"
    )

    url = reverse('aluguel:update_usuario', args=[usuario.id])
    dados_para_atualizar = {
        "nome_completo": "João da Silva",
        "cpf": "123.456.789-00",
        "matricula": "98765",
        "cargo": "Encarregado",  # Valor novo
        "tipo_usuario": "TECNICO",  # Valor novo
        "login":"teste@teste.com"
    }

    # Act: Envia a requisição POST para a view de atualização.
    response = client.post(url, data=dados_para_atualizar)

    # Assert: Verifica se a operação foi bem-sucedida.
    assert response.status_code == 200
    assert response.json()['success'] is True

    # Verifica se os dados foram realmente alterados no banco.
    usuario.refresh_from_db()  # Atualiza o objeto com os novos dados do DB
    assert usuario.cargo == "Encarregado"
    assert usuario.tipo_usuario == "TECNICO"


@pytest.mark.django_db
def test_ct004_excluir_usuario(client):
    """
    Objetivo: Verificar se um usuário pode ser removido do sistema.
    Corresponde ao CT-004.
    """
    # Arrange: Cria o usuário que será excluído.
    usuario = Usuarios.objects.create(
        nome_completo="João da Silva",
        cpf="123.456.789-00",
        matricula="98765"
    )
    assert Usuarios.objects.count() == 1  # Confirma que o usuário existe

    url = reverse('aluguel:delete_usuario', args=[usuario.id])

    # Act: Envia a requisição DELETE.
    response = client.delete(url)

    # Assert: Verifica se a exclusão foi confirmada.
    assert response.status_code == 200
    assert response.json()['success'] is True

    # Verifica se o usuário não existe mais no banco de dados.
    assert Usuarios.objects.count() == 0