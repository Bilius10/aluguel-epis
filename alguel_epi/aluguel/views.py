import json
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render
from django.views import View
from django.db import transaction
from django.db.models import F
from .models import Usuarios, EPI, Emprestimos
from .forms import UsuarioForm, EPIForm, EmprestimoForm
from django.views.generic import TemplateView 
from django.contrib.auth.hashers import make_password


class ProfileView(TemplateView):
    template_name = "aluguel/profile.html"

class MenuView(TemplateView):
    template_name = "aluguel/base.html"

class UsuarioCRUDView(View):
    def get(self, request):
        usuarios = Usuarios.objects.all().order_by('nome_completo')
        form = UsuarioForm()
        return render(request, 'aluguel/usuario_crud.html', {'usuarios': usuarios, 'form': form})

    def post(self, request):
        form = UsuarioForm(request.POST)
        if form.is_valid():
            usuario = form.save(commit=False)
            
            cpf_limpo = ''.join(filter(str.isdigit, usuario.cpf)) 
            usuario.senha_hash = make_password(cpf_limpo)
            
            usuario.save()
            
            return JsonResponse({
                'success': True,
                'usuario': {
                    'id': usuario.id,
                    'nome_completo': usuario.nome_completo,
                    'matricula': usuario.matricula
                }
            })
        return JsonResponse({'success': False, 'errors': form.errors})

def get_usuario_data(request, pk):
    usuario = get_object_or_404(Usuarios, pk=pk)
    data = {
        'id': usuario.id,
        'nome_completo': usuario.nome_completo,
        'cpf': usuario.cpf,
        'matricula': usuario.matricula,
        'cargo': usuario.cargo,
        'tipo_usuario': usuario.tipo_usuario,
        'login': usuario.login,
        'ativo': usuario.ativo
    }
    return JsonResponse(data)

def update_usuario(request, pk):
    if request.method == 'POST':
    
        usuario_instance = get_object_or_404(Usuarios, pk=pk)
        
        form = UsuarioForm(request.POST, instance=usuario_instance)

        if form.is_valid():
            usuario = form.save(commit=False)
            
            # Checa se o CPF foi alterado para atualizar a senha
            cpf_limpo = ''.join(filter(str.isdigit, usuario.cpf))
            if usuario.cpf != usuario_instance.cpf:
                usuario.senha_hash = make_password(cpf_limpo)
            
            usuario.save()

            return JsonResponse({
                'success': True,
                'usuario': {
                    'id': usuario.id,
                    'nome_completo': usuario.nome_completo,
                    'matricula': usuario.matricula
                }
            })
        
        return JsonResponse({'success': False, 'errors': form.errors}, status=400)

    return JsonResponse({'success': False, 'error': 'Método inválido'}, status=405)

# 4. VIEW PARA DELETAR UM USUÁRIO
def delete_usuario(request, pk):
    if request.method == 'DELETE':
        usuario = get_object_or_404(Usuarios, pk=pk)
        usuario.delete()
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'error': 'Método inválido'}, status=405)


class EPICRUDView(View):

    def get(self, request):

        epis = EPI.objects.all().order_by('nome_equipamento')
        form = EPIForm()
        return render(request, 'aluguel/epi_crud.html', {'epis': epis, 'form': form})

    def post(self, request):

        form = EPIForm(request.POST)
        if form.is_valid():
            epi = form.save()

            epi_data = {
                'id': epi.id,
                'nome_equipamento': epi.nome_equipamento,
                'ca_numero': epi.ca_numero,
                'data_validade_ca': epi.data_validade_ca.strftime('%Y-%m-%d') if epi.data_validade_ca else None,
                'quantidade_disponivel': epi.quantidade_disponivel,
                'quantidade_total': epi.quantidade_total
            }
            return JsonResponse({'success': True, 'epi': epi_data})

        return JsonResponse({'success': False, 'errors': form.errors}, status=400)


def get_epi_data(request, pk):
    epi = get_object_or_404(EPI, pk=pk)
    data = {
        'id': epi.id,
        'nome_equipamento': epi.nome_equipamento,
        'ca_numero': epi.ca_numero,
        'data_validade_ca': epi.data_validade_ca.strftime('%Y-%m-%d') if epi.data_validade_ca else None,
        'quantidade_total': epi.quantidade_total,
        'quantidade_disponivel': epi.quantidade_disponivel,
    }
    return JsonResponse(data)


def update_epi(request, pk):
    if request.method == 'POST':
        epi_instance = get_object_or_404(EPI, pk=pk)
        data = json.loads(request.body)
        form = EPIForm(data, instance=epi_instance)
        if form.is_valid():
            epi = form.save()
            epi_data = {
                'id': epi.id,
                'nome_equipamento': epi.nome_equipamento,
                'ca_numero': epi.ca_numero,
                'data_validade_ca': epi.data_validade_ca.strftime('%Y-%m-%d') if epi.data_validade_ca else None,
                'quantidade_disponivel': epi.quantidade_disponivel,
                'quantidade_total': epi.quantidade_total
            }
            return JsonResponse({'success': True, 'epi': epi_data})
        return JsonResponse({'success': False, 'errors': form.errors}, status=400)
    return JsonResponse({'success': False, 'error': 'Método inválido'}, status=405)


