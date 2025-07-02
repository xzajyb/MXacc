# 服务器附魔大全演示

这是一个完整的Vue 3 Composition API演示，展示了复杂的数据筛选和交互功能。

```vue
<template>
<div class="enchant-container">
  <div class="controls">
    <input 
      type="text" 
      v-model="searchQuery" 
      placeholder="搜索附魔名称或描述..." 
      class="search-input"
    >
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
  </div>
  <div class="enchant-stats">
    找到 {{ filteredEnchants.length }} 个附魔（共 {{ enchants.length }} 个）
    <span v-if="selectedQualities.length > 0">
      | 品质：
      <span 
        v-for="q in selectedQualities" 
        :key="q"
        :class="['quality-tag', q]"
      >
        {{ getQualityLabel(q) }}
      </span>
    </span>
  </div>
  
  <div class="enchant-grid">
    <div 
      v-for="enchant in filteredEnchants" 
      :key="enchant.id"
      class="enchant-card"
      :class="enchant.quality"
    >
      <div class="enchant-header">
        <h3 class="enchant-name">{{ enchant.name }}</h3>
        <div class="enchant-quality" :class="enchant.quality">
          {{ getQualityLabel(enchant.quality) }}
        </div>
      </div>
      <div class="enchant-description">{{ enchant.description }}</div>
      <div class="enchant-meta">
        <div class="meta-item">
          <strong>可附魔物品：</strong>
          <span>{{ enchant.items.join('、') }}</span>
        </div>
        <div class="meta-item">
          <strong>获取方式：</strong>
          <div class="source-icons">
            <span 
              v-if="enchant.enchantmentTable" 
              class="source-icon enchantment-table-icon"
              title="可通过附魔台获取"
            >⚔️</span>
            <span 
              v-if="enchant.villager" 
              class="source-icon villager-icon"
              title="可通过村民交易获取"
            >🧑</span>
            <span 
              v-if="enchant.chest" 
              class="source-icon chest-icon"
              title="可通过宝箱获取"
            >📦</span>
            <span 
              v-if="!enchant.enchantmentTable && !enchant.villager && !enchant.chest" 
              class="source-icon special-icon"
            >✨ 特殊</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div v-if="filteredEnchants.length === 0" class="no-results">
    <div class="no-results-icon">🔍</div>
    <h3>未找到匹配的附魔</h3>
    <p>请尝试调整筛选条件</p>
    <button @click="resetFilters" class="reset-btn">重置所有筛选器</button>
  </div>
</div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'

const enchants = [
  {
    id: 1,
    name: "磨损",
    description: "对目标的护甲额外造成附魔等级点耐久损耗",
    items: ["剑", "斧"],
    quality: "传奇",
    enchantmentTable: true,
    villager: true,
    chest: true
  },
  {
    id: 2,
    name: "肾上腺素",
    description: "在抵挡攻击时,将获得1 + 附魔等级 ÷ 2秒的力量效果",
    items: ["盾牌"],
    quality: "史诗",
    enchantmentTable: true,
    villager: true,
    chest: true
  },
  {
    id: 3,
    name: "奥术防御",
    description: "有附魔等级 x 4的几率免疫药水伤害",
    items: ["护甲"],
    quality: "史诗",
    enchantmentTable: true,
    villager: true,
    chest: true
  },
  {
    id: 4,
    name: "☆ 升腾",
    description: "右键时,将你悬浮在空中,持续附魔等级 ÷ 4秒",
    items: ["剑"],
    quality: "传奇",
    enchantmentTable: true,
    villager: true,
    chest: true
  },
  {
    id: 5,
    name: "光环",
    description: "距离你3 + 附魔等级 x 2格内的玩家受到的伤害降低附魔等级 x 10%",
    items: ["胸甲", "护腿"],
    quality: "特殊",
    enchantmentTable: true,
    villager: true,
    chest: true
  },
  {
    id: 6,
    name: "黑暗降临",
    description: "有6 + 附魔等级%的几率使目标在4 + 附魔等级 ÷ 2秒内获得黑暗效果",
    items: ["剑"],
    quality: "传奇",
    enchantmentTable: true,
    villager: true,
    chest: true
  },
  {
    id: 7,
    name: "爆炸挖掘",
    description: "有5 x 附魔等级%的几率挖掘一个3x3的区域",
    items: ["镐"],
    quality: "特殊",
    enchantmentTable: true,
    villager: true,
    chest: true
  },
  {
    id: 8,
    name: "流血",
    description: "有1.5 x 附魔等级%的几率使目标获得流血效果",
    items: ["剑"],
    quality: "传奇",
    enchantmentTable: true,
    villager: true,
    chest: true
  },
  {
    id: 9,
    name: "窒息保护",
    description: "有附魔等级 x 15%的几率免疫窒息伤害",
    items: ["头盔"],
    quality: "普通",
    enchantmentTable: true,
    villager: true,
    chest: true
  },
  {
    id: 10,
    name: "Boss杀手",
    description: "对Boss生物造成额外10 x 附魔等级%的伤害",
    items: ["弓", "弩"],
    quality: "稀有",
    enchantmentTable: true,
    villager: true,
    chest: true
  }
]

// 定义品质选项
const qualities = [
  { value: "普通", label: "普通" },
  { value: "罕见", label: "罕见" },
  { value: "稀有", label: "稀有" },
  { value: "史诗", label: "史诗" },
  { value: "传奇", label: "传奇" },
  { value: "特殊", label: "特殊" },
  { value: "非常特殊", label: "非常特殊" }
]

// 获取品质标签
const getQualityLabel = (value) => {
  const quality = qualities.find(q => q.value === value)
  return quality ? quality.label : value
}

// 搜索查询
const searchQuery = ref('')

// 选中的品质
const selectedQualities = ref([])

// 获取方式筛选
const sources = reactive({
  enchantmentTable: false,
  villager: false,
  chest: false
})

// 切换品质筛选
const toggleQuality = (quality) => {
  const index = selectedQualities.value.indexOf(quality)
  if (index === -1) {
    selectedQualities.value.push(quality)
  } else {
    selectedQualities.value.splice(index, 1)
  }
}

// 重置所有筛选器
const resetFilters = () => {
  searchQuery.value = ''
  selectedQualities.value = []
  sources.enchantmentTable = false
  sources.villager = false
  sources.chest = false
}

// 筛选后的附魔
const filteredEnchants = computed(() => {
  return enchants.filter(enchant => {
    // 搜索筛选
    const query = searchQuery.value.toLowerCase()
    if (query && 
        !enchant.name.toLowerCase().includes(query) && 
        !enchant.description.toLowerCase().includes(query)) {
      return false
    }
    
    // 品质筛选
    if (selectedQualities.value.length > 0 && 
        !selectedQualities.value.includes(enchant.quality)) {
      return false
    }
    
    // 来源筛选
    const sourceFilters = []
    if (sources.enchantmentTable) sourceFilters.push(enchant.enchantmentTable)
    if (sources.villager) sourceFilters.push(enchant.villager)
    if (sources.chest) sourceFilters.push(enchant.chest)
    
    // 如果至少一个来源被选中，但当前附魔不满足任何被选中的来源需求
    if (sourceFilters.length > 0 && !sourceFilters.some(Boolean)) {
      return false
    }
    
    return true
  })
})
</script>

<style scoped>
.enchant-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f9f9f9;
  color: #333333;
}

.controls {
  background: #ffffff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 25px;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  border: 2px solid #a3d2ca;
  border-radius: 8px;
  background: #ffffff;
  color: #333333;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #5eaaa8;
  box-shadow: 0 0 0 3px rgba(94, 170, 168, 0.2);
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 25px;
  margin-top: 20px;
}

.filter-group {
  flex: 1;
  min-width: 300px;
}

.filter-group label {
  display: block;
  margin-bottom: 10px;
  font-weight: bold;
  color: #333333;
  font-size: 16px;
}

.quality-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.quality-btn {
  padding: 8px 15px;
  border: none;
  border-radius: 6px;
  background: #e0e0e0;
  color: #333333;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.quality-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.quality-btn.active {
  background: #5eaaa8;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(94, 170, 168, 0.3);
}

.source-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.source-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 15px;
  background: #f0f0f0;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.source-checkbox:hover {
  background: #dbebe7;
}

.source-checkbox input {
  margin-right: 8px;
}

.enchant-stats {
  padding: 10px 15px;
  background: #f0f0f0;
  border-radius: 6px;
  margin-bottom: 20px;
  color: #333333;
  font-size: 15px;
}

.quality-tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  margin: 0 5px;
  font-size: 13px;
  font-weight: bold;
  color: white;
  background: #a3d2ca;
}

.enchant-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 25px;
  margin-top: 20px;
}

.enchant-card {
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  border-left: 4px solid #a3d2ca;
  transform: translateY(0);
}

.enchant-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.1);
}

.enchant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f0f0f0;
  border-bottom: 1px solid #ddd;
}

.enchant-name {
  margin: 0;
  font-size: 20px;
  color: #333333;
}

.enchant-quality {
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 13px;
  font-weight: bold;
}

.enchant-quality.普通 { background: #95a5a6; color: #2c3e50; }
.enchant-quality.罕见 { background: #2ecc71; color: white; }
.enchant-quality.稀有 { background: #3498db; color: white; }
.enchant-quality.史诗 { background: #9b59b6; color: white; }
.enchant-quality.传奇 { background: #f1c40f; color: #2c3e50; }
.enchant-quality.特殊 { background: #e74c3c; color: white; }
.enchant-quality.非常特殊 { 
  background: linear-gradient(45deg, #ff0000, #ff7300, #fffb00, #48ff00, #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000);
  color: white;
}

.enchant-description {
  padding: 20px;
  color: #555555;
  line-height: 1.6;
  min-height: 80px;
}

.enchant-meta {
  padding: 0 20px 20px;
}

.meta-item strong {
  color: #777777;
}

.source-icons {
  display: flex;
  gap: 12px;
  margin-top: 5px;
}

.source-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e0e0e0;
  color: #5eaaa8;
  font-size: 18px;
}

.source-icon.enchantment-table-icon { background: rgba(52, 152, 219, 0.2); }
.source-icon.villager-icon { background: rgba(46, 204, 113, 0.2); }
.source-icon.chest-icon { background: rgba(241, 196, 15, 0.2); }
.source-icon.special-icon { 
  background: rgba(231, 76, 60, 0.2);
  width: auto;
  padding: 0 12px;
  border-radius: 18px;
}

.no-results {
  text-align: center;
  padding: 50px 20px;
  background: #ffffff;
  border-radius: 12px;
  margin-top: 20px;
}

.no-results-icon {
  font-size: 60px;
  margin-bottom: 20px;
  color: #c0c0c0;
}

.no-results h3 {
  color: #555555;
  margin-bottom: 10px;
}

.no-results p {
  color: #999999;
  margin-bottom: 20px;
}

.reset-btn {
  padding: 10px 25px;
  background: #5eaaa8;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;
}

.reset-btn:hover {
  background: #4d9a94;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(94, 170, 168, 0.2);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .filters {
    flex-direction: column;
    gap: 15px;
  }

  .filter-group {
    min-width: 100%;
  }

  .enchant-grid {
    grid-template-columns: 1fr;
  }
}
</style>
```

## 功能特性

这个Vue 3组件演示包含：

1. **响应式搜索** - 实时搜索附魔名称和描述
2. **多维度筛选** - 按品质和获取方式筛选
3. **动态统计** - 实时显示筛选结果数量
4. **交互式界面** - 按钮状态切换，悬停效果
5. **无结果处理** - 智能显示无匹配结果的提示
6. **响应式设计** - 适配移动端和桌面端

### Vue 3 Composition API 特性

- ✅ `ref()` 响应式数据
- ✅ `reactive()` 对象响应式
- ✅ `computed()` 计算属性
- ✅ 复杂的数组过滤逻辑
- ✅ 事件处理函数
- ✅ 条件渲染 `v-if`
- ✅ 列表渲染 `v-for`
- ✅ 双向绑定 `v-model`
- ✅ 动态class绑定 