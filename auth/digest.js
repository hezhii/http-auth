const crypto = require('crypto')

const USER = require('./user')

const DEFAULT_OPTIONS = {
  realm: 'registered_users@host.com', // 显示给用户看的字符串，至少包括执行鉴权的主机名和可以说明有哪些用户可以访问的额外信息。
  qop: 'auth', // 指定服务器执行的保护质量，可能的取值：auth,auth-int，客服端从中选取，会导致 A2 计算的不同。这里直接使用 auth。
  algorithm: 'MD5' // 摘要算法，可以是 MD5 或者 MD5-less，如果不指定，则协议默认使用 MD5
}

const PRIVATE_KEY = 'http_auth'
const md5 = (str, encoding) => {
  const hash = crypto.createHash('md5')
  return hash.update(str).digest(encoding || 'hex')
}

const parseAuthorization = (header) => {
  const opts = {}
  const parts = header.split(' ')
  const params = parts.slice(1).join(' ')

  const tokens = params.split(/,(?=(?:[^"]|"[^"]*")*$)/)
  if (parts[0].substr(0, 6) === 'Digest') {
    let i = 0
    const len = tokens.length

    while (i < len) {
      const param = /(\w+)=["]?([^"]*)["]?$/.exec(tokens[i])
      if (param) {
        opts[param[1]] = param[2]
      }

      ++i
    }
  }

  return opts
}

// 资源实体值，标记资源是否修改
const getETag = () => 'resourceInfo'

const generateNonce = () => {
  // 添加时间信息，限制 nonce 的有效期，ETag 中的内容可以防止对资源的更新版本进行重复请求。
  // 服务器也可以维护生成的 nonce 信息，防止重放。
  const time = Date.now()
  const etag = md5(getETag())
  const hash = md5(`${time}:${etag}:${PRIVATE_KEY}`)
  return Buffer.from(`${time} ${hash}`).toString('base64')
}

const validateNonce = (nonce) => {
  if (!nonce) {
    return false
  }
  const [timestamp, hash] = Buffer.from(nonce, 'base64').toString('utf8').split(' ')
  // 5 分钟内有效
  if (timestamp + 1000 * 60 * 5 > Date.now()) {
    const curEtag = md5(getETag()) // 如果资源更新了，ETag 会发生改变，则请求失效
    return md5(`${timestamp}:${curEtag}:${PRIVATE_KEY}`) === hash
  } else {
    return false
  }
}

const generateOpaque = () => {
  /**
   * 用来传递状态信息时有用
   *  @see {@link https://security.stackexchange.com/questions/24425/what-is-the-opaque-field-in-http-digest-access-authentication-used-for}
   */
  return md5('' + Date.now())
}

const generateHeader = (options = {}) => {
  const nonce = generateNonce()
  const opaque = generateOpaque()
  const stale = !!options.stale
  return `Digest realm="${DEFAULT_OPTIONS.realm}", qop="${DEFAULT_OPTIONS.qop}", nonce="${nonce}", opaque="${opaque}", algorithm="${DEFAULT_OPTIONS.algorithm}", stale="${stale}"`
}

const challenge = (res, options) => {
  res.set('WWW-Authenticate', generateHeader(options))
  res.status(401).end()
}

const getUser = (req, opts) => {
  /**
   * 摘要的计算规则为：
   *   如果 qop 为 auth 或者 auth-int，Digest = hash(hash(<A1>):<nonce>:<nc>:<cnonce>:<qop>:hash(<A2>))
   *   如果 qop 未定义，则 Digest = hash(hash(<A1>):<nonce>:hash(<A2>))
   *
   * 其中 A1 的计算规则为：
   *   如果算法为 MD5，则 A1 = <username>:<realm>:<password>
   *   如果算法为 MD5-less，则 A1 = hash(<username>:<realm>:<password>):<nonce>:<cnonce>
   *
   * 其中 A2 的计算规则为：
   *   如果 qop 未定义或者是 auth，则 A2 = <request-method>:<digest-uri-value>
   *   如果 qop 为 auth-int，则 A2 = <request-method>:<digest-uri-value>:hash(<request-entity-body>)
   */

  const ha1 = md5(`${opts.username}:${opts.realm}:${USER.password}`)
  const ha2 = md5(`${req.method}:${opts.uri}`)
  const response = md5(`${ha1}:${opts.nonce}:${opts.nc}:${opts.cnonce}:${opts.qop}:${ha2}`)

  if (response === opts.response) {
    if (validateNonce(opts.nonce)) {
      console.log('鉴权成功')
      return { username: opts.username }
    } else {
      console.error('nonce 信息不正确')
      return { stale: true }
    }
  } else {
    console.error('用户名或密码不正确')
    return {}
  }
}

const authenticate = (req, res, callback) => {
  // TODO 这里的有一些逻辑和基础认证相同，可以抽取出来
  const header = req.get('authorization')
  if (header) {
    const options = parseAuthorization(header)
    if (options) {
      const user = getUser(req, options)
      if (user.username) {
        req.user = user.username
        if (callback) {
          callback(req, res)
        }
      } else {
        challenge(res, user)
      }
    }
  } else {
    challenge(res)
  }
}

module.exports = authenticate
