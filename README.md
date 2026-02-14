# 📻 App Rádio Centro Cajazeiras

Aplicativo mobile desenvolvido com React Native e Expo para a Rádio Centro Cajazeiras, oferecendo transmissão de áudio e vídeo ao vivo, além de notícias atualizadas.

## 🚀 Funcionalidades

- **🎵 Transmissão de Áudio Ao Vivo**: Reprodução de stream de rádio com controles de play/pause
- **📺 Transmissão de Vídeo/TV Ao Vivo**: Player de vídeo HLS para TV Centro
- **📰 Feed de Notícias**: Integração com RSS feed para exibir notícias atualizadas
- **🎛️ Mini Player**: Player flutuante que permite controlar o áudio de qualquer tela
- **💬 Integração WhatsApp**: Botão para contato direto via WhatsApp
- **🌙 Reprodução em Background**: Áudio continua tocando mesmo com o app em segundo plano

## 🛠️ Tecnologias

- **React Native** 0.81.5
- **Expo SDK** ~54.0.33
- **Expo Router** 6.0.23 (navegação baseada em arquivos)
- **TypeScript** 5.9.2
- **Expo AV** 16.0.8 (áudio/vídeo)
- **React Native WebView** 13.15.0
- **Fast XML Parser** 5.3.5 (RSS)

## 📋 Pré-requisitos

- Node.js >= 20.19.4 (recomendado)
- npm ou yarn
- Expo CLI (instalado globalmente ou via npx)
- Expo Go app no dispositivo móvel (para testes)

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/radio-centro-app.git
cd radio-centro-app
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm start
```

## 📱 Como Testar

### Opção 1: Expo Go (Recomendado)
1. Instale o [Expo Go](https://expo.dev/client) no seu dispositivo
2. Escaneie o QR Code exibido no terminal
3. O app será carregado automaticamente

### Opção 2: Emulador/Simulador
- **Android**: Pressione `a` no terminal do Expo
- **iOS**: Pressione `i` no terminal (requer Mac)
- **Web**: Pressione `w` no terminal

### Opção 3: Build de Desenvolvimento
Para testar recursos nativos (notificações, background audio):
```bash
npm run android  # ou npm run ios
```

## 📂 Estrutura do Projeto

```
app/
├── _layout.tsx          # Layout raiz com AudioProvider
└── (tabs)/
    ├── _layout.tsx      # Layout de tabs
    ├── index.tsx        # Tela principal (Rádio)
    ├── news.tsx         # Tela de notícias
    └── video.tsx        # Tela de vídeo/TV

src/
├── components/
│   ├── MiniPlayer.tsx   # Player flutuante
│   └── NewsCard.tsx     # Card de notícia
├── context/
│   └── AudioContext.tsx # Context para gerenciar áudio
├── constants/
│   ├── config.ts        # URLs e configurações
│   └── theme.ts         # Cores, espaçamentos, fontes
└── services/
    ├── rss.ts           # Serviço de RSS
    └── notifications.ts # OneSignal (configurado)
```

## ⚙️ Configuração

As URLs de stream e configurações podem ser alteradas em `src/constants/config.ts`:

```typescript
export const Config = {
    urls: {
        audioStream: '...',
        videoStreamHls: '...',
        newsFeed: '...',
    },
    social: {
        whatsapp: '...',
    },
};
```

## 🏗️ Build para Produção

### Android
```bash
eas build --platform android --profile production
```

### iOS
```bash
eas build --platform ios --profile production
```

## 📝 Scripts Disponíveis

- `npm start` - Inicia o servidor de desenvolvimento
- `npm run android` - Inicia no emulador Android
- `npm run ios` - Inicia no simulador iOS
- `npm run web` - Inicia na web

## 🔐 Permissões

O app requer as seguintes permissões:
- **Internet**: Para streaming de áudio/vídeo e RSS
- **Audio Background**: Para reprodução em segundo plano
- **Notifications**: Para notificações push (OneSignal)

## 📄 Licença

Este projeto é privado e propriedade da Rádio Centro Cajazeiras.

## 👥 Desenvolvimento

Desenvolvido com ❤️ para a Rádio Centro Cajazeiras.

---

**Versão**: 1.0.0  
**Última atualização**: 2024
