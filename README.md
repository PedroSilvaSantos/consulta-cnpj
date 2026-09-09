# Consulta CNPJ

 Aplicação para consulta de empresas por CNPJ, composta por um backend em Node.js/Express e um aplicativo mobile desenvolvido com Expo/React Native.

 ## 📁 Estrutura do projeto

```
consulta-cnpj/
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── deno.lock
│   ├── empresas.json
│   ├── netlify/
│   ├── netlify.toml
│   ├── package.json
│   ├── package-lock.json
│   ├── redis.js
│   └── server.js
├── docker-compose.yml
└── mobile/
    ├── App.tsx
    ├── android/
    ├── app.json
    ├── eas.json
    ├── ios/
    ├── package.json
    ├── package-lock.json
    └── tsconfig.json
```

 ## 🚀 Arquitetura em produção

 O projeto utiliza a seguinte arquitetura:

```
┌─────────────────────┐
│   Aplicativo Expo   │
│   React Native      │
└──────────┬──────────┘
           │
           │ HTTPS
           ▼
┌─────────────────────┐
│       Render        │
│  Node.js + Express  │
│      Backend        │
└──────────┬──────────┘
           │
           │ REDIS_URL
           ▼
┌─────────────────────┐
│   Render Valkey     │
│    Cache Redis      │
└─────────────────────┘
```

 O código-fonte fica hospedado no GitHub.

 O Render monitora o repositório e pode realizar um novo deploy sempre que houver um novo commit na branch configurada.

---

 # 🔧 Backend

 O backend está localizado na pasta:

```
backend/
```

 Ele utiliza:

 - Node.js
- Express
- Redis/Valkey
- CORS

 O servidor é iniciado através do script:

```
"scripts": {
  "start": "node server.js"
}
```

 ## Variáveis de ambiente

 O backend utiliza a variável:

```
REDIS_URL=...
```

 Essa variável contém a URL de conexão com o Valkey hospedado no Render.

 A URL deve ser configurada no próprio Render e **não deve ser commitada no GitHub**.

 Exemplo:

```
REDIS_URL=redis://...
```

 > Nunca coloque credenciais, senhas ou URLs privadas diretamente no código-fonte.

---

 # ☁️ Deploy do Backend no Render

 O backend é publicado como um **Web Service** no Render.

 ## Configuração

 Como o backend está dentro da pasta `backend`, o serviço deve utilizar:

```
Root Directory: backend
Runtime: Node
Build Command: npm install
Start Command: npm start
```

 ### Root Directory

```
backend
```

 Isso informa ao Render que o projeto Node está localizado dentro dessa pasta.

 ### Build Command

```
npm install
```

 Instala as dependências definidas no `package.json`.

 ### Start Command

```
npm start
```

 Executa:

```
node server.js
```

---

 # 🌐 URL do Backend

 Depois do deploy, o Render fornece uma URL pública para o backend.

 Exemplo:

```
https://consulta-cnpj-0dt2.onrender.com
```

 As rotas da API são acessadas a partir dessa URL.

 Exemplo de consulta:

```
https://consulta-cnpj-0dt2.onrender.com/api/empresas/cnpj/35737101000124
```

---

 # 🔴 Valkey / Redis

 O backend utiliza o Valkey do Render para armazenar temporariamente os resultados das consultas.

 A conexão é feita através da variável:

```
REDIS_URL
```

 No código:

```
const redis = createClient({
  url: process.env.REDIS_URL,
});
```

 ## Internal Key Value URL

 Como o backend e o Valkey estão hospedados no Render, deve-se utilizar preferencialmente a:

```
Internal Key Value URL
```

 como valor de:

```
REDIS_URL
```

 O backend e o Valkey devem estar configurados de forma que a comunicação interna entre os serviços seja possível.

---

 # 🗄️ Cache das consultas

 O resultado de uma consulta de CNPJ é armazenado no Valkey para evitar consultas repetidas.

 O cache atualmente possui duração de:

```
24 horas
```

 O código utiliza:

```
await redis.set(
  cacheKey,
  JSON.stringify(empresa),
  {
    EX: 60 * 60 * 24,
  }
);
```

 ## O que significa `EX`?

 `EX` significa **Expiration**.

 Ele determina em quantos segundos a chave deverá expirar.

 Por exemplo:

```
EX: 60 * 60
```

 representa:

```
1 hora
```

 Enquanto:

```
EX: 60 * 60 * 24
```

 representa:

```
24 horas
```

 Após o período de 24 horas, o cache expira automaticamente.

---

 # 📱 Frontend / Expo

 O aplicativo mobile está localizado em:

```
mobile/
```

 O frontend utiliza Expo/React Native.

 Para desenvolvimento, o projeto pode ser iniciado com:

```
cd mobile
npx expo start
```

---

 # 🔗 Comunicação entre o aplicativo e o backend

 Em produção, o aplicativo utiliza a URL pública do backend:

