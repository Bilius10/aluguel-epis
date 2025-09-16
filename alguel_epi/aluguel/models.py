from django.db import models

class Usuarios(models.Model):
    USER_TYPE_CHOICES = [
        ('COLABORADOR', 'Colaborador'),
        ('TECNICO', 'Tecnico de segurança'),
        ('ADMIN', 'Admin'),
    ]

    nome_completo = models.CharField(max_length=255)
    cpf = models.CharField(max_length=14, unique=True, null=True, blank=True)
    matricula = models.CharField(max_length=50, unique=True)
    cargo = models.CharField(max_length=100, null=True, blank=True)
    tipo_usuario = models.CharField(max_length=20, choices=USER_TYPE_CHOICES)
    login = models.EmailField(unique=True)
    
    senha_hash = models.CharField(max_length=255)
    ativo = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.nome_completo} ({self.matricula})"

    class Meta:
        verbose_name = "Usuário"
        verbose_name_plural = "Usuários"

class EPI(models.Model):
    """
    Representa um Equipamento de Proteção Individual.
    """
    nome_equipamento = models.CharField(max_length=255)
    ca_numero = models.CharField(max_length=50, verbose_name="Número do CA")
    data_validade_ca = models.DateField(verbose_name="Data de Validade do CA")
    quantidade_total = models.IntegerField()
    quantidade_disponivel = models.IntegerField()

    def __str__(self):
        return f"{self.nome_equipamento} (CA: {self.ca_numero})"

    class Meta:
        verbose_name = "EPI"
        verbose_name_plural = "EPIs"


class Emprestimos(models.Model):
    STATUS_CHOICES = [
        ('EMPRESTADO', 'Emprestado'),
        ('FORNECIDO', 'Fornecido'),
        ('DEVOLVIDO', 'Devolvido'),
        ('DANIFICADO', 'Danificado'),
        ('PERDIDO', 'Perdido'),
    ]

    # Campos existentes que já correspondem à tela
    epi = models.ForeignKey('aluguel.EPI', on_delete=models.PROTECT, verbose_name='EPI')
    colaborador = models.ForeignKey('aluguel.Usuarios', on_delete=models.PROTECT, related_name='emprestimos_recebidos', verbose_name='Colaborador')
    data_retirada = models.DateTimeField(auto_now_add=True, verbose_name='Data do Empréstimo')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='EMPRESTADO')
    data_devolucao = models.DateTimeField(null=True, blank=True, verbose_name='Data da Devolução')
    tecnico = models.ForeignKey('aluguel.Usuarios', on_delete=models.PROTECT, related_name='emprestimos_realizados', verbose_name='Técnico')

    # --- CAMPOS MODIFICADOS E NOVOS ---

    # NOVO: Campo para a data esperada da devolução.
    data_prevista_devolucao = models.DateField(null=True, blank=True, verbose_name='Data Prevista da Devolução')

    # NOVO: Campo para descrever a condição do EPI no momento do empréstimo.
    condicoes_emprestimo = models.TextField(null=True, blank=True, verbose_name='Condições no Empréstimo')

    # RENOMEADO: O campo 'observacao' foi renomeado para ser mais específico.
    observacao_devolucao = models.TextField(null=True, blank=True, verbose_name='Observação na Devolução/Perda')

    class Meta:
        verbose_name = 'Empréstimo'
        verbose_name_plural = 'Empréstimos'

    def __str__(self):
        return f"{self.epi} para {self.colaborador} em {self.data_retirada.strftime('%d/%m/%Y')}"