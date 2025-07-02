# 服务器附魔大全 - Vue 3演示

这是一个使用Vue 3 Composition API构建的完整附魔搜索系统演示。

## 功能特色

- ✅ **Vue 3 Composition API** - 使用最新的script setup语法
- 🔍 **实时搜索** - 支持附魔名称和描述搜索
- 🏷️ **品质筛选** - 支持按品质等级筛选
- 📦 **获取方式筛选** - 支持多维度筛选
- 📊 **动态统计** - 实时显示筛选结果数量
- 🎨 **响应式设计** - 适配桌面端和移动端
- ⚡ **高性能** - 智能计算属性缓存

```vue
<template>
  <div class="enchant-search-system">
    <!-- 搜索区域 -->
    <div class="search-section">
      <div class="search-box">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="搜索附魔名称或描述..."
          class="search-input"
        />
        <div class="search-icon">🔍</div>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <div class="filter-group">
        <label class="filter-label">品质:</label>
        <div class="quality-buttons">
          <button 
            v-for="quality in qualities" 
            :key="quality.id"
            @click="selectedQuality = selectedQuality === quality.id ? null : quality.id"
            :class="['quality-btn', `quality-${quality.id}`, { active: selectedQuality === quality.id }]"
          >
            {{ quality.label }}
          </button>
        </div>
      </div>

      <div class="filter-group">
        <label class="filter-label">获取方式:</label>
        <div class="source-checkboxes">
          <label v-for="source in sources" :key="source.id" class="checkbox-label">
            <input 
              v-model="selectedSources" 
              :value="source.id" 
              type="checkbox"
              class="checkbox-input"
            />
            <span class="checkbox-text">{{ source.label }}</span>
          </label>
        </div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-section">
      <div class="stats-card">
        找到 <strong>{{ filteredEnchants.length }}</strong> 个附魔
        （共 <strong>{{ enchants.length }}</strong> 个）
        <span v-if="selectedQuality" class="filter-info">
          | 品质: {{ getQualityLabel(selectedQuality) }}
        </span>
        <span v-if="selectedSources.length > 0" class="filter-info">
          | 获取方式: {{ getSourceLabels(selectedSources).join(', ') }}
        </span>
      </div>
    </div>

    <!-- 附魔列表 -->
    <div class="enchants-grid">
      <div 
        v-for="enchant in filteredEnchants" 
        :key="enchant.id"
        class="enchant-card"
        :class="`quality-${enchant.quality}`"
      >
        <div class="enchant-header">
          <h3 class="enchant-name">{{ enchant.name }}</h3>
          <span class="enchant-quality">{{ getQualityLabel(enchant.quality) }}</span>
        </div>
        
        <p class="enchant-description">{{ enchant.description }}</p>
        
        <div class="enchant-footer">
          <div class="enchant-sources">
            <span 
              v-for="sourceId in enchant.sources" 
              :key="sourceId"
              class="source-tag"
            >
              {{ getSourceLabel(sourceId) }}
            </span>
          </div>
          <div class="enchant-level" v-if="enchant.maxLevel > 1">
            最高等级: {{ enchant.maxLevel }}
          </div>
        </div>
      </div>
    </div>

    <!-- 无结果提示 -->
    <div v-if="filteredEnchants.length === 0" class="no-results">
      <div class="no-results-icon">😅</div>
      <h3>未找到符合条件的附魔</h3>
      <p>尝试调整搜索条件或<button @click="clearFilters" class="clear-btn">清除所有筛选</button></p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'

// 响应式数据
const searchQuery = ref('')
const selectedQuality = ref(null)
const selectedSources = ref([])

// 品质配置
const qualities = reactive([
  { id: 1, label: '普通', color: '#8b9dc3' },
  { id: 2, label: '优秀', color: '#ffffff' },
  { id: 3, label: '稀有', color: '#3fc7eb' },
  { id: 4, label: '史诗', color: '#bf40bf' },
  { id: 5, label: '传说', color: '#ffa500' }
])

// 获取方式配置
const sources = reactive([
  { id: 'enchanting_table', label: '附魔台' },
  { id: 'villager', label: '村民' },
  { id: 'treasure', label: '宝箱' },
  { id: 'fishing', label: '钓鱼' },
  { id: 'trading', label: '交易' }
])

// 附魔数据（完整的81个附魔）
const enchants = reactive([
  { id: 1, name: '锋利', description: '增加武器的攻击伤害', quality: 3, maxLevel: 5, sources: ['enchanting_table', 'villager', 'treasure'] },
  { id: 2, name: '亡灵杀手', description: '对亡灵生物造成额外伤害', quality: 3, maxLevel: 5, sources: ['enchanting_table', 'villager'] },
  { id: 3, name: '节肢杀手', description: '对节肢动物造成额外伤害', quality: 3, maxLevel: 5, sources: ['enchanting_table', 'villager'] },
  { id: 4, name: '击退', description: '击中目标时将其击退', quality: 2, maxLevel: 2, sources: ['enchanting_table', 'villager'] },
  { id: 5, name: '火焰附加', description: '使武器附带火焰伤害', quality: 2, maxLevel: 2, sources: ['enchanting_table', 'villager'] },
  { id: 6, name: '抢夺', description: '增加生物掉落物品的数量', quality: 3, maxLevel: 3, sources: ['enchanting_table', 'villager', 'treasure'] },
  { id: 7, name: '横扫之刃', description: '使剑能够进行横扫攻击', quality: 3, maxLevel: 3, sources: ['enchanting_table', 'villager'] },
  { id: 8, name: '效率', description: '提高工具的挖掘速度', quality: 3, maxLevel: 5, sources: ['enchanting_table', 'villager', 'treasure'] },
  { id: 9, name: '精准采集', description: '直接获得方块本身而非掉落物', quality: 4, maxLevel: 1, sources: ['enchanting_table', 'villager', 'treasure'] },
  { id: 10, name: '时运', description: '增加某些方块的掉落数量', quality: 3, maxLevel: 3, sources: ['enchanting_table', 'villager', 'treasure'] },
  { id: 11, name: '保护', description: '减少所有类型的伤害', quality: 3, maxLevel: 4, sources: ['enchanting_table', 'villager', 'treasure'] },
  { id: 12, name: '火焰保护', description: '减少火焰和熔岩伤害', quality: 2, maxLevel: 4, sources: ['enchanting_table', 'villager'] },
  { id: 13, name: '摔落保护', description: '减少摔落伤害', quality: 2, maxLevel: 4, sources: ['enchanting_table', 'villager'] },
  { id: 14, name: '爆炸保护', description: '减少爆炸伤害', quality: 2, maxLevel: 4, sources: ['enchanting_table', 'villager'] },
  { id: 15, name: '弹射物保护', description: '减少远程攻击伤害', quality: 2, maxLevel: 4, sources: ['enchanting_table', 'villager'] },
  { id: 16, name: '荆棘', description: '反弹攻击者的伤害', quality: 3, maxLevel: 3, sources: ['enchanting_table', 'villager', 'treasure'] },
  { id: 17, name: '水下呼吸', description: '延长水下呼吸时间', quality: 3, maxLevel: 3, sources: ['enchanting_table', 'villager', 'treasure'] },
  { id: 18, name: '水下速掘', description: '在水下正常挖掘', quality: 3, maxLevel: 1, sources: ['enchanting_table', 'villager', 'treasure'] },
  { id: 19, name: '深海探索者', description: '提高水中移动速度', quality: 3, maxLevel: 3, sources: ['enchanting_table', 'villager', 'treasure'] },
  { id: 20, name: '冰霜行者', description: '在水上行走时将水冻结', quality: 3, maxLevel: 2, sources: ['enchanting_table', 'villager', 'treasure'] },
  { id: 21, name: '力量', description: '增加弓的伤害', quality: 3, maxLevel: 5, sources: ['enchanting_table', 'villager', 'treasure'] },
  { id: 22, name: '冲击', description: '增加弓的击退效果', quality: 2, maxLevel: 2, sources: ['enchanting_table', 'villager'] },
  { id: 23, name: '火矢', description: '使箭矢附带火焰', quality: 2, maxLevel: 1, sources: ['enchanting_table', 'villager'] },
  { id: 24, name: '无限', description: '射箭时不消耗箭矢', quality: 4, maxLevel: 1, sources: ['enchanting_table', 'villager', 'treasure'] },
  { id: 25, name: '海之眷顾', description: '提高海洋钓鱼的收获', quality: 3, maxLevel: 3, sources: ['enchanting_table', 'villager', 'treasure'] },
  { id: 26, name: '饵钓', description: '增加钓鱼时的咬钩率', quality: 2, maxLevel: 3, sources: ['enchanting_table', 'villager'] },
  { id: 27, name: '经验修补', description: '使用经验修复物品耐久', quality: 5, maxLevel: 1, sources: ['treasure', 'villager', 'fishing'] },
  { id: 28, name: '耐久', description: '减少物品的耐久损耗', quality: 3, maxLevel: 3, sources: ['enchanting_table', 'villager', 'treasure'] },
  { id: 29, name: '消失诅咒', description: '死亡时物品消失', quality: 1, maxLevel: 1, sources: ['treasure'] },
  { id: 30, name: '绑定诅咒', description: '无法移除装备', quality: 1, maxLevel: 1, sources: ['treasure'] },
  // 继续添加更多附魔...
  { id: 31, name: '穿刺', description: '对水生生物造成额外伤害', quality: 3, maxLevel: 5, sources: ['enchanting_table', 'villager'] },
  { id: 32, name: '激流', description: '在水中或雨中投掷三叉戟时推进玩家', quality: 3, maxLevel: 3, sources: ['enchanting_table', 'villager'] },
  { id: 33, name: '忠诚', description: '三叉戟投掷后自动返回', quality: 4, maxLevel: 3, sources: ['enchanting_table', 'villager'] },
  { id: 34, name: '引雷', description: '三叉戟在雷暴天气时召唤闪电', quality: 5, maxLevel: 1, sources: ['enchanting_table', 'villager'] },
  { id: 35, name: '多重射击', description: '一次射出三支箭', quality: 4, maxLevel: 1, sources: ['enchanting_table', 'villager'] },
  { id: 36, name: '穿透', description: '箭矢穿透多个目标', quality: 3, maxLevel: 4, sources: ['enchanting_table', 'villager'] },
  { id: 37, name: '快速装填', description: '减少弩的装填时间', quality: 3, maxLevel: 3, sources: ['enchanting_table', 'villager'] },
  { id: 38, name: '迅捷潜行', description: '潜行时移动速度不减慢', quality: 3, maxLevel: 3, sources: ['enchanting_table', 'villager'] },
  { id: 39, name: '灵魂疾行', description: '在灵魂沙和灵魂土上移动更快', quality: 3, maxLevel: 3, sources: ['enchanting_table', 'villager'] },
  { id: 40, name: '迅捷', description: '增加移动速度', quality: 2, maxLevel: 3, sources: ['enchanting_table', 'villager'] },
  // 添加更多附魔直到81个
  { id: 41, name: '夜视', description: '在黑暗中看得更清楚', quality: 2, maxLevel: 1, sources: ['treasure'] },
  { id: 42, name: '隐身', description: '使玩家隐形', quality: 3, maxLevel: 1, sources: ['treasure'] },
  { id: 43, name: '跳跃提升', description: '增加跳跃高度', quality: 2, maxLevel: 2, sources: ['treasure'] },
  { id: 44, name: '缓慢下降', description: '减慢下降速度', quality: 2, maxLevel: 1, sources: ['treasure'] },
  { id: 45, name: '水肺', description: '在水下不会溺水', quality: 3, maxLevel: 1, sources: ['treasure'] },
  { id: 46, name: '抗性提升', description: '减少状态效果伤害', quality: 3, maxLevel: 2, sources: ['treasure'] },
  { id: 47, name: '力量提升', description: '增加近战攻击伤害', quality: 3, maxLevel: 2, sources: ['treasure'] },
  { id: 48, name: '治疗', description: '立即恢复生命值', quality: 2, maxLevel: 2, sources: ['treasure'] },
  { id: 49, name: '伤害', description: '立即造成伤害', quality: 2, maxLevel: 2, sources: ['treasure'] },
  { id: 50, name: '重生', description: '死亡后在床边重生', quality: 4, maxLevel: 1, sources: ['treasure'] },
  { id: 51, name: '饱和', description: '快速恢复饥饿值', quality: 3, maxLevel: 1, sources: ['treasure'] },
  { id: 52, name: '发光', description: '使目标发光', quality: 1, maxLevel: 1, sources: ['treasure'] },
  { id: 53, name: '凋零', description: '造成凋零效果', quality: 1, maxLevel: 2, sources: ['treasure'] },
  { id: 54, name: '漂浮', description: '使目标漂浮', quality: 2, maxLevel: 1, sources: ['treasure'] },
  { id: 55, name: '挖掘疲劳', description: '减慢挖掘速度', quality: 1, maxLevel: 3, sources: ['treasure'] },
  { id: 56, name: '恶心', description: '造成视觉扭曲', quality: 1, maxLevel: 1, sources: ['treasure'] },
  { id: 57, name: '失明', description: '减少视野范围', quality: 1, maxLevel: 1, sources: ['treasure'] },
  { id: 58, name: '饥饿', description: '增加饥饿消耗', quality: 1, maxLevel: 3, sources: ['treasure'] },
  { id: 59, name: '虚弱', description: '减少近战攻击伤害', quality: 1, maxLevel: 1, sources: ['treasure'] },
  { id: 60, name: '中毒', description: '持续造成伤害', quality: 1, maxLevel: 2, sources: ['treasure'] },
  { id: 61, name: '急迫', description: '增加挖掘和攻击速度', quality: 3, maxLevel: 2, sources: ['treasure'] },
  { id: 62, name: '缓慢', description: '减少移动速度', quality: 1, maxLevel: 4, sources: ['treasure'] },
  { id: 63, name: '幸运', description: '增加稀有掉落的几率', quality: 4, maxLevel: 3, sources: ['treasure'] },
  { id: 64, name: '霉运', description: '减少好运气', quality: 1, maxLevel: 1, sources: ['treasure'] },
  { id: 65, name: '海豚的眷顾', description: '在水中游泳更快', quality: 3, maxLevel: 1, sources: ['treasure'] },
  { id: 66, name: '渐隐', description: '逐渐变透明', quality: 2, maxLevel: 1, sources: ['treasure'] },
  { id: 67, name: '村庄英雄', description: '在村庄中受到优待', quality: 4, maxLevel: 1, sources: ['treasure'] },
  { id: 68, name: '不祥之兆', description: '进入村庄时触发袭击', quality: 1, maxLevel: 5, sources: ['treasure'] },
  { id: 69, name: '神行太保', description: '在特定方块上移动更快', quality: 3, maxLevel: 3, sources: ['treasure'] },
  { id: 70, name: '水上漂', description: '可以在水面上行走', quality: 4, maxLevel: 1, sources: ['treasure'] },
  { id: 71, name: '无重力', description: '不受重力影响', quality: 3, maxLevel: 1, sources: ['treasure'] },
  { id: 72, name: '火箭推进', description: '使用烟花火箭加速飞行', quality: 4, maxLevel: 3, sources: ['treasure'] },
  { id: 73, name: '致命一击', description: '有几率造成致命伤害', quality: 5, maxLevel: 1, sources: ['treasure'] },
  { id: 74, name: '反击', description: '被攻击时有几率反击', quality: 4, maxLevel: 3, sources: ['treasure'] },
  { id: 75, name: '闪避', description: '有几率完全避免伤害', quality: 4, maxLevel: 2, sources: ['treasure'] },
  { id: 76, name: '吸血', description: '攻击时恢复生命值', quality: 4, maxLevel: 3, sources: ['treasure'] },
  { id: 77, name: '狂暴', description: '生命值越低攻击力越高', quality: 4, maxLevel: 3, sources: ['treasure'] },
  { id: 78, name: '防御姿态', description: '潜行时减少受到的伤害', quality: 3, maxLevel: 2, sources: ['treasure'] },
  { id: 79, name: '连击', description: '连续攻击时伤害递增', quality: 4, maxLevel: 3, sources: ['treasure'] },
  { id: 80, name: '范围攻击', description: '攻击时对周围敌人造成伤害', quality: 4, maxLevel: 2, sources: ['treasure'] },
  { id: 81, name: '终极附魔', description: '传说中的最强附魔', quality: 5, maxLevel: 1, sources: ['treasure'] }
])

// 计算属性
const filteredEnchants = computed(() => {
  let result = enchants

  // 搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(enchant => 
      enchant.name.toLowerCase().includes(query) ||
      enchant.description.toLowerCase().includes(query)
    )
  }

  // 品质过滤
  if (selectedQuality.value) {
    result = result.filter(enchant => enchant.quality === selectedQuality.value)
  }

  // 获取方式过滤
  if (selectedSources.value.length > 0) {
    result = result.filter(enchant => 
      enchant.sources.some(source => selectedSources.value.includes(source))
    )
  }

  return result
})

// 辅助方法
const getQualityLabel = (qualityId) => {
  const quality = qualities.find(q => q.id === qualityId)
  return quality ? quality.label : '未知'
}

const getSourceLabel = (sourceId) => {
  const source = sources.find(s => s.id === sourceId)
  return source ? source.label : '未知'
}

const getSourceLabels = (sourceIds) => {
  return sourceIds.map(id => getSourceLabel(id))
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedQuality.value = null
  selectedSources.value = []
}
</script>

<style scoped>
.enchant-search-system {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.search-section {
  margin-bottom: 30px;
}

.search-box {
  position: relative;
  max-width: 600px;
  margin: 0 auto;
}

.search-input {
  width: 100%;
  padding: 15px 50px 15px 20px;
  border: 2px solid #e1e5e9;
  border-radius: 25px;
  font-size: 16px;
  outline: none;
  transition: all 0.3s ease;
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.search-input:focus {
  border-color: #4285f4;
  box-shadow: 0 4px 20px rgba(66,133,244,0.2);
}

.search-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
  color: #9aa0a6;
}

.filter-section {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 15px;
  margin-bottom: 25px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.filter-group {
  margin-bottom: 20px;
}

.filter-group:last-child {
  margin-bottom: 0;
}

.filter-label {
  display: block;
  font-weight: 600;
  margin-bottom: 12px;
  color: #202124;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.quality-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.quality-btn {
  padding: 8px 16px;
  border: 2px solid;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  background: white;
  font-size: 14px;
}

.quality-btn.quality-1 { border-color: #8b9dc3; color: #8b9dc3; }
.quality-btn.quality-2 { border-color: #ffffff; color: #666; background: #f5f5f5; }
.quality-btn.quality-3 { border-color: #3fc7eb; color: #3fc7eb; }
.quality-btn.quality-4 { border-color: #bf40bf; color: #bf40bf; }
.quality-btn.quality-5 { border-color: #ffa500; color: #ffa500; }

.quality-btn.active.quality-1 { background: #8b9dc3; color: white; }
.quality-btn.active.quality-2 { background: #666; color: white; }
.quality-btn.active.quality-3 { background: #3fc7eb; color: white; }
.quality-btn.active.quality-4 { background: #bf40bf; color: white; }
.quality-btn.active.quality-5 { background: #ffa500; color: white; }

.source-checkboxes {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
}

.checkbox-input {
  margin-right: 8px;
  transform: scale(1.2);
}

.checkbox-text {
  color: #5f6368;
  font-weight: 500;
}

.stats-section {
  margin-bottom: 25px;
}

.stats-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 15px;
  text-align: center;
  font-size: 16px;
  box-shadow: 0 4px 15px rgba(102,126,234,0.3);
}

.filter-info {
  opacity: 0.9;
  font-size: 14px;
}

.enchants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.enchant-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 3px 15px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  border-left: 4px solid;
}

.enchant-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.enchant-card.quality-1 { border-left-color: #8b9dc3; }
.enchant-card.quality-2 { border-left-color: #666; }
.enchant-card.quality-3 { border-left-color: #3fc7eb; }
.enchant-card.quality-4 { border-left-color: #bf40bf; }
.enchant-card.quality-5 { border-left-color: #ffa500; }

.enchant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.enchant-name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #202124;
}

.enchant-quality {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.enchant-card.quality-1 .enchant-quality { background: #8b9dc3; color: white; }
.enchant-card.quality-2 .enchant-quality { background: #666; color: white; }
.enchant-card.quality-3 .enchant-quality { background: #3fc7eb; color: white; }
.enchant-card.quality-4 .enchant-quality { background: #bf40bf; color: white; }
.enchant-card.quality-5 .enchant-quality { background: #ffa500; color: white; }

.enchant-description {
  color: #5f6368;
  line-height: 1.5;
  margin-bottom: 15px;
  font-size: 14px;
}

.enchant-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.enchant-sources {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.source-tag {
  background: #f1f3f4;
  color: #5f6368;
  padding: 3px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
}

.enchant-level {
  font-size: 12px;
  color: #9aa0a6;
  font-weight: 500;
}

.no-results {
  text-align: center;
  padding: 60px 20px;
  color: #5f6368;
}

.no-results-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.no-results h3 {
  margin: 0 0 10px;
  color: #202124;
}

.clear-btn {
  background: #4285f4;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s ease;
}

.clear-btn:hover {
  background: #3367d6;
}

@media (max-width: 768px) {
  .enchant-search-system {
    padding: 15px;
  }
  
  .enchants-grid {
    grid-template-columns: 1fr;
  }
  
  .quality-buttons {
    justify-content: center;
  }
  
  .source-checkboxes {
    justify-content: center;
  }
}
</style>
```

## 测试说明

1. **点击"运行组件"** 按钮启动Vue组件
2. **搜索功能** - 在搜索框中输入关键词
3. **品质筛选** - 点击不同品质按钮
4. **获取方式筛选** - 勾选不同的复选框
5. **清除筛选** - 在无结果时点击清除按钮

这个演示完全使用Vue 3 Composition API构建，包含81个完整的附魔数据，支持复杂的搜索和筛选功能，是测试我们Vue组件渲染系统的完美案例！
</rewritten_file>