```
EXPO_PRODUCAO_API_URL=https://consulta-cnpj-0dt2.onrender.com
```

 As requisições são feitas adicionando a rota da API.

 Exemplo:

```
EXPO_PRODUCAO_API_URL
        +
/api/empresas/cnpj/35737101000124
```

 Resultando em:

```
https://consulta-cnpj-0dt2.onrender.com/api/empresas/cnpj/35737101000124
```

---

 # 🔄 Fluxo completo de uma consulta

 Quando o usuário consulta um CNPJ:

```
1. Usuário informa o CNPJ
            ↓
2. Aplicativo Expo envia a requisição
            ↓
3. Backend recebe a requisição
            ↓
4. Backend verifica o cache no Valkey
            ↓
       ┌────┴────┐
       │         │
     Existe    Não existe
       │         │
       ↓         ↓
    Retorna   Consulta os
     cache    dados originais
                 │
                 ↓
          Salva no Valkey
          por 24 horas
                 │
                 ↓
          Retorna resultado
```

 Dessa forma, uma consulta repetida dentro das próximas 24 horas pode ser atendida diretamente pelo cache.

---

 # 🔄 Processo de atualização do Backend

 Sempre que houver uma alteração no backend:

 ### 1\. Alterar o código

 Exemplo:

```
backend/server.js
```

 ### 2\. Fazer commit

```
git add backend/server.js
git commit -m "Atualiza backend"
```

 ### 3\. Enviar para o GitHub

```
git push
```

 ### 4\. Render realiza o deploy

 Se o Auto Deploy estiver habilitado, o Render detecta o novo commit e inicia automaticamente um novo deploy.

 Caso o Auto Deploy esteja desabilitado:

```
Render
  ↓
Web Service
  ↓
Manual Deploy
  ↓
Deploy latest commit
```

---

 # 🔨 É necessário rebuildar o aplicativo Expo?

 Nem toda alteração exige um novo build do aplicativo.

 ## Alterações apenas no backend

 Por exemplo:

 - alteração no cache;
- alteração de uma rota;
- correção de uma regra de negócio;
- alteração na consulta ao Redis.

 Nesse caso:

```
GitHub → Render → Deploy
```

 é suficiente.

 Não é necessário gerar um novo APK/IPA.

 ## Alterações no aplicativo mobile

 Se forem feitas alterações no código do Expo que precisam estar dentro do aplicativo publicado, pode ser necessário gerar um novo build.

 Por exemplo:

```
mobile/App.tsx
```

 ou alterações nativas em:

```
mobile/android/
mobile/ios/
```

 Nesse caso, o processo de build do aplicativo deve ser executado novamente.

---

 # 🧪 Testando o Backend

 Após um deploy, é possível testar diretamente uma rota da API.

 Exemplo:

```
https://consulta-cnpj-0dt2.onrender.com/api/empresas/cnpj/35737101000124
```

 A resposta esperada é um JSON contendo os dados encontrados para o CNPJ.

 Também é importante verificar os logs do Render.

 Quando o Valkey estiver conectado corretamente, devem aparecer mensagens semelhantes a:

```
Redis conectando...
Redis pronto.
```

 Erros como:

```
ENOTFOUND
```

 podem indicar problemas na URL ou na conectividade com o Valkey.

---

 # 🔐 Boas práticas

 ## Não versionar arquivos sensíveis

 Nunca envie para o GitHub:

```
.env
```

 ou arquivos contendo:

 - senhas;
- tokens;
- chaves de API;
- URLs privadas de banco;
- credenciais do Redis/Valkey.

 As variáveis devem ser configuradas no Render ou no ambiente apropriado.

 ## Não versionar `node_modules`

 As pastas:

```
backend/node_modules
mobile/node_modules
```

 não precisam ser enviadas ao GitHub.

 As dependências são instaladas utilizando:

```
npm install
```

---

 # 📌 Resumo do ambiente de produção

 | Componente | Serviço | Local |
| --- | --- | --- |
| Código | GitHub | Repositório |
| Backend | Render Web Service | `backend/` |
| Cache | Render Valkey | Key Value |
| Frontend | Expo / React Native | `mobile/` |
| API | Render | `https://consulta-cnpj-0dt2.onrender.com` |

 ## Fluxo de deploy

```
                  GITHUB
                    │
          ┌─────────┴─────────┐
          │                   │
          ▼                   ▼
       BACKEND              MOBILE
          │                   │
          ▼                   ▼
       RENDER                EXPO
          │
          ▼
       VALKEY
```

 O backend é atualizado através de commits enviados ao GitHub, enquanto o aplicativo mobile possui seu próprio processo de build/publicação.

---

 # 🛠️ Comandos úteis

 ### Backend

```
cd backend
npm install
npm start
```

 ### Mobile

```
cd mobile
npm install
npx expo start
```

 ### Git

```
git add .
git commit -m "Descrição da alteração"
git push
```

---

 # 📄 Licença
