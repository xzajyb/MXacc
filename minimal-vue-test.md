# 最简Vue测试

测试最基本的Vue响应式功能。

```vue
<template>
  <div style="padding: 20px; background: #4CAF50; color: white; border-radius: 8px; text-align: center;">
    <h3>简单计数器</h3>
    <p style="font-size: 24px;">{{ count }}</p>
    <button @click="increment" style="padding: 10px 20px; background: white; color: #4CAF50; border: none; border-radius: 4px; margin: 5px; cursor: pointer;">
      +1
    </button>
    <button @click="decrement" style="padding: 10px 20px; background: white; color: #4CAF50; border: none; border-radius: 4px; margin: 5px; cursor: pointer;">
      -1
    </button>
  </div>
</template>

<script setup>
const count = ref(0)

const increment = () => {
  count.value++
}

const decrement = () => {
  count.value--
}
</script>
```

这个测试应该显示：
1. 一个计数器数字
2. 两个按钮（+1 和 -1）
3. 点击按钮数字会变化

如果成功，插值语法`{{ count }}`会显示实际数字而不是原始文本。 