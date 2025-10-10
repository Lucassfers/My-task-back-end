import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

interface TokenInterface {
    userLogadoId: string
    userLogadoNome: string
}
declare global {
  namespace Express {
    interface Request {
      userLogadoId?: string
      userLogadoNome?: string
    }
  }
}

export function verificaToken(req: Request, res: Response, next: NextFunction) {
    const { authorization } = req.headers

    if (!authorization) {
        res.status(401).json({ erro: "Token não informado" })
        return
    }
    const token = authorization.split(" ")[1]

    try {
        const decode = jwt.verify(token, process.env.JWT_KEY as string)
        // console.log(decode)
        const { userLogadoId, userLogadoNome } = decode as TokenInterface
        req.userLogadoId = userLogadoId
        req.userLogadoNome = userLogadoNome

        next()
    } catch (erro) {
        res.status(401).json({ erro: "Token inválido" })
    }
}