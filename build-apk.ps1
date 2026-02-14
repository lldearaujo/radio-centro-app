# Script para Build do APK - App Rádio Centro
# Execute este script no PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Build APK - App Rádio Centro" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está logado no EAS
Write-Host "Verificando login no EAS..." -ForegroundColor Yellow
$whoami = npx eas-cli whoami 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Você não está logado no EAS!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Para fazer login, execute:" -ForegroundColor Yellow
    Write-Host "  npx eas-cli login" -ForegroundColor White
    Write-Host ""
    Write-Host "Depois execute este script novamente." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Pressione qualquer tecla para fazer login agora..." -ForegroundColor Cyan
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
    Write-Host ""
    Write-Host "Fazendo login no EAS..." -ForegroundColor Yellow
    npx eas-cli login
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "Erro ao fazer login. Tente novamente." -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "Login realizado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "Você está logado como: $whoami" -ForegroundColor Green
}

Write-Host ""
Write-Host "Iniciando build do APK..." -ForegroundColor Yellow
Write-Host "Isso pode levar 10-20 minutos..." -ForegroundColor Yellow
Write-Host ""

# Executar build
npx eas-cli build --platform android --profile preview

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Build iniciado com sucesso!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Acompanhe o progresso no link fornecido acima." -ForegroundColor Cyan
    Write-Host "Quando concluir, você receberá um link para baixar o APK." -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Erro ao iniciar o build. Verifique as mensagens acima." -ForegroundColor Red
    exit 1
}
