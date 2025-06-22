const { MongoClient } = require('mongodb')

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI
const options = {}

let client
let clientPromise

if (process.env.NODE_ENV === 'development') {
  // 开发环境：使用全局变量以避免在热重载时创建多个连接
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  // 生产环境：为每个无服务器函数创建新连接
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

module.exports = clientPromise 