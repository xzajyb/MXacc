# 枪械系统测试

测试复杂的Vue组件，包含异步数据获取、标签切换、动态列表渲染等功能。

```vue
<template>
  <div class="weapons-system">
    <div class="tabs">
      <button 
        :class="{ active: activeTab === 'weapons' }" 
        @click="activeTab = 'weapons'"
        class="tab-btn"
      >
        枪械 ({{ weapons.length }})
      </button>
      <button 
        :class="{ active: activeTab === 'ammo' }" 
        @click="activeTab = 'ammo'"
        class="tab-btn"
      >
        弹药 ({{ ammo.length }})
      </button>
    </div>
    
    <div v-if="isLoading" class="loading">
      正在加载数据...
    </div>
    
    <div v-else>
      <!-- 枪械列表 -->
      <div v-if="activeTab === 'weapons'" class="weapons-list">
        <h3>枪械列表</h3>
        <div 
          v-for="weapon in weapons" 
          :key="weapon.id" 
          class="weapon-card"
          @click="toggleWeapon(weapon.id)"
        >
          <div class="weapon-header">
            <h4>{{ weapon.name }}</h4>
            <span class="weapon-type">{{ weapon.type }}</span>
          </div>
          <div v-if="expandedWeapon === weapon.id" class="weapon-details">
            <p><strong>伤害:</strong> {{ weapon.stats.damage }}</p>
            <p><strong>射程:</strong> {{ weapon.stats.range }}</p>
            <p><strong>精度:</strong> {{ weapon.stats.accuracy }}</p>
            <p><strong>弹容量:</strong> {{ weapon.stats.capacity }}</p>
          </div>
        </div>
      </div>
      
      <!-- 弹药列表 -->
      <div v-if="activeTab === 'ammo'" class="ammo-list">
        <h3>弹药列表</h3>
        <div 
          v-for="item in ammo" 
          :key="item.id" 
          class="ammo-card"
        >
          <h4>{{ item.name }}</h4>
          <p>{{ item.description }}</p>
          <div class="compatible-weapons">
            <strong>兼容武器:</strong>
            <span 
              v-for="weaponId in item.compatibleWeapons" 
              :key="weaponId"
              class="weapon-tag"
            >
              {{ getWeaponName(weaponId) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const weapons = ref([])
const ammo = ref([])
const activeTab = ref('weapons')
const expandedWeapon = ref(null)
const isLoading = ref(true)

// 模拟数据
const mockData = {
  weapons: [
    {
      id: 'ak47',
      name: 'AK-47',
      type: '突击步枪',
      stats: { damage: '34', range: '150m', accuracy: '75%', capacity: '30发' }
    },
    {
      id: 'm4a1', 
      name: 'M4A1',
      type: '突击步枪',
      stats: { damage: '31', range: '140m', accuracy: '80%', capacity: '30发' }
    },
    {
      id: 'awp',
      name: 'AWP', 
      type: '狙击步枪',
      stats: { damage: '115', range: '800m', accuracy: '95%', capacity: '10发' }
    }
  ],
  ammo: [
    {
      id: '762_rifle',
      name: '7.62mm步枪弹',
      description: '高威力步枪弹药，适用于远距离作战',
      compatibleWeapons: ['ak47']
    },
    {
      id: '556_rifle', 
      name: '5.56mm步枪弹',
      description: '标准北约步枪弹药，平衡的性能表现',
      compatibleWeapons: ['m4a1']
    },
    {
      id: '338_sniper',
      name: '.338拉普阿弹', 
      description: '专业狙击弹药，极高威力和射程',
      compatibleWeapons: ['awp']
    }
  ]
}

// 模拟异步加载
onMounted(() => {
  setTimeout(() => {
    weapons.value = mockData.weapons
    ammo.value = mockData.ammo
    isLoading.value = false
  }, 1000)
})

const toggleWeapon = (weaponId) => {
  if (expandedWeapon.value === weaponId) {
    expandedWeapon.value = null
  } else {
    expandedWeapon.value = weaponId
  }
}

const getWeaponName = (weaponId) => {
  const weapon = weapons.value.find(w => w.id === weaponId)
  return weapon ? weapon.name : weaponId
}
</script>

<style scoped>
.weapons-system {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tab-btn {
  padding: 10px 20px;
  border: 2px solid #3498db;
  background: white;
  color: #3498db;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s;
}

.tab-btn.active {
  background: #3498db;
  color: white;
}

.tab-btn:hover {
  background: #2980b9;
  color: white;
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #666;
}

.weapon-card, .ammo-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 15px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
}

.weapon-card:hover {
  border-color: #3498db;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.weapon-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.weapon-header h4 {
  margin: 0;
  color: #2c3e50;
}

.weapon-type {
  background: #ecf0f1;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #7f8c8d;
}

.weapon-details {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px dashed #ddd;
}

.weapon-details p {
  margin: 5px 0;
  color: #555;
}

.ammo-card h4 {
  margin: 0 0 10px 0;
  color: #27ae60;
}

.ammo-card p {
  margin: 0 0 10px 0;
  color: #666;
  line-height: 1.4;
}

.compatible-weapons {
  margin-top: 10px;
}

.weapon-tag {
  display: inline-block;
  background: #3498db;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  margin-left: 5px;
}
</style>
```

## 测试要点

这个组件测试了以下Vue 3功能：
1. **响应式数据** - `weapons`、`ammo`、`activeTab`、`expandedWeapon`、`isLoading`
2. **计算属性** - 数组长度显示
3. **条件渲染** - `v-if`、`v-else`
4. **列表渲染** - `v-for`
5. **事件处理** - `@click`
6. **动态类名** - `:class`
7. **生命周期钩子** - `onMounted`
8. **模拟异步操作** - `setTimeout`

如果正常工作，你应该看到：
- 两个标签按钮显示实际的数量
- 1秒后加载完成，显示武器和弹药列表
- 可以切换标签
- 点击武器卡片可以展开/收起详情
- 所有插值语法显示实际数据而非原始文本 