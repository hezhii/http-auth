# HTTP 身份认证

某些页面、数据、功能等只想让特定的人甚至本人访问，为了实现这个目标，那么必不可少的就是认证功能，例如：常见的输入用户名、密码的表单验证或者移动端的手机短信验证等。

HTTP 本身也提供了身份认证机制，包括：**基本认证**和**摘要认证**。

此仓库实现了服务端的基本认证和摘要认证。

## 如何测试

1. 克隆项目并安装依赖，服务端基于 Express 进行构建。

```bash
$ git clone https://github.com/hezhii/http-auth.git
$ cd http-auth
$ npm install
```

2. 启动服务并通过浏览器页面测试

```bash
$ npm start
```

3. 服务启动后，通过浏览器访问 http://localhost:8080 页面，点击 **BASIC 认证**测试基本认证，点击 **DIGEST 认证**测试摘要认证。

## 了解更多

关于 HTTP 认证机制的具体细节，可以访问[我的博客](blog.whezh.com/http-auth/)进行了解。
