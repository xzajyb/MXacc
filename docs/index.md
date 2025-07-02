---
layout: page
---

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  // 自动重定向到快速开始页面
  if (typeof window !== 'undefined') {
    window.location.href = '/docs/guide/getting-started.html'
  }
})
</script>

# 正在跳转...

正在跳转到文档内容，如果没有自动跳转，请点击：[快速开始](/guide/getting-started) 