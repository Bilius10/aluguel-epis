from django import forms
from .models import Usuarios, EPI, Emprestimos

class UsuarioForm(forms.ModelForm):
    class Meta:
        model = Usuarios
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

        widgets = {
            'nome_completo': forms.TextInput(attrs={'class': 'form-control'}),
            'cpf': forms.TextInput(attrs={'class': 'form-control'}),
            'matricula': forms.TextInput(attrs={'class': 'form-control'}),
            'cargo': forms.TextInput(attrs={'class': 'form-control'}),
            'tipo_usuario': forms.Select(attrs={'class': 'form-select'}),
            'login': forms.EmailInput(attrs={'class': 'form-control'}),
            'ativo': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }

class EPIForm(forms.ModelForm):
    class Meta:
        model = EPI

        fields = [
            'nome_equipamento',
            'ca_numero',
            'data_validade_ca',
            'quantidade_total',
            'quantidade_disponivel'
        ]

        labels = {
            'nome_equipamento': 'Nome do Equipamento',
            'ca_numero': 'Número do C.A.',
            'data_validade_ca': 'Data de Validade do C.A.',
            'quantidade_total': 'Quantidade Total',
            'quantidade_disponivel': 'Quantidade Disponível',
        }

        widgets = {
            'nome_equipamento': forms.TextInput(
                attrs={'class': 'form-control', 'placeholder': 'Ex: Luva de Raspa'}
            ),
            'ca_numero': forms.TextInput(
                attrs={'class': 'form-control', 'placeholder': 'Ex: 35421'}
            ),
            'data_validade_ca': forms.DateInput(
                attrs={'class': 'form-control', 'type': 'date'}
            ),
            'quantidade_total': forms.NumberInput(
                attrs={'class': 'form-control', 'min': '0'}
            ),
            'quantidade_disponivel': forms.NumberInput(
                attrs={'class': 'form-control', 'min': '0'}
            ),
        }

class EmprestimoForm(forms.ModelForm):

    class Meta:
        model = Emprestimos
        
        fields = [
            'epi', 
            'colaborador', 
            'tecnico', 
            'observacao'
        ]

        labels = {
            'epi': 'Equipamento (EPI)',
            'colaborador': 'Colaborador (Quem retira)',
            'tecnico': 'Técnico Responsável',
            'observacao': 'Observações (Opcional)',
        }

        widgets = {
            'epi': forms.Select(
                attrs={'class': 'form-select'}
            ),
            'colaborador': forms.Select(
                attrs={'class': 'form-select'}
            ),
            'tecnico': forms.Select(
                attrs={'class': 'form-select'}
            ),
            'observacao': forms.Textarea(
                attrs={
                    'class': 'form-control', 
                    'rows': 3, 
                    'placeholder': 'Ex: Equipamento entregue com pequena avaria na alça.'
                }
            ),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        if self.instance and self.instance.pk:
            self.fields['epi'].queryset = EPI.objects.filter(quantidade_disponivel__gt=0) | EPI.objects.filter(pk=self.instance.epi.pk)
        else:
            self.fields['epi'].queryset = EPI.objects.filter(quantidade_disponivel__gt=0)
