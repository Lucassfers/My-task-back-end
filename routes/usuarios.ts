import { PrismaClient } from "@prisma/client";
import { Router } from 'express';
import { z } from "zod";
import bcrypt from 'bcrypt';
import { verificaToken } from "../middlewares/verificaToken";
const prisma = new PrismaClient()
const router = Router()
const usuarioSchema = z.object({
    nome: z.string().min(3, { message: "Nome deve possuir, no mínimo, 3 caracteres" }),
    email: z.string().email().min(10, { message: "E-mail deve possuir, no mínimo, 10 caracteres" }),
    senha: z.string()
})

const alteraSenhaSchema = z.object({
    senhaAtual: z.string().min(1, { message: "Senha atual deve ser informada" }),
    novaSenha: z.string().min(1, { message: "Nova senha deve ser informada" })
})

router.get("/", async (req, res) => {
    try {
        const usuarios = await prisma.usuario.findMany()
        res.status(200).json(usuarios)
    } catch (error) {
        res.status(400).json(error)
    }
})

export function validaSenha(senha: string): string[] {
    const mensa: string[] = []

    if (senha.length < 8) {
        mensa.push("Erro... senha deve possuir, no mínimo, 8 caracteres")
    }
    let maiusculas = 0
    let minusculas = 0
    let numeros = 0
    let simbolos = 0

    for (const letra of senha) {
        if ((/[a-z]/).test(letra)) {
            minusculas++
        } else if ((/[A-Z]/).test(letra)) {
            maiusculas++
        } else if ((/[0-9]/).test(letra)) {
            numeros++
        } else if ((/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/).test(letra)) {
            simbolos++
        }
    }

    if (maiusculas === 0) {
        mensa.push("Erro... senha deve possuir, no mínimo, 1 letra maiúscula")
    }
    if (minusculas === 0) {
        mensa.push("Erro... senha deve possuir, no mínimo, 1 letra minúscula")
    }
    if (numeros === 0) {
        mensa.push("Erro... senha deve possuir, no mínimo, 1 número")
    }
    if (simbolos === 0) {
        mensa.push("Erro... senha deve possuir, no mínimo, 1 símbolo")
    }
    return mensa
}

router.post("/", async (req, res) => {
    const valida = usuarioSchema.safeParse(req.body)
    if (!valida.success) {
        res.status(400).json({ erro: valida.error })
        return
    }

    const erros = validaSenha(valida.data.senha)
    if (erros.length > 0) {
        res.status(400).json({ erro: erros.join("; ") })
        return
    } 
    const salt = bcrypt.genSaltSync(12)
    const hash = bcrypt.hashSync(valida.data.senha, salt)
    const { nome, email } = valida.data

    try {
        const usuario = await prisma.usuario.create({
            data: { nome, email, senha: hash }
        })
        res.status(201).json(usuario)
    } catch (error) {
        res.status(400).json(error)
    }
})

router.delete("/:id", async (req, res) => {
    const { id } = req.params

    try {
        const usuario = await prisma.usuario.delete({
            where: { id }
        })
        res.status(200).json(usuario)
    } catch (error) {
        res.status(400).json(error)
    }
})

router.put("/:id", async (req, res) => {
    const { id } = req.params

    const usuarioUpdateSchema = usuarioSchema.omit({ senha: true }).partial();
    const valida = usuarioUpdateSchema.safeParse(req.body)
    if (!valida.success) {
        res.status(400).json({ erro: valida.error })
        return
    }

    const { nome, email } = valida.data;
    try {
        const usuario = await prisma.usuario.update({
            where: { id },
            data: { nome, email }
        })
        res.status(200).json(usuario)
    } catch (error) {
        res.status(400).json(error)
    }
})

router.patch("/altera_senha/:id", verificaToken, async (req, res) => {
    const { id } = req.params;

    const valida = alteraSenhaSchema.safeParse(req.body);
    if (!valida.success) {
        res.status(400).json({ erro: valida.error })
        return
    }

    const { senhaAtual, novaSenha } = valida.data;

    try {
        const usuario = await prisma.usuario.findUnique({
            where: { id }
        });

        if (!usuario) {
            res.status(404).json({ erro: "Usuário não encontrado." });
            return;
        }
        if (!bcrypt.compareSync(senhaAtual, usuario.senha)) {
            await prisma.log.create({
                data: {
                    descricao: "Tentativa de alteração de senha com senha atual incorreta",
                    complemento: `Usuário: ${usuario.id} - ${usuario.nome}`,
                    usuarioId: usuario.id
                }
            });
            res.status(400).json({ erro: "Senha atual incorreta." });
            return;
        }
        if (bcrypt.compareSync(novaSenha, usuario.senha)) {
            res.status(400).json({ erro: "A nova senha não pode ser igual à senha atual." });
            return;
        }

        const mensagensErroNovaSenha = validaSenha(novaSenha);
        if (mensagensErroNovaSenha.length > 0) {
            res.status(400).json({ erro: mensagensErroNovaSenha.join(";") });
            return;
        }

        const salt = bcrypt.genSaltSync(12);
        const novaSenhaHash = bcrypt.hashSync(novaSenha, salt);

        await prisma.usuario.update({
            where: { id },
            data: { senha: novaSenhaHash }
        });

        await prisma.log.create({
            data: {
                descricao: "Senha do usuário alterada com sucesso",
                complemento: `Usuário: ${usuario.id} - ${usuario.nome}`,
                usuarioId: usuario.id
            }
        });

        res.status(200).json({ mensagem: "Senha alterada com sucesso!" });

    } catch (error) {
        res.status(400).json({error});
    }
});

router.get("/:id", async (req, res) => {
    const { id } = req.params
    try {
    const usuario = await prisma.usuario.findUnique({
      where: { id }
    })
    res.status(200).json(usuario)
  } catch (error) {
    res.status(400).json(error)
  }
})

export default router;
