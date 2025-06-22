const clientPromise = require('./_lib/mongodb');

module.exports = async function handler(req, res) {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // 检查环境变量
    const mongoUri = process.env.MONGODB_URI;
    const jwtSecret = process.env.JWT_SECRET;
    
    console.log('环境检查:');
    console.log('- MONGODB_URI:', mongoUri ? '已设置' : '未设置');
    console.log('- JWT_SECRET:', jwtSecret ? '已设置' : '未设置');

    if (!mongoUri) {
      return res.status(500).json({
        error: '环境变量错误',
        message: 'MONGODB_URI 未设置',
        details: '请在Vercel Dashboard中设置MONGODB_URI环境变量'
      });
    }

    if (!jwtSecret) {
      return res.status(500).json({
        error: '环境变量错误',
        message: 'JWT_SECRET 未设置',
        details: '请在Vercel Dashboard中设置JWT_SECRET环境变量'
      });
    }

    // 测试数据库连接
    const client = await clientPromise;
    const db = client.db('mxacc');
    
    // 尝试连接并获取集合信息
    const collections = await db.listCollections().toArray();
    console.log('数据库连接成功，集合列表:', collections.map(c => c.name));

    // 尝试查询users集合
    const users = db.collection('users');
    const userCount = await users.countDocuments();
    console.log('用户总数:', userCount);

    res.status(200).json({
      message: 'MXAcc API 运行正常',
      database: {
        connected: true,
        collections: collections.map(c => c.name),
        userCount: userCount
      },
      environment: {
        mongoUri: mongoUri ? '已配置' : '未配置',
        jwtSecret: jwtSecret ? '已配置' : '未配置',
        nodeEnv: process.env.NODE_ENV || 'development'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API测试错误:', error);
    
    res.status(500).json({
      error: '数据库连接失败',
      message: error.message,
      details: '请检查MONGODB_URI是否正确配置',
      timestamp: new Date().toISOString()
    });
  }
} 