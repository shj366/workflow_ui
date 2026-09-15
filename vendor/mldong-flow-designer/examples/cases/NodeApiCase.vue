<!--
  案例2：节点 API 操作演示

  验证 designerApi 在钉钉模式下的核心节点 API：
  - updateText(id, text): 修改节点显示文本
  - setProperties(id, props): 合并节点 properties
  - deleteProperty(id, key): 删除单个 property
  - changeNodeId(old, new): 修改节点 ID（同步 properties.name）
  - setHighlight(data): 设置高亮
  - getAllNodes(): 获取所有节点
  - render(data): 重渲染
-->
<template>
  <div class="node-api-case">
    <!--
      顶部 toolbar（模式切换 + 标题 + 操作按钮）
      移动端预览时隐藏：演示站额外加的 UI 不属于 flow-designer 组件。
      移动端预览的目的 = 还原用户在实际移动端上看到的画面。
    -->
    <div v-if="!isMobilePreview" class="case-toolbar">
      <!--
        模式切换按钮：仅演示站可见。
        - 线上环境业务方只有一个模式（钉钉），不需要切换。
        - 移动端预览场景下也不需要（移动端本来就只有一个模式）。
        演示站为了对比画布/钉钉两种渲染效果才增加这个开关。
      -->
      <div v-if="showModeSwitch" class="mode-switch">
        <button :class="{ active: mode === 'canvas' }" @click="mode = 'canvas'">画布模式</button>
        <button :class="{ active: mode === 'dingtalk' }" @click="mode = 'dingtalk'">钉钉模式</button>
      </div>
      <div class="case-title">节点 API 操作演示</div>
      <div class="case-actions">
        <el-button size="small" @click="logAllNodes">打印所有节点</el-button>
        <el-button size="small" @click="testUpdateText">updateText 测试</el-button>
        <el-button size="small" @click="testSetProperties">setProperties 测试</el-button>
        <el-button size="small" type="danger" @click="testDeleteProperty">deleteProperty 测试</el-button>
        <el-button size="small" type="warning" @click="testChangeId">changeNodeId 测试</el-button>
        <el-button size="small" type="success" @click="testHighlight">setHighlight 测试</el-button>
      </div>
    </div>

    <div class="case-body">
      <!-- 左侧：设计器（移动端预览时是页面上唯一展示的元素） -->
      <div class="designer-wrap">
        <FlowDesigner
          ref="designerRef"
          v-model:value="graphData"
          :mode="mode"
          :high-light="highLightData"
          @on-init="handleInit"
        />
      </div>

      <!--
        右侧面板（当前所有节点 + 操作日志）
        移动端预览时隐藏（仅在演示站桌面端用于调试，不属于 flow-designer 组件）。
      -->
      <div v-if="!isMobilePreview" class="side-panel">
        <div class="panel-section">
          <div class="panel-header">📋 当前所有节点</div>
          <div class="node-list">
            <div
              v-for="(n, idx) in nodes"
              :key="`${n.id}-${idx}`"
              :class="['node-item', { highlighted: isHighlighted(n.id) }]"
            >
              <div class="node-row1">
                <span class="node-id">{{ n.id }}</span>
                <span class="node-type">{{ n.type }}</span>
              </div>
              <div class="node-row2">
                <span class="node-text">{{ n.text?.value || '(空)' }}</span>
              </div>
              <div class="node-row3">
                <span class="node-props-title">properties:</span>
                <span class="node-props">{{ formatProps(n.properties) }}</span>
              </div>
            </div>
            <div v-if="!nodes.length" class="empty">无节点数据</div>
          </div>
        </div>

        <div class="panel-section">
          <div class="panel-header">📝 操作日志</div>
          <div class="log-list">
            <div v-for="(log, i) in logs" :key="i" :class="['log-item', log.type]">
              <span class="log-time">{{ log.time }}</span>
              <span class="log-msg">{{ log.msg }}</span>
            </div>
            <div v-if="!logs.length" class="empty">暂无操作</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import FlowDesigner from '../../packages/index'
