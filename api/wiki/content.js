const clientPromise = require('../_lib/mongodb')
const { ObjectId } = require('mongodb')

module.exports = async function handler(req, res) {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // 只允许GET请求
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: '方法不允许' })
  }

  try {
    console.log('=== Wiki Content API ===')
    console.log('Query:', req.query)

    // 连接数据库
    const client = await clientPromise
    const db = client.db('mxacc')
    const wikiPages = db.collection('wiki_pages')
    const wikiCategories = db.collection('wiki_categories')

    const { action, pageId, slug, categoryId, search, page = 1, limit = 20 } = req.query

    switch (action) {
      case 'get-page': {
        let wikiPage
        
        if (pageId) {
          wikiPage = await wikiPages.findOne({ 
            _id: new ObjectId(pageId),
            published: true 
          })
        } else if (slug) {
          wikiPage = await wikiPages.findOne({ 
            slug,
            published: true 
          })
        } else {
          return res.status(400).json({ success: false, message: '请提供页面ID或slug' })
        }
        
        if (!wikiPage) {
          return res.status(404).json({ success: false, message: '页面不存在' })
        }
        
        // 获取分类信息
        if (wikiPage.categoryId) {
          const category = await wikiCategories.findOne({ _id: wikiPage.categoryId })
          if (category) {
            wikiPage.category = {
              _id: category._id,
              name: category.name,
              description: category.description
            }
          }
        }
        
        return res.json({ success: true, data: wikiPage })
      }

      case 'get-categories': {
        const categories = await wikiCategories.find({})
          .sort({ order: 1, name: 1 })
          .toArray()
        
        // 为每个分类获取页面数量
        for (const category of categories) {
          const pageCount = await wikiPages.countDocuments({ 
            categoryId: category._id,
            published: true 
          })
          category.pageCount = pageCount
        }
        
        return res.json({ success: true, data: categories })
      }

      case 'get-pages': {
        let query = { published: true }
        
        if (categoryId) {
          query.categoryId = new ObjectId(categoryId)
        }
        
        if (search) {
          query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } },
            { tags: { $in: [new RegExp(search, 'i')] } }
          ]
        }
        
        const skipCount = (parseInt(page) - 1) * parseInt(limit)
        
        const pages = await wikiPages.find(query)
          .sort({ order: 1, updatedAt: -1 })
          .skip(skipCount)
          .limit(parseInt(limit))
          .project({
            title: 1,
            slug: 1,
            categoryId: 1,
            tags: 1,
            createdAt: 1,
            updatedAt: 1,
            order: 1,
            // 只返回内容的摘要，不返回完整内容
            contentSummary: { $substr: ['$content', 0, 200] }
          })
          .toArray()
        
        const totalCount = await wikiPages.countDocuments(query)
        
        // 获取分类信息
        const categoryIds = [...new Set(pages.map(page => page.categoryId).filter(Boolean))]
        const categoriesMap = {}
        
        if (categoryIds.length > 0) {
          const categories = await wikiCategories.find({ 
            _id: { $in: categoryIds } 
          }).toArray()
          
          categories.forEach(cat => {
            categoriesMap[cat._id.toString()] = {
              _id: cat._id,
              name: cat.name
            }
          })
        }
        
        // 添加分类信息到页面
        pages.forEach(page => {
          if (page.categoryId && categoriesMap[page.categoryId.toString()]) {
            page.category = categoriesMap[page.categoryId.toString()]
          }
        })
        
        return res.json({ 
          success: true, 
          data: {
            pages,
            pagination: {
              current: parseInt(page),
              total: Math.ceil(totalCount / parseInt(limit)),
              count: totalCount,
              limit: parseInt(limit)
            }
          }
        })
      }

      case 'get-navigation': {
        // 获取完整的导航结构
        const categories = await wikiCategories.find({})
          .sort({ order: 1, name: 1 })
          .toArray()
        
        const navigation = []
        
        for (const category of categories) {
          const pages = await wikiPages.find({ 
            categoryId: category._id,
            published: true 
          })
            .sort({ order: 1, title: 1 })
            .project({
              _id: 1,
              title: 1,
              slug: 1,
              order: 1
            })
            .toArray()
          
          if (pages.length > 0) {
            navigation.push({
              _id: category._id,
              name: category.name,
              description: category.description,
              order: category.order,
              pages
            })
          }
        }
        
        return res.json({ success: true, data: navigation })
      }

      case 'search': {
        if (!search || search.trim().length < 2) {
          return res.status(400).json({ success: false, message: '搜索关键词至少需要2个字符' })
        }
        
        const searchQuery = {
          published: true,
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } },
            { tags: { $in: [new RegExp(search, 'i')] } }
          ]
        }
        
        const skipCount = (parseInt(page) - 1) * parseInt(limit)
        
        const searchResults = await wikiPages.find(searchQuery)
          .sort({ 
            // 相关性排序：标题匹配优先
            title: { $meta: 'textScore' },
            updatedAt: -1 
          })
          .skip(skipCount)
          .limit(parseInt(limit))
          .project({
            title: 1,
            slug: 1,
            categoryId: 1,
            tags: 1,
            createdAt: 1,
            updatedAt: 1,
            contentSummary: { $substr: ['$content', 0, 300] }
          })
          .toArray()
        
        const totalCount = await wikiPages.countDocuments(searchQuery)
        
        return res.json({
          success: true,
          data: {
            results: searchResults,
            query: search,
            pagination: {
              current: parseInt(page),
              total: Math.ceil(totalCount / parseInt(limit)),
              count: totalCount,
              limit: parseInt(limit)
            }
          }
        })
      }

      case 'get-recent': {
        const recentPages = await wikiPages.find({ published: true })
          .sort({ updatedAt: -1 })
          .limit(parseInt(limit) || 10)
          .project({
            title: 1,
            slug: 1,
            categoryId: 1,
            updatedAt: 1,
            contentSummary: { $substr: ['$content', 0, 150] }
          })
          .toArray()
        
        return res.json({ success: true, data: recentPages })
      }

      case 'get-stats': {
        const stats = await Promise.all([
          wikiPages.countDocuments({ published: true }),
          wikiCategories.countDocuments({}),
          wikiPages.aggregate([
            { $match: { published: true } },
            { $group: { _id: null, avgLength: { $avg: { $strLenCP: '$content' } } } }
          ]).toArray()
        ])
        
        return res.json({
          success: true,
          data: {
            totalPages: stats[0],
            totalCategories: stats[1],
            averageContentLength: Math.round(stats[2][0]?.avgLength || 0)
          }
        })
      }

      default:
        return res.status(400).json({ success: false, message: '未知操作' })
    }

  } catch (error) {
    console.error('Wiki Content API 错误:', error)
    return res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    })
  }
} 