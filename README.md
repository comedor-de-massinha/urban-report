# 🌆 UrbanReport — Plataforma de Ocorrências Urbanas

Sistema web completo para registro e acompanhamento de ocorrências urbanas, permitindo que cidadãos reportem **Animais Perdidos**, **Focos de Dengue** e **Problemas Urbanos**.

## 📋 Funcionalidades

- **Registro de Ocorrências** — formulário responsivo com geolocalização e upload de imagens
- **Mapa Interativo** — visualização geográfica com filtros e clusters (OpenStreetMap + Leaflet)
- **Dashboard Administrativo** — tabela CRUD, estatísticas e gráficos (Chart.js)
- **API REST** — FastAPI com documentação Swagger automática
- **Autenticação** — JWT com controle de acesso por perfil

## 🗂️ Estrutura do Projeto

```
├── backend/                  # FastAPI (Python)
│   ├── app/
│   │   ├── api/              # Routers / endpoints
│   │   ├── core/             # Config, segurança, dependências
│   │   ├── models/           # Modelos Pydantic
│   │   ├── schemas/          # Schemas de validação
│   │   ├── services/         # Lógica de negócio
│   │   └── main.py           # Entry point
│   ├── requirements.txt
│   └── .env.example
├── frontend/                 # React + Tailwind CSS
│   ├── src/
│   │   ├── components/       # Componentes reutilizáveis
│   │   ├── pages/            # Páginas principais
│   │   ├── services/         # Chamadas à API
│   │   ├── hooks/            # Custom hooks
│   │   └── context/          # Context API (auth)
│   ├── package.json
│   └── .env.example
├── database/
│   └── schema.sql            # Schema PostgreSQL completo
└── README.md
```

## 🚀 Setup e Execução Local

### Pré-requisitos

- Python 3.11+
- Node.js 18+
- Conta no [Supabase](https://supabase.com) (gratuita)

### 1. Configurar Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Vá em **SQL Editor** e execute o conteúdo de `database/schema.sql`
3. Copie as credenciais em **Settings → API**

### 2. Backend (FastAPI)

```bash
cd backend

# Criar ambiente virtual
python -m venv venv

# Ativar (Windows)
venv\Scripts\activate

# Ativar (Linux/Mac)
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
copy .env.example .env
# Edite o .env com suas credenciais do Supabase

# Rodar o servidor
uvicorn app.main:app --reload --port 8000
```

API disponível em: http://localhost:8000  
Swagger UI: http://localhost:8000/docs  
ReDoc: http://localhost:8000/redoc

### 3. Frontend (React)

```bash
cd frontend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
copy .env.example .env
# Edite o .env com a URL do backend

# Rodar o servidor de desenvolvimento
npm run dev
```

Frontend disponível em: http://localhost:5173

## 🗄️ Banco de Dados

Execute o arquivo `database/schema.sql` no SQL Editor do Supabase para criar todas as tabelas.

### Tabelas principais

| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários do sistema (admins e cidadãos) |
| `occurrences` | Ocorrências gerais (base) |
| `lost_animals` | Dados específicos de animais perdidos |
| `dengue_reports` | Dados específicos de focos de dengue |
| `urban_problems` | Dados específicos de problemas urbanos |
| `images` | Imagens associadas às ocorrências |

## 📡 Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/register` | Registrar usuário |
| POST | `/auth/login` | Login (retorna JWT) |
| GET | `/occurrences` | Listar todas as ocorrências |
| POST | `/occurrences/animal` | Criar ocorrência de animal perdido |
| POST | `/occurrences/dengue` | Criar ocorrência de dengue |
| POST | `/occurrences/urban` | Criar ocorrência urbana |
| GET | `/occurrences/{id}` | Buscar ocorrência por ID |
| PUT | `/occurrences/{id}` | Atualizar ocorrência |
| DELETE | `/occurrences/{id}` | Deletar ocorrência (admin) |
| GET | `/stats` | Estatísticas do dashboard |

## 🔐 Perfis de Acesso

- **Cidadão** — pode criar ocorrências e acompanhar as próprias
- **Admin** — acesso total ao dashboard, CRUD completo e alteração de status

## 🛠️ Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Backend | FastAPI 0.111, Python 3.11 |
| Frontend | React 18, Vite, Tailwind CSS 3 |
| Banco | PostgreSQL via Supabase |
| Mapa | Leaflet.js + OpenStreetMap |
| Gráficos | Chart.js |
| Auth | JWT (python-jose) |
| HTTP | Axios |

## 📄 Licença

MIT
