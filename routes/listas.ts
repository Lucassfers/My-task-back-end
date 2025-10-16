import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { verificaToken } from '../middlewares/verificaToken';

const prisma = new PrismaClient();
const router = Router();

const listaSchema = z.object({
  titulo: z.string().min(1, { message: 'Nome da lista deve ter pelo menos 1 caractere.' }),
  boardId: z.coerce.number().int().positive(),
  usuarioId: z.string().uuid()
});

router.get('/', async (req: any, res) => {
  try {
    const usuarioId = req.userLogadoId;

    if (!usuarioId) {
      return res.status(401).json({ erro: 'Usuário não autenticado' });
    }

    const listas = await prisma.lista.findMany({
      include: { board: true },
      where: {
          board: { 
            usuarioId: usuarioId, 
          } 
        },
      orderBy: [{ boardId: 'asc' }],
    });
    res.status(200).json(listas);
  } catch (error) {
    res.status(400).json({error});
  }
});

router.get('/:id/tasks', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ erro: 'id inválido' });
  try {
    const lista = await prisma.lista.findUnique({
      where: { id },
      include: { tasks: true },
    });
    if (!lista) return res.status(404).json({ erro: 'Lista não encontrada.' });
    res.status(200).json(lista.tasks);
  } catch (error) {
    res.status(400).json({error});
    return
  }
})


router.post('/', async (req, res) => {
  const valida = listaSchema.safeParse(req.body);
  if (!valida.success) {
    return res.status(400).json();
  }
  const { titulo, boardId } = valida.data;
  try {
    const nova = await prisma.lista.create({
      data: { titulo, boardId },
    });
    res.status(201).json(nova);
  } catch (error) {
   res.status(400).json({error});
    return
  }
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ erro: 'id inválido' });

  const valida = listaSchema.safeParse(req.body);
  if (!valida.success) {
    return res.status(400).json({ erro: valida.error.format() });
  }
  const { titulo, boardId } = valida.data;

  try {
    const upd = await prisma.lista.update({
      where: { id },
      data: { titulo, boardId },
    });
    res.status(200).json(upd);
  } catch (error) {
    res.status(400).json({error});
    return
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ erro: 'id inválido' });
  try {
    const del = await prisma.lista.delete({ where: { id } });
    res.status(200).json(del);
  } catch (error) {
    res.status(400).json({error});
    return
  }
});

router.get('/lista/:termo', async (req: any, res) => {
  const { termo } = req.params;
  const usuarioId = req.userLogadoId;

  if (!usuarioId) {
    return res.status(401).json({ erro: 'Usuário não autenticado' });
  }

  if (Number.isNaN(Number(termo))) {
    try {
      const listas = await prisma.lista.findMany({
        include: { board: true },
        where: {
          board: {
            usuarioId: usuarioId,
          },
          OR: [
            { titulo: { contains: termo, mode: 'insensitive' } },
            { board: { titulo: { equals: termo, mode: 'insensitive' } } },
          ],
        },
      });
      return res.status(200).json(listas);
    } catch (error) {
      res.status(500).json({error});
      return 
    }
  }
  return res.status(400).json({ erro: 'Use /by-board/:boardId para listar por board.' });
});

router.get(':id/tasks/comentarios', verificaToken, async (req:any, res) => {
  const { id } = req.params
  const usuarioId = req.userLogadoId;

  if(!usuarioId){
    return res.status(401).json({ erro: 'Usuário não autenticado'})
  }
  try{
    const lista = await prisma.lista.findFirst({
      where: {
        id: Number(id),
        board: {
          usuarioId: usuarioId 
        }
      },
      include: {
        tasks: {
          where:{
            destaque: true
          }, 
          orderBy: {
            id: 'desc'
          },
          include: {
            comentarios: {
              orderBy: { id: 'asc' },
              include: {
                usuario: { 
                  select: { id:true, nome:true }
                }
              }
            }
          }
        }
      }
    })

    if(!lista){
      return res.status(404).json({ erro: 'Lista não encontrado ou você não tem permissão para acessá-la.'})
    }
    res.status(200).json(lista)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

export default router;