import LeaveJson from '../assets/wf-leave.json'
import { useIsMobilePreview } from '../composables/useIsMobilePreview'
import type { FDHighLightType } from '../../packages/flow-designer/src/types'

const mode = ref<'canvas' | 'dingtalk'>('dingtalk')

const isMobilePreview = useIsMobilePreview()

/**
 * 是否显示模式切换按钮（画布/钉钉）
 * - dev 环境（演示站）下、且未开启移动端预览时：显示
 * - 移动端预览：隐藏（移动端场景只有一个模式）
 * - build 后（线上环境）：隐藏（Vite 静态消除 DEV === false 分支）
 * 模式切换不是 flow-designer 组件的一部分，是 Example 演示
 * 为了对比画布/钉钉两种渲染效果加的。
 */
const showModeSwitch = computed(() => import.meta.env.DEV && !isMobilePreview.value)
const designerRef = ref<any>(null)
// 模板 ref 仅挂载用，显式引用避免 vue-tsc 3.x TS6133 误报
void designerRef
const graphData = ref<any>(structuredClone(LeaveJson))

const highLightData = ref<FDHighLightType>({
  historyNodeNames: ['start'],
  historyEdgeNames: [],
  activeNodeNames: ['apply'],
})

const api = ref<any>(null)
const nodes = ref<any[]>([])

const handleInit = (instance: any) => {
  api.value = instance
  log('init', `API 就绪（${mode.value} 模式）`)
  refreshNodes()
  // 订阅事件
  instance.eventCenter?.on('update:graphData', () => {
    log('event', 'update:graphData 触发')
    refreshNodes()
  })
}

const refreshNodes = () => {
  if (!api.value?.getAllNodes) {
    nodes.value = []
    return
  }
  nodes.value = api.value.getAllNodes()
}

// ===== API 测试 =====

const testUpdateText = () => {
  if (!api.value) return
  // 改 apply 节点的文本（id 或 properties.name 都行）
  api.value.updateText('apply', `请假申请-${Date.now() % 10000}`)
  log('ok', 'updateText("apply", ...) 完成')
}

const testSetProperties = () => {
  if (!api.value) return
  api.value.setProperties('approveDept', {
    customAssignee: `mgr-${Date.now() % 1000}`,
    customRole: '部门管理员',
  })
  log('ok', 'setProperties("approveDept", {customAssignee, customRole}) 完成')
}

const testDeleteProperty = () => {
  if (!api.value) return
  api.value.deleteProperty('apply', 'assignee')
  log('ok', 'deleteProperty("apply", "assignee") 完成')
}

const testChangeId = () => {
  if (!api.value) return
  // changeNodeId 同步 node.id 和 properties.name
  const newId = `applyNew_${Date.now() % 1000}`
  api.value.changeNodeId('apply', newId)
  log('ok', `changeNodeId("apply", "${newId}") 完成`)
}

const testHighlight = () => {
  if (!api.value) return
  // 切换不同的高亮
  const cycle = [
    { historyNodeNames: ['start', 'apply'], historyEdgeNames: ['t1'], activeNodeNames: ['approveDept'] },
    { historyNodeNames: ['approveDept'], historyEdgeNames: ['t3'], activeNodeNames: ['d1'] },
    { historyNodeNames: ['d1'], historyEdgeNames: ['t4'], activeNodeNames: ['approveHr'] },
    { historyNodeNames: [], historyEdgeNames: [], activeNodeNames: [] },
  ]
  const idx = (cycle.findIndex(c =>
    JSON.stringify(c) === JSON.stringify(highLightData.value)
  ) + 1) % cycle.length
  const next = cycle[idx]
  api.value.setHighlight(next)
  highLightData.value = next
  log('ok', `setHighlight 完成：active=${next.activeNodeNames.join(',')}`)
}

