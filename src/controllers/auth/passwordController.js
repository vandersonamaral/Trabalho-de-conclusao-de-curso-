import prisma from "../../config/prisma.js";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../../services/emailService.js";
import bcrypt from "bcryptjs";

export async function forgotPassword(request, reply) {
    const { email } = request.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        // Não revela se o e-mail existe
        return reply.send({ message: "Se o e-mail existir, enviaremos instruções." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await prisma.passwordResetToken.create({
        data: { userId: user.id, token, expiresAt }
    });

    const resetLink = `http://localhost:3000/reset-password?token=${token}`; // ajuste para seu frontend
    await sendPasswordResetEmail(email, resetLink);

    return reply.send({ message: "Se o e-mail existir, enviaremos instruções." });
}

export async function resetPassword(request, reply) {
    const { token, novaSenha } = request.body;
    const reset = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!reset || reset.expiresAt < new Date()) {
        return reply.status(400).send({ error: "Token inválido ou expirado." });
    }

    const senhaHash = await bcrypt.hash(novaSenha, 10);
    await prisma.user.update({
        where: { id: reset.userId },
        data: { senha: senhaHash }
    });

    await prisma.passwordResetToken.delete({ where: { token } });

    return reply.send({ message: "Senha redefinida com sucesso." });
}

export async function changePassword(request, reply) {
    const { senhaAtual, novaSenha } = request.body;
    const userId = request.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return reply.status(404).send({ error: "Usuário não encontrado." });

    const senhaValida = await bcrypt.compare(senhaAtual, user.senha);
    if (!senhaValida) return reply.status(400).send({ error: "Senha atual incorreta." });

    const senhaHash = await bcrypt.hash(novaSenha, 10);
    await prisma.user.update({ where: { id: userId }, data: { senha: senhaHash } });

    return reply.send({ message: "Senha alterada com sucesso." });
} 