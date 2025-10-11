# aluguel/tests/test_views_epis.py

import pytest
import json
from django.urls import reverse
from aluguel.models import EPI  # Usando import absoluto

# O decorator garante que cada teste use um banco de dados limpo.
# A fixture 'client' é injetada para simular requisições HTTP.
@pytest.mark.django_db
def test_ct005_cadastrar_epi_com_sucesso(client):
    """
    Objetivo: Verificar se um novo EPI pode ser cadastrado corretamente.
    Corresponde ao CT-005.
    """
    # Arrange: Prepara os dados de entrada e a URL do endpoint.
    url = reverse('aluguel:epis_crud')
    data = {
        "nome_equipamento": "Capacete de Segurança",
        "ca_numero": "12345",
        "data_validade_ca": "2028-12-31",
        "quantidade_total": "50",
        "quantidade_disponivel": "50"
    }

    # Act: Executa a requisição POST para criar o EPI.
    response = client.post(url, data=data)

    # Assert: Verifica se o resultado é o esperado.
    assert response.status_code == 200
    response_data = response.json()
    assert response_data['success'] is True

    # Verifica se o EPI foi realmente criado no banco de dados.
    epi_criado = EPI.objects.get(ca_numero=data['ca_numero'])
    assert epi_criado.nome_equipamento == "Capacete de Segurança"
    
    # Verifica o resultado esperado: quantidade disponível igual à total.
    assert epi_criado.quantidade_disponivel == epi_criado.quantidade_total
    assert epi_criado.quantidade_total == 50


@pytest.mark.django_db
def test_ct006_cadastrar_epi_dados_invalidos(client):
    """
    Objetivo: Verificar se o sistema rejeita cadastro com campos obrigatórios em branco.
    Corresponde ao CT-006.
    """
    # Arrange: Prepara os dados inválidos e a URL.
    url = reverse('aluguel:epis_crud')
    data_invalida = {
        "nome_equipamento": "",  # Campo obrigatório vazio
        "ca_numero": "54321",
        "quantidade_total": "10",
    }

    # Act: Tenta criar um novo EPI com o nome em branco.
    response = client.post(url, data=data_invalida)
    print(response.json())
    # Assert: Verifica se a resposta indica um erro de validação.
    assert response.status_code == 400
    response_data = response.json()
    assert response_data['success'] is False
    assert 'nome_equipamento' in response_data['errors']  # Verifica se o erro é no campo correto

    # Garante que nenhum EPI foi criado.
    assert EPI.objects.count() == 0


@pytest.mark.django_db
def test_ct007_editar_quantidade_epi(client):
    """
    Objetivo: Garantir que a quantidade total de um EPI possa ser atualizada.
    Corresponde ao CT-007.
    """
    # Arrange: Cria o EPI que será editado.
    epi = EPI.objects.create(
        nome_equipamento="Capacete de Segurança",
        ca_numero="12345",
        quantidade_total=50,  # Valor antigo
        data_validade_ca='2025-12-31',
        quantidade_disponivel=50
    )

    url = reverse('aluguel:update_epis', args=[epi.id])
    dados_para_atualizar = {
        "nome_equipamento": "Capacete de Segurança",
        "ca_numero": "12345",
        "quantidade_total": 60,  # Valor novo
        "data_validade_ca":'2025-12-31',
        "quantidade_disponivel": 60
    }

    # Act: Envia a requisição POST para a view de atualização.
    # Sua view `update_epi` espera JSON no corpo da requisição.
    response = client.post(
        url, 
        data=json.dumps(dados_para_atualizar), 
        content_type='application/json'
    )
    print(response.json())
    # Assert: Verifica se a operação foi bem-sucedida.
    assert response.status_code == 200
    assert response.json()['success'] is True

    # Verifica se os dados foram realmente alterados no banco.
    epi.refresh_from_db()  # Atualiza o objeto com os novos dados do DB
    assert epi.quantidade_total == 60


@pytest.mark.django_db
def test_ct008_excluir_epi(client):
    """
    Objetivo: Verificar se um EPI pode ser excluído do sistema.
    Corresponde ao CT-008.
    """
    # Arrange: Cria o EPI que será excluído.
    epi = EPI.objects.create(
        nome_equipamento="Capacete de Segurança",
        ca_numero="12345",
        quantidade_total=50,
        data_validade_ca='2025-12-31',
        quantidade_disponivel=50
    )
    assert EPI.objects.count() == 1  # Confirma que o EPI existe

    url = reverse('aluguel:delete_epis', args=[epi.id])

    # Act: Envia a requisição DELETE.
    response = client.delete(url)
    print(response.json())
    # Assert: Verifica se a exclusão foi confirmada.
    assert response.status_code == 200
    assert response.json()['success'] is True

    # Verifica se o EPI não existe mais no banco de dados.
    assert EPI.objects.count() == 0