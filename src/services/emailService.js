import nodemailer from "nodemailer";

export async function sendPasswordResetEmail(to, resetLink) {
    // Para produção, configure SMTP real
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });

    const info = await transporter.sendMail({
        from: '"Transporte Escolar" <no-reply@transporte.com>',
        to,
        subject: "Recuperação de senha",
        text: `Clique no link para redefinir sua senha: ${resetLink}`,
        html: `<p>Clique no link para redefinir sua senha:</p><a href="${resetLink}">${resetLink}</a>`,
    });

    // Para testes: visualizar o e-mail enviado
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
} 