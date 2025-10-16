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
        const existente = await prisma.usuario.findUnique({ where: { id } })
        if (!existente) {
            return res.status(404).json({ erro: "Usuário não encontrado" })
        }

        const resultado = await prisma.$transaction(async (tx) => {
            const anonComentarios = await tx.comentario.updateMany({
                where: { usuarioId: id },
                data: { usuarioId: null }
            })

            const tasksAtribuidas = await tx.task.findMany({
                where: { usuarioId: id },
                select: { id: true }
            })
            const taskIdsAtribuidas = tasksAtribuidas.map(t => t.id)
            let delComentariosTasksAtribuidas = { count: 0 }
            let delTasksAtribuidas = { count: 0 }
            if (taskIdsAtribuidas.length > 0) {
                delComentariosTasksAtribuidas = await tx.comentario.deleteMany({
                    where: { taskId: { in: taskIdsAtribuidas } }
                })
                delTasksAtribuidas = await tx.task.deleteMany({
                    where: { id: { in: taskIdsAtribuidas } }
                })
            }

            const boardsDoUsuario = await tx.board.findMany({
                where: { usuarioId: id },
                select: { id: true }
            })
            const boardIds = boardsDoUsuario.map(b => b.id)
            let delComentariosTasksBoards = { count: 0 }
            let delTasksBoards = { count: 0 }
            let delListas = { count: 0 }
            let delBoards = { count: 0 }
            if (boardIds.length > 0) {
                const listas = await tx.lista.findMany({
                    where: { boardId: { in: boardIds } },
                    select: { id: true }
                })
                const listaIds = listas.map(l => l.id)
                if (listaIds.length > 0) {
                    const tasksBoards = await tx.task.findMany({
                        where: { listaId: { in: listaIds } },
                        select: { id: true }
                    })
                    const taskIdsBoards = tasksBoards.map(t => t.id)
                    if (taskIdsBoards.length > 0) {
                        delComentariosTasksBoards = await tx.comentario.deleteMany({
                            where: { taskId: { in: taskIdsBoards } }
                        })
                        delTasksBoards = await tx.task.deleteMany({
                            where: { id: { in: taskIdsBoards } }
                        })
                    }
                    delListas = await tx.lista.deleteMany({ where: { id: { in: listaIds } } })
                }
                delBoards = await tx.board.deleteMany({ where: { id: { in: boardIds } } })
            }

            const updLogs = await tx.log.updateMany({
                where: { usuarioId: id },
                data: { usuarioId: null }
            })

            const deleted = await tx.usuario.delete({ where: { id } })

            return {
                deleted,
                afetados: {
                    comentariosAnonimizados: anonComentarios.count,
                    comentariosTasksAtribuidas: delComentariosTasksAtribuidas.count,
                    tasksAtribuidas: delTasksAtribuidas.count,
                    comentariosTasksBoards: delComentariosTasksBoards.count,
                    tasksBoards: delTasksBoards.count,
                    listas: delListas.count,
                    boards: delBoards.count,
                    logsDesvinculados: updLogs.count,
                }
            }
        })

        res.status(200).json({ mensagem: "Usuário deletado com sucesso", ...resultado })
    } catch (error: any) {
        console.error("ERRO DELETE /usuarios/:id", error)
        res.status(400).json({ erro: "Não foi possível deletar o usuário.", detalhe: String(error?.message ?? error) })
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
