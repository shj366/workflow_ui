<!--
  案例1：vben5 process-drawer 风格移植测试

  目标：在钉钉模式下，验证 vben5 业务方 process-drawer.vue 的真实写法
        （lfInstance.graphModel[k] = values[k] + eventCenter.emit）能否直接复用

  关键点：本组件不直接用 lf / api.graphModel 之类专用概念，
         而是通过 ref 取 lfInstance 后像 vben5 一样直接调用
-->
<template>
  <div class="vben-case">
    <!--
      顶部模式切换 + 操作栏
      移动端预览时隐藏：演示站额外加的 UI 不属于 flow-designer 组件。
      移动端预览的目的 = 还原用户在实际移动端上看到的画面，
      那个场景下只有 <FlowDesigner> 本身，不会有 toolbar / event-log。
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
      <div class="case-actions">
        <el-button type="primary" size="small" @click="openDrawer">打开流程属性抽屉</el-button>
        <el-button size="small" @click="logCurrent">打印当前 lfInstance.graphModel</el-button>
        <el-button size="small" @click="reset">重置数据</el-button>
      </div>
    </div>

    <!-- 设计器（移动端预览时是页面上唯一展示的元素） -->
    <FlowDesigner
      ref="designerRef"
      v-model:value="graphData"
      :mode="mode"
      :high-light="highLightData"
      @on-init="handleInit"
      @node-click="onNodeClick"
      @edge-click="onEdgeClick"
    />

    <!-- 抽屉：模拟 vben5 process-drawer -->
    <el-drawer
      v-model="drawerVisible"
      title="流程属性（vben5 process-drawer 移植演示）"
      direction="rtl"
      size="500px"
      :before-close="handleDrawerClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        label-width="120px"
        @submit.prevent
      >
        <el-form-item label="流程编码" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入流程定义唯一编码"
            @input="(v: any) => handleFieldChange('name', v)"
          />
        </el-form-item>
        <el-form-item label="流程名称" prop="displayName">
          <el-input
            v-model="formData.displayName"
            placeholder="请输入流程显示名称"
            @input="(v: any) => handleFieldChange('displayName', v)"
          />
        </el-form-item>
        <el-form-item label="流程类型" prop="type">
          <el-select
            v-model="formData.type"
            placeholder="请选择流程类型"
            style="width: 100%"
            @change="(v: any) => handleFieldChange('type', v)"
          >
            <el-option label="主流程" value="snaker" />
            <el-option label="子流程" value="sub" />
          </el-select>
        </el-form-item>
        <el-form-item label="实例URL" prop="instanceUrl">
          <el-input
            v-model="formData.instanceUrl"
            placeholder="表单地址"
            @input="(v: any) => handleFieldChange('instanceUrl', v)"
          />
        </el-form-item>
        <el-form-item label="过期时间" prop="expireTime">
          <el-input
            v-model="formData.expireTime"
            placeholder="过期时间（小时）"
            @input="(v: any) => handleFieldChange('expireTime', v)"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="drawer-footer">
          <div class="drawer-tip">
            💡 抽屉表单 onChange 后，handleValuesChange 中使用 vben5 原写法：
            <code>lfInstance.graphModel[k] = values[k]</code>
          </div>
          <el-button @click="drawerVisible = false">关闭</el-button>
        </div>
      </template>
    </el-drawer>

    <!--
      底部事件日志
      移动端预览时隐藏（仅在演示站桌面端用，不属于 flow-designer 组件）。
    -->
    <div v-if="!isMobilePreview" class="event-log">
      <div class="log-header">
        事件日志（实时）
        <el-button size="small" text @click="logs = []">清空</el-button>
      </div>
      <div class="log-body">
        <div v-for="(log, i) in logs" :key="i" :class="['log-item', log.type]">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-tag">{{ log.tag }}</span>
          <span class="log-msg">{{ log.msg }}</span>
        </div>
        <div v-if="!logs.length" class="log-empty">暂无日志</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, nextTick } from 'vue'
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

