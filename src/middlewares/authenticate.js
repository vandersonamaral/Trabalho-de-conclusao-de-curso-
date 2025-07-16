import jwt from "jsonwebtoken";

// Middleware de autenticação JWT
export async function authenticate(request, reply) {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader) {
            return reply.status(401).send({ error: "Token não fornecido." });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Adiciona informações do usuário ao request para uso posterior
        request.user = {
            id: decoded.sub,
            role: decoded.role,
            email: decoded.email,
        };
    } catch (err) {
        return reply.status(401).send({ error: "Token inválido ou expirado." });
    }
} 