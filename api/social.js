import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

// MongoDB连接
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('mxacc');

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

// 智能缓存管理器
class SocialCacheManager {
  constructor() {
    this.cache = {
      posts: new Map(),
      comments: new Map(),
      likes: new Map(),
      users: new Map(),
      follows: new Map(),
      messages: new Map(),
      conversations: new Map()
    };
    
    this.limits = {
      posts: 2000,
      comments: 5000,
      likes: 10000,
      users: 3000,
      follows: 8000,
      messages: 4000,
      conversations: 1000
    };
    
    this.lastSync = Date.now();
    this.syncInterval = 5 * 60 * 1000; // 5分钟
    
    // 启动定期同步
    setInterval(() => this.syncToDatabase(), this.syncInterval);
  }

  // LRU清理策略
  cleanupCache(type) {
    const cache = this.cache[type];
    const limit = this.limits[type];
    
    if (cache.size <= limit) return;
    
    const entries = Array.from(cache.entries())
      .sort((a, b) => (a[1].lastAccess || 0) - (b[1].lastAccess || 0));
    
    const toRemove = Math.floor(cache.size * 0.2);
    for (let i = 0; i < toRemove; i++) {
      cache.delete(entries[i][0]);
    }
  }

  // 获取缓存数据
  get(type, key) {
    const item = this.cache[type].get(key);
    if (item) {
      item.lastAccess = Date.now();
      return item.data;
    }
    return null;
  }

  // 设置缓存数据
  set(type, key, data) {
    this.cache[type].set(key, {
      data,
      lastAccess: Date.now(),
      lastModified: Date.now()
    });
    this.cleanupCache(type);
  }

  // 删除缓存数据
  delete(type, key) {
    this.cache[type].delete(key);
  }

  // 获取缓存状态
  getStatus() {
    const status = {};
    for (const [type, cache] of Object.entries(this.cache)) {
      status[type] = {
        count: cache.size,
        limit: this.limits[type],
        usage: (cache.size / this.limits[type] * 100).toFixed(1) + '%'
      };
    }
    return {
      ...status,
      lastSync: new Date(this.lastSync).toISOString(),
      nextSync: new Date(this.lastSync + this.syncInterval).toISOString()
    };
  }

  // 同步到数据库
  async syncToDatabase() {
    try {
      const { db } = await connectToDatabase();
      
      // 这里可以实现批量同步逻辑
      // 目前采用实时双写策略，所以这里主要做清理工作
      
      this.lastSync = Date.now();
      console.log('Cache sync completed at:', new Date().toISOString());
    } catch (error) {
      console.error('Cache sync failed:', error);
    }
  }
}

// 全局缓存实例
const cache = new SocialCacheManager();

// JWT验证中间件
async function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('未提供有效的认证令牌');
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error('无效的认证令牌');
  }
}

// 获取用户信息
async function getUserById(db, userId) {
  // 先从缓存获取
  const cachedUser = cache.get('users', userId);
  if (cachedUser) {
    return cachedUser;
  }

  // 从数据库获取
  const user = await db.collection('users').findOne(
    { _id: new ObjectId(userId) },
    { projection: { password: 0 } }
  );

  if (user) {
    // 处理字段兼容性
    if (user.security?.emailVerified !== undefined) {
      user.isEmailVerified = user.security.emailVerified;
    }
    
    // 缓存用户信息
    cache.set('users', userId, user);
  }

  return user;
}

// 帖子相关功能
async function handlePosts(req, res, db, action) {
  switch (action) {
    case 'list':
      return await listPosts(req, res, db);
    case 'create':
      return await createPost(req, res, db);
    case 'like':
      return await likePost(req, res, db);
    default:
      return res.status(400).json({ error: '无效的操作' });
  }
}

