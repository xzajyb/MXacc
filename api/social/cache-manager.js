// 社交数据缓存管理系统
// 目标：512MB内存限制，智能数据管理

class SocialCacheManager {
  constructor() {
    this.caches = {
      posts: new Map(),           // 帖子缓存
      comments: new Map(),        // 评论缓存  
      likes: new Map(),           // 点赞缓存
      users: new Map(),           // 用户资料缓存
      follows: new Map(),         // 关注关系缓存
      messages: new Map(),        // 私信缓存
      conversations: new Map()    // 会话缓存
    }
    
    // 缓存配置 (总计约500MB，留12MB缓冲)
    this.limits = {
      posts: 2000,        // ~100MB (50KB per post)
      comments: 5000,     // ~100MB (20KB per comment)
      likes: 10000,       // ~50MB (5KB per like record)
      users: 3000,        // ~75MB (25KB per user)
      follows: 8000,      // ~40MB (5KB per follow)
      messages: 4000,     // ~100MB (25KB per message)
      conversations: 1000 // ~35MB (35KB per conversation)
    }
    
    this.syncInterval = 5 * 60 * 1000 // 5分钟同步间隔
    this.lastSync = new Date()
    this.pendingWrites = new Map() // 待写入数据库的数据
    
    // 启动定期同步
    this.startPeriodicSync()
  }

  // 清理缓存 - LRU策略
  cleanCache(type) {
    const cache = this.caches[type]
    const limit = this.limits[type]
    
    if (cache.size > limit) {
      const entries = Array.from(cache.entries())
      // 按最后访问时间排序，移除最老的20%
      const sortedEntries = entries.sort((a, b) => 
        (a[1].lastAccess || 0) - (b[1].lastAccess || 0)
      )
      
      const toRemove = Math.floor(cache.size * 0.2)
      const toKeep = sortedEntries.slice(toRemove)
      
      cache.clear()
      toKeep.forEach(([key, value]) => cache.set(key, value))
      
      console.log(`🧹 清理 ${type} 缓存: 移除 ${toRemove} 条记录`)
    }
  }

  // 获取缓存数据
  get(type, key) {
    const cache = this.caches[type]
    const data = cache.get(key)
    
    if (data) {
      data.lastAccess = Date.now()
      return data.value
    }
    return null
  }

  // 设置缓存数据
  set(type, key, value, needsSync = false) {
    const cache = this.caches[type]
    
    cache.set(key, {
      value,
      lastAccess: Date.now(),
      lastModified: Date.now(),
      needsSync
    })
    
    if (needsSync) {
      this.markForSync(type, key, value)
    }
    
    // 检查是否需要清理
    if (cache.size > this.limits[type]) {
      this.cleanCache(type)
    }
  }

  // 标记数据需要同步到数据库
  markForSync(type, key, data) {
    const syncKey = `${type}_${key}`
    this.pendingWrites.set(syncKey, {
      type,
      key,
      data,
      timestamp: Date.now()
    })
  }

