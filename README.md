# Sistema de Gerenciamento de EPIs (SGE)

## 📖 Sobre o Projeto

[cite_start]O SGE (Sistema de Gerenciamento de EPIs) é uma aplicação web desenvolvida para automatizar e otimizar o processo de empréstimo, devolução e controle de Equipamentos de Proteção Individual (EPIs)[cite: 8, 9].

[cite_start]O principal objetivo do sistema é fornecer dados claros para a equipe de Segurança do Trabalho, garantindo que todos os colaboradores estejam devidamente equipados em suas frentes de trabalho[cite: 9]. [cite_start]A solução foi desenvolvida com Python e o framework Django, garantindo agilidade no desenvolvimento, segurança e escalabilidade[cite: 10].

**Autores:**
* [cite_start]João Vitor da Rosa de Oliveira [cite: 1]
* [cite_start]Lissandro Dauer [cite: 2]

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

2.  **Crie e ative um ambiente virtual: (Não é obrigatorio)**
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

3.  **Configure o Banco de Dados:**
    No arquivo `settings.py`, localize a seção `DATABASES` e insira as credenciais do seu banco de dados PostgreSQL.

4.  **Aplique as migrações:**
    Este comando irá criar todas as tabelas no banco de dados com base nos modelos definidos.
    ```bash
    python manage.py migrate
    ```

5.  **Inicie o servidor de desenvolvimento:**
    ```bash
    python manage.py runserver
    ```

8.  **Acesse a aplicação:**
    Abra seu navegador e acesse [http://127.0.0.1:8000/](http://127.0.0.1:8000/). Você deverá ver a página de menu inicial do projeto.
