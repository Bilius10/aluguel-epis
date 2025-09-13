from django.urls import path
from .views import (
    MenuView,
    UsuarioCRUDView,
    get_usuario_data,
    update_usuario,
    delete_usuario,
    EPICRUDView,
    get_epi_data,
    update_epi,
    delete_epi,
    ProfileView,
    EmprestimoCRUDView,
    get_emprestimo_data,
    update_emprestimo,
    delete_emprestimo,
    ProfileView
)

urlpatterns = [
    path('usuarios/', UsuarioCRUDView.as_view(), name='usuario_crud'),
    path('usuarios/dados/<int:pk>/', get_usuario_data, name='get_usuario_data'),
    path('usuarios/update/<int:pk>/', update_usuario, name='update_usuario'),
    path('usuarios/delete/<int:pk>/', delete_usuario, name='delete_usuario'),

    path('epis/', EPICRUDView.as_view(), name='epis_crud'),
    path('epis/dados/<int:pk>/', get_epi_data, name='get_epis_data'),
    path('epis/update/<int:pk>/', update_epi, name='update_epis'),
    path('epis/delete/<int:pk>/', delete_epi, name='delete_epis'),

    path('emprestimos/', EmprestimoCRUDView.as_view(), name='emprestimo_crud'),
    path('emprestimos/dados/<int:pk>/', get_emprestimo_data, name='get_emprestimo_data'),
    path('emprestimos/update/<int:pk>/', update_emprestimo, name='update_emprestimo'),
    path('emprestimos/delete/<int:pk>/', delete_emprestimo, name='delete_emprestimo'),

    path('perfil/', ProfileView.as_view(), name='profile_page'),
]