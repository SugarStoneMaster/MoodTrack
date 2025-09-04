# app/obs/otel_init.py
import os
from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from azure.monitor.opentelemetry.exporter import AzureMonitorTraceExporter

cs = os.getenv("APPLICATIONINSIGHTS_CONNECTION_STRING")
if cs:
    resource = Resource.create({
        "service.name": "moodtrack-api",       # finisce come cloud_RoleName
        "deployment.environment": os.getenv("APP_ENV", "dev"),
    })
    provider = TracerProvider(resource=resource)
    trace.set_tracer_provider(provider)
    exporter = AzureMonitorTraceExporter.from_connection_string(cs)
    provider.add_span_processor(BatchSpanProcessor(exporter))