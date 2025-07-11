import buildApp from "./config/app.js";

const app = buildApp();

app.listen({ port: 3000 }).then(() => {
    console.log("Servidor rodando em http://localhost:3000");
}).catch(err => {
    console.error("Erro ao iniciar o servidor:", err);
    process.exit(1);
});