def delete_epi(request, pk):
    if request.method == 'DELETE':
        epi = get_object_or_404(EPI, pk=pk)
        epi.delete()
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'error': 'Método inválido'}, status=405)

class EmprestimoCRUDView(View):

    def get(self, request):

        emprestimos = Emprestimos.objects.select_related('epi', 'colaborador', 'tecnico').all().order_by('-data_retirada')
        form = EmprestimoForm()
        return render(request, 'aluguel/emprestimo_crud.html', {'emprestimos': emprestimos, 'form': form})

    def post(self, request):

        try:
            data = json.loads(request.body)
            form = EmprestimoForm(data)
        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'error': 'Dados JSON inválidos.'}, status=400)
        
        if form.is_valid():
            try:

                with transaction.atomic():

                    epi_selecionado = form.cleaned_data['epi']
                    
                    if epi_selecionado.quantidade_disponivel <= 0:
                        return JsonResponse({'success': False, 'errors': {'epi': ['Este EPI não está mais disponível em estoque.']}}, status=400)

                    # Salva o empréstimo
                    emprestimo = form.save()

                    epi_selecionado.quantidade_disponivel = F('quantidade_disponivel') - 1
                    epi_selecionado.save()

                emprestimo_data = {
                    'id': emprestimo.id,
                    'colaborador_nome': emprestimo.colaborador.nome_completo,
                    'epi_nome': emprestimo.epi.nome_equipamento,
                    'data_retirada': emprestimo.data_retirada.strftime('%d/%m/%Y %H:%M'),
                    'status': emprestimo.get_status_display(),
                }
                return JsonResponse({'success': True, 'emprestimo': emprestimo_data})
            except Exception as e:
                return JsonResponse({'success': False, 'error': f'Erro interno do servidor: {str(e)}'}, status=500)
                
        return JsonResponse({'success': False, 'errors': form.errors}, status=400)

def get_emprestimo_data(request, pk):
    """ Retorna todos os dados de um empréstimo específico para preencher o formulário de edição. """
    emprestimo = get_object_or_404(Emprestimos, pk=pk)
    data = {
        'epi': emprestimo.epi.id,
        'colaborador': emprestimo.colaborador.id,
        'tecnico': emprestimo.tecnico.id,
        'data_prevista_devolucao': emprestimo.data_prevista_devolucao.strftime('%Y-%m-%d') if emprestimo.data_prevista_devolucao else '',
        'condicoes_emprestimo': emprestimo.condicoes_emprestimo,
        'status': emprestimo.status,
        'data_devolucao': emprestimo.data_devolucao.strftime('%Y-%m-%dT%H:%M') if emprestimo.data_devolucao else '',
        'observacao_devolucao': emprestimo.observacao_devolucao,
    }
    return JsonResponse(data)

def update_emprestimo(request, pk):
    """ Lida com a ATUALIZAÇÃO de um empréstimo existente. """
    emprestimo_instance = get_object_or_404(Emprestimos, pk=pk)
    
    # Guarda os valores originais para comparar depois
    epi_original = emprestimo_instance.epi
    status_original = emprestimo_instance.status
    
    data = json.loads(request.body)
    form = EmprestimoForm(data, instance=emprestimo_instance)
    
    if form.is_valid():
        with transaction.atomic():
            emprestimo = form.save()
            epi_novo = emprestimo.epi
            status_novo = emprestimo.status
            
            # --- LÓGICA DE ATUALIZAÇÃO DE ESTOQUE ---
            
            # 1. Se o EPI foi trocado
            if epi_original.pk != epi_novo.pk:
                # Devolve o EPI antigo ao estoque
                epi_original.quantidade_disponivel = F('quantidade_disponivel') + 1
                epi_original.save()
                # Retira o EPI novo do estoque
                epi_novo.quantidade_disponivel = F('quantidade_disponivel') - 1
                epi_novo.save()

            status_devolucao = ['DEVOLVIDO', 'DANIFICADO', 'PERDIDO']
            if status_novo in status_devolucao and status_original not in status_devolucao:
        
                if epi_original.pk == epi_novo.pk:
                    epi_novo.quantidade_disponivel = F('quantidade_disponivel') + 1
                    epi_novo.save()

        emprestimo_data = {
            'id': emprestimo.id,
            'colaborador_nome': emprestimo.colaborador.nome_completo,
            'epi_nome': emprestimo.epi.nome_equipamento,
            'data_retirada': emprestimo.data_retirada.strftime('%d/%m/%Y %H:%M'),
            'status': emprestimo.get_status_display(),
        }
        return JsonResponse({'success': True, 'emprestimo': emprestimo_data})
        
    return JsonResponse({'success': False, 'errors': form.errors}, status=400)

def delete_emprestimo(request, pk):
    """ Deleta um empréstimo e devolve o item ao estoque. """
    if request.method == 'DELETE':
        try:
            with transaction.atomic():
                emprestimo = get_object_or_404(Emprestimos, pk=pk)
                epi_a_devolver = emprestimo.epi

                emprestimo.delete()

                epi_a_devolver.quantidade_disponivel = F('quantidade_disponivel') + 1
                epi_a_devolver.save()

            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': f'Erro interno do servidor: {str(e)}'}, status=500)

    return JsonResponse({'success': False, 'error': 'Método inválido'}, status=405)
