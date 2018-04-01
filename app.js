const express = require('express')
const http = require('http')

const app = express()

app.get('/', (req, res) => {
  res.sendFile('index.html', {
    root: '.'
  })
})

const server = http.createServer(app)
const PORT = process.env.PORT || 8080
server.listen(PORT, () => {
  console.log(`服务器已启动，监听 ${PORT} 端口`)
})
