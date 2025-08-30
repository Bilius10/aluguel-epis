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
    """
    Registra o empréstimo de um EPI a um colaborador, realizado por um técnico.
    """
    STATUS_CHOICES = [
        ('ATIVO', 'Ativo'),
        ('DEVOLVIDO', 'Devolvido'),
        ('ATRASADO', 'Atrasado'),
    ]

    colaborador = models.ForeignKey(
        Usuarios,
        on_delete=models.PROTECT,
        related_name='emprestimos_recebidos',
        verbose_name="Colaborador"
    )
    tecnico = models.ForeignKey(
        Usuarios,
        on_delete=models.PROTECT,
        related_name='emprestimos_realizados',
        verbose_name="Técnico"
    )
    epi = models.ForeignKey(EPI, on_delete=models.PROTECT, verbose_name="EPI")
    data_retirada = models.DateTimeField(auto_now_add=True)
    data_devolucao = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ATIVO')
    observacao = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Empréstimo de {self.epi.nome_equipamento} para {self.colaborador.nome_completo}"

    class Meta:
        verbose_name = "Empréstimo"
        verbose_name_plural = "Empréstimos"