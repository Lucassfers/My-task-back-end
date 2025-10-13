import express from 'express'
import cors from 'cors'
import 'dotenv/config'

import routesBoards from './routes/boards'
import routesComentarios from './routes/comentarios'
import routesUsuarios from './routes/usuarios'
import routesTasks from './routes/tasks'
import routesListas from './routes/listas'
import routesLogin from './routes/login'
import routesAdmin from './routes/admin'
import routesAdminLogin from "./routes/adminLogin"
import routesDashboards from "./routes/dashboards"
import { verificaToken } from './middlewares/verificaToken'

const app = express()
const port = 3000

app.use(express.json())
app.use(cors())

app.use("/boards", verificaToken, routesBoards)
app.use("/comentarios", verificaToken, routesComentarios)
app.use("/usuarios", routesUsuarios)
app.use("/tasks", verificaToken, routesTasks)
app.use("/listas", verificaToken, routesListas)
app.use("/login", routesLogin)
app.use("/admin", routesAdmin)
app.use("/adminLogin", routesAdminLogin)
app.use("/dashbooards", routesDashboards)

app.get('/', (req, res) => {
  res.send('API: MyTask')
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`)
})