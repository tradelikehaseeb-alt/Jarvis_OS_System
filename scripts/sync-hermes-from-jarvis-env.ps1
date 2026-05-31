# Sync Jarvis OS root .env LLM keys into Hermes agent config (~/.hermes).
# Run from repo root: .\scripts\sync-hermes-from-jarvis-env.ps1

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$jarvisEnv = Join-Path $repoRoot ".env"
$hermesHome = Join-Path $env:USERPROFILE ".hermes"
$hermesEnv = Join-Path $hermesHome ".env"
$hermesConfig = Join-Path $hermesHome "config.yaml"

if (-not (Test-Path $jarvisEnv)) {
    Write-Error "Missing $jarvisEnv - copy .env.example and set API keys first."
}

New-Item -ItemType Directory -Force -Path $hermesHome | Out-Null

$keys = @(
    "GROQ_API_KEY",
    "OPENAI_API_KEY",
    "OPENROUTER_API_KEY",
    "GEMINI_API_KEY",
    "GOOGLE_API_KEY",
    "DEEPSEEK_API_KEY",
    "ANTHROPIC_API_KEY",
    "SERPER_API_KEY"
)

$jarvisLines = Get-Content $jarvisEnv -Encoding UTF8
$existing = @{}
if (Test-Path $hermesEnv) {
    foreach ($line in Get-Content $hermesEnv -Encoding UTF8) {
        if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
            $existing[$Matches[1]] = $Matches[2]
        }
    }
}

$out = @("# Synced from Jarvis OS .env ($repoRoot)") + @()
foreach ($key in $keys) {
    $value = $null
    foreach ($line in $jarvisLines) {
        if ($line -match "^\s*$key=(.*)$") {
            $value = $Matches[1].Trim()
            break
        }
    }
    if ([string]::IsNullOrWhiteSpace($value) -and $existing.ContainsKey($key)) {
        $value = $existing[$key]
    }
    if (-not [string]::IsNullOrWhiteSpace($value)) {
        $out += "$key=$value"
    }
}

Set-Content -Path $hermesEnv -Value $out -Encoding UTF8
Write-Host "Updated $hermesEnv"

$groqModel = "llama-3.3-70b-versatile"
foreach ($line in $jarvisLines) {
    if ($line -match '^\s*GROQ_MODEL=(.*)$') {
        $groqModel = $Matches[1].Trim()
        break
    }
}

$configYaml = @"
# Hermes agent - Groq via OpenAI-compatible API (synced for Jarvis OS)
_config_version: 25
model:
  default: $groqModel
  provider: custom
  base_url: https://api.groq.com/openai/v1
  key_env: GROQ_API_KEY
"@

Set-Content -Path $hermesConfig -Value $configYaml.TrimEnd() -Encoding UTF8
Write-Host "Updated $hermesConfig"
Write-Host ""
Write-Host ('Test: cd "' + (Join-Path $repoRoot 'hermes-agent') + '"; py -3.11 run_agent.py --query hello')
