# Painel de Enquetes - Rádio Centro

Sistema web para criar e gerenciar enquetes (Supabase + FastAPI).

## Configuração

1. **Edite o arquivo `.env`** na pasta `polls_admin` e preencha:
   - `SUPABASE_SERVICE_ROLE_KEY` — em Supabase: **Settings → API → service_role** (nunca use no app mobile)
   - Opcional: `ADMIN_USER` e `ADMIN_PASS` para login (padrão: admin / admin)

2. O `SUPABASE_URL` já está preenchido com o seu projeto.

## Como iniciar

No PowerShell, na pasta do projeto:

```powershell
cd "C:\Users\Leonardo Lins\Desktop\app radio centro\polls_admin"
.\.venv\Scripts\Activate.ps1
py -m uvicorn app.main:app --reload --port 8000
```

Depois abra no navegador: **http://localhost:8000**

- Login: usuário e senha definidos no `.env` (padrão: admin / admin)
- Em **Enquetes** você lista, cria e vê resultados.
