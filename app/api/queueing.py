# api/queueing.py
import base64
import os
import json
from azure.storage.queue import QueueClient

QUEUE_CONN_STR = os.getenv("AZURE_STORAGE_CONNECTION_STRING")  # per dev semplice
QUEUE_NAME = os.getenv("SENTIMENT_QUEUE", "sentiment-jobs")

def enqueue_entry(entry_id: int):
    q = QueueClient.from_connection_string(QUEUE_CONN_STR, QUEUE_NAME)
    body = json.dumps({"entry_id": entry_id}).encode("utf-8")
    encoded = base64.b64encode(body).decode("ascii")
    q.send_message(encoded)