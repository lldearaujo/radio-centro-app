import os
from pathlib import Path
from functools import lru_cache

from dotenv import load_dotenv
from supabase import Client, create_client

# Garantir que .env seja carregado da pasta polls_admin (onde fica o .env)
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_env_path)


@lru_cache
def get_supabase() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        raise RuntimeError(
            "SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY não configurados. "
            "Defina-os no arquivo .env ou nas variáveis de ambiente."
        )

    return create_client(url, key)

