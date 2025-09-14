{{- define "moodtrack-api.name" -}}
{{- .Chart.Name | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "moodtrack-api.fullname" -}}
{{- if .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- include "moodtrack-api.name" . -}}
{{- end -}}
{{- end -}}

{{- define "moodtrack-api.labels" -}}
app.kubernetes.io/name: {{ include "moodtrack-api.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: Helm
{{- end -}}
