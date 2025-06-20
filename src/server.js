import app from "./config/app.js";


app.listen({port:3000}).then(() => {
    console.log("Servidor rodando em http://localhost:3000");
}).catch(err => {
    console.error("Erro ao iniciar o servidor:", err);
    process.exit(1);
});