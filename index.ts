import express from 'express'
import cors from 'cors'
import 'dotenv/config'

import routesBoards from './routes/boards'
import routesComentarios from './routes/comentarios'
import routesUsuarios from './routes/usuarios'
import routesTasks from './routes/tasks'
import routesListas from './routes/listas'
import routesLogin from './routes/login'

const app = express()
const port = 3000

app.use(express.json())
app.use(cors())

app.use("/boards", routesBoards)
app.use("/comentarios", routesComentarios)
app.use("/usuarios", routesUsuarios)
app.use("/tasks", routesTasks)
app.use("/listas", routesListas)
app.use("/login", routesLogin)

app.get('/', (req, res) => {
  res.send('API: MyTask')
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`)
})