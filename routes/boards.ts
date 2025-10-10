import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

const boardSchema = z.object({
  titulo: z.string().min(1, { message: 'Título obrigatório' }),
  usuarioId: z.string().uuid({ message: 'usuarioId deve ser UUID' }),
  motivo: z.enum(['TRABALHO', 'ESTUDO', 'PESSOAL', 'OUTRO']),
});

router.get('/', async (_req, res) => {
  try {
    const boards = await prisma.board.findMany({
      include: {
        listas: {
          select: { id: true, titulo: true, boardId: true },
        },
      },
      orderBy: { id: 'asc' },
    });
    res.status(200).json(boards);
  } catch (error) {
    res.status(400).json({error});
  }
});

router.get('/:id/listas/tasks/comentarios', async (req, res) => {
  const { id } = req.params
  try {
    const board = await prisma.board.findUnique({
      where: { id: Number(id) },
      include: {
        listas: {
          include: {
            tasks: {
              orderBy: { id: 'asc' },
              include: {
                comentarios: {
                  orderBy: { id: 'asc'},
                  include: {
                    usuario: {
                      select: { id: true, nome: true }
                    }
                  }
                }
              }
            }
          }
        },
      }
    })
    res.status(200).json(board)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
});


router.post('/', async (req, res) => {
  const valida = boardSchema.safeParse(req.body);
  if (!valida.success) {
    return res.status(400).json({ erro: valida.error.format() });
  }
  const { titulo, motivo, usuarioId } = valida.data;
  try {
    const novo = await prisma.board.create({
      data: { titulo, motivo, usuarioId },
    });
    res.status(201).json(novo);
  } catch (error) {
    console.error('ERRO POST /boards', error);
    res.status(400).json({error});
  }
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ erro: 'id inválido' });

  const valida = boardSchema.partial().safeParse(req.body);
  if (!valida.success) {
    return res.status(400).json({ erro: valida.error.format() });
  }

  try {
    const upd = await prisma.board.update({
      where: { id },
      data: valida.data,
    });
    res.status(200).json(upd);
  } catch (error) {
    console.error('ERRO PUT /boards/:id', error);
    res.status(400).json({ erro: 'Erro ao atualizar board.' });
  }
});


router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ erro: 'id inválido' });
  try {
    const del = await prisma.board.delete({ where: { id } });
    res.status(200).json(del);
  } catch (error) {
    console.error('ERRO DELETE /boards/:id', error);
    res.status(400).json({ erro: 'Erro ao deletar board.' });
  }
});


router.get("/pesquisa/:termo", async (req, res) => {
  const { termo } = req.params

  try {
      const boards = await prisma.board.findMany({
        include: {
          usuario: true,
        },
        where: {
          OR: [
            { titulo: { contains: termo, mode: "insensitive" } },
            { usuario: { nome: { equals: termo, mode: "insensitive" } } },
          ],
        },
      })
      res.status(200).json(boards)
    } catch (error) {
      res.status(500).json({ erro: error })
    }
})
export default router;
