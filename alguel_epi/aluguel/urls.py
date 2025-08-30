from django.urls import path
from .views import (
    UsuarioCRUDView,
    get_usuario_data,
    update_usuario,
    delete_usuario
)

app_name = 'aluguel'

urlpatterns = [
    path('', UsuarioCRUDView.as_view(), name='usuario_crud'),
    
    path('dados/<int:pk>/', get_usuario_data, name='get_usuario_data'),
    path('atualizar/<int:pk>/', update_usuario, name='update_usuario'),
    path('deletar/<int:pk>/', delete_usuario, name='delete_usuario'),

]