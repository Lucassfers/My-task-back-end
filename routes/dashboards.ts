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
        res.status(200).json({ totalBoards, totalListas, totalTasks, totalComentarios})
    } catch (error) {
        res.status(400).json(error)
    }
})

type BoardGroupByMotivo = {
  motivo: string
  _count: {
    id: number
  }
}

router.get("/boardsNome", async (req, res) => {
  try {
    const boards = await prisma.board.groupBy({
      by: ["motivo"],
      _count: { id: true }, 
    });

    const boards2 = boards.map((board: BoardGroupByMotivo) => ({
      motivo: board.motivo,
      total: board._count.id, 
    }));

    res.status(200).json(boards2);
  } catch (error) {
    console.error(error);
    res.status(400).json(error);
  }
});

export default router