  // 批量同步到数据库
  async syncToDatabase(db) {
    if (this.pendingWrites.size === 0) return

    console.log(`🔄 开始同步 ${this.pendingWrites.size} 条数据到数据库`)
    
    const collections = {
      posts: db.collection('posts'),
      comments: db.collection('comments'),
      likes: db.collection('likes'),
      follows: db.collection('follows'),
      messages: db.collection('messages'),
      conversations: db.collection('conversations')
    }

    const syncPromises = []
    const syncData = Array.from(this.pendingWrites.values())
    
    // 按类型分组同步
    const groupedData = syncData.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = []
      acc[item.type].push(item)
      return acc
    }, {})

    for (const [type, items] of Object.entries(groupedData)) {
      if (collections[type]) {
        syncPromises.push(this.syncTypeToDatabase(collections[type], type, items))
      }
    }

    try {
      await Promise.all(syncPromises)
      this.pendingWrites.clear()
      this.lastSync = new Date()
      console.log('✅ 数据同步完成')
    } catch (error) {
      console.error('❌ 数据同步失败:', error)
    }
  }

  // 同步特定类型的数据
  async syncTypeToDatabase(collection, type, items) {
    const { ObjectId } = require('mongodb')
    
    for (const item of items) {
      try {
        const data = item.data
        
        switch (type) {
          case 'posts':
            await collection.updateOne(
              { _id: new ObjectId(item.key) },
              { $set: data },
              { upsert: true }
            )
            break
            
          case 'comments':
            await collection.updateOne(
              { _id: new ObjectId(item.key) },
              { $set: data },
              { upsert: true }
            )
            break
            
          case 'likes':
            // 点赞数据特殊处理
            if (data.action === 'like') {
              await collection.updateOne(
                { 
                  postId: new ObjectId(data.postId),
                  userId: new ObjectId(data.userId),
                  type: 'like'
                },
                { 
                  $set: {
                    postId: new ObjectId(data.postId),
                    userId: new ObjectId(data.userId),
                    type: 'like',
                    createdAt: data.createdAt || new Date()
                  }
                },
                { upsert: true }
              )
            } else if (data.action === 'unlike') {
              await collection.deleteOne({
                postId: new ObjectId(data.postId),
                userId: new ObjectId(data.userId),
                type: 'like'
              })
            }
            break
            
          case 'follows':
            if (data.action === 'follow') {
              await collection.updateOne(
                {
                  followerId: new ObjectId(data.followerId),
                  followingId: new ObjectId(data.followingId)
                },
                {
                  $set: {
                    followerId: new ObjectId(data.followerId),
                    followingId: new ObjectId(data.followingId),
                    createdAt: data.createdAt || new Date()
                  }
                },
                { upsert: true }
              )
            } else if (data.action === 'unfollow') {
              await collection.deleteOne({
                followerId: new ObjectId(data.followerId),
                followingId: new ObjectId(data.followingId)
              })
            }
            break
        }
      } catch (error) {
        console.error(`同步 ${type} 数据失败:`, error)
      }
    }
  }

  // 启动定期同步
  startPeriodicSync() {
    setInterval(async () => {
      try {
        // 这里需要数据库连接，在实际使用时传入
        console.log('⏰ 定期同步检查...')
        
        // 清理过期的待同步数据 (超过30分钟)
        const now = Date.now()
        for (const [key, value] of this.pendingWrites.entries()) {
          if (now - value.timestamp > 30 * 60 * 1000) {
            this.pendingWrites.delete(key)
          }
        }
        
      } catch (error) {
        console.error('定期同步错误:', error)
      }
    }, this.syncInterval)
  }

  // 获取缓存状态
  getStatus() {
    const status = {}
    
    for (const [type, cache] of Object.entries(this.caches)) {
      status[type] = {
        size: cache.size,
        limit: this.limits[type],
        usage: `${((cache.size / this.limits[type]) * 100).toFixed(1)}%`
      }
    }
    
    status.pendingWrites = this.pendingWrites.size
    status.lastSync = this.lastSync
    
    return status
  }

  // 强制同步指定类型的数据
  async forceSyncType(db, type) {
    const items = Array.from(this.pendingWrites.values()).filter(item => item.type === type)
    if (items.length > 0) {
      const collection = db.collection(type)
      await this.syncTypeToDatabase(collection, type, items)
      
      // 移除已同步的项目
      items.forEach(item => {
        this.pendingWrites.delete(`${item.type}_${item.key}`)
      })
    }
  }

  // 预热缓存 - 加载热门数据
  async warmUpCache(db) {
    console.log('🔥 开始预热缓存...')
    
    try {
      // 加载最新的热门帖子
      const recentPosts = await db.collection('posts')
        .find({})
        .sort({ createdAt: -1 })
        .limit(200)
        .toArray()
      
      recentPosts.forEach(post => {
        this.set('posts', post._id.toString(), post)
      })

      // 加载活跃用户
      const activeUsers = await db.collection('users')
        .find({})
        .sort({ lastLogin: -1 })
        .limit(500)
        .toArray()
      
      activeUsers.forEach(user => {
        this.set('users', user._id.toString(), user)
      })

      console.log('✅ 缓存预热完成')
    } catch (error) {
      console.error('❌ 缓存预热失败:', error)
    }
  }
}

// 全局缓存管理器实例
const cacheManager = new SocialCacheManager()

module.exports = cacheManager 