async function listPosts(req, res, db) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 先尝试从缓存获取
    const cacheKey = `posts_${page}_${limit}`;
    const cachedPosts = cache.get('posts', cacheKey);
    
    if (cachedPosts) {
      return res.json(cachedPosts);
    }

    // 从数据库获取
    const posts = await db.collection('posts')
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    // 获取每个帖子的作者信息、点赞数和评论数
    const enrichedPosts = await Promise.all(posts.map(async (post) => {
      const author = await getUserById(db, post.authorId);
      
      // 获取点赞数
      const likesCount = await db.collection('likes').countDocuments({
        targetId: post._id.toString(),
        type: 'post'
      });

      // 获取评论数
      const commentsCount = await db.collection('comments').countDocuments({
        postId: post._id.toString()
      });

      return {
        ...post,
        author: author ? {
          _id: author._id,
          username: author.username,
          email: author.email,
          avatar: author.profile?.avatar
        } : null,
        likesCount,
        commentsCount
      };
    }));

    // 缓存结果
    cache.set('posts', cacheKey, enrichedPosts);

    res.json(enrichedPosts);
  } catch (error) {
    console.error('获取帖子列表失败:', error);
    res.status(500).json({ error: '获取帖子列表失败' });
  }
}

async function createPost(req, res, db) {
  try {
    const decoded = await verifyToken(req);
    const { content, images } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: '帖子内容不能为空' });
    }

    const post = {
      content: content.trim(),
      images: images || [],
      authorId: decoded.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('posts').insertOne(post);
    const newPost = await db.collection('posts').findOne({ _id: result.insertedId });
    
    // 获取作者信息
    const author = await getUserById(db, decoded.userId);
    
    const enrichedPost = {
      ...newPost,
      author: author ? {
        _id: author._id,
        username: author.username,
        email: author.email,
        avatar: author.profile?.avatar
      } : null,
      likesCount: 0,
      commentsCount: 0
    };

    // 缓存新帖子
    cache.set('posts', newPost._id.toString(), enrichedPost);

    res.status(201).json(enrichedPost);
  } catch (error) {
    console.error('创建帖子失败:', error);
    res.status(500).json({ error: error.message || '创建帖子失败' });
  }
}

async function likePost(req, res, db) {
  try {
    const decoded = await verifyToken(req);
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({ error: '帖子ID不能为空' });
    }

    // 检查是否已经点赞
    const existingLike = await db.collection('likes').findOne({
      userId: decoded.userId,
      targetId: postId,
      type: 'post'
    });

    if (existingLike) {
      // 取消点赞
      await db.collection('likes').deleteOne({ _id: existingLike._id });
      cache.delete('likes', `${decoded.userId}_${postId}_post`);
      res.json({ liked: false, message: '已取消点赞' });
    } else {
      // 添加点赞
      const like = {
        userId: decoded.userId,
        targetId: postId,
        type: 'post',
        createdAt: new Date()
      };
      
      await db.collection('likes').insertOne(like);
      cache.set('likes', `${decoded.userId}_${postId}_post`, like);
      res.json({ liked: true, message: '点赞成功' });
    }
  } catch (error) {
    console.error('点赞操作失败:', error);
    res.status(500).json({ error: error.message || '点赞操作失败' });
  }
}

// 评论相关功能
async function handleComments(req, res, db, action) {
  switch (action) {
    case 'list':
      return await listComments(req, res, db);
    case 'create':
      return await createComment(req, res, db);
    case 'like':
      return await likeComment(req, res, db);
    case 'delete':
      return await deleteComment(req, res, db);
    default:
      return res.status(400).json({ error: '无效的操作' });
  }
}

