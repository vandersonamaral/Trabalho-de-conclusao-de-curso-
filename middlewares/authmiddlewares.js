import jwt from "jsonwebtoken";

export async function authenticate(request, reply) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return reply.status(401).send({ error: "Token não fornecido." });
    }

    const token = authHeader.split(" ")[1]; 

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    
    request.user = {
      id: decoded.sub,
      role: decoded.role,
      email: decoded.email, 
    };
  } catch (err) {
    return reply.status(401).send({ error: "Token inválido ou expirado." });
  }
}
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