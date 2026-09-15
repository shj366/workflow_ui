<!--
  案例4：会签进度回显（countersignProgress）演示

  演示钉钉模式新版高亮数据：highLight.nodeProgress
  - 节点 properties.performType='ALL' 时识别为会签节点
  - 无 nodeProgress：仅显示会签角标（并行蓝/顺序橙）+ 彩条
  - 有 nodeProgress：回显成员列表（任意节点可带，会签节点额外带 type）
      ✓ 已处理（历史节点） / ▶ 当前轮到（进行中节点，橙色）/ · 未处理（灰色）
  - 兼容两种会签类型存储：properties.countersignType 平铺 与 properties.field.countersignType 嵌套

  业务方用法（后端组装好 nodeProgress 传入即可，前端零心智）：
  ```vue
  <FlowDesigner
    v-model:value="graphData"
    :mode="'dingtalk'"
    :viewer="true"
    :high-light="highLightData"
  />
  ```

  点击「▶ 模拟会签」逐步推进：并行会签逐个打勾，顺序会签"当前轮到"橙色高亮后移。
-->
<template>
  <div class="countersign-case">
    <div v-if="!isMobilePreview" class="case-toolbar">
      <div class="case-info">
        <div class="case-title">钉钉模式 · 会签进度回显</div>
        <div class="case-desc">
          <code>performType=ALL</code> 节点识别为会签：角标区分并行（蓝）/顺序（橙）；
          传入 <code>highLight.countersignProgress</code> 后回显成员列表 ——
          <code>✓</code> 已处理 / <code>▶</code> 当前轮到（顺序会签）/ <code>·</code> 未处理。
          不传则保持现状（仅角标）。
        </div>
      </div>
      <div class="case-actions">
        <el-button type="primary" size="small" @click="viewer = !viewer">
          {{ viewer ? '切换到编辑模式' : '切换到预览模式' }}
        </el-button>
        <el-button
          type="success"
          size="small"
          @click="stepAll"
          :disabled="allDone || !viewer"
        >
          ▶ 模拟会签
        </el-button>
        <el-button size="small" @click="reset" :disabled="allDone || !viewer">
          ↻ 重置
        </el-button>
      </div>
    </div>

    <FlowDesigner
      v-model:value="graphData"
      :mode="mode"
      :viewer="viewer"
      :high-light="highLightData"
    />

    <div v-if="!isMobilePreview" class="event-log">
      <div class="log-header">
        会签进度
        <el-button size="small" text @click="logs = []">清空</el-button>
      </div>
      <div class="log-body">
        <div v-for="(log, i) in logs" :key="i" :class="['log-item', log.type]">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-msg">{{ log.msg }}</span>
        </div>
        <div v-if="!logs.length" class="log-empty">
          点击「▶ 模拟会签」逐步推进会签进度
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import FlowDesigner from '../../packages/index'
import { useIsMobilePreview } from '../composables/useIsMobilePreview'

// 强制钉钉模式
const mode = ref<'canvas' | 'dingtalk'>('dingtalk')
// 默认预览模式（viewer 才需要回显进度；编辑模式展示角标/成员配置）
const viewer = ref(true)

const isMobilePreview = useIsMobilePreview()

/**
 * 会签演示流程：start → 会签申请 → 三人并行会签 → 顺序会签 → end
 * countersignType 使用 field 嵌套格式（与 examples/assets/wf-countersign.json 一致，
 * 后端 NodeParser 兼容平铺/嵌套两种）
 */
const graphData = ref<any>({
  name: 'wf-countersign-demo',
  displayName: '会签进度回显演示',
  nodes: [
    {
      id: 'start', type: 'snaker:start', x: 280, y: 280,
      properties: { width: 120, height: 80 },
      text: { x: 280, y: 320, value: '开始' },
    },
    {
      id: 'apply', type: 'snaker:task', x: 480, y: 280,
      properties: {
        width: 120, height: 80, assignee: 'apply.operator',
        taskType: 'Major', performType: 'ANY', autoExecute: 'N',
      },
      text: { x: 480, y: 280, value: '会签申请' },
    },
    {
      id: 'csParallel', type: 'snaker:task', x: 680, y: 280,
      properties: {
        width: 120, height: 80, assignee: 'u1,u2,u3',
        taskType: 'Major', performType: 'ALL', autoExecute: 'N',
        field: { countersignType: 'PARALLEL', countersignCompletionCondition: '#nrOfCompletedInstances==3' },
      },
      text: { x: 680, y: 280, value: '三人并行会签' },
    },
    {
      id: 'csSeq', type: 'snaker:task', x: 880, y: 280,
      properties: {
        width: 120, height: 80, assignee: 'u4,u5,u6',
        taskType: 'Major', performType: 'ALL', autoExecute: 'N',
        field: { countersignType: 'SEQUENTIAL' },
      },
      text: { x: 880, y: 280, value: '顺序会签' },
    },
    {
      id: 'end', type: 'snaker:end', x: 1080, y: 280,
      properties: { width: 120, height: 80 },
      text: { x: 1080, y: 320, value: '结束' },
    },
  ],
  edges: [
    { id: 't1', type: 'snaker:transition', sourceNodeId: 'start', targetNodeId: 'apply', properties: {} },
    { id: 't2', type: 'snaker:transition', sourceNodeId: 'apply', targetNodeId: 'csParallel', properties: {} },
    { id: 't3', type: 'snaker:transition', sourceNodeId: 'csParallel', targetNodeId: 'csSeq', properties: {} },
    { id: 't4', type: 'snaker:transition', sourceNodeId: 'csSeq', targetNodeId: 'end', properties: {} },
  ],
})

