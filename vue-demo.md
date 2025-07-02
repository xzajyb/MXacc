# Vue语法演示文档

这是一个演示Vue语法渲染的文档。

## 基本Vue语法支持

### 1. Vue指令

这是一个包含Vue指令的示例：

<div class="controls">
  <input
    type="text"
    v-model="searchQuery"
    placeholder="搜索附魔名称或描述..."
    class="search-input"
  >
</div>

### 2. 条件渲染

<div v-if="showResults">
  显示搜索结果
</div>

### 3. 列表渲染

<div class="enchant-grid">
  <div
    v-for="enchant in filteredEnchants"
    :key="enchant.id"
    class="enchant-card"
    :class="enchant.quality"
  >
    <h3>{{ enchant.name }}</h3>
    <p>{{ enchant.description }}</p>
  </div>
</div>

### 4. 事件处理

<button @click="resetFilters" class="reset-btn">
  重置所有筛选器
</button>

### 5. 插值语法

当前搜索：{{ searchQuery }}

找到 {{ filteredEnchants.length }} 个附魔（共 {{ enchants.length }} 个）

## 容器语法

::: tip 提示
这是一个提示容器，支持VitePress风格的容器语法。
:::

::: warning 警告
这是一个警告容器。
:::

::: danger 危险
这是一个危险提示容器。
:::

::: info 信息
这是一个信息容器。
:::

## 代码高亮

```vue
<template>
  <div class="app">
    <input v-model="message" placeholder="输入消息">
    <p>{{ message }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: ''
    }
  }
}
</script>
```

```javascript
// JavaScript 代码示例
const enchants = [
  { id: 1, name: '锋利', quality: 'common' },
  { id: 2, name: '抢夺', quality: 'rare' }
]

const filteredEnchants = enchants.filter(item => 
  item.name.includes(searchQuery)
)
```

## 复杂Vue组件示例

<div class="filters">
  <div class="filter-group">
    <label>品质：</label>
    <div class="quality-filters">
      <button
        v-for="quality in qualities"
        :key="quality.value"
        @click="toggleQuality(quality.value)"
        :class="{
          'quality-btn': true,
          'active': selectedQualities.includes(quality.value),
          [quality.value]: true
        }"
      >
        {{ quality.label }}
      </button>
    </div>
  </div>

  <div class="filter-group">
    <label>获取方式：</label>
    <div class="source-filters">
      <label class="source-checkbox">
        <input type="checkbox" v-model="sources.enchantmentTable">
        <span>附魔台</span>
      </label>
      <label class="source-checkbox">
        <input type="checkbox" v-model="sources.villager">
        <span>村民</span>
      </label>
      <label class="source-checkbox">
        <input type="checkbox" v-model="sources.chest">
        <span>宝箱</span>
      </label>
    </div>
  </div>
</div>

## 特殊功能

- **插值语法高亮**：{{ message }} 会被特殊标记
- **指令转换**：`v-for`、`v-if` 等指令会被转换为 data 属性
- **动态类名**：`:class` 会被处理
- **事件绑定**：`@click` 等事件会被标记

这样就实现了Vue语法的可视化展示！ 