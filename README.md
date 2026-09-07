# POC - Consulta CNPJ

POC simples baseada na planilha `Lista de empresas ABC.xlsx`.

## Estrutura

- `backend/`: API Express + JSON com 51,129 empresas.
- `mobile/`: aplicativo Expo/React Native para Android e iOS.

## Backend

```bash
cd backend
npm install
npm start
```

API:
- `GET /health`
- `GET /api/empresas/cnpj/:cnpj`

Exemplo:
`http://localhost:3000/api/empresas/cnpj/00000000000000`

## Mobile

```bash
cd mobile
npm install
npx expo start
```

Antes de rodar no celular, altere no `mobile/App.tsx`:

```ts
const API_URL = "http://SEU_IP_LOCAL:3000";
```

Use o IP da máquina onde o backend está rodando. O celular e o computador precisam estar na mesma rede para o acesso local.

## Observação

Para uma POC, a base foi colocada em JSON para eliminar a necessidade de configurar banco de dados.
Em uma próxima etapa, podemos trocar o JSON por PostgreSQL + Prisma sem alterar o contrato da API.
