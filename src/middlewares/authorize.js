// Middleware de autorização por papel (role)
export function authorize(roles = []) {
    return async (request, reply) => {
        const user = request.user;
        if (!user) {
            return reply.status(401).send({ error: "Usuário não autenticado." });
        }
        if (roles.length && !roles.includes(user.role)) {
            return reply.status(403).send({ error: "Acesso não autorizado." });
        }
    };
} 