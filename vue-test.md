# Vue 3组件渲染测试

这是一个测试Vue 3组件渲染系统的简单例子。

## 简单计数器组件

```vue
<template>
  <div class="counter-app">
    <h2>Vue 3计数器测试</h2>
    <div class="counter-display">
      <span class="count">{{ count }}</span>
    </div>
    <div class="counter-controls">
      <button @click="increment" class="btn btn-primary">增加 +</button>
      <button @click="decrement" class="btn btn-secondary">减少 -</button>
      <button @click="reset" class="btn btn-reset">重置</button>
    </div>
    <p class="status">
      当前状态: {{ count > 0 ? '正数' : count < 0 ? '负数' : '零' }}
    </p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// 响应式数据
const count = ref(0)

// 计算属性
const status = computed(() => {
  return count.value > 0 ? '正数' : count.value < 0 ? '负数' : '零'
})

// 方法
const increment = () => {
  count.value++
}

const decrement = () => {
  count.value--
}

const reset = () => {
  count.value = 0
}
</script>

<style scoped>
.counter-app {
  text-align: center;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  font-family: Arial, sans-serif;
}

.counter-display {
  margin: 2rem 0;
}

.count {
  font-size: 4rem;
  font-weight: bold;
  color: #fff;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.counter-controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin: 2rem 0;
}

.btn {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.btn-primary {
  background: #4CAF50;
  color: white;
}

.btn-primary:hover {
  background: #45a049;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #f44336;
  color: white;
}

.btn-secondary:hover {
  background: #da190b;
  transform: translateY(-2px);
}

.btn-reset {
  background: #ff9800;
  color: white;
}

.btn-reset:hover {
  background: #e68900;
  transform: translateY(-2px);
}

.status {
  font-size: 1.2rem;
  margin-top: 1rem;
  font-weight: 500;
}
</style>
```

## 测试要点

如果Vue组件渲染系统工作正常，你应该看到：

1. ✅ **插值语法执行**：`{{ count }}` 显示实际数字而不是原始文本
2. ✅ **响应式数据**：点击按钮时数字会实时更新
3. ✅ **事件处理**：`@click` 事件能正确触发
4. ✅ **计算属性**：状态文本根据数字变化
5. ✅ **Vue 3 Composition API**：`ref()` 和 `computed()` 正常工作
6. ✅ **样式渲染**：组件具有漂亮的视觉效果

如果看到"正在加载Vue组件..."的占位符或插值语法显示为原始文本，说明还有问题需要修复。 