// 父组件 v-model 状态
const graphData = ref<any>(structuredClone(LeaveJson))

const highLightData = ref<FDHighLightType>({
  historyNodeNames: ['start'],
  historyEdgeNames: [],
  activeNodeNames: ['apply'],
})

// lfInstance：与 vben5 写法保持一致，使用 .value 取实例
const lfInstance = ref<any>(null)

const handleInit = (api: any) => {
  // 兼容两种模式：画布模式返回 lf，钉钉模式返回 designerApi
  lfInstance.value = api
  log('init', `lfInstance 已就绪（模式：${mode.value}）`)

  // 订阅 update:graphModel 事件，业务方常常需要监听
  api.eventCenter?.on('update:graphModel', (data: any) => {
    log('event', `update:graphModel 触发，name=${data?.name}`)
  })
}

// ───── 抽屉相关 ─────
const drawerVisible = ref(false)
const formRef = ref<any>(null)
// 模板 ref 仅挂载用，显式引用避免 vue-tsc 3.x TS6133 误报
void formRef
const formData = ref({
  name: '',
  displayName: '',
  type: 'snaker',
  instanceUrl: '',
  expireTime: '',
})
const isIniting = ref(false)

const openDrawer = () => {
  // ⭐ 关键：Object.assign 赋值保持原 reactive object 不变，
  // 这样外部注册的 watch(formData, { deep: true }) 依赖不丢失。
  // 若用 formData.value = { ...新对象 } 整体替换，watch 会失效。
  isIniting.value = true
  Object.assign(formData.value, {
    name: graphData.value.name ?? '',
    displayName: graphData.value.displayName ?? '',
    type: graphData.value.type ?? 'snaker',
    instanceUrl: graphData.value.instanceUrl ?? '',
    expireTime: graphData.value.expireTime ?? '',
  })
  // 同步 prevFormData 快照，避免 openDrawer 后第一次 watch 误报所有字段变化
  prevFormData = { ...formData.value }
  drawerVisible.value = true
  nextTick(() => {
    isIniting.value = false
  })
}

const handleDrawerClose = (done: () => void) => {
  done()
}

/**
 * 同步表单数据到画布（vben5 process-drawer.vue handleValuesChange 等价）
 *
 * 演示两种调用方式：
 * ① callback（vben5 真实写法，由 form 组件 onChange 主动回调）
 * ② watch（依赖收集被动触发，Object.assign 后可用）
 *
 * 用 isSyncing 标志互斥防重：callback 触发时设 true，watch 看到 true 跳过。
 */
const isSyncing = ref(false)

const syncToGraph = (key: string, value: any, source: 'callback' | 'watch') => {
  if (isIniting.value) return
  if (!lfInstance.value?.graphModel) {
    log('warn', 'lfInstance.value.graphModel 不可用')
    return
  }
  if (source === 'callback') {
    isSyncing.value = true
  } else if (isSyncing.value) {
    // watch 误判为重复
    return
  }

  log('change', `[${source}] ${key} = ${JSON.stringify(value)}`)

  // ⭐⭐⭐ vben5 真实写法：直接写 graphModel 顶层 ⭐⭐⭐
  lfInstance.value.graphModel[key] = value
  const { eventCenter } = lfInstance.value.graphModel
  eventCenter.emit('update:graphModel', lfInstance.value.graphModel)

  log('ok', `已通过 graphModel 直写更新 ${key}`)

  // callback 触发的同步走完后释放标志
  if (source === 'callback') {
    nextTick(() => {
      isSyncing.value = false
    })
  }
}

// ① callback 模式（vben5 真实写法演示）
const handleFieldChange = (key: string, value: any) => {
  syncToGraph(key, value, 'callback')
}