async function listComments(req, res, db) {
  try {
    const { postId } = req.query;

    if (!postId) {
      return res.status(400).json({ error: '帖子ID不能为空' });
    }

    // 先尝试从缓存获取
    const cacheKey = `comments_${postId}`;
    const cachedComments = cache.get('comments', cacheKey);
    
    if (cachedComments) {
      return res.json(cachedComments);
    }

    // 获取所有评论（包括二级评论）
    const comments = await db.collection('comments')
      .find({ postId })
      .sort({ createdAt: 1 })
      .toArray();

    // 获取每个评论的作者信息和点赞数
    const enrichedComments = await Promise.all(comments.map(async (comment) => {
      const author = await getUserById(db, comment.authorId);
      
      // 获取点赞数
      const likesCount = await db.collection('likes').countDocuments({
        targetId: comment._id.toString(),
        type: 'comment'
      });

      // 获取回复数（仅对一级评论）
      let repliesCount = 0;
      if (!comment.parentCommentId) {
        repliesCount = await db.collection('comments').countDocuments({
          parentCommentId: comment._id.toString()
        });
      }

      return {
        ...comment,
        author: author ? {
          _id: author._id,
          username: author.username,
          email: author.email,
          avatar: author.profile?.avatar
        } : null,
        likesCount,
        repliesCount
      };
    }));

    // 组织评论结构（一级评论 + 二级评论）
    const topLevelComments = enrichedComments.filter(c => !c.parentCommentId);
    const replies = enrichedComments.filter(c => c.parentCommentId);

    const structuredComments = topLevelComments.map(comment => ({
      ...comment,
      replies: replies.filter(reply => reply.parentCommentId === comment._id.toString())
    }));

    // 缓存结果
    cache.set('comments', cacheKey, structuredComments);

    res.json(structuredComments);
  } catch (error) {
    console.error('获取评论失败:', error);
    res.status(500).json({ error: '获取评论失败' });
  }
}

