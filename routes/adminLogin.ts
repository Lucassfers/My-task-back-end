import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()
const router = Router()

router.post("/", async (req, res) => {
    const { email, senha } = req.body
    const msgPadrao = "Login ou senha incorretos"
    if(!email || !senha){
        res.status(400).json({ erro: msgPadrao })
        return
    }

    try{
        const admin = await prisma.admin.findFirst({
            where: { email }
        })
        
        if(admin == null) {
            res.status(400).json({ erro: msgPadrao })
            return
        }

        if(bcrypt.compareSync(senha, admin.senha)){
            const token = jwt.sign({
                adminLogadoId: admin.id,
                adminLogadoNome: admin.nome,
            },
            process.env.JWT_KEY as string,
            {expiresIn: "1h"}
        )
        res.status(200).json({
            id: admin.id,
            nome: admin.nome,
            email: admin.email,
            token
        })
        } else {
            const descricao = "Tentativa de acesso ao sistema"
            const complemento = "Admin: " + admin.id + " - " + admin.nome
            const log = await prisma.log.create({
                data: { descricao, complemento, adminId: admin.id}
            })
            res.status(400).json({ erro: msgPadrao})
        }
    } catch (error) {
        res.status(400).json(error)
    }
})

export default router