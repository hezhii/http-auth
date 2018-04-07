const express = require('express')
const http = require('http')
const crypto = require('crypto')

const app = express()

app.get('/', (req, res) => {
  res.sendFile('index.html', {
    root: '.'
  })
})

const USER = {
  name: 'admin',
  password: '123456'
}

app.get('/basic', (req, res) => {
  const unauthorized = (res) => {
    // realm 是服务器分配的字符串，用于对请求 URI 所指定的受保护资源进行标识，定义受保护的区间。
    res.set('WWW-Authenticate', 'Basic realm="/basic"')
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
  if (user && user.name === USER.name && user.password === USER.password) {
    return res.send(`<h1>Welcome, ${user.name}</h1>`)
  }
  unauthorized(res)
})

const PRIVATE_KEY = 'http_auth'
const md5 = (str, encoding) => {
  const hash = crypto.createHash('md5')
  return hash.update(str).digest(encoding || 'hex')
}
const generateNonce = () => {
  const time = Date.now()
  const etag = md5('resourceInfo')
  const hash = md5(`${time}:${etag}:${PRIVATE_KEY}`)
  return Buffer.from(`${time} ${hash}`).toString('base64')
}
const generateOpaque = () => {
  /**
   * 用来传递状态信息时有用
   *  @see {@link https://security.stackexchange.com/questions/24425/what-is-the-opaque-field-in-http-digest-access-authentication-used-for}
   */
  return md5('' + Date.now())
}
const parseAuthorization = (header) => {
  const opts = {}
  const parts = header.split(' ')
  const params = parts.slice(1).join(' ')

  // Split the parameters by comma.
  let tokens = params.split(/,(?=(?:[^"]|"[^"]*")*$)/)
  if (parts[0].substr(0, 6) === 'Digest') {
    // Parse parameters.
    let i = 0
    let len = tokens.length

    while (i < len) {
      // Strip quotes and whitespace.
      let param = /(\w+)=["]?([^"]*)["]?$/.exec(tokens[i])
      if (param) {
        opts[param[1]] = param[2]
      }

      ++i
    }
  }
  // Return options.
  return opts
}
app.get('/digest', (req, res) => {
  const unauthorized = (res) => {
    const header = `Digest realm="registered_users@host.com",nonce="${generateNonce()}",opaque="${generateOpaque()}"`
    res.set('WWW-Authenticate', header)
    res.sendStatus(401)
  }
  const authorization = req.get('authorization')
  if (!authorization) {
    return unauthorized(res)
  }
  const options = parseAuthorization(authorization)
  const ha1 = md5(`${options.username}:${options.realm}:${USER.password}`)
  const ha2 = md5(`${req.method}:${options.uri}`)
  const response = md5(`${ha1}:${options.nonce}:${ha2}`)
  console.log(response)
  console.log(options)
  if (response === options.response) {
    return res.send(`<h1>Welcome, ${options.username}</h1>`)
  } else {
    unauthorized(res)
  }
})

const server = http.createServer(app)
const PORT = process.env.PORT || 8080
server.listen(PORT, () => {
  console.log(`服务器已启动，监听 ${PORT} 端口`)
})
