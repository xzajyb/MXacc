#!/usr/bin/env node

const { build } = require('vite');

async function buildProject() {
  try {
    console.log('🚀 开始构建 MXAcc...');
    
    await build({
      // Vite 配置
      configFile: './vite.config.ts',
      logLevel: 'info'
    });
    
    console.log('✅ 构建完成！');
  } catch (error) {
    console.error('❌ 构建失败:', error);
    process.exit(1);
  }
}

buildProject(); 