# 用户封禁管理系统

## 功能概述

为管理员提供完整的用户封禁管理功能，包括封禁用户、查看封禁列表、处理申述等，同时为被封禁用户提供申述机制。

## 核心功能

### 1. 管理员封禁功能

#### 封禁用户
- **选择用户**：管理员可从用户列表中选择要封禁的用户（不能封禁其他管理员）
- **封禁原因**：必须填写详细的封禁原因
- **封禁时长**：支持临时封禁（小时/天/周/月）和永久封禁
- **管理员备注**：可添加内部备注信息

#### 封禁类型
- **临时封禁**：设置具体到期时间，到期后自动解除
- **永久封禁**：无到期时间，需手动解除

#### 封禁管理
- **查看封禁列表**：显示所有封禁记录，支持状态筛选（活跃/已解除）
- **解除封禁**：管理员可手动解除任何封禁
- **封禁详情**：显示封禁原因、时间、到期时间、备注等信息

### 2. 申述系统

#### 用户申述
- **申述入口**：被封禁用户访问社交功能时自动弹出申述界面
- **申述内容**：填写申述原因和详细说明
- **申述限制**：每次只能有一个待处理的申述
- **申述历史**：用户可查看所有申述记录和处理结果

#### 管理员处理
- **申述列表**：管理员可查看所有申述，支持状态筛选
- **申述处理**：通过/驳回申述，并提供回复说明
- **自动解封**：申述通过时自动解除对应的封禁

### 3. 封禁状态检查

#### API层面检查
- **社交内容API**：所有写操作前检查用户封禁状态
- **私信API**：发送消息、关注等操作前检查封禁状态
- **实时检查**：封禁状态实时生效，无需重新登录

#### 前端显示
- **封禁通知**：被封禁用户访问社交功能时显示详细封禁信息
- **功能禁用**：社交功能按钮显示为禁用状态
- **提示信息**：明确告知用户封禁原因和申述方式

## 技术实现

### 1. 后端API

#### 封禁管理API（已整合到 `/api/social/content`）
- `GET ?action=ban-management&subAction=bans` - 获取封禁列表
- `GET ?action=ban-management&subAction=appeals` - 获取申述列表  
- `GET ?action=ban-management&subAction=check` - 检查用户封禁状态
- `GET ?action=ban-management&subAction=my-appeals` - 获取用户申述记录
- `POST action=ban-user` - 封禁用户
- `POST action=submit-appeal` - 提交申述
- `PUT action=unban-user` - 解除封禁
- `PUT action=process-appeal` - 处理申述

#### 封禁状态检查
- 社交内容API：`/api/social/content` 
- 私信API：`/api/social/messaging`
- 在所有写操作前调用 `checkUserBanStatus()` 函数

### 2. 数据库设计

#### 封禁记录集合 (`user_bans`)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // 被封禁用户ID
  reason: String,             // 封禁原因
  notes: String,              // 管理员备注
  duration: Number,           // 封禁时长
  durationType: String,       // 时长单位（hours/days/weeks/months）
  expiresAt: Date,           // 到期时间（null表示永久）
  status: String,             // 状态（active/revoked）
  createdBy: ObjectId,        // 封禁操作者ID
  createdAt: Date,            // 封禁时间
  revokedBy: ObjectId,        // 解封操作者ID
  revokedAt: Date,            // 解封时间
  revokeReason: String,       // 解封原因
  updatedAt: Date
}
```

#### 申述记录集合 (`ban_appeals`)
```javascript
{
  _id: ObjectId,
  banId: ObjectId,            // 对应的封禁记录ID
  userId: ObjectId,           // 申述用户ID
  reason: String,             // 申述原因
  details: String,            // 详细说明
  status: String,             // 状态（pending/approved/rejected）
  handledBy: ObjectId,        // 处理管理员ID
  handledAt: Date,            // 处理时间
  adminResponse: String,      // 管理员回复
  createdAt: Date,
  updatedAt: Date
}
```

### 3. 前端组件

#### 管理员界面 (`AdminPage.tsx`)
- **封禁管理标签**：新增"封禁管理"标签页
- **三栏布局**：封禁用户表单 | 封禁列表 | 申述管理
- **状态筛选**：支持按状态筛选封禁和申述记录
- **处理对话框**：申述处理对话框，支持通过/驳回操作

#### 封禁通知组件 (`BanNotice.tsx`)
- **封禁详情**：显示封禁原因、类型、剩余时间等
- **申述表单**：内置申述提交功能
- **申述历史**：显示用户所有申述记录
- **时间计算**：实时显示剩余封禁时间

#### 社交页面集成 (`SocialPage.tsx`)
- **封禁检查**：页面加载时检查用户封禁状态
- **条件渲染**：被封禁时显示BanNotice而非正常界面
- **功能禁用**：封禁状态下禁用所有社交功能按钮
- **错误提示**：操作时显示相应的封禁提示信息

## 权限控制

### 管理员权限
- 只有角色为 'admin' 的用户可以访问封禁管理功能
- 不能封禁其他管理员用户
- 可以查看所有封禁和申述记录
- 可以解除任何封禁和处理任何申述

### 用户权限
- 只能查看自己的申述记录
- 只能为自己的封禁提交申述
- 每次只能有一个待处理的申述

### 封禁效果
- 无法发布帖子、评论、点赞
- 无法发送私信、关注用户
- 无法进行任何社交互动操作
- 可以正常使用其他非社交功能

## 用户体验

### 被封禁用户
1. **即时通知**：访问社交功能时立即显示封禁通知
2. **详细信息**：清楚了解封禁原因、类型和剩余时间
3. **申述便捷**：直接在通知界面提交申述
4. **状态跟踪**：实时查看申述处理状态
5. **友好提示**：明确的操作指引和注意事项

### 管理员
1. **集中管理**：所有封禁操作集中在一个界面
2. **快速操作**：简化的封禁流程和批量操作
3. **状态一览**：清晰的列表展示和状态筛选
4. **处理高效**：快速的申述处理流程
5. **记录完整**：详细的操作日志和历史记录

## 安全特性

1. **权限验证**：所有操作都进行严格的权限检查
2. **防止误操作**：不能封禁管理员，确认对话框保护
3. **状态实时性**：封禁状态实时检查，立即生效
4. **数据完整性**：完整的操作记录和状态跟踪
5. **申述保护**：防止重复申述，保护系统资源

## 部署说明

1. **数据库**：确保MongoDB中创建了 `user_bans` 和 `ban_appeals` 集合
2. **API权限**：确保封禁管理API只对管理员开放
3. **前端集成**：BanNotice组件已集成到SocialPage中
4. **状态检查**：所有社交API已集成封禁状态检查
5. **管理界面**：AdminPage已添加封禁管理标签页

## 使用流程

### 封禁用户流程
1. 管理员进入"封禁管理"页面
2. 选择要封禁的用户
3. 填写封禁原因和时长
4. 确认封禁操作
5. 用户立即被限制社交功能

### 申述处理流程
1. 被封禁用户提交申述
2. 管理员在申述列表中查看
3. 管理员选择通过或驳回
4. 填写处理说明
5. 申述通过时自动解除封禁

### 解除封禁流程
1. 管理员在封禁列表中找到记录
2. 点击"解封"按钮
3. 确认解封操作
4. 用户立即恢复社交功能

---

**注意：封禁功能对用户体验影响较大，请谨慎使用，确保有明确的社区规则和申述流程。** 