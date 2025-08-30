# Sistema de Gerenciamento de EPIs (SGE)

## 📖 Sobre o Projeto

[cite_start]O SGE (Sistema de Gerenciamento de EPIs) é uma aplicação web desenvolvida para automatizar e otimizar o processo de empréstimo, devolução e controle de Equipamentos de Proteção Individual (EPIs)[cite: 8, 9].

[cite_start]O principal objetivo do sistema é fornecer dados claros para a equipe de Segurança do Trabalho, garantindo que todos os colaboradores estejam devidamente equipados em suas frentes de trabalho[cite: 9]. [cite_start]A solução foi desenvolvida com Python e o framework Django, garantindo agilidade no desenvolvimento, segurança e escalabilidade[cite: 10].

**Autores:**
* [cite_start]João Vitor da Rosa de Oliveira [cite: 1]
* [cite_start]Lissandro Dauer [cite: 2]

## ✨ Funcionalidades Principais

O sistema conta com os seguintes módulos:

* [cite_start]**RF01 - Gerenciamento de Pessoas:** Permite o cadastro centralizado de administradores, técnicos e colaboradores, diferenciando seus papéis e permissões no sistema[cite: 15, 16].
* [cite_start]**RF02 - Cadastro de EPIs:** Permite o cadastro completo dos equipamentos, incluindo nome, número do Certificado de Aprovação (CA), data de validade e quantidade em estoque[cite: 17].
* [cite_start]**RF03 - Registro de Empréstimo:** Um técnico pode registrar a retirada de EPIs para um colaborador, com o sistema abatendo a quantidade do estoque automaticamente[cite: 18].
* [cite_start]**RF04 - Registro de Devolução:** Permite registrar a devolução de um EPI, atualizando o status do empréstimo e retornando o item ao estoque[cite: 19].
* [cite_start]**RF05 - Geração de Relatórios:** O sistema é capaz de gerar relatórios essenciais, como EPIs pendentes, histórico por colaborador e inventário de estoque[cite: 20].

## 🛠️ Tecnologias Utilizadas

* [cite_start]**Backend:** Python 3.12+ [cite: 10]
* [cite_start]**Framework:** Django 5.1+ [cite: 10]
* **Banco de Dados:** PostgreSQL
* **Frontend:** HTML, CSS, JavaScript (com Bootstrap 5)

## 🗄️ Modelo do Banco de Dados

A estrutura do banco de dados foi modelada para suportar as funcionalidades principais do sistema, consistindo em três entidades principais: `Usuarios`, `EPI` e `Emprestimos`.

![Diagrama do Banco de Dados](image_62a18c.png)

## 🚀 Como Executar o Projeto

Siga os passos abaixo para configurar e executar o ambiente de desenvolvimento localmente.

### **Pré-requisitos**

* [Python 3.12+](https://www.python.org/downloads/)
* [Git](https://git-scm.com/downloads/)
* Um gerenciador de pacotes Python (pip), que já vem com o Python.

### **Passo a Passo**

1.  **Clone o repositório:**
    ```bash
    git clone <URL_DO_SEU_REPOSITORIO>
    cd nome-da-pasta-do-projeto
    ```

2.  **Crie e ative um ambiente virtual:**
    * No Windows:
        ```bash
        python -m venv venv
        .\venv\Scripts\activate
        ```
    * No macOS/Linux:
        ```bash
        python3 -m venv venv
        source venv/bin/activate
        ```

3.  **Instale as dependências:**
    Crie um arquivo `requirements.txt` com as dependências do projeto. Ele deve conter no mínimo:
    ```
    Django>=5.0
    psycopg[binary]
    ```
    Em seguida, instale-as com o comando:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure o Banco de Dados:**
    No arquivo `settings.py`, localize a seção `DATABASES` e insira as credenciais do seu banco de dados PostgreSQL.

5.  **Aplique as migrações:**
    Este comando irá criar todas as tabelas no banco de dados com base nos modelos definidos.
    ```bash
    python manage.py migrate
    ```

6.  **Crie um superusuário:**
    Você precisará de um usuário administrador para acessar o painel de admin do Django.
    ```bash
    python manage.py createsuperuser
    ```
    Siga as instruções para criar seu login e senha.

7.  **Inicie o servidor de desenvolvimento:**
    ```bash
    python manage.py runserver
    ```

8.  **Acesse a aplicação:**
    Abra seu navegador e acesse [http://127.0.0.1:8000/](http://127.0.0.1:8000/). Você deverá ver a página de menu inicial do projeto.
