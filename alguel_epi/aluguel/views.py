import json
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render
from django.views import View
from .models import Usuarios
from .forms import UsuarioForm
from django.views.generic import TemplateView 
from .models import Usuarios
from .forms import UsuarioForm
from django.contrib.auth.hashers import make_password

class MenuView(TemplateView):
    template_name = "aluguel/menu.html"

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

# 2. VIEW PARA BUSCAR DADOS DE UM USUÁRIO (PARA EDIÇÃO)
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

# 3. VIEW PARA ATUALIZAR UM USUÁRIO
def update_usuario(request, pk):
    if request.method == 'POST':
        usuario_instance = get_object_or_404(Usuarios, pk=pk)
        data = json.loads(request.body)
        form = UsuarioForm(data, instance=usuario_instance)

        if form.is_valid():
            usuario = form.save(commit=False)
            cpf_limpo = ''.join(filter(str.isdigit, usuario.cpf))
            if data.get('cpf') != usuario_instance.cpf:
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
    return JsonResponse({'success': False, 'error': 'Método inválido'}, status=405)



# 4. VIEW PARA DELETAR UM USUÁRIO
def delete_usuario(request, pk):
    if request.method == 'DELETE':
        usuario = get_object_or_404(Usuarios, pk=pk)
        usuario.delete()
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'error': 'Método inválido'}, status=405)