async function createComment(req, res, db) {
  try {
    const decoded = await verifyToken(req);
    const { postId, content, parentCommentId } = req.body;

    if (!postId || !content || content.trim().length === 0) {
      return res.status(400).json({ error: '帖子ID和评论内容不能为空' });
    }

    // 确定评论级别
    let level = 1;
    if (parentCommentId) {
      const parentComment = await db.collection('comments').findOne({
        _id: new ObjectId(parentCommentId)
      });
      
      if (!parentComment) {
        return res.status(404).json({ error: '父评论不存在' });
      }
      
      // 限制最多2级评论
      if (parentComment.level >= 2) {
        return res.status(400).json({ error: '评论嵌套层级不能超过2级' });
      }
      
      level = parentComment.level + 1;
    }

    const comment = {
      postId,
      content: content.trim(),
      authorId: decoded.userId,
      parentCommentId: parentCommentId || null,
      level,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('comments').insertOne(comment);
    const newComment = await db.collection('comments').findOne({ _id: result.insertedId });
    
    // 获取作者信息
    const author = await getUserById(db, decoded.userId);
    
    const enrichedComment = {
      ...newComment,
      author: author ? {
        _id: author._id,
        username: author.username,
        email: author.email,
        avatar: author.profile?.avatar
      } : null,
      likesCount: 0,
      repliesCount: 0
    };

    // 缓存新评论
    cache.set('comments', newComment._id.toString(), enrichedComment);

    res.status(201).json(enrichedComment);
  } catch (error) {
    console.error('创建评论失败:', error);
    res.status(500).json({ error: error.message || '创建评论失败' });
  }
}

async function likeComment(req, res, db) {
  try {
    const decoded = await verifyToken(req);
    const { commentId } = req.body;

    if (!commentId) {
      return res.status(400).json({ error: '评论ID不能为空' });
    }

    // 检查是否已经点赞
    const existingLike = await db.collection('likes').findOne({
      userId: decoded.userId,
      targetId: commentId,
      type: 'comment'
    });

    if (existingLike) {
      // 取消点赞
      await db.collection('likes').deleteOne({ _id: existingLike._id });
      cache.delete('likes', `${decoded.userId}_${commentId}_comment`);
      res.json({ liked: false, message: '已取消点赞' });
    } else {
      // 添加点赞
      const like = {
        userId: decoded.userId,
        targetId: commentId,
        type: 'comment',
        createdAt: new Date()
      };
      
      await db.collection('likes').insertOne(like);
      cache.set('likes', `${decoded.userId}_${commentId}_comment`, like);
      res.json({ liked: true, message: '点赞成功' });
    }
  } catch (error) {
    console.error('评论点赞操作失败:', error);
    res.status(500).json({ error: error.message || '评论点赞操作失败' });
  }
}

async function deleteComment(req, res, db) {
  try {
    const decoded = await verifyToken(req);
    const { commentId } = req.body;

    if (!commentId) {
      return res.status(400).json({ error: '评论ID不能为空' });
    }

    // 获取评论信息
    const comment = await db.collection('comments').findOne({
      _id: new ObjectId(commentId)
    });

    if (!comment) {
      return res.status(404).json({ error: '评论不存在' });
    }

    // 检查权限（只能删除自己的评论）
    if (comment.authorId !== decoded.userId) {
      return res.status(403).json({ error: '只能删除自己的评论' });
    }

    // 删除评论及其所有回复
    await db.collection('comments').deleteMany({
      $or: [
        { _id: new ObjectId(commentId) },
        { parentCommentId: commentId }
      ]
    });

    // 删除相关点赞
    await db.collection('likes').deleteMany({
      targetId: commentId,
      type: 'comment'
    });

    // 清理缓存
    cache.delete('comments', commentId);

    res.json({ message: '评论删除成功' });
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(500).json({ error: error.message || '删除评论失败' });
  }
}

// 私信相关功能
async function handleMessages(req, res, db, action) {
  switch (action) {
    case 'conversations':
      return await getConversations(req, res, db);
    case 'messages':
      return await getMessages(req, res, db);
    case 'send':
      return await sendMessage(req, res, db);
    case 'search-users':
      return await searchUsers(req, res, db);
    case 'mark-read':
      return await markMessagesAsRead(req, res, db);
    default:
      return res.status(400).json({ error: '无效的操作' });
  }
}

async function getConversations(req, res, db) {
  try {
    const decoded = await verifyToken(req);

    // 先尝试从缓存获取
    const cacheKey = `conversations_${decoded.userId}`;
    const cachedConversations = cache.get('conversations', cacheKey);
    
    if (cachedConversations) {
      return res.json(cachedConversations);
    }

    const conversations = await db.collection('conversations')
      .find({
        participants: decoded.userId
      })
      .sort({ lastMessageAt: -1 })
      .toArray();

    // 获取每个对话的对方用户信息和最后一条消息
    const enrichedConversations = await Promise.all(conversations.map(async (conv) => {
      const otherUserId = conv.participants.find(p => p !== decoded.userId);
      const otherUser = await getUserById(db, otherUserId);
      
      // 获取最后一条消息
      const lastMessage = await db.collection('messages')
        .findOne(
          { conversationId: conv._id.toString() },
          { sort: { createdAt: -1 } }
        );

      // 获取未读消息数
      const unreadCount = await db.collection('messages').countDocuments({
        conversationId: conv._id.toString(),
        senderId: { $ne: decoded.userId },
        isRead: false
      });

      return {
        ...conv,
        otherUser: otherUser ? {
          _id: otherUser._id,
          username: otherUser.username,
          email: otherUser.email,
          avatar: otherUser.profile?.avatar,
          isOnline: otherUser.isOnline || false,
          lastSeen: otherUser.lastSeen
        } : null,
        lastMessage,
        unreadCount
      };
    }));

    // 缓存结果
    cache.set('conversations', cacheKey, enrichedConversations);

    res.json(enrichedConversations);
  } catch (error) {
    console.error('获取对话列表失败:', error);
    res.status(500).json({ error: error.message || '获取对话列表失败' });
  }
}

async function getMessages(req, res, db) {
  try {
    const decoded = await verifyToken(req);
    const { conversationId, page = 1, limit = 50 } = req.query;

    if (!conversationId) {
      return res.status(400).json({ error: '对话ID不能为空' });
    }

    // 先尝试从缓存获取
    const cacheKey = `messages_${conversationId}_${page}_${limit}`;
    const cachedMessages = cache.get('messages', cacheKey);
    
    if (cachedMessages) {
      return res.json(cachedMessages);
    }

    // 验证用户是否属于该对话
    const conversation = await db.collection('conversations').findOne({
      _id: new ObjectId(conversationId),
      participants: decoded.userId
    });

    if (!conversation) {
      return res.status(403).json({ error: '无权访问此对话' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const messages = await db.collection('messages')
      .find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    // 获取每条消息的发送者信息
    const enrichedMessages = await Promise.all(messages.map(async (message) => {
      const sender = await getUserById(db, message.senderId);
      
      return {
        ...message,
        sender: sender ? {
          _id: sender._id,
          username: sender.username,
          email: sender.email,
          avatar: sender.profile?.avatar
        } : null
      };
    }));

    // 缓存结果
    cache.set('messages', cacheKey, enrichedMessages);

    res.json(enrichedMessages.reverse()); // 按时间正序返回
  } catch (error) {
    console.error('获取消息失败:', error);
    res.status(500).json({ error: error.message || '获取消息失败' });
  }
}

async function sendMessage(req, res, db) {
  try {
    const decoded = await verifyToken(req);
    const { recipientId, content } = req.body;

    if (!recipientId || !content || content.trim().length === 0) {
      return res.status(400).json({ error: '接收者ID和消息内容不能为空' });
    }

    if (recipientId === decoded.userId) {
      return res.status(400).json({ error: '不能给自己发送消息' });
    }

    // 检查接收者是否存在
    const recipient = await getUserById(db, recipientId);
    if (!recipient) {
      return res.status(404).json({ error: '接收者不存在' });
    }

    // 查找或创建对话
    let conversation = await db.collection('conversations').findOne({
      participants: { $all: [decoded.userId, recipientId] }
    });

    if (!conversation) {
      // 创建新对话
      const newConversation = {
        participants: [decoded.userId, recipientId],
        createdAt: new Date(),
        lastMessageAt: new Date()
      };
      
      const result = await db.collection('conversations').insertOne(newConversation);
      conversation = { ...newConversation, _id: result.insertedId };
    }

    // 创建消息
    const message = {
      conversationId: conversation._id.toString(),
      senderId: decoded.userId,
      content: content.trim(),
      isRead: false,
      createdAt: new Date()
    };

    const messageResult = await db.collection('messages').insertOne(message);
    
    // 更新对话的最后消息时间
    await db.collection('conversations').updateOne(
      { _id: conversation._id },
      { $set: { lastMessageAt: new Date() } }
    );

    // 获取完整的消息信息
    const newMessage = await db.collection('messages').findOne({ _id: messageResult.insertedId });
    const sender = await getUserById(db, decoded.userId);
    
    const enrichedMessage = {
      ...newMessage,
      sender: sender ? {
        _id: sender._id,
        username: sender.username,
        email: sender.email,
        avatar: sender.profile?.avatar
      } : null
    };

    // 缓存新消息
    cache.set('messages', newMessage._id.toString(), enrichedMessage);

    res.status(201).json(enrichedMessage);
  } catch (error) {
    console.error('发送消息失败:', error);
    res.status(500).json({ error: error.message || '发送消息失败' });
  }
}

async function searchUsers(req, res, db) {
  try {
    const decoded = await verifyToken(req);
    const { query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: '搜索关键词至少需要2个字符' });
    }

    const searchRegex = new RegExp(query.trim(), 'i');
    const users = await db.collection('users')
      .find({
        $and: [
          { _id: { $ne: new ObjectId(decoded.userId) } }, // 排除自己
          {
            $or: [
              { username: { $regex: searchRegex } },
              { email: { $regex: searchRegex } }
            ]
          }
        ]
      })
      .limit(10)
      .project({
        _id: 1,
        username: 1,
        email: 1,
        'profile.avatar': 1,
        isOnline: 1,
        lastSeen: 1
      })
      .toArray();

    res.json(users);
  } catch (error) {
    console.error('搜索用户失败:', error);
    res.status(500).json({ error: error.message || '搜索用户失败' });
  }
}

async function markMessagesAsRead(req, res, db) {
  try {
    const decoded = await verifyToken(req);
    const { conversationId } = req.body;

    if (!conversationId) {
      return res.status(400).json({ error: '对话ID不能为空' });
    }

    // 验证用户是否属于该对话
    const conversation = await db.collection('conversations').findOne({
      _id: new ObjectId(conversationId),
      participants: decoded.userId
    });

    if (!conversation) {
      return res.status(403).json({ error: '无权访问此对话' });
    }

    // 将该对话中其他人发给当前用户的未读消息标记为已读
    await db.collection('messages').updateMany(
      {
        conversationId,
        senderId: { $ne: decoded.userId },
        isRead: false
      },
      {
        $set: { isRead: true, readAt: new Date() }
      }
    );

    res.json({ message: '消息已标记为已读' });
  } catch (error) {
    console.error('标记消息已读失败:', error);
    res.status(500).json({ error: error.message || '标记消息已读失败' });
  }
}

// 用户相关功能
async function handleUsers(req, res, db, action) {
  switch (action) {
    case 'follow':
      return await followUser(req, res, db);
    case 'unfollow':
      return await unfollowUser(req, res, db);
    case 'followers':
      return await getFollowers(req, res, db);
    case 'following':
      return await getFollowing(req, res, db);
    case 'profile':
      return await getUserProfile(req, res, db);
    case 'update-online-status':
      return await updateOnlineStatus(req, res, db);
    default:
      return res.status(400).json({ error: '无效的操作' });
  }
}

async function followUser(req, res, db) {
  try {
    const decoded = await verifyToken(req);
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: '目标用户ID不能为空' });
    }

    if (targetUserId === decoded.userId) {
      return res.status(400).json({ error: '不能关注自己' });
    }

    // 检查目标用户是否存在
    const targetUser = await getUserById(db, targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: '目标用户不存在' });
    }

    // 检查是否已经关注
    const existingFollow = await db.collection('follows').findOne({
      followerId: decoded.userId,
      followingId: targetUserId
    });

    if (existingFollow) {
      return res.status(400).json({ error: '已经关注了该用户' });
    }

    // 创建关注关系
    const follow = {
      followerId: decoded.userId,
      followingId: targetUserId,
      createdAt: new Date()
    };

    await db.collection('follows').insertOne(follow);
    cache.set('follows', `${decoded.userId}_${targetUserId}`, follow);

    res.json({ message: '关注成功' });
  } catch (error) {
    console.error('关注用户失败:', error);
    res.status(500).json({ error: error.message || '关注用户失败' });
  }
}

