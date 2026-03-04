# 🐛 Debug - App Não Abre

## Possíveis Causas

1. **react-native-onesignal** - Módulo nativo que causa crash em builds de release quando não configurado corretamente (CAUSA PRINCIPAL RESOLVIDA)
2. **New Architecture habilitada** - Pode causar problemas de compatibilidade
3. **Erro no AudioContext** - Falha ao inicializar o modo de áudio
4. **Dependências nativas não compiladas** - Algum módulo nativo pode estar faltando

## O que foi feito

1. ✅ **Removido react-native-onesignal** - Estava causando crash no Android após instalação
2. ✅ Adicionado tratamento de erros no `initNotifications`
3. ✅ Adicionado tratamento de erros no `AudioContext`

## Como obter logs de erro

### Opção 1: Logcat (Android)
```bash
# Conecte o dispositivo via USB e execute:
adb logcat | grep -i "react\|expo\|error"
```

### Opção 2: Android Studio
1. Abra o Android Studio
2. Conecte o dispositivo
3. Vá em View > Tool Windows > Logcat
4. Filtre por "ReactNativeJS" ou "Expo"

### Opção 3: Verificar logs do build
Acesse o link do build no EAS para ver se há erros durante a compilação.

## Próximos passos

1. **Fazer novo build** com as correções
2. **Verificar logs** do dispositivo quando tentar abrir
3. **Testar versão simplificada** se necessário

## Build de teste simplificado

Se o problema persistir, podemos criar uma versão simplificada do app sem:
- AudioContext (temporariamente)
- Notificações (já está desabilitado)
- MiniPlayer (temporariamente)

Isso ajudará a identificar qual componente está causando o problema.
