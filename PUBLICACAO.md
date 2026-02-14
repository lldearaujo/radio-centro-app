# 📱 Guia de Build e Publicação - App Rádio Centro

Este guia explica como fazer o build e publicar o aplicativo nas lojas (Google Play Store e Apple App Store).

## 🚀 Pré-requisitos

### 1. Conta Expo
- Crie uma conta em: https://expo.dev/signup
- Faça login no EAS CLI:
```bash
npx eas-cli login
```

### 2. Google Play Console (para Android)
- Crie uma conta em: https://play.google.com/console
- Custo: $25 (taxa única de registro)
- Necessário para publicar na Google Play Store

### 3. Apple Developer (para iOS - opcional)
- Custo: $99/ano
- Necessário apenas se quiser publicar no App Store

## 📦 Build do Aplicativo

### Opção 1: Build APK (Para Testes)

APK é um arquivo que pode ser instalado diretamente no dispositivo Android sem passar pela loja.

```bash
# Build APK para testes
npx eas-cli build --platform android --profile preview
```

**Resultado:** Você receberá um link para download do APK que pode instalar diretamente no dispositivo.

### Opção 2: Build AAB (Para Google Play Store)

AAB (Android App Bundle) é o formato necessário para publicar na Google Play Store.

```bash
# Build AAB para produção
npx eas-cli build --platform android --profile production
```

**Resultado:** Você receberá um arquivo AAB pronto para upload na Google Play Console.

### Opção 3: Build iOS (Para App Store)

```bash
# Build iOS para produção
npx eas-cli build --platform ios --profile production
```

**Nota:** Requer conta Apple Developer ($99/ano).

## 🏪 Publicação na Google Play Store

### Passo 1: Criar App na Google Play Console

1. Acesse: https://play.google.com/console
2. Clique em "Criar app"
3. Preencha:
   - **Nome do app:** Rádio Centro
   - **Idioma padrão:** Português (Brasil)
   - **Tipo de app:** App
   - **Gratuito ou pago:** Gratuito
4. Aceite os termos e clique em "Criar app"

### Passo 2: Configurar Detalhes do App

1. **Conteúdo do app:**
   - Descrição curta (80 caracteres)
   - Descrição completa
   - Screenshots (mínimo 2, recomendado 4-8)
   - Ícone (512x512px)
   - Imagem de destaque (1024x500px)

2. **Classificação de conteúdo:**
   - Preencha o questionário sobre conteúdo

3. **Preços e distribuição:**
   - Selecione países onde o app estará disponível
   - Defina como gratuito

### Passo 3: Upload do AAB

1. No menu lateral, vá em **"Produção"** > **"Criar nova versão"**
2. Faça upload do arquivo AAB gerado pelo EAS Build
3. Adicione notas de versão
4. Clique em **"Revisar versão"**

### Passo 4: Revisar e Publicar

1. Revise todas as informações
2. Clique em **"Iniciar lançamento para produção"**
3. O app passará por revisão (pode levar algumas horas a alguns dias)

### Publicação Automática (Opcional)

Você pode automatizar a publicação usando o EAS Submit:

```bash
# Após o build, publicar automaticamente
npx eas-cli submit --platform android
```

**Nota:** Requer configuração das credenciais da Google Play Console no EAS.

## 🍎 Publicação na Apple App Store (Opcional)

### Passo 1: Criar App no App Store Connect

1. Acesse: https://appstoreconnect.apple.com
2. Vá em **"Meus Apps"** > **"+"** > **"Novo App"**
3. Preencha:
   - Plataforma: iOS
   - Nome: Rádio Centro
   - Idioma principal: Português (Brasil)
   - Bundle ID: com.radiocentro.app
   - SKU: radio-centro-app

### Passo 2: Configurar Informações

1. **Informações do App:**
   - Descrição
   - Palavras-chave
   - Categoria
   - Screenshots (vários tamanhos)
   - Ícone (1024x1024px)

2. **Preços e disponibilidade:**
   - Defina como gratuito

### Passo 3: Upload via EAS Submit

```bash
# Build e submit para App Store
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios
```

## 🔄 Atualizações Futuras

Para atualizar o app após publicação:

1. **Atualize a versão no `app.json`:**
```json
{
  "expo": {
    "version": "1.0.1"  // Incremente a versão
  }
}
```

2. **Faça um novo build:**
```bash
npx eas-cli build --platform android --profile production
```

3. **Faça upload na loja** (ou use `eas submit`)

## 📋 Checklist Antes de Publicar

### Android (Google Play)
- [ ] Ícone do app (512x512px)
- [ ] Screenshots (mínimo 2)
- [ ] Descrição do app
- [ ] Política de privacidade (URL)
- [ ] Classificação de conteúdo preenchida
- [ ] AAB gerado e testado
- [ ] Versão atualizada no app.json

### iOS (App Store)
- [ ] Ícone do app (1024x1024px)
- [ ] Screenshots para diferentes tamanhos de tela
- [ ] Descrição do app
- [ ] Política de privacidade
- [ ] Build iOS gerado e testado
- [ ] Versão atualizada no app.json

## 🛠️ Comandos Úteis

```bash
# Ver builds em andamento
npx eas-cli build:list

# Ver detalhes de um build específico
npx eas-cli build:view [BUILD_ID]

# Baixar build localmente
npx eas-cli build:download [BUILD_ID]

# Ver status do submit
npx eas-cli submit:list
```

## 📝 Notas Importantes

1. **Primeira publicação:** Pode levar alguns dias para ser aprovada
2. **Atualizações:** Geralmente são aprovadas mais rapidamente
3. **Testes internos:** Use o perfil "preview" para testar antes de publicar
4. **Versões:** Sempre incremente a versão antes de um novo build
5. **Política de privacidade:** É obrigatória para apps que coletam dados

## 🆘 Suporte

- Documentação EAS: https://docs.expo.dev/build/introduction/
- Documentação Google Play: https://support.google.com/googleplay/android-developer
- Documentação App Store: https://developer.apple.com/app-store/

---

**Boa sorte com a publicação! 🚀**
