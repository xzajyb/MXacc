# 🌟 MXacc 社交功能API完整指南

## 📋 API概览

MXacc项目现已整合完整的社交功能，包含4个主要API端点：

### 1. `/api/social/posts` - 帖子系统 ⭐
**支持功能：**
- ✅ 发布帖子
- ✅ 获取帖子列表（全部/关注/用户）  
- ✅ 点赞/取消点赞帖子
- ✅ 评论帖子（支持二级回复）
- ✅ 点赞/取消点赞评论
- ✅ 删除帖子（作者+管理员）

### 2. `/api/social/comments` - 评论系统 💬
**支持功能：**
- ✅ 获取评论列表（层级结构）
- ✅ 删除评论（作者+管理员）
- ✅ 评论点赞状态
- ✅ 二级回复支持

### 3. `/api/social/users` - 用户关系 👥
**支持功能：**
- ✅ 搜索用户
- ✅ 关注/取消关注
- ✅ 获取用户详情
- ✅ 关注者/关注列表

### 4. `/api/social/messages` - 私信系统 💌 **[新增]**
**支持功能：**
- ✅ 发送私信
- ✅ 获取对话列表
- ✅ 获取对话消息
- ✅ 标记已读
- ✅ 删除消息/对话

---

## 🚀 核心功能详解

### 📝 帖子API (`/api/social/posts`)

#### 1. 获取帖子列表
```http
GET /api/social/posts?type=feed&page=1&limit=10
Authorization: Bearer <token>
```

**参数说明：**
- `type`: `feed`(全部) | `following`(关注) | `user`(特定用户)
- `userId`: 当type=user时指定用户ID
- `page`: 页码（默认1）
- `limit`: 每页数量（默认10）

**响应示例：**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "post_id",
        "content": "帖子内容",
        "images": ["image1.jpg"],
        "author": {
          "id": "user_id",
          "username": "username",
          "nickname": "昵称",
          "avatar": "avatar.jpg"
        },
        "likesCount": 5,
        "commentsCount": 3,
        "isLiked": false,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

#### 2. 发布帖子
```http
POST /api/social/posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "create",
  "content": "帖子内容",
  "images": ["可选图片数组"]
}
```

#### 3. 点赞帖子
```http
POST /api/social/posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "like",
  "postId": "帖子ID"
}
```

#### 4. 评论帖子
```http
POST /api/social/posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "comment",
  "postId": "帖子ID", 
  "commentContent": "评论内容",
  "parentCommentId": "可选，回复评论ID"
}
```

#### 5. 点赞评论
```http
POST /api/social/posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "like-comment",
  "commentId": "评论ID"
}
```

#### 6. 删除帖子
```http
DELETE /api/social/posts?postId=帖子ID
Authorization: Bearer <token>
```

---

### 💬 评论API (`/api/social/comments`)

#### 获取评论列表（层级结构）
```http
GET /api/social/comments?postId=帖子ID&page=1&limit=20
Authorization: Bearer <token>
```

**响应特点：**
- 自动组织为层级结构（一级评论+二级回复）
- 包含点赞状态和回复数量
- 支持分页

**响应示例：**
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "comment_id",
        "content": "评论内容",
        "parentCommentId": null,
        "author": { /* 作者信息 */ },
        "likesCount": 2,
        "isLiked": false,
        "repliesCount": 1,
        "replies": [
          {
            "id": "reply_id",
            "content": "回复内容",
            "parentCommentId": "comment_id",
            "author": { /* 作者信息 */ },
            "likesCount": 0,
            "isLiked": false,
            "repliesCount": 0,
            "createdAt": "2024-01-01T00:00:00.000Z"
          }
        ],
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 👥 用户关系API (`/api/social/users`)

#### 1. 搜索用户
```http
GET /api/social/users?action=search&search=关键词&page=1&limit=20
Authorization: Bearer <token>
```

#### 2. 获取用户详情
```http
GET /api/social/users?action=profile&userId=用户ID
Authorization: Bearer <token>
```

#### 3. 关注用户
```http
POST /api/social/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "follow",
  "userId": "目标用户ID"
}
```

#### 4. 取消关注
```http
POST /api/social/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "unfollow", 
  "userId": "目标用户ID"
}
```

---

### 💌 私信API (`/api/social/messages`) **[新功能]**

