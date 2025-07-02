# 插值语法测试

测试Vue组件的插值语法是否正常工作：

```vue
<template>
<div class="test-container">
  <h3>基础插值测试</h3>
  <p>计数器值：{{ count }}</p>
  <p>用户名：{{ username }}</p>
  
  <h3>数组处理测试</h3>
  <p>列表长度：{{ items.length }}</p>
  <p>列表内容：{{ items.join('、') }}</p>
  
  <h3>函数调用测试</h3>
  <p>双倍计数：{{ doubleCount() }}</p>
  <p>格式化消息：{{ formatMessage(username) }}</p>
  
  <h3>交互测试</h3>
  <button @click="increment">增加计数</button>
  <button @click="addItem">添加项目</button>
  
  <h3>列表渲染测试</h3>
  <ul>
    <li v-for="item in items" :key="item">{{ item }}</li>
  </ul>
</div>
</template>

<script setup>
import { ref } from 'vue'

const count = ref(5)
const username = ref("测试用户")
const items = ref(["项目1", "项目2", "项目3"])

const doubleCount = () => {
  return count.value * 2
}

const formatMessage = (name) => {
  return `欢迎 ${name}！`
}

const increment = () => {
  count.value++
}

const addItem = () => {
  items.value.push(`项目${items.value.length + 1}`)
}
</script>

<style scoped>
.test-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

button {
  padding: 8px 16px;
  margin: 5px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #0056b3;
}

li {
  margin: 5px 0;
  padding: 5px;
  background: white;
  border-radius: 4px;
}
</style>
```

## 预期结果

运行后应该看到：
- ✅ 计数器值：5
- ✅ 用户名：测试用户  
- ✅ 列表长度：3
- ✅ 列表内容：项目1、项目2、项目3
- ✅ 双倍计数：10
- ✅ 格式化消息：欢迎 测试用户！
- ✅ 按钮可以点击并实时更新数据 