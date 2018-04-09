const express = require('express')
const http = require('http')
const path = require('path')

const auth = require('./auth')

const app = express()
app.use(express.static(path.join(__dirname, 'public')))

const connect = (authenticate) => {
  return (req, res, next) => {
    authenticate(req, res, (req, res) => {
      next()
    })
  }
}
const render = (req, res) => {
  res.send(`<h1>Welcome, ${req.user}</h1>`)
}

app.get('/basic', connect(auth.basic), render)
app.get('/digest', connect(auth.digest), render)

const server = http.createServer(app)
const PORT = process.env.PORT || 8080
server.listen(PORT, () => {
  console.log(`服务器已启动，访问 http://localhost:${PORT} 进行测试。`)
})
