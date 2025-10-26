import { PrismaClient, Motivos } from "@prisma/client";
import { Router } from "express";
import { z }  from 'zod'
import { verificaToken } from "../middlewares/verificaToken";

const prisma = new PrismaClient()
const router = Router();

const taskSchema = z.object({
    titulo: z.string().min(1, 
        { message: "Nome da tarefa deve ter pelo menos 1 caractere."}),
    descricao: z.string().optional(),
    prazo: z.coerce.date(),
    destaque: z.boolean().optional(),
    usuarioId: z.string(),
    listaId: z.coerce.number().int().positive(),
})

router.get("/", async (req, res) => {
    try{
        const tasks = await prisma.task.findMany({
            include: {
                usuario: true,
            }
        })
        res.status(200).json(tasks)
    } catch (error){
        res.status(400).json({ erro: error})
    }
})

router.get("/listas/tasks", async (req, res) => {
    const id = Number(req.params);
    if (Number.isNaN(id)) return res.status(400).json({ erro: 'listaId inválido'})
    try {
        const tasks = await prisma.task.findMany({
            where: { listaId: id },
            include: { lista: true },
        })       
        res.status(200).json(tasks) 
    } catch (error) {
    res.status(400).json({error});
    }
})

router.post("/", async (req, res) => {
    const valida = taskSchema.safeParse(req.body)
    if(!valida.success){
        res.status(400).json({ erro: valida.error })
        return
    }
    const { titulo, descricao, prazo, usuarioId, listaId } = valida.data
    try {
        const task = await prisma.task.create({
            data: { titulo, descricao, prazo, usuarioId, listaId },
        });
        res. status(201).json(task)
    } catch (error) {
        res.status(400).json({ error })
    }
})

router.delete("/:id", async (req, res) => {
    const { id } = req.params

    try{
        const task = await prisma.task.delete({
            where: { id: Number(id)}
        })
        res.status(200).json(task)
    } catch (error) {
        res.status(400).json({ erro: error })
    }
})

router.put("/:id", async (req, res) => {
    const { id } = req.params

    const valida = taskSchema.safeParse(req.body)
    if (!valida.success) {
        res.status(400).json({ erro: valida.error })
        return
    }
    const { titulo, descricao, prazo, usuarioId, listaId } = valida.data

    try{
    const task = await prisma.task.update({
      where: { id: Number(id) },
      data: {
       titulo, descricao, prazo, usuarioId, listaId
      }
    })
    res.status(200).json(task)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.get('/task/:termo', async (req, res) => {
    const { termo } = req.params;
    if (Number.isNaN(Number(termo))) {
        try {
            const tasks = await prisma.task.findMany({
                include: { lista: true },
                where: {
                    OR: [
                        { titulo: { contains: termo, mode: 'insensitive'}},
                        { lista: { titulo: { equals: termo, mode: 'insensitive'}}},
                    ],
                },
            });
            return res.status(200).json(tasks)
        } catch (error) {
            res.status(400).json({error});
        }
    }
    return res.status(400).json({ erro: 'Use /by-lista/:listaId para listar por lista'})
})

router.get("/destaques", verificaToken, async (req, res) => {
    try {
        const tasks = await prisma.task.findMany({
            where: {
                destaque: true
            },
            include: {
                lista: true
            },
            orderBy:{
                id: "desc"
            }
        })
        res.status(200).json(tasks)
    } catch (error) {
        res.status(500).json({ erro: error })
    }
})

router.get("/semDestaques", verificaToken, async (req, res) => {
    try {
        const tasks = await prisma.task.findMany({
            where: {
                destaque: false
            },
            include: {
                lista: true
            },
            orderBy:{
                id: "desc"
            }
        })
        res.status(200).json(tasks)
    } catch (error) {
        res.status(500).json({ erro: error })
    }
})

router.patch("/destacar/:id", verificaToken, async (req, res) => {
    const { id } = req.params

    try{
        const destacarTask = await prisma.task.findUnique({
            where: { id: Number(id) },
            select: { destaque: true},
        });

        const task = await prisma.task.update({
            where: { id: Number(id)},
            data: { destaque: !destacarTask?.destaque }
        })
        res.status(200).json(task)
    } catch (error) {
        res.status(400).json(error)
    }
})


export default router