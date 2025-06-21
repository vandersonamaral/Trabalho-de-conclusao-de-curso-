import { ZodError } from 'zod';
import bcrypt from "bcryptjs";
import { registerSchema } from './validation/schemas.js';
import { PrismaClient } from "@prisma/client";
import { supabase } from "../../services/supabaseClient.js";

const prisma = new PrismaClient();

export default async function registerHandler(request, reply) {
  try {
    const data = await request.file();
    const fields = data.fields;

    const dadosParaValidar = {
      nome: fields.nome.value,
      email: fields.email.value,
      senha: fields.senha.value,
      matricula: fields.matricula.value,
      cpf: fields.cpf.value,
      rg: fields.rg.value,
      telefone: fields.telefone.value,
    };

    // Validação dos dados com Zod
    registerSchema.parse(dadosParaValidar);

    // Verifica se e-mail já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: fields.email.value }
    });

    if (existingUser) {
      return reply.status(400).send({ error: "Email já cadastrado." });
    }

    // Upload do comprovante
    const buffer = await data.toBuffer();
    const filename = `${Date.now()}-${data.filename}`;
    const matricula = fields.matricula.value;
    const filepath = `comprovantes/${matricula}/${filename}`; // Sem o "public/" aqui!

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documentos")
      .upload(filepath, buffer, {
        contentType: data.mimetype,
      });

    if (uploadError) {
      console.error("Erro no upload:", uploadError);
      return reply.status(500).send({ error: "Erro ao enviar comprovante" });
    }

    const url = `${process.env.SUPABASE_URL}/storage/v1/object/public/${uploadData.path}`;

    const senhaHash = await bcrypt.hash(fields.senha.value, 10);

    // Cria o usuário
    await prisma.user.create({
      data: {
        nome: fields.nome.value,
        email: fields.email.value,
        senha: senhaHash,
        role: "ALUNO",
        statusCadastro: "PENDENTE",
        matricula: fields.matricula.value,
        cpf: fields.cpf.value,
        rg: fields.rg.value,
        telefone: fields.telefone.value,
        comprovanteMatriculaUrl: url,
      },
    });

    return reply.status(201).send({
      message: "Aluno registrado com sucesso. Aguardando aprovação.",
    });

  } catch (error) {
    if (error instanceof ZodError) {
      return reply.status(400).send({ error: "Erro de validação", detalhes: error.errors });
    }

    console.error(error);
    return reply.status(500).send({ error: "Erro no cadastro", detalhes: error.message });
  }
}
