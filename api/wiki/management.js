const clientPromise = require('../_lib/mongodb')
const { ObjectId } = require('mongodb')
const path = require('path')
const fs = require('fs').promises
const jwt = require('jsonwebtoken')

// 验证JWT token
function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('未提供有效的授权token')
  }
  
  const token = authHeader.split(' ')[1]
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch (error) {
    throw new Error('Token无效')
  }
}

// 验证管理员权限
async function verifyAdminUser(users, userId) {
  const user = await users.findOne({ _id: new ObjectId(userId) })
  if (!user || user.role !== 'admin') {
    throw new Error('权限不足')
  }
  return user
}

// 创建安全的文件路径
function createSafePath(basePath, relativePath) {
  const resolved = path.resolve(basePath, relativePath)
  if (!resolved.startsWith(basePath)) {
    throw new Error('路径不安全')
  }
  return resolved
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
    console.log('=== Wiki Management API ===')
    console.log('Method:', req.method)
    console.log('Body:', req.body)

    // 连接数据库
    const client = await clientPromise
    const db = client.db('mxacc')
    const users = db.collection('users')
    const wikiPages = db.collection('wiki_pages')
    const wikiCategories = db.collection('wiki_categories')

    // 验证用户身份和管理员权限
    const decoded = verifyToken(req.headers.authorization)
    const currentUser = await verifyAdminUser(users, decoded.userId)

    const { action } = req.body || req.query

    // GET: 获取Wiki内容
    if (req.method === 'GET') {
      switch (action) {
        case 'get-page': {
          const { pageId, slug } = req.query
          let page
          
          if (pageId) {
            page = await wikiPages.findOne({ _id: new ObjectId(pageId) })
          } else if (slug) {
            page = await wikiPages.findOne({ slug })
          }
          
          if (!page) {
            return res.status(404).json({ success: false, message: '页面不存在' })
          }
          
          return res.json({ success: true, data: page })
        }

        case 'get-categories': {
          const categories = await wikiCategories.find({})
            .sort({ order: 1, name: 1 })
            .toArray()
          
          return res.json({ success: true, data: categories })
        }

        case 'get-pages': {
          const { categoryId, search } = req.query
          let query = {}
          
          if (categoryId) {
            query.categoryId = new ObjectId(categoryId)
          }
          
          if (search) {
            query.$or = [
              { title: { $regex: search, $options: 'i' } },
              { content: { $regex: search, $options: 'i' } }
            ]
          }
          
          const pages = await wikiPages.find(query)
            .sort({ order: 1, updatedAt: -1 })
            .toArray()
          
          return res.json({ success: true, data: pages })
        }

        case 'get-navigation': {
          // 获取导航结构
          const categories = await wikiCategories.find({})
            .sort({ order: 1, name: 1 })
            .toArray()
          
          const navigation = []
          
          for (const category of categories) {
            const pages = await wikiPages.find({ categoryId: category._id })
              .sort({ order: 1, title: 1 })
              .toArray()
            
            navigation.push({
              ...category,
              pages: pages.map(page => ({
                _id: page._id,
                title: page.title,
                slug: page.slug,
                order: page.order
              }))
            })
          }
          
          return res.json({ success: true, data: navigation })
        }

        default:
          return res.status(400).json({ success: false, message: '未知操作' })
      }
    }

    // POST: 创建内容
    if (req.method === 'POST') {
      switch (action) {
        case 'create-category': {
          const { name, description, order = 0 } = req.body
          
          if (!name) {
            return res.status(400).json({ success: false, message: '分类名称不能为空' })
          }
          
          // 检查分类名称是否已存在
          const existingCategory = await wikiCategories.findOne({ name })
          if (existingCategory) {
            return res.status(400).json({ success: false, message: '分类名称已存在' })
          }
          
          const category = {
            name,
            description: description || '',
            order,
            createdAt: new Date(),
            createdBy: new ObjectId(currentUser._id)
          }
          
          const result = await wikiCategories.insertOne(category)
          
          return res.json({
            success: true,
            message: '分类创建成功',
            data: { _id: result.insertedId, ...category }
          })
        }

        case 'create-page': {
          const { title, content, categoryId, slug, order = 0, tags = [] } = req.body
          
          if (!title || !content) {
            return res.status(400).json({ success: false, message: '标题和内容不能为空' })
          }
          
          // 生成slug
          const pageSlug = slug || title.toLowerCase()
            .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
          
          // 检查slug是否已存在
          const existingPage = await wikiPages.findOne({ slug: pageSlug })
          if (existingPage) {
            return res.status(400).json({ success: false, message: 'URL slug已存在' })
          }
          
          const page = {
            title,
            content,
            slug: pageSlug,
            categoryId: categoryId ? new ObjectId(categoryId) : null,
            order,
            tags,
            published: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: new ObjectId(currentUser._id),
            updatedBy: new ObjectId(currentUser._id)
          }
          
          const result = await wikiPages.insertOne(page)
          
          return res.json({
            success: true,
            message: '页面创建成功',
            data: { _id: result.insertedId, ...page }
          })
        }

        default:
          return res.status(400).json({ success: false, message: '未知操作' })
      }
    }

    // PUT: 更新内容
    if (req.method === 'PUT') {
      switch (action) {
        case 'update-category': {
          const { categoryId, name, description, order } = req.body
          
          if (!categoryId || !name) {
            return res.status(400).json({ success: false, message: '分类ID和名称不能为空' })
          }
          
          const updateData = {
            name,
            description: description || '',
            order: order || 0,
            updatedAt: new Date()
          }
          
          const result = await wikiCategories.updateOne(
            { _id: new ObjectId(categoryId) },
            { $set: updateData }
          )
          
          if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, message: '分类不存在' })
          }
          
          return res.json({ success: true, message: '分类更新成功' })
        }

        case 'update-page': {
          const { pageId, title, content, categoryId, slug, order, tags, published } = req.body
          
          if (!pageId || !title || !content) {
            return res.status(400).json({ success: false, message: '页面ID、标题和内容不能为空' })
          }
          
          const updateData = {
            title,
            content,
            categoryId: categoryId ? new ObjectId(categoryId) : null,
            order: order || 0,
            tags: tags || [],
            published: published !== undefined ? published : true,
            updatedAt: new Date(),
            updatedBy: new ObjectId(currentUser._id)
          }
          
          if (slug) {
            // 检查slug是否与其他页面冲突
            const existingPage = await wikiPages.findOne({ 
              slug, 
              _id: { $ne: new ObjectId(pageId) } 
            })
            if (existingPage) {
              return res.status(400).json({ success: false, message: 'URL slug已存在' })
            }
            updateData.slug = slug
          }
          
          const result = await wikiPages.updateOne(
            { _id: new ObjectId(pageId) },
            { $set: updateData }
          )
          
          if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, message: '页面不存在' })
          }
          
          return res.json({ success: true, message: '页面更新成功' })
        }

        default:
          return res.status(400).json({ success: false, message: '未知操作' })
      }
    }

    // DELETE: 删除内容
    if (req.method === 'DELETE') {
      switch (action) {
        case 'delete-category': {
          const { categoryId } = req.body
          
          if (!categoryId) {
            return res.status(400).json({ success: false, message: '分类ID不能为空' })
          }
          
          // 检查分类下是否有页面
          const pagesCount = await wikiPages.countDocuments({ categoryId: new ObjectId(categoryId) })
          if (pagesCount > 0) {
            return res.status(400).json({ success: false, message: '分类下还有页面，无法删除' })
          }
          
          const result = await wikiCategories.deleteOne({ _id: new ObjectId(categoryId) })
          
          if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: '分类不存在' })
          }
          
          return res.json({ success: true, message: '分类删除成功' })
        }

        case 'delete-page': {
          const { pageId } = req.body
          
          if (!pageId) {
            return res.status(400).json({ success: false, message: '页面ID不能为空' })
          }
          
          const result = await wikiPages.deleteOne({ _id: new ObjectId(pageId) })
          
          if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: '页面不存在' })
          }
          
          return res.json({ success: true, message: '页面删除成功' })
        }

        default:
          return res.status(400).json({ success: false, message: '未知操作' })
      }
    }

    return res.status(405).json({ success: false, message: '方法不允许' })

  } catch (error) {
    console.error('Wiki Management API 错误:', error)
    return res.status(500).json({ 
      success: false, 
      message: error.message || '服务器错误' 
    })
  }
} 