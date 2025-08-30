from django import forms
from .models import Usuarios

class UsuarioForm(forms.ModelForm):
    class Meta:
        model = Usuarios
        # Lista dos campos que aparecerão no formulário
        fields = [
            'nome_completo',
            'cpf',
            'matricula',
            'cargo',
            'tipo_usuario',
            'login',
            'ativo'
        ]

        labels = {
            'login': 'Email',
            'tipo_usuario': 'Tipo de Usuário',
        }

        # Adiciona widgets para melhorar a aparência no HTML (opcional, mas recomendado)
        widgets = {
            'nome_completo': forms.TextInput(attrs={'class': 'form-control'}),
            'cpf': forms.TextInput(attrs={'class': 'form-control'}),
            'matricula': forms.TextInput(attrs={'class': 'form-control'}),
            'cargo': forms.TextInput(attrs={'class': 'form-control'}),
            'tipo_usuario': forms.Select(attrs={'class': 'form-select'}),
            'login': forms.EmailInput(attrs={'class': 'form-control'}),
            'ativo': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }

# NOTA: O campo 'senha_hash' foi omitido de propósito. A gestão de senhas
# deve ser feita de forma especial (com hash seguro), e geralmente não se
# edita o hash diretamente em um formulário comum.