#### 1. 获取对话列表
```http
GET /api/social/messages?action=conversations&page=1&limit=20
Authorization: Bearer <token>
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "conversation_id",
        "conversationId": "conv_user1_user2",
        "otherUser": {
          "id": "user_id",
          "username": "username",
          "nickname": "昵称",
          "avatar": "avatar.jpg"
        },
        "lastMessage": "最后一条消息",
        "lastMessageAt": "2024-01-01T00:00:00.000Z",
        "unreadCount": 3,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

#### 2. 获取对话消息
```http
GET /api/social/messages?action=messages&conversationId=对话ID&page=1&limit=50
Authorization: Bearer <token>
```

#### 3. 发送私信
```http
POST /api/social/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "send",
  "receiverId": "接收者ID",
  "content": "消息内容",
  "messageType": "text"
}
```

#### 4. 标记已读
```http
PUT /api/social/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "mark-read",
  "conversationId": "对话ID"
}
```

#### 5. 删除消息
```http
DELETE /api/social/messages?messageId=消息ID
Authorization: Bearer <token>
```

#### 6. 删除对话
```http
DELETE /api/social/messages?conversationId=对话ID
Authorization: Bearer <token>
```

---

## 🗄️ 数据库结构

### 新增集合说明：

#### 1. `messages` - 私信消息
```javascript
{
  _id: ObjectId,
  conversationId: ObjectId, // 对话ID
  senderId: ObjectId,       // 发送者ID
  receiverId: ObjectId,     // 接收者ID  
  content: String,          // 消息内容
  messageType: String,      // 消息类型：text/image/file
  readAt: Date,             // 已读时间（可选）
  createdAt: Date
}
```

#### 2. `conversations` - 对话
```javascript
{
  _id: ObjectId,
  conversationId: String,   // 唯一对话标识：conv_userId1_userId2
  participants: [ObjectId], // 参与者ID数组
  lastMessage: String,      // 最后一条消息
  lastMessageAt: Date,      // 最后消息时间
  createdAt: Date
}
```

#### 3. `likes` - 点赞（扩展）
```javascript
{
  _id: ObjectId,
  postId: ObjectId,         // 帖子ID（可选）
  commentId: ObjectId,      // 评论ID（可选）
  userId: ObjectId,         // 点赞用户ID
  type: String,             // 类型：like/comment-like
  createdAt: Date
}
```

#### 4. `comments` - 评论（扩展）
```javascript
{
  _id: ObjectId,
  postId: ObjectId,         // 帖子ID
  authorId: ObjectId,       // 评论作者ID
  content: String,          // 评论内容
  parentCommentId: ObjectId, // 父评论ID（二级评论）
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔧 开发使用示例

### JavaScript/TypeScript 客户端示例：

```typescript
// 发布帖子
const createPost = async (content: string, images?: string[]) => {
  const response = await fetch('/api/social/posts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'create',
      content,
      images
    })
  })
  return response.json()
}

// 发送私信
const sendMessage = async (receiverId: string, content: string) => {
  const response = await fetch('/api/social/messages', {
    method: 'POST', 
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'send',
      receiverId,
      content
    })
  })
  return response.json()
}

// 点赞帖子
const likePost = async (postId: string) => {
  const response = await fetch('/api/social/posts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'like',
      postId
    })
  })
  return response.json()
}
```

---

## ✨ 新功能亮点

### 🎯 API合并优化
- **减少API数量**：从原来的多个端点合并为4个统一端点
- **功能集成**：posts API同时支持帖子、评论、点赞等多种操作
- **统一响应格式**：所有API使用相同的响应结构

### 🔐 权限控制完善  
- **帖子删除**：✅ 作者和管理员均可删除
- **评论删除**：✅ 作者和管理员均可删除  
- **私信访问**：✅ 只有对话参与者可访问
- **消息删除**：✅ 发送者和管理员可删除

### 🌟 新增功能
- **二级评论**：支持对评论进行回复
- **评论点赞**：可以对评论进行点赞
- **私信系统**：完整的一对一私信功能
- **已读状态**：私信支持已读/未读状态
- **层级结构**：评论自动组织为树状结构

### 📊 数据统计
- **未读消息数**：实时统计未读私信数量
- **回复数量**：统计评论的回复数量
- **点赞统计**：分别统计帖子和评论的点赞数

---

## 🚀 下一步开发建议

1. **实时功能**：集成WebSocket支持实时私信和通知
2. **文件上传**：支持私信发送图片和文件
3. **消息搜索**：在对话中搜索历史消息
4. **群组功能**：扩展支持多人群聊
5. **消息撤回**：支持消息撤回功能

---

**🎉 恭喜！MXacc社交功能现已完整实现，支持帖子、评论、点赞、关注、私信等全套社交功能！** 