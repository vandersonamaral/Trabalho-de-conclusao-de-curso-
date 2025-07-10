import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email(),
    senha: z.string().min(6),
});

export const registerAlunoSchema = z.object({
    nome: z.string().min(3),
    email: z.string().email(),
    senha: z.string().min(6),
    matricula: z.string().min(3),
    cpf: z.string().min(11).max(14),
    rg: z.string().min(5),
    telefone: z.string().min(8),
    instituicao: z.string(),
    diasSolicitados: z.array(z.enum([
        "SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO", "DOMINGO"
    ])),
});

export const registerSupervisorSchema = z.object({
    nome: z.string().min(3),
    email: z.string().email(),
    senha: z.string().min(6),
    departamento: z.string().optional(), // Só obrigatório para o segundo em diante
}); 