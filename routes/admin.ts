import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { verificaToken } from "../middlewares/verificaToken"

const prisma = new PrismaClient()
const router = Router()

const adminSchema = z.object({
    nome: z.string().min(10, 
        { message: "Nome deve possuir, no mínimo, 10 caracteres "}),
    email: z.string().email(),
    senha: z.string(),
})

router.get("/", async (req, res) => {
    try{
        const admins = await prisma.admin.findMany()
        res.status(200).json(admins)
    } catch (error) {
        res.status(400).json(error)
    }
})

function validaSenha(senha: string){
    const msg: string[] = []

    if(senha.length < 8){
        msg.push("Erro... senha deve possuir, no mínimo, 8 caracteres")
    }
    let pequenas = 0
    let grandes = 0
    let numeros = 0
    let simbolos = 0
    for (const letra of senha) {
    // expressão regular
    if ((/[a-z]/).test(letra)) {
      pequenas++
    }
    else if ((/[A-Z]/).test(letra)) {
      grandes++
    }
    else if ((/[0-9]/).test(letra)) {
      numeros++
    } else {
      simbolos++
    }
  }
  if (pequenas == 0) {
    msg.push("Erro... senha deve possuir letra(s) minúscula(s)")
  }

  if (grandes == 0) {
    msg.push("Erro... senha deve possuir letra(s) maiúscula(s)")
  }

  if (numeros == 0) {
    msg.push("Erro... senha deve possuir número(s)")
  }

  if (simbolos == 0) {
    msg.push("Erro... senha deve possuir símbolo(s)")
  }

  return msg
}

router.post("/", verificaToken, async (req, res) => {
    const valida = adminSchema.safeParse(req.body)
    if (!valida.success) {
        res.status(400).json({ erro: valida.error })
        return
    }

    const erros = validaSenha(valida.data.senha)
    if (erros.length > 0) {
        res.status(400).json({ erro: erros.join("; ")})
        return
    }
    const salt = bcrypt.genSaltSync(12)
    const hash = bcrypt.hashSync(valida.data.senha, salt)
    const { nome, email } = valida.data

    try{
        const admin = await prisma.admin.create({
            data: { nome, email, senha: hash } 
        })
        res.status(201).json(admin)
    } catch (error) {
        res.status(400).json(error)
    }
})

router.get("/:id", async (req, res) => {
    const { id } = req.params
    try{
        const admin = await prisma.admin.findFirst({
            where: { id }
        })
        res.status(200).json(admin)
    } catch (error) {
        res.status(400).json(error)
    }
})

router.delete("/:id", async (req, res) => {
  const { id } = req.params

  try {
    // Verifica existência
    const existente = await prisma.admin.findUnique({ where: { id } })
    if (!existente) {
      return res.status(404).json({ erro: "Admin não encontrado" })
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const updBoards = await tx.board.updateMany({
        where: { adminId: id },
        data: { adminId: null }
      })
      const updUsuarios = await tx.usuario.updateMany({
        where: { adminId: id },
        data: { adminId: null }
      })
      const updLogs = await tx.log.updateMany({
        where: { adminId: id },
        data: { adminId: null }
      })

      const deleted = await tx.admin.delete({ where: { id } })

      return {
        deleted,
        afetados: {
          boards: updBoards.count,
          usuarios: updUsuarios.count,
          logs: updLogs.count,
        }
      }
    })

    res.status(200).json({
      mensagem: "Admin deletado com sucesso",
      ...resultado
    })
  } catch (error: any) {
    console.error("ERRO DELETE /admin/:id", error)
    res.status(400).json({ erro: "Não foi possível deletar o admin.", detalhe: String(error?.message ?? error) })
  }
})

export default router