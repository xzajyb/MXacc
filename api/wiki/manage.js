const { MongoClient, ObjectId } = require('mongodb')
const jwt = require('jsonwebtoken')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DB_NAME = 'mxacc'
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

let cachedClient = null

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient
  }

  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  cachedClient = client
  return client
}

module.exports = async function handler(req, res) {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // 验证管理员权限
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ success: false, message: '需要登录' })
    }

    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return res.status(401).json({ success: false, message: '无效的令牌' })
    }

    // 连接数据库
    const client = await connectToDatabase()
    const db = client.db(DB_NAME)
    const users = db.collection('users')
    const wikis = db.collection('wikis')
    const wikiCategories = db.collection('wiki_categories')

    // 获取用户信息并验证管理员权限
    const user = await users.findOne({ _id: new ObjectId(decoded.userId) })
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '需要管理员权限' })
    }

    // 根据请求方法和操作类型处理
    const { action, type } = req.method === 'GET' ? req.query : req.body

    // GET 请求 - 获取数据
    if (req.method === 'GET') {
      // 获取分类列表
      if (action === 'categories') {
        const categories = await wikiCategories.find()
          .sort({ order: 1, name: 1 })
          .toArray()
        
        return res.status(200).json({
          success: true,
          data: categories.map(cat => ({
            id: cat._id.toString(),
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            order: cat.order,
            isVisible: cat.isVisible,
            createdAt: cat.createdAt,
            updatedAt: cat.updatedAt
          }))
        })
      }

      // 获取文档列表
      if (action === 'documents') {
        const { categoryId, page = 1, limit = 50 } = req.query
        let query = {}
        
        if (categoryId && categoryId !== 'all') {
          query.categoryId = new ObjectId(categoryId)
        }

        const documents = await wikis.find(query)
          .sort({ order: 1, createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(parseInt(limit))
          .toArray()

        const total = await wikis.countDocuments(query)

        return res.status(200).json({
          success: true,
          data: documents.map(doc => ({
            id: doc._id.toString(),
            title: doc.title,
            slug: doc.slug,
            content: doc.content,
            categoryId: doc.categoryId?.toString(),
            order: doc.order,
            isPublished: doc.isPublished,
            author: doc.author,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        })
      }

      // 获取单个文档
      if (action === 'document' && req.query.id) {
        const document = await wikis.findOne({ _id: new ObjectId(req.query.id) })
        if (!document) {
          return res.status(404).json({ success: false, message: '文档不存在' })
        }

        return res.status(200).json({
          success: true,
          data: {
            id: document._id.toString(),
            title: document.title,
            slug: document.slug,
            content: document.content,
            categoryId: document.categoryId?.toString(),
            order: document.order,
            isPublished: document.isPublished,
            author: document.author,
            createdAt: document.createdAt,
            updatedAt: document.updatedAt
          }
        })
      }

      // 获取统计信息
      if (action === 'stats') {
        const totalDocs = await wikis.countDocuments()
        const publishedDocs = await wikis.countDocuments({ isPublished: true })
        const draftDocs = await wikis.countDocuments({ isPublished: false })
        const totalCategories = await wikiCategories.countDocuments()

        return res.status(200).json({
          success: true,
          data: {
            totalDocuments: totalDocs,
            publishedDocuments: publishedDocs,
            draftDocuments: draftDocs,
            totalCategories
          }
        })
      }
    }

    // POST 请求 - 创建数据
    if (req.method === 'POST') {
      // 创建分类
      if (action === 'create-category') {
        const { name, slug, description = '', order = 0, isVisible = true } = req.body

        if (!name || !slug) {
          return res.status(400).json({ success: false, message: '分类名称和标识符不能为空' })
        }

        // 检查标识符是否重复
        const existingCategory = await wikiCategories.findOne({ slug })
        if (existingCategory) {
          return res.status(400).json({ success: false, message: '分类标识符已存在' })
        }

        const newCategory = {
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim(),
          order: parseInt(order),
          isVisible: Boolean(isVisible),
          createdAt: new Date(),
          updatedAt: new Date()
        }

        const result = await wikiCategories.insertOne(newCategory)
        
        return res.status(201).json({
          success: true,
          message: '分类创建成功',
          data: { id: result.insertedId.toString(), ...newCategory }
        })
      }

      // 创建文档
      if (action === 'create-document') {
        const { title, slug, content, categoryId, order = 0, isPublished = true } = req.body

        if (!title || !slug || !content) {
          return res.status(400).json({ success: false, message: '标题、标识符和内容不能为空' })
        }

        // 检查标识符是否重复
        const existingDoc = await wikis.findOne({ slug: slug.trim() })
        if (existingDoc) {
          return res.status(400).json({ success: false, message: '文档标识符已存在' })
        }

        const newDoc = {
          title: title.trim(),
          slug: slug.trim(),
          content: content.trim(),
          categoryId: categoryId ? new ObjectId(categoryId) : null,
          order: parseInt(order),
          isPublished: Boolean(isPublished),
          author: {
            id: decoded.userId,
            username: user.username,
            displayName: user.profile?.displayName || user.profile?.nickname || user.username
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }

        const result = await wikis.insertOne(newDoc)
        
        return res.status(201).json({
          success: true,
          message: '文档创建成功',
          data: { id: result.insertedId.toString(), ...newDoc }
        })
      }

      // 重建Wiki静态文件
      if (action === 'rebuild-wiki') {
        try {
          // 动态导入构建脚本
          const buildWiki = require('../../scripts/build-wiki')
          await buildWiki()

          return res.status(200).json({
            success: true,
            message: 'Wiki重建成功！VitePress文档已更新',
            timestamp: new Date().toISOString()
          })
        } catch (error) {
          console.error('Wiki重建失败:', error)
          return res.status(500).json({
            success: false,
            message: '重建失败: ' + error.message
          })
        }
      }
    }

    // PUT 请求 - 更新数据
    if (req.method === 'PUT') {
      const { id } = req.body
      if (!id) {
        return res.status(400).json({ success: false, message: 'ID不能为空' })
      }

      // 更新分类
      if (action === 'update-category') {
        const { name, slug, description, order, isVisible } = req.body
        
        const updateData = { updatedAt: new Date() }
        if (name !== undefined) updateData.name = name.trim()
        if (slug !== undefined) updateData.slug = slug.trim()
        if (description !== undefined) updateData.description = description.trim()
        if (order !== undefined) updateData.order = parseInt(order)
        if (isVisible !== undefined) updateData.isVisible = Boolean(isVisible)

        const result = await wikiCategories.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        )

        if (result.matchedCount === 0) {
          return res.status(404).json({ success: false, message: '分类不存在' })
        }

        return res.status(200).json({ success: true, message: '分类更新成功' })
      }

      // 更新文档
      if (action === 'update-document') {
        const { title, slug, content, categoryId, order, isPublished } = req.body
        
        const updateData = { updatedAt: new Date() }
        if (title !== undefined) updateData.title = title.trim()
        if (slug !== undefined) updateData.slug = slug.trim()
        if (content !== undefined) updateData.content = content.trim()
        if (categoryId !== undefined) updateData.categoryId = categoryId ? new ObjectId(categoryId) : null
        if (order !== undefined) updateData.order = parseInt(order)
        if (isPublished !== undefined) updateData.isPublished = Boolean(isPublished)

        const result = await wikis.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        )

        if (result.matchedCount === 0) {
          return res.status(404).json({ success: false, message: '文档不存在' })
        }

        return res.status(200).json({ success: true, message: '文档更新成功' })
      }
    }

    // DELETE 请求 - 删除数据
    if (req.method === 'DELETE') {
      const { id, type } = req.query
      if (!id || !type) {
        return res.status(400).json({ success: false, message: 'ID和类型不能为空' })
      }

      // 删除分类
      if (type === 'category') {
        // 检查分类下是否有文档
        const docsInCategory = await wikis.countDocuments({ categoryId: new ObjectId(id) })
        if (docsInCategory > 0) {
          return res.status(400).json({ 
            success: false, 
            message: '无法删除包含文档的分类，请先移动或删除分类下的文档' 
          })
        }

        const result = await wikiCategories.deleteOne({ _id: new ObjectId(id) })
        if (result.deletedCount === 0) {
          return res.status(404).json({ success: false, message: '分类不存在' })
        }

        return res.status(200).json({ success: true, message: '分类删除成功' })
      }

      // 删除文档
      if (type === 'document') {
        const result = await wikis.deleteOne({ _id: new ObjectId(id) })
        if (result.deletedCount === 0) {
          return res.status(404).json({ success: false, message: '文档不存在' })
        }

        return res.status(200).json({ success: true, message: '文档删除成功' })
      }
    }

    return res.status(405).json({ success: false, message: '方法不允许' })

  } catch (error) {
    console.error('Wiki管理API错误:', error)
    return res.status(500).json({
      success: false,
      message: error.message || '服务器内部错误'
    })
  }
} 