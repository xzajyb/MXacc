# Vue组件执行演示 🚀

这个页面展示了我们的markdown渲染器如何**真正执行Vue组件**，而不只是语法高亮！

## 🎯 核心功能

### ✅ 真正的Vue组件执行
- 解析Vue模板语法
- 执行JavaScript脚本
- 支持数据绑定和事件处理
- 实时DOM更新

### ✅ VitePress Markdown扩展
- 容器语法 (`::: tip` `::: warning` 等)
- 表格支持
- 任务列表
- Emoji支持 :tada: :100:
- 代码高亮

---

## 🔥 Vue组件示例

### 1. 基础计数器组件

```vue
<template>
  <div style="padding: 20px; border: 2px solid #42b883; border-radius: 8px; text-align: center; background: linear-gradient(135deg, #42b883, #35495e); color: white;">
    <h3 style="margin: 0 0 15px 0;">🎮 Vue计数器</h3>
    <div style="font-size: 2rem; font-weight: bold; margin: 10px 0;">{{ count }}</div>
    <div style="display: flex; gap: 10px; justify-content: center; margin-top: 15px;">
      <button @click="increment" style="padding: 10px 20px; background: #fff; color: #42b883; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
        ➕ 增加
      </button>
      <button @click="decrement" style="padding: 10px 20px; background: #fff; color: #42b883; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
        ➖ 减少
      </button>
      <button @click="reset" style="padding: 10px 20px; background: #ff6b6b; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
        🔄 重置
      </button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      count: 0
    }
  },
  methods: {
    increment() {
      this.count++
    },
    decrement() {
      this.count--
    },
    reset() {
      this.count = 0
    }
  }
}
</script>
```

### 2. 动态列表渲染

```vue
<template>
  <div style="padding: 20px; border: 2px solid #4CAF50; border-radius: 10px; background: linear-gradient(135deg, #e8f5e8, #f0fff0);">
    <h3 style="color: #2E7D32; margin: 0 0 20px 0;">📝 待办事项列表</h3>
    
    <div style="margin-bottom: 20px;">
      <input v-model="newTodo" placeholder="添加新任务..." style="padding: 10px; border: 2px solid #4CAF50; border-radius: 5px; width: 60%; margin-right: 10px;">
      <button @click="addTodo" style="padding: 10px 15px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
        ➕ 添加
      </button>
    </div>

    <div style="text-align: left;">
      <div v-for="todo in todos" style="margin: 10px 0; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="width: 8px; height: 8px; background: #4CAF50; border-radius: 50%; display: inline-block;"></span>
          <span style="color: #333;">{{ todo.text }}</span>
        </div>
        <span style="color: #666; font-size: 0.9em;">{{ todo.id }}</span>
      </div>
    </div>

    <div style="margin-top: 20px; padding: 10px; background: #4CAF50; color: white; border-radius: 5px; text-align: center;">
      📊 总计: {{ todos.length }} 个任务
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      newTodo: '',
      todos: [
        { id: 1, text: '学习Vue.js', completed: false },
        { id: 2, text: '完成项目文档', completed: false },
        { id: 3, text: '测试markdown渲染器', completed: true }
      ]
    }
  },
  methods: {
    addTodo() {
      if (this.newTodo.trim()) {
        this.todos.push({
          id: Date.now(),
          text: this.newTodo,
          completed: false
        })
        this.newTodo = ''
      }
    }
  }
}
</script>
```

### 3. 条件渲染示例

```vue
<template>
  <div style="padding: 20px; border: 2px solid #FF6B35; border-radius: 10px; background: linear-gradient(135deg, #fff5f2, #ffe8e1);">
    <h3 style="color: #D84315; margin: 0 0 20px 0;">🎭 条件渲染演示</h3>
    
    <div style="margin-bottom: 20px;">
      <button @click="toggleMode" style="padding: 12px 24px; background: #FF6B35; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 16px;">
        🔄 切换模式 (当前: {{ mode }})
      </button>
    </div>

    <div v-if="mode === 'welcome'" style="padding: 20px; background: #4CAF50; color: white; border-radius: 8px; text-align: center;">
      <h2 style="margin: 0 0 10px 0;">🎉 欢迎使用!</h2>
      <p style="margin: 0; font-size: 18px;">这是欢迎界面，点击按钮查看其他内容</p>
    </div>

    <div v-if="mode === 'info'" style="padding: 20px; background: #2196F3; color: white; border-radius: 8px; text-align: center;">
      <h2 style="margin: 0 0 10px 0;">ℹ️ 信息页面</h2>
      <p style="margin: 0; font-size: 18px;">这里显示重要信息和系统状态</p>
    </div>

    <div v-if="mode === 'settings'" style="padding: 20px; background: #9C27B0; color: white; border-radius: 8px; text-align: center;">
      <h2 style="margin: 0 0 10px 0;">⚙️ 设置面板</h2>
      <p style="margin: 0; font-size: 18px;">在这里可以配置各种选项</p>
    </div>

    <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 8px; text-align: center; border: 2px dashed #FF6B35;">
      <strong>🔍 调试信息:</strong> 当前状态变量 = "{{ mode }}"
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      mode: 'welcome'
    }
  },
  methods: {
    toggleMode() {
      const modes = ['welcome', 'info', 'settings']
      const currentIndex = modes.indexOf(this.mode)
      this.mode = modes[(currentIndex + 1) % modes.length]
    }
  }
}
</script>
```

---

## 📚 VitePress容器演示

::: tip 💡 提示
这是一个提示容器！现在支持真正的VitePress语法了。
:::

::: warning ⚠️ 警告
注意：这是一个警告容器，用于重要提醒。
:::

::: danger 🚨 危险
危险操作！请谨慎处理。
:::

::: info ℹ️ 信息
这是信息容器，用于展示额外信息。
:::

::: details 📋 点击展开详情
这是可折叠的详情容器。

- 支持markdown语法
- 可以包含**粗体**和*斜体*
- 还能包含`代码`和[链接](https://example.com)

```javascript
// 甚至可以包含代码块
console.log('Hello from details container!')
```
:::

---

## 📊 表格支持

| 功能 | 状态 | 说明 |
|------|------|------|
| Vue组件执行 | ✅ 完成 | 真正的组件渲染和交互 |
| VitePress容器 | ✅ 完成 | 支持tip、warning、danger等 |
| 代码高亮 | ✅ 完成 | 语法高亮和复制功能 |
| 表格渲染 | ✅ 完成 | 支持GitHub风格表格 |
| Emoji支持 | ✅ 完成 | :rocket: :tada: :100: |

---

## ✅ 任务列表

- [x] 实现Vue组件解析
- [x] 支持模板语法
- [x] 支持事件处理
- [x] 支持条件渲染
- [x] 支持列表渲染
- [x] 添加VitePress容器
- [ ] 添加更多组件示例
- [ ] 优化性能
- [ ] 添加错误处理

---

## 🎉 总结

现在我们的markdown渲染器已经支持：

1. **真正的Vue组件执行** - 不只是语法高亮，而是真正运行Vue代码
2. **完整的VitePress功能** - 容器、表格、任务列表等
3. **美观的样式设计** - 现代化的UI和动画效果
4. **响应式布局** - 适配桌面端和移动端

点击上面任何一个Vue组件的"▶️ 运行组件"按钮，看看真正的Vue组件执行效果！ 🚀 