const logAllNodes = () => {
  refreshNodes()
  console.log('[API] 所有节点:', nodes.value)
  log('info', `共 ${nodes.value.length} 个节点（已打印到 console）`)
}

// ===== 工具 =====
const isHighlighted = (id: string) => {
  const hl = highLightData.value
  return hl?.activeNodeNames?.includes(id) || hl?.historyNodeNames?.includes(id)
}

const formatProps = (props: Record<string, any>) => {
  if (!props) return ''
  return Object.entries(props)
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join(', ')
}

// ===== 日志 =====
interface LogItem { time: string; msg: string; type: string }
const logs = ref<LogItem[]>([])
const log = (type: string, msg: string) => {
  const now = new Date()
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
  logs.value.unshift({ time, msg, type })
  if (logs.value.length > 40) logs.value.pop()
}

watch(mode, () => {
  nodes.value = []
  logs.value = []
})
</script>

<style scoped>
.node-api-case {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.case-toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  gap: 16px;
  z-index: 5;
}

.case-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  flex: 1;
  text-align: center;
}

.mode-switch {
  display: flex;
  gap: 4px;
  padding: 3px;
  background: #f5f7fa;
  border-radius: 18px;
}

.mode-switch button {
  padding: 5px 14px;
  border: none;
  border-radius: 14px;
  background: transparent;
  color: #606266;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.mode-switch button.active {
  background: #3068EC;
  color: #fff;
}

.case-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.case-body {
  flex: 1;
  min-height: 0;
  display: flex;
}

.designer-wrap {
  flex: 1;
  min-width: 0;
  position: relative;
}

.side-panel {
  flex-shrink: 0;
  width: 360px;
  height: 100%;
  background: #fff;
  border-left: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-section {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-bottom: 1px solid #ebeef5;
}

.panel-section:first-child {
  flex: 1 1 0;
}

.panel-section:last-child {
  flex: 1 1 0;
}

.panel-header {
  flex-shrink: 0;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  background: #fafbfc;
  border-bottom: 1px solid #ebeef5;
}

.node-list,
.log-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 6px 10px;
}

.node-item {
  padding: 8px 10px;
  margin-bottom: 6px;
  border-radius: 6px;
  background: #fafbfc;
  border: 1px solid #ebeef5;
  font-size: 12px;
  line-height: 1.5;
}

.node-item.highlighted {
  background: #fef5e7;
  border-color: #f5b041;
  box-shadow: 0 0 0 2px rgba(245, 176, 65, 0.15);
}

.node-row1 {
  display: flex;
  justify-content: space-between;
  font-weight: 600;
  color: #303133;
}

.node-id {
  font-family: monospace;
  color: #3068EC;
}

.node-type {
  font-size: 10px;
  padding: 1px 6px;
  background: #e8f0fe;
  color: #3068EC;
  border-radius: 3px;
}

.node-row2 {
  margin-top: 4px;
  color: #303133;
  font-weight: 500;
}

.node-row3 {
  margin-top: 2px;
  color: #909399;
  font-size: 11px;
  word-break: break-all;
}

.node-props-title {
  color: #c0c4cc;
}

.log-item {
  display: flex;
  gap: 6px;
  padding: 4px 0;
  font-size: 11px;
  font-family: monospace;
  border-bottom: 1px dashed #f0f2f5;
  line-height: 1.4;
}

.log-time {
  color: #909399;
  flex-shrink: 0;
}

.log-msg {
  flex: 1;
  color: #303133;
}

.log-item.ok .log-msg { color: #67c23a; }
.log-item.warn .log-msg { color: #e6a23c; }
.log-item.event .log-msg { color: #3068EC; }
.log-item.info .log-msg { color: #909399; }
.log-item.init .log-msg { color: #00bcd4; }

.empty {
  text-align: center;
  padding: 30px 16px;
  color: #c0c4cc;
  font-size: 12px;
}
</style>