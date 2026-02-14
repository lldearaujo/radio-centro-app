# 🔐 Como Fazer Login no EAS

## Opção 1: Login via Terminal (Recomendado)

### No PowerShell ou CMD:

1. Abra o terminal na pasta do projeto:
   ```
   cd "C:\Users\Leonardo Lins\Desktop\app radio centro"
   ```

2. Execute o comando de login:
   ```bash
   npx eas-cli login
   ```

3. Você será solicitado a:
   - **Email ou username**: Digite seu email ou nome de usuário do Expo
   - **Password**: Digite sua senha

4. Se não tiver conta, você pode criar em: https://expo.dev/signup

### Exemplo de saída:
```
? Log in to EAS with email or username: seu-email@exemplo.com
? Password: ********
✔ Logged in as lldearaujo
```

## Opção 2: Login via Script Automatizado

Execute um dos scripts criados:

### Windows (PowerShell):
```powershell
.\build-apk.ps1
```

### Windows (CMD/Batch):
```cmd
build-apk.bat
```

O script verificará se você está logado e, se não estiver, pedirá para fazer login.

## Opção 3: Login via Token (Avançado)

Se você tiver um token de acesso do Expo:

```bash
npx eas-cli login --token SEU_TOKEN_AQUI
```

Para gerar um token:
1. Acesse: https://expo.dev/accounts/lldearaujo/settings/access-tokens
2. Clique em "Create Token"
3. Copie o token gerado
4. Use no comando acima

## Verificar se está logado

Para verificar se você está logado:

```bash
npx eas-cli whoami
```

Se estiver logado, mostrará seu username. Se não, pedirá para fazer login.

## Problemas Comuns

### "Not logged in"
- Execute `npx eas-cli login` novamente
- Verifique se digitou o email/senha corretos

### "An Expo user account is required"
- Crie uma conta em: https://expo.dev/signup
- Depois faça login com `npx eas-cli login`

### "Input is required, but stdin is not readable"
- Isso acontece quando o comando precisa de interação
- Execute o comando diretamente no terminal (não via script automatizado)

---

**Depois de fazer login, execute o build:**
```bash
npx eas-cli build --platform android --profile preview
```

Ou use os scripts `build-apk.ps1` ou `build-apk.bat` que criamos!
