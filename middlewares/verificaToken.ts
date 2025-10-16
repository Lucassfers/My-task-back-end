import jwt from "jsonwebtoken"
import { Request, Response, NextFunction } from 'express'

type TokenType = {
  usuarioLogadoId: string
  usuarioLogadoNome: string
}

// Acrescenta na interface Request (de forma global) os 2 novos atributos (TypeScript)
declare global {
  namespace Express {
    interface Request {
      userLogadoId?: string
      userLogadoNome?: string
    }
  }
}

export function verificaToken(req: Request | any, res: Response, next: NextFunction) {
  const { authorization } = req.headers

  if (!authorization) {
    res.status(401).json({ error: "Token não informado" })
    return
  }

  const token = authorization.split(" ")[1]

  try {
    const decode = jwt.verify(token, process.env.JWT_KEY as string)
    // console.log(decode)
    const { usuarioLogadoId, usuarioLogadoNome } = decode as TokenType

    req.userLogadoId    = usuarioLogadoId
    req.userLogadoNome  = usuarioLogadoNome

    next()
  } catch (error) {
    res.status(401).json({ error: "Token inválido" })
  }
}