async function unfollowUser(req, res, db) {
  try {
    const decoded = await verifyToken(req);
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: '目标用户ID不能为空' });
    }

    // 删除关注关系
    const result = await db.collection('follows').deleteOne({
      followerId: decoded.userId,
      followingId: targetUserId
    });

    if (result.deletedCount === 0) {
      return res.status(400).json({ error: '未关注该用户' });
    }

    cache.delete('follows', `${decoded.userId}_${targetUserId}`);

    res.json({ message: '取消关注成功' });
  } catch (error) {
    console.error('取消关注失败:', error);
    res.status(500).json({ error: error.message || '取消关注失败' });
  }
}

async function getFollowers(req, res, db) {
  try {
    const { userId } = req.query;
    const targetUserId = userId || (await verifyToken(req)).userId;

    // 先尝试从缓存获取
    const cacheKey = `followers_${targetUserId}`;
    const cachedFollowers = cache.get('follows', cacheKey);
    
    if (cachedFollowers) {
      return res.json(cachedFollowers);
    }

    const follows = await db.collection('follows')
      .find({ followingId: targetUserId })
      .toArray();

    const followers = await Promise.all(follows.map(async (follow) => {
      const follower = await getUserById(db, follow.followerId);
      return follower ? {
        _id: follower._id,
        username: follower.username,
        email: follower.email,
        avatar: follower.profile?.avatar,
        followedAt: follow.createdAt
      } : null;
    }));

    const validFollowers = followers.filter(f => f !== null);
    
    // 缓存结果
    cache.set('follows', cacheKey, validFollowers);

    res.json(validFollowers);
  } catch (error) {
    console.error('获取粉丝列表失败:', error);
    res.status(500).json({ error: error.message || '获取粉丝列表失败' });
  }
}

