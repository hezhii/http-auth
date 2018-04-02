const express = require('express')
const http = require('http')

const app = express()

app.get('/', (req, res) => {
  res.sendFile('index.html', {
    root: '.'
  })
})

app.get('/basic', (req, res) => {
  const unauthorized = (res) => {
    res.set('WWW-Authenticate', 'Basic realm="Please input username and password"')
    res.sendStatus(401)
  }
  const parse = (header) => {
    if (typeof header !== 'string') {
      return
    }
    const str = Buffer.from(header.substring(6), 'base64').toString()
    const i = str.indexOf(':')
    return {
      name: str.substring(0, i),
      password: str.substring(i + 1)
    }
  }
  const authorization = req.get('authorization')
  if (!authorization) {
    return unauthorized(res)
  }
  const user = parse(authorization)
  if (user && user.name === 'admin' && user.password === '123456') {
    return res.send(`<h1>Welcome, ${user.name}</h1>`)
  }
  unauthorized(res)
})

const server = http.createServer(app)
const PORT = process.env.PORT || 8080
server.listen(PORT, () => {
  console.log(`服务器已启动，监听 ${PORT} 端口`)
})
