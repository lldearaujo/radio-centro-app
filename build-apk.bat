@echo off
REM Script para Build do APK - App Rádio Centro
REM Execute este arquivo clicando duas vezes ou pelo CMD

echo ========================================
echo   Build APK - App Rádio Centro
echo ========================================
echo.

REM Verificar se está logado no EAS
echo Verificando login no EAS...
npx eas-cli whoami >nul 2>&1

if errorlevel 1 (
    echo.
    echo Você não está logado no EAS!
    echo.
    echo Para fazer login, execute:
    echo   npx eas-cli login
    echo.
    echo Depois execute este script novamente.
    echo.
    pause
    echo.
    echo Fazendo login no EAS...
    npx eas-cli login
    
    if errorlevel 1 (
        echo.
        echo Erro ao fazer login. Tente novamente.
        pause
        exit /b 1
    )
    
    echo.
    echo Login realizado com sucesso!
)

echo.
echo Iniciando build do APK...
echo Isso pode levar 10-20 minutos...
echo.

REM Executar build
npx eas-cli build --platform android --profile preview

if errorlevel 1 (
    echo.
    echo Erro ao iniciar o build. Verifique as mensagens acima.
    pause
    exit /b 1
) else (
    echo.
    echo ========================================
    echo   Build iniciado com sucesso!
    echo ========================================
    echo.
    echo Acompanhe o progresso no link fornecido acima.
    echo Quando concluir, você receberá um link para baixar o APK.
    echo.
)

pause