// ② watch 模式（业务方不写 callback 时也能 work）
//
// 注意：vue3 watch(formData, cb, { deep: true }) 调用 cb 时
// newVal 和 oldVal 是同一个引用（因为 formData 内部属性被修改，未替换整体），
// 需要外部维护 prevFormData 快照进行 diff。
let prevFormData: Record<string, any> = { ...formData.value }
watch(
  formData,
  (newVal) => {
    if (isIniting.value || isSyncing.value) {
      prevFormData = { ...newVal }
      return
    }
    for (const key of Object.keys(newVal) as (keyof typeof formData.value)[]) {
      if (newVal[key] !== prevFormData[key]) {
        syncToGraph(key, newVal[key], 'watch')
      }
    }
    prevFormData = { ...newVal }
  },
  { deep: true }
)

const logCurrent = () => {
  if (!lfInstance.value) {
    log('warn', 'lfInstance 未就绪')
    return
  }
  log('info', `graphModel.name=${lfInstance.value.graphModel?.name}`)
  log('info', `graphModel.displayName=${lfInstance.value.graphModel?.displayName}`)
  log('info', `graphData.name=${graphData.value.name}`)
}

const reset = () => {
  graphData.value = structuredClone(LeaveJson)
  log('reset', '已重置为初始数据')
}

// ───── 事件日志 ─────
interface LogItem { time: string; tag: string; msg: string; type: string }
const logs = ref<LogItem[]>([])
const log = (type: string, msg: string) => {
  const now = new Date()
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
  logs.value.unshift({ time, tag: type, msg, type })
  if (logs.value.length > 50) logs.value.pop()
}

// 监听 graphData 同步变化（验证 v-model 是否真的被更新）
watch(() => graphData.value, (n) => {
  log('sync', `v-model 更新：name=${n?.name}, displayName=${n?.displayName}`)
})

/**
 * @node-click 监听 - 验证事件签名对齐画布模式
 * payload 结构（与画布模式 Flow.ts 中 eventCenter.on('node:click') 拿到的对象一致）：
 *   { data: { id, type, text: { value }, properties }, node, patternItem, lf }
 */
const onNodeClick = (params: any) => {
  log(
    'event',
    `node-click 触发：id=${params?.data?.id}, type=${params?.data?.type}, ` +
    `hasLf=${!!params?.lf}`
  )
}

/**
 * @edge-click 监听 - 验证事件签名对齐画布模式
 * payload 结构与画布模式 edge:click 一致
 */
const onEdgeClick = (params: any) => {
  log(
    'event',
    `edge-click 触发：id=${params?.data?.id}, type=${params?.data?.type}, ` +
    `hasLf=${!!params?.lf}`
  )
}

onBeforeUnmount(() => {})
</script>

<style scoped>
.vben-case {
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
  z-index: 5;
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
  box-shadow: 0 1px 4px rgba(48, 104, 236, 0.3);
}

.case-actions {
  display: flex;
  gap: 8px;
}

.drawer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.drawer-tip {
  font-size: 12px;
  color: #909399;
  flex: 1;
  line-height: 1.6;
}

.drawer-tip code {
  background: #f0f2f5;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
  color: #d63384;
}

.event-log {
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 380px;
  max-height: 280px;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
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

.log-tag {
  flex-shrink: 0;
  padding: 0 4px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  color: #fff;
}

.log-item.ok .log-tag { background: #67c23a; }
.log-item.change .log-tag { background: #e6a23c; }
.log-item.event .log-tag { background: #909399; }
.log-item.sync .log-tag { background: #3068EC; }
.log-item.info .log-tag { background: #606266; }
.log-item.warn .log-tag { background: #f56c6c; }
.log-item.reset .log-tag { background: #9c27b0; }
.log-item.init .log-tag { background: #00bcd4; }

.log-msg {
  flex: 1;
  color: #303133;
  word-break: break-all;
}

.log-empty {
  text-align: center;
  padding: 20px;
  color: #c0c4cc;
  font-size: 12px;
}
</style>