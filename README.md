# Transporte Escolar/Universitário - Backend

Backend em Node.js + Fastify + Prisma + Supabase para gestão de transporte escolar/universitário.

## 🚀 Sobre o Projeto

API para cadastro, autenticação e gestão de transporte escolar/universitário, com upload de comprovantes, aprovação de cadastros, reservas, controle de presença e recuperação de senha.

> **Atenção:** O backend é totalmente independente do frontend. A pasta `frontend/` pode ser usada para desenvolvimento local, mas pode (e deve) ser movida para fora do backend em produção.

## 📦 Estrutura de Pastas

```
src/
  config/
  controllers/
  middlewares/
  repositories/
  routes/
  schemas/
  services/
  utils/
frontend/   # (opcional, apenas para desenvolvimento local)
```

## 🛠️ Como rodar o backend

```bash
# Instale as dependências
npm install

# Configure o .env (veja .env.example)
cp .env.example .env

# Rode as migrations do Prisma
npx prisma migrate dev

# Rode o servidor
npm run dev
```

A API estará disponível em `http://localhost:3000` (ou na porta definida no server.js).

## 🧪 Testes

```bash
npx dotenv -e .env.test -- npm test
```

## 📚 Integração com o Frontend

- O frontend (web/mobile) deve consumir a API via HTTP.
- No React Native, configure a baseURL do axios para o IP da sua máquina, ex: `http://192.168.0.10:3000`.
- O backend já está com CORS habilitado para facilitar o desenvolvimento.
- Quando for separar os projetos, basta mover a pasta `frontend` para fora do backend.

## 📝 Licença

MIT