// 会签成员状态（reactive，模拟审批时 mutate，highLight computed 自动重算）
interface Member { id: string; name: string; done?: boolean; active?: boolean }
const csParallelMembers = reactive<Member[]>([
  { id: 'u1', name: '张三', done: true },
  { id: 'u2', name: '李四', done: true },
  { id: 'u3', name: '王五' },
])
const csSeqMembers = reactive<Member[]>([
  { id: 'u4', name: '赵六', done: true },
  { id: 'u5', name: '孙七', active: true },
  { id: 'u6', name: '周八' },
])

// 高亮数据：nodeProgress 结构（后端 highLight 接口扩展后的返回形态）
// 普通节点也可带（apply 为进行中节点，当前处理人 active）；会签节点额外带 type
const highLightData = computed(() => ({
  historyNodeNames: ['apply'],
  historyEdgeNames: [],
  activeNodeNames: [],
  nodeProgress: {
    apply: {
      // 普通节点也可带：进行中节点，当前处理人 active
      members: [
        { id: 'apply.operator', name: '申请人', active: true },
      ],
    },
    csParallel: { type: 'PARALLEL', members: csParallelMembers },
    csSeq: { type: 'SEQUENTIAL', members: csSeqMembers },
  },
}))

const allDone = computed(
  () =>
    csParallelMembers.every((m) => m.done) &&
    csSeqMembers.every((m) => m.done),
)

/** 模拟推进一次：并行逐个打勾；顺序把"当前轮到"置为已完成并移到下一位 */
function stepAll() {
  if (allDone.value) return
  // 并行会签：补下一个未完成
  const pNext = csParallelMembers.find((m) => !m.done)
  if (pNext) {
    pNext.done = true
    log('ok', `并行会签：${pNext.name} 已处理（${csParallelMembers.filter((m) => m.done).length}/${csParallelMembers.length}）`)
    return
  }
  // 顺序会签：当前轮到 → 已完成，激活下一位
  const seqIdx = csSeqMembers.findIndex((m) => m.active)
  if (seqIdx >= 0) {
    csSeqMembers[seqIdx].active = false
    csSeqMembers[seqIdx].done = true
    if (seqIdx + 1 < csSeqMembers.length) {
      csSeqMembers[seqIdx + 1].active = true
      log('event', `顺序会签：${csSeqMembers[seqIdx].name} 已处理，当前轮到 ${csSeqMembers[seqIdx + 1].name}`)
    } else {
      log('ok', '✅ 顺序会签全部完成')
    }
    return
  }
  // 顺序会签未开始：激活第一位
  const first = csSeqMembers.find((m) => !m.done)
  if (first) {
    first.active = true
    log('event', `顺序会签：当前轮到 ${first.name}`)
  }
}

function reset() {
  csParallelMembers.splice(0, csParallelMembers.length,
    { id: 'u1', name: '张三', done: true },
    { id: 'u2', name: '李四', done: true },
    { id: 'u3', name: '王五' },
  )
  csSeqMembers.splice(0, csSeqMembers.length,
    { id: 'u4', name: '赵六', done: true },
    { id: 'u5', name: '孙七', active: true },
    { id: 'u6', name: '周八' },
  )
  log('event', '↻ 重置会签进度')
}

// ─── 事件日志 ───
interface LogItem { time: string; msg: string; type: string }
const logs = ref<LogItem[]>([])
const log = (type: string, msg: string) => {
  const now = new Date()
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
  logs.value.unshift({ time, msg, type })
  if (logs.value.length > 30) logs.value.pop()
}
</script>

<style scoped>
.countersign-case {
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
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  z-index: 5;
  gap: 16px;
}

.case-info {
  flex: 1;
  min-width: 0;
}

.case-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.case-desc {
  font-size: 12px;
  color: #606266;
  line-height: 1.6;
}

.case-desc code {
  background: #f0f2f5;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 11px;
  color: #d63384;
  font-family: 'Consolas', 'Monaco', monospace;
}

.case-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.event-log {
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 420px;
  max-height: 260px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(8px);
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  z-index: 4;
  display: flex;
  flex-direction: column;
}

.log-header {
  flex-shrink: 0;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.log-body {
  flex: 1;
  overflow-y: auto;
  padding: 6px 12px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
}

.log-item {
  display: flex;
  gap: 6px;
  padding: 3px 0;
  line-height: 1.4;
  border-bottom: 1px dashed #f0f2f5;
}

.log-time {
  color: #909399;
  flex-shrink: 0;
}

.log-msg {
  flex: 1;
  color: #303133;
  word-break: break-all;
}

.log-item.event .log-msg { color: #3068EC; }
.log-item.ok .log-msg { color: #67c23a; }

.log-empty {
  text-align: center;
  padding: 20px;
  color: #c0c4cc;
  font-size: 12px;
}
</style>
