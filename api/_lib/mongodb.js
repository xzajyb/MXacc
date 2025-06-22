const { MongoClient } = require('mongodb')

console.log(`[${new Date().toISOString()}] MongoDB配置检查开始`)
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('MONGODB_URI存在:', !!process.env.MONGODB_URI)

if (!process.env.MONGODB_URI) {
  console.error('缺少MONGODB_URI环境变量')
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI
console.log('MongoDB URI配置完成')

const options = {
  serverSelectionTimeoutMS: 5000, // 5秒超时
  socketTimeoutMS: 45000, // 45秒socket超时
}

let client
let clientPromise

if (process.env.NODE_ENV === 'development') {
  console.log('使用开发环境MongoDB连接')
  // 开发环境：使用全局变量以避免在热重载时创建多个连接
  if (!global._mongoClientPromise) {
    console.log('创建新的MongoDB客户端连接')
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
      .then(client => {
        console.log('MongoDB开发环境连接成功')
        return client
      })
      .catch(err => {
        console.error('MongoDB开发环境连接失败:', err)
        throw err
      })
  } else {
    console.log('重用现有的MongoDB开发环境连接')
  }
  clientPromise = global._mongoClientPromise
} else {
  console.log('使用生产环境MongoDB连接')
  // 生产环境：为每个无服务器函数创建新连接
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
    .then(client => {
      console.log('MongoDB生产环境连接成功')
      return client
    })
    .catch(err => {
      console.error('MongoDB生产环境连接失败:', err)
      throw err
    })
}

module.exports = clientPromise 