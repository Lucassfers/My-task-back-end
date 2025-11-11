# Dockerfile para Backend (Node.js + Prisma + TypeScript)
FROM node:20-alpine AS base

# Instalar dependências do sistema necessárias para o Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Build TypeScript (se necessário para produção)
# RUN npm run build

# Expor porta do backend
EXPOSE 3000

# Comando para desenvolvimento (com hot reload)
CMD ["npm", "run", "dev"]

# Para produção, descomente as linhas abaixo e comente o CMD acima:
# CMD ["npm", "start"]
