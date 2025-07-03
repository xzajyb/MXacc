# 简单Vue测试

测试新的Vue 3 CDN运行时渲染器。

## 基础响应式测试

```vue
<template>
  <div style="padding: 20px; background: linear-gradient(45deg, #667eea, #764ba2); color: white; border-radius: 10px; text-align: center;">
    <h2>Vue 3 响应式测试</h2>
    <p style="font-size: 24px; margin: 20px 0;">
      计数: <strong>{{ count }}</strong>
    </p>
    <div style="display: flex; gap: 10px; justify-content: center;">
      <button @click="increment" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
        增加 +
      </button>
      <button @click="decrement" style="padding: 10px 20px; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer;">
        减少 -
      </button>
    </div>
    <p style="margin-top: 20px;">
      状态: {{ status }}
    </p>
  </div>
</template>

<script setup>
const count = ref(0)

const status = computed(() => {
  if (count.value > 0) return '正数'
  if (count.value < 0) return '负数'
  return '零'
})

const increment = () => {
  count.value++
}

const decrement = () => {
  count.value--
}
</script>
```

## 测试步骤

1. 点击"运行组件"按钮
2. Vue将从CDN加载
3. 组件应该显示计数器和按钮
4. 点击按钮应该能改变数字
5. 状态文本应该相应变化

如果一切正常，说明Vue 3运行时渲染成功！ 