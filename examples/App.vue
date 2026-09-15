<script setup lang="ts">
import { ref, shallowRef, watch } from 'vue'
import Example from './components/Example.vue'
import VbenProcessCase from './cases/VbenProcessCase.vue'
import NodeApiCase from './cases/NodeApiCase.vue'
import ViewerCase from './cases/ViewerCase.vue'
import CountersignCase from './cases/CountersignCase.vue'

interface CaseItem {
  key: string
  label: string
  desc: string
  component: any
}

const cases: CaseItem[] = [
  { key: 'home', label: '首页演示', desc: '画布/钉钉模式基础演示', component: Example },
  { key: 'vben-process', label: '案例1: vben5 process-drawer 风格', desc: '业务方真实写法移植测试', component: VbenProcessCase },
  { key: 'node-api', label: '案例2: 节点 API 操作', desc: 'updateText / setProperties / deleteProperty', component: NodeApiCase },
  { key: 'viewer', label: '案例3: 钉钉模式 · 预览模式', desc: ':viewer=true 与画布模式 isSilentMode 对齐', component: ViewerCase },
  { key: 'countersign', label: '案例4: 会签进度回显', desc: 'countersignProgress 角标 + 成员列表回显', component: CountersignCase },
]

const activeKey = ref<string>('home')
const activeCase = shallowRef<any>(Example)

/**
 * 移动端预览开关
 * 激活后主区域宽度收缩为 375px（手机视口），
 * 并给 <html> 加 is-mobile-preview class 触发钉钉模式移动端样式
 * （@media (max-width: 768px) 不会被缩小容器触发，需额外用类选择器）
 * 便于业务方查看节点卡片自适应 + pan/pinch 交互
 */
const isMobilePreview = ref(false)
const toggleMobilePreview = () => {
  isMobilePreview.value = !isMobilePreview.value
}
watch(isMobilePreview, (v) => {
  document.documentElement.classList.toggle('is-mobile-preview', v)
}, { immediate: true })

// 监听 hash 变化支持直接访问指定案例
const syncFromHash = () => {
  const hash = window.location.hash.replace('#/', '').replace('#', '')
  const found = cases.find(c => c.key === hash)
  if (found) {
    activeKey.value = found.key
    activeCase.value = found.component
  }
}

const handleSelect = (item: CaseItem) => {
  activeKey.value = item.key
  activeCase.value = item.component
  window.location.hash = `#/${item.key}`
}

window.addEventListener('hashchange', syncFromHash)
syncFromHash()
</script>

<template>
  <div class="app-shell">
    <nav class="case-nav">
      <div class="case-nav__brand">
        <span class="brand-icon">⚙️</span>
        <span class="brand-text">flow-designer-plus · 演示与验证</span>
      </div>
      <div class="case-nav__tabs">
        <button
          v-for="item in cases"
          :key="item.key"
          :class="['case-tab', { active: activeKey === item.key }]"
          :title="item.desc"
          @click="handleSelect(item)"
        >
          {{ item.label }}
        </button>
        <button
          :class="['case-tab', 'case-tab--mobile', { active: isMobilePreview }]"
          :title="isMobilePreview ? '退出移动端预览' : '预览移动端效果（375px）'"
          @click="toggleMobilePreview"
        >
          <span class="mobile-icon">{{ isMobilePreview ? '📱' : '📱' }}</span>
          {{ isMobilePreview ? '移动端（开）' : '移动端' }}
        </button>
      </div>
      <a
        class="source-link"
        href="https://gitee.com/mldong/flow-designer"
        target="_blank"
        title="源码仓库"
      >
        <span class="source-icon">
          <img src="https://gitee.com/mldong/flow-designer/badge/star.svg" alt="star" width="80" height="20" />
        </span>
      </a>
    </nav>
    <main :class="['app-main', { 'app-main--mobile': isMobilePreview }]">
      <div class="app-main__viewport">
        <component :is="activeCase" />
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.case-nav {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 0 24px;
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  z-index: 10;
}

.case-nav__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.brand-icon {
  font-size: 22px;
}

.source-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 12px;
  padding: 3px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  color: #909399;
  text-decoration: none;
  transition: all 0.18s;
}

.source-link:hover {
  color: #3068EC;
  border-color: #3068EC;
  background: rgba(48, 104, 236, 0.06);
}

.source-icon {
  display: inline-flex;
  align-items: center;
  line-height: 0;
}

.source-icon img {
  display: block;
  height: 20px;
  width: auto;
}

.case-nav__tabs {
  display: flex;
  gap: 6px;
  margin-left: auto;
}

.case-tab {
  padding: 7px 16px;
  border: none;
  border-radius: 16px;
  background: transparent;
  color: #606266;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.18s;
  white-space: nowrap;
}

.case-tab:hover:not(.active) {
  background: rgba(48, 104, 236, 0.08);
  color: #3068EC;
}

.case-tab.active {
  background: #3068EC;
  color: #fff;
  box-shadow: 0 2px 6px rgba(48, 104, 236, 0.3);
}

/* 移动端预览开关按钮 */
.case-tab--mobile {
  margin-left: 12px;
  border: 1px dashed #c0c4cc;
  background: #f5f7fa;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.case-tab--mobile:hover:not(.active) {
  background: #e8f0fe;
  border-color: #3068EC;
  color: #3068EC;
}

.case-tab--mobile.active {
  background: #67c23a;
  border-color: #67c23a;
  box-shadow: 0 2px 6px rgba(103, 194, 58, 0.3);
}

.mobile-icon {
  font-size: 14px;
}

.app-main {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
}

.app-main__viewport {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: transparent;
}

/**
 * 移动端预览：
 * 主区域收缩为 375px 宽（iPhone 视口），居中显示，
 * 外面用阴影 + 留白模拟手机外壳；
 * 内部的 :root 上会触发 :root.is-mobile-preview 类选择器，
 * 钉钉模式节点卡片自动从 220px 缩为 160px，padding 收紧等。
 */
.app-main--mobile {
  display: flex;
  justify-content: center;
  align-items: stretch;
  background: #2c2c2c; /* 手机外壳外侧深色背景 */
  padding: 12px;
}

.app-main--mobile .app-main__viewport {
  flex: 0 0 375px;       /* 防止被 flex 拉伸到全宽 */
  width: 375px;
  max-width: 375px;
  background: #f5f7fa;
  border-radius: 24px; /* 手机圆角 */
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 8px #1a1a1a, 0 0 0 10px #333;
  overflow: hidden;
}
</style>
