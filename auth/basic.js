const USER = require('./user')

const parseAuthorization = (header) => {
  let tokens = header.split(' ')
  if (tokens[0] === 'Basic') {
    return tokens[1]
  }
}

const getUser = (str) => {
  const arr = Buffer.from(str, 'base64').toString('utf8').split(':')
  const username = arr[0]
  const password = arr[1]
  // 方便起见，直接写死用户名和密码，实际场景中可以从数据库中获取，并且真实密码不应该明文存储。
  if (username === USER.username && password === USER.password) {
    return { username }
  } else {
    return {}
  }
}

const challenge = (res) => {
  // realm 是服务器分配的字符串，用于对请求 URI 所指定的受保护资源进行标识，定义受保护的区间。
  res.set('WWW-Authenticate', 'Basic realm="/basic"')
  res.status(401).end()
}

const authenticate = (req, res, callback) => {
  const header = req.get('authorization')
  if (header) {
    const options = parseAuthorization(header)
    if (options) {
      const user = getUser(options)
      if (user.username) {
        req.user = user.username
        if (callback) {
          callback(req, res)
        }
      } else {
        challenge(res)
      }
    }
  } else {
    challenge(res)
  }
}

module.exports = authenticate
