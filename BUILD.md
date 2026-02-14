# 🚀 Guia Rápido de Build e Publicação

## 📦 Opções de Build

### 1. **APK para Testes** (Instalação direta)
```bash
npx eas-cli build --platform android --profile preview
```
- Gera um APK que pode ser instalado diretamente no celular
- Útil para testar antes de publicar
- Não precisa de conta na loja

### 2. **AAB para Google Play Store** (Publicação oficial)
```bash
npx eas-cli build --platform android --profile production
```
- Gera um AAB (Android App Bundle) para publicar na loja
- Formato obrigatório para Google Play Store
- Requer conta no Google Play Console ($25 taxa única)

### 3. **iOS para App Store** (Opcional)
```bash
npx eas-cli build --platform ios --profile production
```
- Requer conta Apple Developer ($99/ano)

## 🏪 Processo de Publicação

### Google Play Store

1. **Criar conta:** https://play.google.com/console ($25 taxa única)
2. **Criar app** na console
3. **Preencher informações:**
   - Nome, descrição, screenshots
   - Ícone (512x512px)
   - Política de privacidade (URL)
4. **Upload do AAB** gerado pelo EAS
5. **Revisar e publicar**

### Publicação Automática (Opcional)
```bash
npx eas-cli submit --platform android
```
Automatiza o upload para a loja (requer configuração de credenciais).

## ⚙️ Antes de Fazer Build

1. **Verificar versão** no `app.json` (já está 1.0.0 ✓)
2. **Verificar ícones** (já configurados ✓)
3. **Testar o app** no Expo Go primeiro
4. **Preparar screenshots** para a loja

## 📝 Checklist de Publicação

- [ ] App testado e funcionando
- [ ] Versão atualizada no app.json
- [ ] Screenshots preparados (mínimo 2)
- [ ] Descrição do app escrita
- [ ] Política de privacidade (se necessário)
- [ ] Build AAB gerado
- [ ] Conta Google Play Console criada
- [ ] App publicado na loja

---

**Pronto para começar?** Vamos fazer o build agora?
