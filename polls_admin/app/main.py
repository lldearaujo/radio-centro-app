import html
import json
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import List
from uuid import uuid4
from urllib import request as urlrequest
from urllib.error import URLError, HTTPError

from fastapi import Depends, FastAPI, Form, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from starlette.status import HTTP_302_FOUND

from .supabase_client import get_supabase

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Painel de Enquetes - Rádio Centro")


def _supabase_hint(err: Exception) -> str:
    msg = str(err).lower()
    if "key" in msg or "auth" in msg or "401" in msg or "403" in msg or "jwt" in msg or "invalid" in msg:
        return (
            "Use a chave Secret (sb_secret_...) ou a chave Legacy service_role (JWT). "
            "No Supabase: Settings → API → aba 'Legacy anon, service_role API keys'."
        )
    return "Verifique SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env e reinicie o servidor."


def _error_html_response(message: str, hint: str) -> HTMLResponse:
    """Resposta de erro em HTML puro (sem template) para nunca falhar."""
    return HTMLResponse(
        content=f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Erro</title></head>
<body style="font-family:sans-serif;max-width:600px;margin:2rem auto;padding:1rem;">
<h2 style="color:#c62828;">Erro ao carregar</h2>
<pre style="background:#f5f5f5;padding:1rem;overflow:auto;">{html.escape(message)}</pre>
<p style="background:#fff3e0;padding:0.75rem;color:#e65100;">{html.escape(hint)}</p>
<p><a href="/polls">Tentar novamente</a> | <a href="/login">Login</a></p>
</body></html>""",
        status_code=500,
    )


@app.exception_handler(Exception)
def global_exception_handler(request: Request, exc: Exception):
    """Captura qualquer exceção e devolve HTML simples (sem template) para nunca falhar."""
    logger.exception("Exceção não tratada: %s", exc)
    msg = html.escape(str(exc))
    hint = html.escape(_supabase_hint(exc))
    html_content = f"""
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"><title>Erro - Painel Enquetes</title></head>
    <body style="font-family:sans-serif;max-width:600px;margin:2rem auto;padding:1rem;">
      <h2 style="color:#c62828;">Erro ao carregar</h2>
      <pre style="background:#f5f5f5;padding:1rem;overflow:auto;">{msg}</pre>
      <p style="background:#fff3e0;padding:0.75rem;color:#e65100;">{hint}</p>
      <p><a href="/polls">Tentar novamente</a> | <a href="/login">Login</a></p>
    </body></html>
    """
    return HTMLResponse(content=html_content, status_code=500)


# Sessão: chave lida do .env
_secret = os.getenv("SECRET_KEY", "change-me-to-a-strong-secret")
app.add_middleware(SessionMiddleware, secret_key=_secret)

_BASE = Path(__file__).resolve().parent
templates = Jinja2Templates(directory=str(_BASE / "templates"))

app.mount("/static", StaticFiles(directory=str(_BASE / "static")), name="static")


def require_auth(request: Request):
    if not request.session.get("is_authenticated"):
        raise HTTPException(status_code=HTTP_302_FOUND, headers={"Location": "/login"})


@app.get("/login")
def login_form(request: Request):
    return templates.TemplateResponse("login.html", {"request": request, "error": None})


@app.post("/login")
def login(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
):
    # Credenciais via .env
    admin_user = os.getenv("ADMIN_USER", "admin")
    admin_pass = os.getenv("ADMIN_PASS", "admin")

    if username == admin_user and password == admin_pass:
        request.session["is_authenticated"] = True
        return RedirectResponse(url="/polls", status_code=HTTP_302_FOUND)

    return templates.TemplateResponse(
        "login.html",
        {"request": request, "error": "Usuário ou senha inválidos."},
    )


@app.get("/logout")
def logout(request: Request):
    request.session.clear()
    return RedirectResponse(url="/login", status_code=HTTP_302_FOUND)


@app.get("/")
def root():
    return RedirectResponse(url="/polls", status_code=HTTP_302_FOUND)


@app.get("/debug-polls", response_class=HTMLResponse)
def debug_polls():
    """Rota de diagnóstico: testa conexão com Supabase sem login. Remova em produção."""
    try:
        sb = get_supabase()
        res = sb.table("polls").select("id, title").limit(1).execute()
        return HTMLResponse(
            f"<html><body><h2>OK</h2><p>Conexão Supabase OK. Enquetes: {len(res.data or [])}</p></body></html>"
        )
    except Exception as e:
        logger.exception("Debug /debug-polls: %s", e)
        msg = html.escape(str(e))
        return HTMLResponse(
            f"<html><body><h2>Erro Supabase</h2><pre>{msg}</pre><p>{html.escape(_supabase_hint(e))}</p></body></html>",
            status_code=500,
        )


@app.get("/polls-test", response_class=HTMLResponse)
def polls_test():
    """Repete a lógica de /polls SEM login; mostra erro exato ou sucesso. Use para debug."""
    import traceback
    try:
        sb = get_supabase()
        res = sb.table("polls").select("*").order("created_at", desc=True).execute()
        polls = res.data or []
        votes_res = sb.table("poll_votes").select("poll_id").execute()
        votes_by_poll = {}
        for row in votes_res.data or []:
            pid = row.get("poll_id")
            if pid is not None:
                pid_str = str(pid)
                votes_by_poll[pid_str] = votes_by_poll.get(pid_str, 0) + 1
        for poll in polls:
            poll["id"] = str(poll.get("id") or "")
            poll["created_at"] = str(poll.get("created_at") or "")[:19]
            poll["total_votes"] = votes_by_poll.get(poll["id"], 0)
        return HTMLResponse(
            f"<html><body><h2>OK</h2><p>Enquetes: {len(polls)}</p><pre>{html.escape(repr(polls[:2]))}</pre></body></html>"
        )
    except Exception as e:
        tb = traceback.format_exc()
        logger.exception("Debug /polls-test: %s", e)
        return HTMLResponse(
            f"<html><body><h2>Erro em /polls-test</h2><pre>{html.escape(tb)}</pre></body></html>",
            status_code=500,
        )


@app.get("/polls")
def list_polls(request: Request):
    require_auth(request)
    try:
        supabase = get_supabase()
    except Exception as e:
        logger.exception("Erro ao obter cliente Supabase: %s", e)
        return _error_html_response(str(e), _supabase_hint(e))
    try:
        res = supabase.table("polls").select("*").order("created_at", desc=True).execute()
        polls = res.data or []

        votes_res = supabase.table("poll_votes").select("poll_id").execute()
        votes_by_poll: dict = {}
        for row in votes_res.data or []:
            pid = row.get("poll_id")
            if pid is not None:
                pid_str = str(pid)
                votes_by_poll[pid_str] = votes_by_poll.get(pid_str, 0) + 1

        # Normalizar para o template (id e created_at como string)
        for poll in polls:
            poll["id"] = str(poll.get("id") or "")
            poll["created_at"] = str(poll.get("created_at") or "")[:19]
            poll["total_votes"] = votes_by_poll.get(poll["id"], 0)

        return templates.TemplateResponse(
            "polls_list.html",
            {"request": request, "polls": polls},
        )
    except Exception as e:
        logger.exception("Erro em /polls ao consultar Supabase: %s", e)
        return _error_html_response(str(e), _supabase_hint(e))


@app.get("/polls/new")
def new_poll_form(request: Request):
    require_auth(request)
    return templates.TemplateResponse(
        "poll_form.html",
        {"request": request, "poll": None, "options": ["", ""], "error": None},
    )


@app.post("/polls/new")
def create_poll(
    request: Request,
    title: str = Form(...),
    description: str = Form(""),
    options: List[str] = Form(...),
    starts_at: str = Form(""),
    ends_at: str = Form(""),
    highlight: bool = Form(False),
):
    require_auth(request)

    clean_options = [opt.strip() for opt in options if opt.strip()]
    if not clean_options:
        return templates.TemplateResponse(
            "poll_form.html",
            {
                "request": request,
                "poll": {
                    "title": title,
                    "description": description,
                    "starts_at": starts_at,
                    "ends_at": ends_at,
                },
                "options": options,
                "error": "Informe pelo menos uma opção.",
            },
        )

    def _parse_dt(value: str) -> datetime | None:
        value = value.strip()
        if not value:
            return None
        try:
            # HTML datetime-local -> ex: 2024-01-31T14:30
            return datetime.fromisoformat(value)
        except ValueError:
            return None

    start_dt = _parse_dt(starts_at)
    end_dt = _parse_dt(ends_at)

    if end_dt and start_dt and end_dt <= start_dt:
        return templates.TemplateResponse(
            "poll_form.html",
            {
                "request": request,
                "poll": {
                    "title": title,
                    "description": description,
                    "starts_at": starts_at,
                    "ends_at": ends_at,
                },
                "options": options,
                "error": "A data de fim deve ser depois da data de início.",
            },
        )

    try:
        supabase = get_supabase()
    except Exception as e:
        logger.exception("create_poll: erro ao obter Supabase: %s", e)
        return _error_html_response(str(e), _supabase_hint(e))

    try:
        poll_payload = {
            "title": title.strip(),
            "description": description.strip() or None,
            "status": "active",
            "highlight": bool(highlight),
        }
        if start_dt:
            poll_payload["starts_at"] = start_dt.isoformat()
        if end_dt:
            poll_payload["ends_at"] = end_dt.isoformat()
        res = supabase.table("polls").insert(poll_payload).execute()
        poll = (res.data or [None])[0]
        if not poll:
            return _error_html_response("Falha ao criar enquete (resposta vazia).", _supabase_hint(Exception("")))

        options_payload = [
            {
                "id": str(uuid4()),
                "poll_id": poll["id"],
                "label": label,
                "sort_order": idx,
            }
            for idx, label in enumerate(clean_options)
        ]
        supabase.table("poll_options").insert(options_payload).execute()
        return RedirectResponse(url="/polls", status_code=HTTP_302_FOUND)
    except Exception as e:
        logger.exception("create_poll: erro ao inserir: %s", e)
        return _error_html_response(str(e), _supabase_hint(e))


@app.get("/polls/{poll_id}/results")
def poll_results(poll_id: str, request: Request, supabase=Depends(get_supabase)):
    require_auth(request)

    poll_res = supabase.table("polls").select("*").eq("id", poll_id).single().execute()
    poll = poll_res.data
    if not poll:
        raise HTTPException(status_code=404, detail="Enquete não encontrada.")

    options_res = (
        supabase.table("poll_options")
        .select("*")
        .eq("poll_id", poll_id)
        .order("sort_order", desc=False)
        .execute()
    )
    options = options_res.data or []

    votes_res = (
        supabase.table("poll_votes")
        .select("option_id")
        .eq("poll_id", poll_id)
        .execute()
    )
    counts: dict = {}
    for row in votes_res.data or []:
        oid = row.get("option_id")
        if oid:
            counts[oid] = counts.get(oid, 0) + 1
    total_votes = sum(counts.values())

    for opt in options:
        count = counts.get(opt["id"], 0)
        opt["votes"] = count
        opt["percentage"] = (count / total_votes * 100) if total_votes > 0 else 0

    return templates.TemplateResponse(
        "poll_results.html",
        {
            "request": request,
            "poll": poll,
            "options": options,
            "total_votes": total_votes,
        },
    )


@app.post("/polls/{poll_id}/delete")
def delete_poll(poll_id: str, request: Request):
    require_auth(request)
    try:
        supabase = get_supabase()
    except Exception as e:
        logger.exception("delete_poll: erro ao obter Supabase: %s", e)
        return _error_html_response(str(e), _supabase_hint(e))

    try:
        supabase.table("polls").delete().eq("id", poll_id).execute()
        return RedirectResponse(url="/polls", status_code=HTTP_302_FOUND)
    except Exception as e:
        logger.exception("delete_poll: erro ao apagar enquete: %s", e)
        return _error_html_response(str(e), _supabase_hint(e))


@app.get("/notifications")
def list_notifications(request: Request):
    require_auth(request)
    try:
        supabase = get_supabase()
    except Exception as e:
        logger.exception("list_notifications: erro ao obter Supabase: %s", e)
        return _error_html_response(str(e), _supabase_hint(e))

    try:
        res = (
            supabase.table("notifications_log")
            .select("*")
            .order("created_at", desc=True)
            .limit(50)
            .execute()
        )
        logs = res.data or []
        return templates.TemplateResponse(
            "notifications_list.html",
            {"request": request, "logs": logs},
        )
    except Exception as e:
        logger.exception("list_notifications: erro ao consultar logs: %s", e)
        return _error_html_response(str(e), _supabase_hint(e))


@app.get("/notifications/new")
def new_notification_form(request: Request):
    require_auth(request)
    return templates.TemplateResponse(
        "notifications_form.html",
        {"request": request, "error": None},
    )


@app.post("/notifications/new")
def create_notification(
    request: Request,
    title: str = Form(...),
    body: str = Form(...),
    target_url: str = Form(""),
):
    require_auth(request)

    if not title.strip() or not body.strip():
        return templates.TemplateResponse(
            "notifications_form.html",
            {
                "request": request,
                "error": "Título e mensagem são obrigatórios.",
                "title": title,
                "body": body,
                "target_url": target_url,
            },
        )

    try:
        supabase = get_supabase()
    except Exception as e:
        logger.exception("create_notification: erro ao obter Supabase: %s", e)
        return _error_html_response(str(e), _supabase_hint(e))

    # Buscar todos os tokens registrados
    try:
        tokens_res = supabase.table("push_tokens").select("expo_push_token").execute()
        rows = tokens_res.data or []
        tokens = [row.get("expo_push_token") for row in rows if row.get("expo_push_token")]
    except Exception as e:
        logger.exception("create_notification: erro ao buscar tokens: %s", e)
        return _error_html_response(str(e), _supabase_hint(e))

    if not tokens:
        return templates.TemplateResponse(
            "notifications_form.html",
            {
                "request": request,
                "error": "Nenhum dispositivo registrado para receber notificações.",
                "title": title,
                "body": body,
                "target_url": target_url,
            },
        )

    # Montar payload para Expo Push API
    data_payload = {}
    if target_url.strip():
        data_payload["target_url"] = target_url.strip()

    messages = [
        {
            "to": token,
            "sound": "default",
            "title": title.strip(),
            "body": body.strip(),
            "data": data_payload,
        }
        for token in tokens
    ]

    expo_url = "https://exp.host/--/api/v2/push/send"
    sent_ok = False
    error_text: str | None = None

    try:
        payload_bytes = json.dumps(messages).encode("utf-8")
        req = urlrequest.Request(
            expo_url,
            data=payload_bytes,
            headers={"Content-Type": "application/json"},
        )
        with urlrequest.urlopen(req, timeout=10) as resp:
            resp_body = resp.read().decode("utf-8")
            logger.info("Expo push response: %s", resp_body)
        sent_ok = True
    except (HTTPError, URLError, TimeoutError) as e:
        logger.exception("Erro ao chamar Expo Push API: %s", e)
        error_text = str(e)
    except Exception as e:
        logger.exception("Erro inesperado ao chamar Expo Push API: %s", e)
        error_text = str(e)

    # Registrar log no Supabase (independente de sucesso)
    try:
        log_payload = {
            "title": title.strip(),
            "body": body.strip(),
            "data": data_payload or None,
            "sent_ok": sent_ok,
            "error": error_text,
        }
        supabase.table("notifications_log").insert(log_payload).execute()
    except Exception as e:
        logger.exception("Erro ao registrar log de notificação: %s", e)

    if not sent_ok:
        return templates.TemplateResponse(
            "notifications_form.html",
            {
                "request": request,
                "error": "Falha ao enviar notificações. Verifique o log e tente novamente.",
                "title": title,
                "body": body,
                "target_url": target_url,
            },
        )

    return RedirectResponse(url="/notifications", status_code=HTTP_302_FOUND)


@app.get("/ads")
def list_ads(request: Request):
    require_auth(request)
    try:
        supabase = get_supabase()
    except Exception as e:
        logger.exception("list_ads: erro ao obter Supabase: %s", e)
        return _error_html_response(str(e), _supabase_hint(e))

    try:
        res = supabase.table("ads_banners").select("*").order("created_at", desc=True).execute()
        ads = res.data or []
        return templates.TemplateResponse(
            "ads_list.html",
            {"request": request, "ads": ads},
        )
    except Exception as e:
        logger.exception("list_ads: erro ao consultar banners: %s", e)
        return _error_html_response(str(e), _supabase_hint(e))


@app.get("/ads/new")
def new_ad_form(request: Request):
    require_auth(request)
    return templates.TemplateResponse(
        "ads_form.html",
        {
            "request": request,
            "error": None,
            "title": "",
            "image_url": "",
            "target_url": "",
            "position": "home_radio",
            "kind": "image",
            "html_snippet": "",
            "is_active": True,
        },
    )


@app.post("/ads/new")
def create_ad(
    request: Request,
    title: str = Form(...),
    image_url: str = Form(""),
    target_url: str = Form(""),
    position: str = Form("home_radio"),
    kind: str = Form("image"),
    html_snippet: str = Form(""),
    is_active: bool = Form(False),
):
    require_auth(request)

    error = None
    if not title.strip():
        error = "Título é obrigatório."
    elif kind == "image" and not image_url.strip():
        error = "Para tipo Imagem, a URL da imagem é obrigatória."
    elif kind == "adsense" and not html_snippet.strip():
        error = "Para tipo AdSense/HTML, cole o código do anúncio."

    if error:
        return templates.TemplateResponse(
            "ads_form.html",
            {
                "request": request,
                "error": error,
                "title": title,
                "image_url": image_url,
                "target_url": target_url,
                "position": position,
                "kind": kind,
                "html_snippet": html_snippet,
                "is_active": is_active,
            },
        )

    try:
        supabase = get_supabase()
    except Exception as e:
        logger.exception("create_ad: erro ao obter Supabase: %s", e)
        return _error_html_response(str(e), _supabase_hint(e))

    payload = {
        "title": title.strip(),
        "image_url": image_url.strip() or None,
        "target_url": target_url.strip() or None,
        "position": position.strip() or "home_radio",
        "kind": (kind or "image").strip(),
        "html_snippet": html_snippet.strip() or None,
        "is_active": bool(is_active),
    }

    try:
        if payload["is_active"]:
            # Desativa outros banners da mesma posição
            supabase.table("ads_banners").update({"is_active": False}).eq("position", payload["position"]).execute()

        supabase.table("ads_banners").insert(payload).execute()
        return RedirectResponse(url="/ads", status_code=HTTP_302_FOUND)
    except Exception as e:
        logger.exception("create_ad: erro ao criar banner: %s", e)
        return _error_html_response(str(e), _supabase_hint(e))


@app.get("/ads/{ad_id}/edit")
def edit_ad_form(ad_id: str, request: Request):
    require_auth(request)
    try:
        supabase = get_supabase()
    except Exception as e:
        logger.exception("edit_ad_form: erro ao obter Supabase: %s", e)
        return _error_html_response(str(e), _supabase_hint(e))

    try:
        res = supabase.table("ads_banners").select("*").eq("id", ad_id).single().execute()
        ad = res.data
        if not ad:
            raise HTTPException(status_code=404, detail="Banner não encontrado.")
    except Exception as e:
        logger.exception("edit_ad_form: erro ao buscar banner: %s", e)
        return _error_html_response(str(e), _supabase_hint(e))

    return templates.TemplateResponse(
        "ads_form.html",
        {
            "request": request,
            "error": None,
            "ad_id": ad_id,
            "title": ad.get("title") or "",
            "image_url": ad.get("image_url") or "",
            "target_url": ad.get("target_url") or "",
            "position": ad.get("position") or "home_radio",
            "kind": ad.get("kind") or "image",
            "html_snippet": ad.get("html_snippet") or "",
            "is_active": bool(ad.get("is_active")),
        },
    )


@app.post("/ads/{ad_id}/edit")
def update_ad(
    ad_id: str,
    request: Request,
    title: str = Form(...),
    image_url: str = Form(""),
    target_url: str = Form(""),
    position: str = Form("home_radio"),
    kind: str = Form("image"),
    html_snippet: str = Form(""),
    is_active: bool = Form(False),
):
    require_auth(request)

    error = None
    if not title.strip():
        error = "Título é obrigatório."
    elif kind == "image" and not image_url.strip():
        error = "Para tipo Imagem, a URL da imagem é obrigatória."
    elif kind == "adsense" and not html_snippet.strip():
        error = "Para tipo AdSense/HTML, cole o código do anúncio."

    if error:
        return templates.TemplateResponse(
            "ads_form.html",
            {
                "request": request,
                "error": error,
                "ad_id": ad_id,
                "title": title,
                "image_url": image_url,
                "target_url": target_url,
                "position": position,
                "kind": kind,
                "html_snippet": html_snippet,
                "is_active": is_active,
            },
        )

    try:
        supabase = get_supabase()
    except Exception as e:
        logger.exception("update_ad: erro ao obter Supabase: %s", e)
        return _error_html_response(str(e), _supabase_hint(e))

    payload = {
        "title": title.strip(),
        "image_url": image_url.strip() or None,
        "target_url": target_url.strip() or None,
        "position": position.strip() or "home_radio",
        "kind": (kind or "image").strip(),
        "html_snippet": html_snippet.strip() or None,
        "is_active": bool(is_active),
    }

    try:
        # Atualiza o banner alvo
        supabase.table("ads_banners").update(payload).eq("id", ad_id).execute()

        if payload["is_active"]:
            # Desativa outros banners da mesma posição
            supabase.table("ads_banners").update({"is_active": False}).eq(
                "position", payload["position"]
            ).neq("id", ad_id).execute()

        return RedirectResponse(url="/ads", status_code=HTTP_302_FOUND)
    except Exception as e:
        logger.exception("update_ad: erro ao atualizar banner: %s", e)
        return _error_html_response(str(e), _supabase_hint(e))


@app.post("/ads/{ad_id}/delete")
def delete_ad(ad_id: str, request: Request):
    require_auth(request)
    try:
        supabase = get_supabase()
    except Exception as e:
        logger.exception("delete_ad: erro ao obter Supabase: %s", e)
        return _error_html_response(str(e), _supabase_hint(e))

    try:
        supabase.table("ads_banners").delete().eq("id", ad_id).execute()
        return RedirectResponse(url="/ads", status_code=HTTP_302_FOUND)
    except Exception as e:
        logger.exception("delete_ad: erro ao apagar banner: %s", e)
        return _error_html_response(str(e), _supabase_hint(e))


_WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]


def _weekdays_to_label(days) -> str:
    try:
        nums = sorted(int(d) for d in (days or []))
    except Exception:
        return "-"
    labels = [_WEEKDAY_LABELS[n] for n in nums if 0 <= int(n) <= 6]
    return ", ".join(labels) if labels else "-"


@app.get("/programs")
def list_programs(request: Request):
    require_auth(request)
    try:
        supabase = get_supabase()
    except Exception as e:
        logger.exception("list_programs: erro ao obter Supabase: %s", e)
        return _error_html_response(str(e), _supabase_hint(e))

    try:
        res = (
            supabase.table("programs")
            .select("*")
            .order("start_time", desc=False)
            .execute()
        )
        programs = res.data or []
        for prog in programs:
            prog["weekdays_label"] = _weekdays_to_label(prog.get("weekdays"))
        return templates.TemplateResponse(
            "programs_list.html",
            {"request": request, "programs": programs},
        )
    except Exception as e:
        logger.exception("list_programs: erro ao consultar programas: %s", e)
        return _error_html_response(str(e), _supabase_hint(e))


@app.get("/programs/new")
def new_program_form(request: Request):
    require_auth(request)
    return templates.TemplateResponse(
        "programs_form.html",
        {
            "request": request,
            "error": None,
            "name": "",
            "host": "",
            "description": "",
            "weekdays": [],
            "start_time": "",
            "end_time": "",
            "notify_on_start": False,
            "is_active": True,
        },
    )


@app.post("/programs/new")
def create_program(
    request: Request,
    name: str = Form(...),
    host: str = Form(""),
    description: str = Form(""),
    weekdays: List[str] = Form(...),
    start_time: str = Form(...),
    end_time: str = Form(...),
    notify_on_start: bool = Form(False),
    is_active: bool = Form(True),
):
    require_auth(request)

    try:
        weekdays_int = sorted({int(d) for d in weekdays})
    except Exception:
        weekdays_int = []

    error = None
    if not name.strip():
        error = "Nome do programa é obrigatório."
    elif not weekdays_int:
        error = "Selecione pelo menos um dia da semana."
    elif not start_time or not end_time or end_time <= start_time:
        error = "Horário de fim deve ser depois do horário de início."

    if error:
        return templates.TemplateResponse(
            "programs_form.html",
            {
                "request": request,
                "error": error,
                "name": name,
                "host": host,
                "description": description,
                "weekdays": weekdays_int,
                "start_time": start_time,
                "end_time": end_time,
                "notify_on_start": notify_on_start,
                "is_active": is_active,
            },
        )

    try:
        supabase = get_supabase()
    except Exception as e:
        logger.exception("create_program: erro ao obter Supabase: %s", e)
        return _error_html_response(str(e), _supabase_hint(e))

    payload = {
        "name": name.strip(),
        "host": host.strip() or None,
        "description": description.strip() or None,
        "weekdays": weekdays_int,
        "start_time": start_time,
        "end_time": end_time,
        "notify_on_start": bool(notify_on_start),
        "is_active": bool(is_active),
    }

    try:
        supabase.table("programs").insert(payload).execute()
        return RedirectResponse(url="/programs", status_code=HTTP_302_FOUND)
    except Exception as e:
        logger.exception("create_program: erro ao criar programa: %s", e)
        return _error_html_response(str(e), _supabase_hint(e))


@app.post("/programs/{program_id}/delete")
def delete_program(program_id: str, request: Request):
    require_auth(request)
    try:
        supabase = get_supabase()
    except Exception as e:
        logger.exception("delete_program: erro ao obter Supabase: %s", e)
        return _error_html_response(str(e), _supabase_hint(e))

    try:
        supabase.table("programs").delete().eq("id", program_id).execute()
        return RedirectResponse(url="/programs", status_code=HTTP_302_FOUND)
    except Exception as e:
        logger.exception("delete_program: erro ao apagar programa: %s", e)
        return _error_html_response(str(e), _supabase_hint(e))


@app.post("/programs/{program_id}/notify")
def notify_program(program_id: str, request: Request):
    require_auth(request)
    try:
        supabase = get_supabase()
    except Exception as e:
        logger.exception("notify_program: erro ao obter Supabase: %s", e)
        return _error_html_response(str(e), _supabase_hint(e))

    try:
        prog_res = (
            supabase.table("programs")
            .select("*")
            .eq("id", program_id)
            .single()
            .execute()
        )
        program = prog_res.data
        if not program:
            raise HTTPException(status_code=404, detail="Programa não encontrado.")
    except Exception as e:
        logger.exception("notify_program: erro ao buscar programa: %s", e)
        return _error_html_response(str(e), _supabase_hint(e))

    title = f"Agora na Rádio Centro: {program.get('name', '').strip()}"
    body = program.get("description") or "Começou um novo programa. Abra o app e ouça ao vivo."

    # Buscar tokens
    try:
        tokens_res = supabase.table("push_tokens").select("expo_push_token").execute()
        rows = tokens_res.data or []
        tokens = [row.get("expo_push_token") for row in rows if row.get("expo_push_token")]
    except Exception as e:
        logger.exception("notify_program: erro ao buscar tokens: %s", e)
        return _error_html_response(str(e), _supabase_hint(e))

    if not tokens:
        return _error_html_response(
            "Nenhum dispositivo registrado para receber notificações.",
            "Abra o app em um dispositivo físico e conceda permissão de notificações.",
        )

    data_payload = {"program_id": program_id}

    messages = [
        {
            "to": token,
            "sound": "default",
            "title": title,
            "body": body,
            "data": data_payload,
        }
        for token in tokens
    ]

    expo_url = "https://exp.host/--/api/v2/push/send"
    sent_ok = False
    error_text: str | None = None

    try:
        payload_bytes = json.dumps(messages).encode("utf-8")
        req = urlrequest.Request(
            expo_url,
            data=payload_bytes,
            headers={"Content-Type": "application/json"},
        )
        with urlrequest.urlopen(req, timeout=10) as resp:
            resp_body = resp.read().decode("utf-8")
            logger.info("Expo push response (program): %s", resp_body)
        sent_ok = True
    except (HTTPError, URLError, TimeoutError) as e:
        logger.exception("notify_program: erro ao chamar Expo Push API: %s", e)
        error_text = str(e)
    except Exception as e:
        logger.exception("notify_program: erro inesperado ao chamar Expo Push API: %s", e)
        error_text = str(e)

    # Registrar no log geral de notificações
    try:
        log_payload = {
            "title": title,
            "body": body,
            "data": data_payload,
            "sent_ok": sent_ok,
            "error": error_text,
        }
        supabase.table("notifications_log").insert(log_payload).execute()
    except Exception as e:
        logger.exception("notify_program: erro ao registrar log de notificação: %s", e)

    if not sent_ok:
        return _error_html_response(
            "Falha ao enviar notificações deste programa.",
            "Verifique o log de notificações e tente novamente.",
        )

    return RedirectResponse(url="/programs", status_code=HTTP_302_FOUND)

