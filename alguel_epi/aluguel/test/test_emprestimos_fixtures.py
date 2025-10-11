# aluguel/tests/test_views_emprestimos.py

import pytest
import json
from django.urls import reverse
from aluguel.models import Usuarios, EPI, Emprestimos

# --- Fixtures: Dados de teste reutilizáveis ---

@pytest.fixture
def colaborador_joao():
    """Fornece um usuário colaborador padrão para os testes."""
    return Usuarios.objects.create(
        nome_completo="João da Silva", 
        cpf="123.456.789-00", 
        matricula="98765",
        tipo_usuario="COLABORADOR",  # <-- CORREÇÃO: Adicionado tipo de usuário
        login="joao.silva@test.com"
    )

@pytest.fixture
def tecnico_admin():
    """Fornece um usuário técnico padrão para os testes."""
    return Usuarios.objects.create(
        nome_completo="Admin", 
        cpf="111.222.333-44", 
        matricula="admin", 
        tipo_usuario="TECNICO",
        login="admin.tecnico@test.com"
    )

@pytest.fixture
def epi_capacete_com_estoque():
    """Fornece um EPI com 50 unidades disponíveis."""
    return EPI.objects.create(
        nome_equipamento="Capacete de Segurança", ca_numero="12345", 
        quantidade_total=50, quantidade_disponivel=50, data_validade_ca='2028-12-31'
    )

@pytest.fixture
def epi_luva_sem_estoque():
    """Fornece um EPI com 0 unidades disponíveis."""
    return EPI.objects.create(
        nome_equipamento="Luva de Raspa", ca_numero="54321", 
        quantidade_total=10, quantidade_disponivel=0, data_validade_ca='2027-01-01'
    )


# --- Testes baseados nos Casos de Teste (CTs) ---

@pytest.mark.django_db
def test_ct009_realizar_emprestimo_com_sucesso(client, colaborador_joao, tecnico_admin, epi_capacete_com_estoque):
    """
    Objetivo: Validar o registro de um novo empréstimo e o decremento do estoque.
    Corresponde ao CT-009.
    """
    # Arrange
    url = reverse('aluguel:emprestimo_crud')
    data = {
        'colaborador': colaborador_joao.id,
        'tecnico': tecnico_admin.id,
        'epi': epi_capacete_com_estoque.id,
        'data_prevista_devolucao': '2025-12-20',
        'status': 'EMPRESTADO'  
    }
    
    # Act
    response = client.post(url, data=json.dumps(data), content_type='application/json')
    
    # Assert
    assert response.status_code == 200
    assert response.json()['success'] is True
    
    # Verifica o resultado esperado no banco de dados
    epi_capacete_com_estoque.refresh_from_db()
    assert epi_capacete_com_estoque.quantidade_disponivel == 49
    assert Emprestimos.objects.count() == 1


@pytest.mark.django_db
def test_ct010_emprestar_epi_sem_estoque(client, colaborador_joao, tecnico_admin, epi_luva_sem_estoque):
    """
    Objetivo: Garantir que o sistema impeça o empréstimo de um EPI sem estoque.
    Corresponde ao CT-010.
    """
    # Arrange
    url = reverse('aluguel:emprestimo_crud')
    data = {
        'colaborador': colaborador_joao.id,
        'tecnico': tecnico_admin.id,
        'epi': epi_luva_sem_estoque.id,
        'status': 'EMPRESTADO'  # <-- CORREÇÃO: Campo status adicionado
    }
    
    # Act
    response = client.post(url, data=json.dumps(data), content_type='application/json')
    print(response.json())
    # Assert
    # A validação de estoque na sua view vem antes da validação do formulário.
    assert response.status_code == 400
    response_data = response.json()

    assert response_data['success'] is False
    assert 'Select a valid choice. That choice is not one of the available choices.' in response_data['errors']['epi'][0]
    
    # Garante que o empréstimo não foi criado
    assert Emprestimos.objects.count() == 0


@pytest.mark.django_db
def test_ct011_realizar_devolucao_emprestimo(client, colaborador_joao, tecnico_admin, epi_capacete_com_estoque):
    """
    Objetivo: Validar a devolução, atualização de status e incremento do estoque.
    Corresponde ao CT-011.
    """
    # Arrange: Cria um empréstimo existente e decrementa o estoque para simular o pré-requisito.
    emprestimo = Emprestimos.objects.create(
        colaborador=colaborador_joao, tecnico=tecnico_admin, epi=epi_capacete_com_estoque, status='EMPRESTADO'
    )
    epi_capacete_com_estoque.quantidade_disponivel = 49
    epi_capacete_com_estoque.save()

    url = reverse('aluguel:update_emprestimo', args=[emprestimo.id])
    data_devolucao = {
        'colaborador': colaborador_joao.id, 'tecnico': tecnico_admin.id, 'epi': epi_capacete_com_estoque.id,
        'status': 'DEVOLVIDO',
        'data_devolucao': '2025-10-11T14:30' # Formato esperado pelo input datetime-local
    }

    # Act
    response = client.post(url, data=json.dumps(data_devolucao), content_type='application/json')
    
    # Assert
    assert response.status_code == 200
    assert response.json()['success'] is True
    
    # Verifica o resultado esperado no banco de dados
    epi_capacete_com_estoque.refresh_from_db()
    assert epi_capacete_com_estoque.quantidade_disponivel == 50
    emprestimo.refresh_from_db()
    assert emprestimo.status == 'DEVOLVIDO'


@pytest.mark.django_db
def test_ct012_excluir_emprestimo_devolve_estoque(client, colaborador_joao, tecnico_admin, epi_capacete_com_estoque):
    """
    Objetivo: Verificar se a exclusão de um empréstimo devolve o EPI ao estoque.
    Corresponde ao CT-012.
    """
    # Arrange: Cria um empréstimo e decrementa o estoque.
    emprestimo = Emprestimos.objects.create(
        colaborador=colaborador_joao, tecnico=tecnico_admin, epi=epi_capacete_com_estoque, status='EMPRESTADO'
    )
    epi_capacete_com_estoque.quantidade_disponivel = 49
    epi_capacete_com_estoque.save()
    
    url = reverse('aluguel:delete_emprestimo', args=[emprestimo.id])
    
    # Act
    response = client.delete(url)
    
    # Assert
    assert response.status_code == 200
    assert response.json()['success'] is True
    
    # Verifica o resultado esperado no banco de dados
    epi_capacete_com_estoque.refresh_from_db()
    assert epi_capacete_com_estoque.quantidade_disponivel == 50
    assert Emprestimos.objects.count() == 0