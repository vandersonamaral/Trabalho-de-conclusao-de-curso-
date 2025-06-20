import { z } from "zod";

export const registerSchema = z.object({
  nome: z.string().min(3),
  email: z.string().email(),
  senha: z.string().min(6),
  matricula: z.string().min(3),
  cpf: z.string().min(11).max(14),
  rg: z.string().min(5),
  telefone: z.string().min(8),
  comprovanteMatriculaUrl: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(6),
});