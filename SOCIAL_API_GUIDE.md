# 🚀 MXacc 社交功能API指南

## 📊 API架构概览

社交功能已从3个API优化为2个统一API：

1. **`/api/social/content`** - 内容管理API
2. **`/api/social/messaging`** - 社交和私信API

## 🔗 API详细说明

### 1. Content API (`/api/social/content`)

#### 获取帖子列表
```http
GET /api/social/content?action=posts&type=feed&page=1&limit=10
Authorization: Bearer <token>
```

**参数说明：**
- `action`: `posts` (默认值，可省略)
- `type`: `feed`(全部) | `following`(关注) | `user`(用户)
- `userId`: 当type=user时，指定用户ID
- `page`: 页码 (默认1)
- `limit`: 每页数量 (默认10)

**响应示例：**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "...",
        "content": "帖子内容",
        "images": [],
        "author": {
          "id": "...",
          "username": "用户名",
          "nickname": "昵称",
          "avatar": "头像URL"
        },
        "likesCount": 5,
        "commentsCount": 3,
        "isLiked": false,
        "canDelete": false,
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

#### 获取评论列表（支持二级评论）
```http
GET /api/social/content?action=comments&postId=<postId>&page=1&limit=20
Authorization: Bearer <token>
```

**响应包含二级评论预览：**
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "...",
        "content": "评论内容",
        "author": {...},
        "likesCount": 2,
        "repliesCount": 5,
        "isLiked": false,
        "replies": [
          {
            "id": "...",
            "content": "回复内容",
            "author": {...},
            "replyTo": {
              "id": "...",
              "username": "被回复的用户"
            },
            "canDelete": false,
            "createdAt": "..."
          }
        ],
        "canDelete": false,
        "createdAt": "..."
      }
    ]
  }
}
```

#### 获取二级评论详情
```http
GET /api/social/content?action=replies&commentId=<commentId>&page=1&limit=20
Authorization: Bearer <token>
```

#### 创建帖子
```http
POST /api/social/content
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "create-post",
  "content": "帖子内容",
  "images": ["图片URL1", "图片URL2"]
}
```

#### 创建评论（支持二级评论）
```http
POST /api/social/content
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "create-comment",
  "postId": "帖子ID",
  "content": "评论内容",
  "parentId": "父评论ID（二级评论）",
  "replyTo": {
    "userId": "被回复用户ID",
    "username": "被回复用户名"
  }
}
```

#### 点赞/取消点赞（支持帖子和评论）
```http
POST /api/social/content
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "toggle-like",
  "postId": "帖子ID",
  // 或
  "commentId": "评论ID"
}
```

#### 删除帖子
```http
DELETE /api/social/content?action=post&id=<postId>
Authorization: Bearer <token>
```

#### 删除评论
```http
DELETE /api/social/content?action=comment&id=<commentId>
Authorization: Bearer <token>
```

**权限说明：**
- 帖子：作者或管理员可删除
- 评论：作者或管理员可删除，删除一级评论会连带删除所有二级评论

### 2. Messaging API (`/api/social/messaging`)

#### 搜索用户
```http
GET /api/social/messaging?action=search-users&search=<keyword>&page=1&limit=20
Authorization: Bearer <token>
```

#### 获取用户详情
```http
GET /api/social/messaging?action=user-profile&userId=<userId>
Authorization: Bearer <token>
```

#### 获取关注者列表
```http
GET /api/social/messaging?action=followers&userId=<userId>&page=1&limit=20
Authorization: Bearer <token>
```

#### 获取关注列表
```http
GET /api/social/messaging?action=following&userId=<userId>&page=1&limit=20
Authorization: Bearer <token>
```

#### 获取会话列表
```http
GET /api/social/messaging?action=conversations&page=1&limit=20
Authorization: Bearer <token>
```

#### 获取消息列表
```http
GET /api/social/messaging?action=messages&conversationId=<conversationId>&page=1&limit=20
Authorization: Bearer <token>
```

#### 关注用户
```http
POST /api/social/messaging
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "follow",
  "userId": "目标用户ID"
}
```

#### 取消关注
```http
POST /api/social/messaging
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "unfollow",
  "userId": "目标用户ID"
}
```

#### 发送私信
```http
POST /api/social/messaging
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "send-message",
  "receiverId": "接收者ID",
  "content": "消息内容"
}
```

## 🗄️ 数据库集合

### 新增集合：
- `messages` - 私信消息
- `conversations` - 会话信息

### 优化集合：
- `likes` - 支持帖子和评论点赞（type字段区分）
- `comments` - 支持二级评论（parentId字段）

## 🔒 权限控制

### JWT Token验证
所有API都需要在请求头中包含有效的JWT token：
```
Authorization: Bearer <your_jwt_token>
```

### 删除权限
- **帖子删除**：帖子作者 OR 管理员
- **评论删除**：评论作者 OR 管理员
- **私信访问**：只能访问自己参与的会话

### 功能权限
- **未验证邮箱**：可以使用所有社交功能
- **普通用户**：可以使用所有功能
- **管理员**：额外的删除权限

## 🚨 错误响应

```json
{
  "success": false,
  "message": "错误信息"
}
```

常见错误：
- `401` - Token无效或用户不存在
- `403` - 权限不足
- `400` - 参数错误
- `404` - 资源不存在
- `500` - 服务器内部错误

## 📝 使用示例

### 前端调用示例（TypeScript）

```typescript
// 获取帖子列表
const fetchPosts = async () => {
  const token = localStorage.getItem('token')
  const response = await fetch('/api/social/content?action=posts&type=feed', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  const data = await response.json()
  return data.data.posts
}

// 发布帖子
const createPost = async (content: string) => {
  const token = localStorage.getItem('token')
  const response = await fetch('/api/social/content', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'create-post',
      content
    })
  })
  return response.json()
}

// 点赞帖子
const toggleLike = async (postId: string) => {
  const token = localStorage.getItem('token')
  const response = await fetch('/api/social/content', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'toggle-like',
      postId
    })
  })
  return response.json()
}

// 发送私信
const sendMessage = async (receiverId: string, content: string) => {
  const token = localStorage.getItem('token')
  const response = await fetch('/api/social/messaging', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'send-message',
      receiverId,
      content
    })
  })
  return response.json()
}
```

## 🎯 API测试

### 基础连接测试
```bash
curl https://mxacc.mxos.top/api/social/content
# 预期返回: {"success":false,"message":"未提供有效的授权token"}
```

### 带Token测试
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://mxacc.mxos.top/api/social/content?action=posts
```

---

**注意事项：**
1. 所有API都需要有效的JWT token
2. 分页从1开始，不是0
3. 删除操作不可恢复，请谨慎使用
4. 私信会自动创建会话，无需手动创建
5. 二级评论有层级限制，不支持三级及以上评论 