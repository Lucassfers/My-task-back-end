import { PrismaClient } from "@prisma/client"
import { Router } from "express"

const prisma = new PrismaClient()
const router = Router()

router.get("/gerais", async (req, res) => {
    try{
        const totalBoards = await prisma.board.count()
        const totalListas = await prisma.lista.count()
        const totalTasks = await prisma.task.count()
        const totalComentarios = await prisma.comentario.count()
        const totalUsuarios = await prisma.usuario.count()
        res.status(200).json({ totalBoards, totalListas, totalTasks, totalComentarios, totalUsuarios})
    } catch (error) {
        res.status(400).json(error)
    }
})

type UsuarioGroupByBoard = {
  nome: string
  _count: {
    boards: number
  }
}

router.get("/boardsUsuario", async(req, res) => {
  try{
    const usuarios = await prisma.usuario.findMany({
      select: {
        nome: true,
        _count: {
           select: { boards: true } }
      }
    })
    const usuarios2 = usuarios.filter((item: UsuarioGroupByBoard) => item._count.boards > 0).map((item: UsuarioGroupByBoard) => ({
      nome: item.nome,
      boards: item._count.boards
    }))
    res.status(200).json(usuarios2)
  } catch (error) {
    res.status(400).json(error)
  }
})


type UsuarioGroupByComentario = {
  nome: string
  _count: {
    comentarios: number
  }
}

router.get("/comentariosUsuario", async(req, res) => {
  try{
    const usuarios = await prisma.usuario.findMany({
      select: {
        nome: true,
        _count: {
           select: { comentarios: true } }
      }
    })
    const usuarios2 = usuarios.filter((item: UsuarioGroupByComentario) => item._count.comentarios > 0).map((item: UsuarioGroupByComentario) => ({
      nome: item.nome,
      comentarios: item._count.comentarios
    }))
    res.status(200).json(usuarios2)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.get("/boardsMotivo", async (req, res) => {
  try{
    const motivos = await prisma.board.groupBy({
      by: ['motivo'],
      _count: {
        motivo: true
      },
      orderBy: { motivo: "asc" }
    })
    const motivos2 = motivos.map((m) => ({
      motivo: m.motivo,
      num: m._count.motivo,
    }))
    res.status(200).json(motivos2)
  } catch (error) {
    res.status(400).json(error)
  }
})



export default router