async function getFollowing(req, res, db) {
  try {
    const { userId } = req.query;
    const targetUserId = userId || (await verifyToken(req)).userId;

    // 先尝试从缓存获取
    const cacheKey = `following_${targetUserId}`;
    const cachedFollowing = cache.get('follows', cacheKey);
    
    if (cachedFollowing) {
      return res.json(cachedFollowing);
    }

    const follows = await db.collection('follows')
      .find({ followerId: targetUserId })
      .toArray();

    const following = await Promise.all(follows.map(async (follow) => {
      const followedUser = await getUserById(db, follow.followingId);
      return followedUser ? {
        _id: followedUser._id,
        username: followedUser.username,
        email: followedUser.email,
        avatar: followedUser.profile?.avatar,
        followedAt: follow.createdAt
      } : null;
    }));

    const validFollowing = following.filter(f => f !== null);
    
    // 缓存结果
    cache.set('follows', cacheKey, validFollowing);

    res.json(validFollowing);
  } catch (error) {
    console.error('获取关注列表失败:', error);
    res.status(500).json({ error: error.message || '获取关注列表失败' });
  }
}

async function getUserProfile(req, res, db) {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: '用户ID不能为空' });
    }

    const user = await getUserById(db, userId);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 获取统计信息
    const [postsCount, followersCount, followingCount] = await Promise.all([
      db.collection('posts').countDocuments({ authorId: userId }),
      db.collection('follows').countDocuments({ followingId: userId }),
      db.collection('follows').countDocuments({ followerId: userId })
    ]);

    const profile = {
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.profile?.avatar,
      bio: user.profile?.bio,
      isOnline: user.isOnline || false,
      lastSeen: user.lastSeen,
      stats: {
        postsCount,
        followersCount,
        followingCount
      }
    };

    res.json(profile);
  } catch (error) {
    console.error('获取用户资料失败:', error);
    res.status(500).json({ error: error.message || '获取用户资料失败' });
  }
}

