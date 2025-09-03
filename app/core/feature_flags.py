# app/core/feature_flags.py
import os, json, threading, time
from typing import Optional, Any
from azure.appconfiguration import AzureAppConfigurationClient

# Config di base
_APP_CONF_CS   = os.getenv("APP_CONFIG_CONNECTION_STRING")          # per ora: connection string
_APP_CONF_EP   = os.getenv("APP_CONFIG_ENDPOINT", "")                   # in futuro: endpoint + Managed Identity
_APP_CONF_LABEL= os.getenv("APP_CONFIG_LABEL", "dev")               # dev|prod
_TTL_SECONDS   = int(os.getenv("APP_CONFIG_TTL", "30"))             # cache refresh

# Client singleton
_client_lock = threading.Lock()
_client: Optional[AzureAppConfigurationClient] = None

def _get_client() -> AzureAppConfigurationClient:
    global _client
    if _client: return _client
    with _client_lock:
        if _client: return _client
        if _APP_CONF_CS:
            _client = AzureAppConfigurationClient.from_connection_string(_APP_CONF_CS)
        else:
            # Futuro: DefaultAzureCredential con endpoint
            from azure.identity import DefaultAzureCredential
            cred = DefaultAzureCredential()
            _client = AzureAppConfigurationClient(_APP_CONF_EP, cred)  # richiede APP_CONFIG_ENDPOINT
        return _client

# Cache semplice in-process
_cache = {}
_cache_expiry = 0
_cache_lock = threading.Lock()

def _refresh_cache():
    global _cache, _cache_expiry
    client = _get_client()
    new_cache = {}
    # Prendiamo solo i namespace che ci interessano
    selectors = [
        {"key_filter": "features:*", "label_filter": _APP_CONF_LABEL},
        {"key_filter": "llm:*",      "label_filter": _APP_CONF_LABEL},
        {"key_filter": "ui:*",       "label_filter": _APP_CONF_LABEL},
    ]
    for s in selectors:
        for kv in client.list_configuration_settings(key_filter=s["key_filter"], label_filter=s["label_filter"]):
            new_cache[(kv.key, kv.label)] = kv.value
    with _cache_lock:
        _cache = new_cache
        _cache_expiry = time.time() + _TTL_SECONDS

def _maybe_refresh():
    if time.time() >= _cache_expiry:
        _refresh_cache()

def get_value(key: str, default: Optional[str] = None, label: Optional[str] = None) -> Optional[str]:
    _maybe_refresh()
    lb = label or _APP_CONF_LABEL
    with _cache_lock:
        return _cache.get((key, lb), default)

def get_bool(key: str, default: bool = False, label: Optional[str] = None) -> bool:
    v = get_value(key, None, label)
    if v is None: return default
    return str(v).strip().lower() in ("1", "true", "yes", "on")

def get_json(key: str, default: Any = None, label: Optional[str] = None) -> Any:
    v = get_value(key, None, label)
    if v is None: return default
    try:
        return json.loads(v)
    except Exception:
        return default

def snapshot(label: str | None = None) -> dict:
    """Ritorna una copia della cache caricata (key->value) e TTL rimanente."""
    _maybe_refresh()
    with _cache_lock:
        ttl_remaining = max(0, int(_cache_expiry - time.time()))
        # filtra per label attiva
        lb = label or _APP_CONF_LABEL
        data = {k: v for (k, l), v in _cache.items() if l == lb}
        return {"label": lb, "ttl_remaining": ttl_remaining, "flags": data}
