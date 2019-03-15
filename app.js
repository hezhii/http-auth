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

app.get('/img', (req, res) => {
  console.log('请求图片', req.headers)
  res.end('123')
})

app.get('/basic', connect(auth.basic), (req, res) => {
  res.send(`<h1>Basic: Welcome, ${req.user}</h1><img src="/img" />`)
})

app.get('/digest', connect(auth.digest), (req, res) => {
  console.log('摘要认证：', req.headers)
  res.sendFile(path.resolve(__dirname, './img.png'))
})

const server = http.createServer(app)
const PORT = process.env.PORT || 8080
server.listen(PORT, () => {
  console.log(`服务器已启动，访问 http://localhost:${PORT} 进行测试。`)
})