async function updateOnlineStatus(req, res, db) {
  try {
    const decoded = await verifyToken(req);
    const { isOnline } = req.body;

    const updateData = {
      isOnline: Boolean(isOnline),
      lastSeen: new Date()
    };

    await db.collection('users').updateOne(
      { _id: new ObjectId(decoded.userId) },
      { $set: updateData }
    );

    // 更新缓存
    const cachedUser = cache.get('users', decoded.userId);
    if (cachedUser) {
      cache.set('users', decoded.userId, { ...cachedUser, ...updateData });
    }

    res.json({ message: '在线状态更新成功' });
  } catch (error) {
    console.error('更新在线状态失败:', error);
    res.status(500).json({ error: error.message || '更新在线状态失败' });
  }
}

// 缓存状态功能
async function getCacheStatus(req, res) {
  try {
    const status = cache.getStatus();
    
    // 计算总内存使用情况
    const totalItems = Object.values(status).reduce((sum, cache) => {
      if (typeof cache === 'object' && cache.count) {
        return sum + cache.count;
      }
      return sum;
    }, 0);

    const memoryInfo = {
      totalCachedItems: totalItems,
      estimatedMemoryUsage: '约 ' + Math.round(totalItems * 0.1) + 'MB',
      maxMemoryLimit: '512MB',
      ...status
    };

    res.json(memoryInfo);
  } catch (error) {
    console.error('获取缓存状态失败:', error);
    res.status(500).json({ error: '获取缓存状态失败' });
  }
}

// 主处理函数
export default async function handler(req, res) {
  // 设置CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { db } = await connectToDatabase();
    const { type, action } = req.query;

    switch (type) {
      case 'posts':
        return await handlePosts(req, res, db, action);
      case 'comments':
        return await handleComments(req, res, db, action);
      case 'messages':
        return await handleMessages(req, res, db, action);
      case 'users':
        return await handleUsers(req, res, db, action);
      case 'cache-status':
        return await getCacheStatus(req, res);
      default:
        return res.status(400).json({ error: '无效的API类型' });
    }
  } catch (error) {
    console.error('API处理失败:', error);
    res.status(500).json({ error: error.message || 'API处理失败' });
  }
}