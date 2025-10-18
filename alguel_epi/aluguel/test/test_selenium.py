import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

@pytest.fixture
def browser():
    driver = webdriver.Chrome() 
    
    yield driver

    driver.quit() 

@pytest.mark.django_db
def test_site_abre(browser):
    
    browser.get('http://127.0.0.1:8000/')
    
    assert 'Meu Sistema' in browser.title
    
@pytest.mark.django_db
def test_clica_menu_perfil_usuario(browser):
    
    browser.get('http://127.0.0.1:8000/')

    profile_link = browser.find_element(By.ID, "user-info-header")
    profile_link.click() 

    save_button = browser.find_element(By.ID, "save-profile-btn")

    assert save_button.text == "Salvar Alterações"

@pytest.mark.django_db
def test_cadastrar_colaborador(browser):
    
    browser.get('http://127.0.0.1:8000/')

    colaborador_link = browser.find_element(By.LINK_TEXT, "Colaborador")
    colaborador_link.click() 

    adicionar_usuario = browser.find_element(By.ID, "add-user-btn")
    adicionar_usuario.click() 

    nome = browser.find_element(By.ID, "id_nome_completo")
    matricula = browser.find_element(By.ID, "id_matricula")
    cpf = browser.find_element(By.ID, "id_cpf")
    cargo = browser.find_element(By.ID, "id_cargo")
    tipo = browser.find_element(By.ID, "id_tipo_usuario")
    login = browser.find_element(By.ID, "id_login")

    nome.send_keys("teste2")
    matricula.send_keys("124")
    cpf.send_keys("11122233344")
    cargo.send_keys("teste")
    tipo.send_keys("Colaborador")
    login.send_keys("teste2@teste2.com")

    salvar = browser.find_element(By.XPATH, "//*[@id='user-form']/footer/button[2]")
    salvar.click() 

    WebDriverWait(browser, 10).until(
        EC.text_to_be_present_in_element(
            (By.ID, "user-table-body"), "teste2"
        )
    )

    linhas_usuarios = browser.find_elements(By.CSS_SELECTOR, "#user-table-body tr")

    ultimo_usuario_tr = linhas_usuarios[-1]

    nome_td = ultimo_usuario_tr.find_element(By.TAG_NAME, "td")

    assert nome_td.text == "teste2"

@pytest.mark.django_db
def test_cadastrar_epi(browser):
    
    browser.get('http://127.0.0.1:8000/')

    epi_link = browser.find_element(By.LINK_TEXT, "Equipamentos")
    epi_link.click() 

    adicionar_epi = browser.find_element(By.ID, "add-epi-btn")
    adicionar_epi.click() 

    nome = browser.find_element(By.ID, "id_nome_equipamento")
    ca = browser.find_element(By.ID, "id_ca_numero")
    data = browser.find_element(By.ID, "id_data_validade_ca")
    qt = browser.find_element(By.ID, "id_quantidade_total")
    qd = browser.find_element(By.ID, "id_quantidade_disponivel")

    nome.send_keys("teste2")
    ca.send_keys("1245")
    data.send_keys("20/02/2025")
    qt.send_keys("21")
    qd.send_keys("21")

    salvar = browser.find_element(By.XPATH, "//*[@id='epi-form']/footer/button[2]")
    salvar.click() 

    WebDriverWait(browser, 10).until(
        EC.text_to_be_present_in_element(
            (By.ID, "epi-table-body"), "teste2"
        )
    )

    linhas_epi = browser.find_elements(By.CSS_SELECTOR, "#epi-table-body tr")

    ultimo_epi_tr = linhas_epi[-1]

    nome_td = ultimo_epi_tr.find_element(By.TAG_NAME, "td")

    assert nome_td.text == "teste2"    




