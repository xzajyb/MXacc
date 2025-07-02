# 样式支持示例文档

这个文档演示了在 Markdown 中使用自定义样式的功能。

<style>
:root {
  --qq-card-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  --qq-card-shadow-hover: 0 6px 16px rgba(0, 0, 0, 0.15);
  --qq-card-transition: all 0.3s ease;
}

.qq-group-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 2rem 0;
  padding: 0 1rem;
}

.qq-channel-card, .qq-group-card {
  display: block;
  border-radius: 12px;
  padding: 1.5rem;
  background: linear-gradient(135deg, #2E8B57 20%, #3CB371 100%);
  text-decoration: none;
  transition: var(--qq-card-transition);
  box-shadow: var(--qq-card-shadow);
  border: 1px solid #8FBC8F;
  backdrop-filter: saturate(180%) blur(16px);
  position: relative;
  overflow: hidden;
}

/* 黑暗模式适配 */
.dark .qq-group-card {
  background: linear-gradient(135deg, #2E8B57 20%, #3CB371 100%);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  color: white;
}

.dark .qq-group-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.03);
  z-index: -1;
}

.card-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  color: white;
}

.icon {
  font-size: 2.5rem;
  flex-shrink: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: var(--qq-card-transition);
}

.text-content h3 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.text-content p {
  margin: 0.5rem 0 0;
  opacity: 0.95;
  font-size: 0.95rem;
  font-weight: 500;
}

.arrow {
  margin-left: auto;
  font-size: 1.5rem;
  opacity: 0.8;
  transition: var(--qq-card-transition);
}

.qq-channel-card:hover, .qq-group-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--qq-card-shadow-hover);
}

.qq-group-card:hover .icon, .qq-channel-card:hover .icon {
  transform: scale(1.1);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.dark .qq-group-card:hover {
  box-shadow: 0 6px 32px rgba(0, 0, 0, 0.6);
  color: white;
}

.qq-group-card:hover .arrow, .qq-channel-card:hover .arrow {
  transform: translateX(3px);
  opacity: 1;
}

/* 增强交互效果 */
.qq-group-card {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .qq-group-container {
    padding: 0 0.5rem;
  }
  
  .qq-channel-card, .qq-group-card {
    padding: 1.2rem;
  }
  
  .icon {
    font-size: 2rem;
  }
  
  .text-content h3 {
    font-size: 1.1rem;
  }
  
  .text-content p {
    font-size: 0.9rem;
  }
}

.demo-button {
  display: inline-block;
  padding: 12px 24px;
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.demo-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
}
</style>

## 自定义样式组件

### 卡片组件展示

下面是使用自定义样式的卡片组件：

<div class="qq-group-container">
  <a href="#" class="qq-group-card">
    <div class="card-content">
      <div class="icon">🎮</div>
      <div class="text-content">
        <h3>游戏交流群</h3>
        <p>和朋友一起畅聊游戏心得，分享攻略技巧</p>
      </div>
      <div class="arrow">→</div>
    </div>
  </a>
  
  <a href="#" class="qq-group-card">
    <div class="card-content">
      <div class="icon">💻</div>
      <div class="text-content">
        <h3>技术交流群</h3>
        <p>程序员交流编程经验，分享最新技术动态</p>
      </div>
      <div class="arrow">→</div>
    </div>
  </a>
  
  <a href="#" class="qq-group-card">
    <div class="card-content">
      <div class="icon">📚</div>
      <div class="text-content">
        <h3>学习讨论群</h3>
        <p>学术交流与讨论，共同进步成长</p>
      </div>
      <div class="arrow">→</div>
    </div>
  </a>
</div>

## 自定义按钮样式

### 渐变按钮效果

这是一个使用自定义样式的按钮：

<a href="#" class="demo-button">点击测试按钮</a>

## 代码示例

### CSS 实现

下面是创建这些样式的代码：

```css
.qq-group-card {
  background: linear-gradient(135deg, #2E8B57 20%, #3CB371 100%);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.qq-group-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}
```

## Markdown 扩展功能

### Callout 提示框

::: tip
这是一个提示框，展示了 VitePress 的 Markdown 扩展功能。
:::

::: warning
这是一个警告框，用于提醒重要信息。
:::

::: danger
这是一个危险提示框，用于警告可能的风险。
:::

### 表格功能

## 表格支持

| 功能 | 支持状态 | 说明 |
|------|----------|------|
| 自定义样式 | ✅ | 支持在 Markdown 中使用 `<style>` 标签 |
| 代码高亮 | ✅ | 支持多种编程语言的语法高亮 |
| 表格渲染 | ✅ | 支持标准 Markdown 表格语法 |
| Callout 框 | ✅ | 支持 tip、warning、danger、info 类型 |

## 总结

这个文档演示了以下功能：

1. **自定义 CSS 样式** - 在 Markdown 中嵌入 `<style>` 标签
2. **响应式设计** - 支持移动端适配的样式
3. **深色模式支持** - 自动适配深色和浅色主题
4. **交互效果** - 悬停动画和过渡效果
5. **组件化设计** - 可复用的样式组件

通过这种方式，文档可以拥有更加丰富的视觉效果和交互体验。 