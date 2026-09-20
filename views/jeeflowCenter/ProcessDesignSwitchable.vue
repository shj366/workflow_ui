<script setup lang="ts">
import type { Component } from 'vue';

import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Select, message } from 'antdv-next';
// @ts-expect-error The plugin owns this vendored JavaScript bundle.
import FlowDesigner from '../../assets/jeeflow-designer/mldong-flow-designer-plus.js';
import '../../assets/jeeflow-designer/style.css';

import { useJeeflowUiClient } from '../../client';
import { getSysUserInfoApi, getSysUserListApi } from '#/api/core/user';
import WorkflowModeSegmented from './WorkflowModeSegmented.vue';

type FlowGraph = Record<string, unknown> & {
  nodes: unknown[];
  edges: unknown[];
};

type DesignRow = {
  id: string;
  name: string;
  displayName?: string;
  type?: string;
  isDeployed?: number;
  updateTime?: string;
  createTime?: string;
};

type UserOption = { label: string; value: string };

function parseUserOptions(value: unknown): UserOption[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.flatMap((item) => parseUserOptions(item));
  const source = value as { id?: unknown; data?: unknown; items?: unknown[]; rows?: unknown[]; list?: unknown[] };
  if (source.data !== undefined) return parseUserOptions(source.data);
  const rows = source.items ?? source.rows ?? source.list;
  if (Array.isArray(rows)) return rows.flatMap((item) => parseUserOptions(item));
  if (source.id === undefined) return [];
  const item = value as { id: unknown; username?: unknown; nickname?: unknown; dept?: { name?: unknown }; dept_name?: unknown };
  const name = typeof item.nickname === 'string' && item.nickname ? item.nickname : String(item.username ?? item.id);
  const department = typeof item.dept?.name === 'string' ? item.dept.name : String(item.dept_name ?? '未分配部门');
  return [{ label: `${name}（${department}）`, value: String(item.id) }];
}

function uniqueUserOptions(options: UserOption[]) {
  return [...new Map(options.map((option) => [option.value, option])).values()];
}

const UserSearchSelect = defineComponent({
  name: 'WorkflowUserSearchSelect',
  inheritAttrs: false,
  props: { modelValue: { type: String, default: '' } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const keyword = ref('');
    const applicantOption = { label: '发起人', value: 'applicant' };
    const options = ref<UserOption[]>([applicantOption]);
    const selected = ref<UserOption[]>([]);
    const loadingUsers = ref(false);
    let searchTimer: number | undefined;
    let requestId = 0;
    let selectedRequestId = 0;

    function modelIds(value: string) {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }

    async function loadSelected(value: string) {
      const ids = modelIds(value);
      const currentRequestId = ++selectedRequestId;
      const loaded = await Promise.all(ids.map(async (id) => {
        if (id === 'applicant') return applicantOption;
        const existing = options.value.find((option) => option.value === id);
        if (existing) return existing;
        const numericId = Number(id);
        if (!Number.isFinite(numericId)) return { label: id, value: id };
        try {
          return parseUserOptions(await getSysUserInfoApi(numericId))[0] ?? { label: id, value: id };
        } catch {
          return { label: id, value: id };
        }
      }));
      if (currentRequestId === selectedRequestId) {
        selected.value = loaded;
        options.value = uniqueUserOptions([applicantOption, ...loaded, ...options.value]);
      }
    }

    async function search() {
      const currentRequestId = ++requestId;
      loadingUsers.value = true;
      try {
        const result = await getSysUserListApi({ keyword: keyword.value.trim() || undefined, page: 1, size: 200, status: 1 });
        if (currentRequestId === requestId) {
          options.value = uniqueUserOptions([applicantOption, ...selected.value, ...parseUserOptions(result)]);
        }
      } finally {
        if (currentRequestId === requestId) loadingUsers.value = false;
      }
    }

    function updateValue(value: unknown) {
      if (!Array.isArray(value)) throw new TypeError('参与人选择值必须是用户 ID 列表');
      const next = value.map((item) => {
        const raw: { value?: unknown; label?: unknown } = item && typeof item === 'object'
          ? item as { value?: unknown; label?: unknown }
          : { value: item };
        const id = String(raw.value ?? '');
        const existing = options.value.find((option) => option.value === id);
        return existing ?? { label: typeof raw.label === 'string' ? raw.label : id, value: id };
      }).filter((option) => option.value);
      selected.value = next;
      options.value = uniqueUserOptions([applicantOption, ...next, ...options.value]);
      emit('update:modelValue', next.map((option) => option.value).join(','));
    }

    watch(() => props.modelValue, (value) => { void loadSelected(value); }, { immediate: true });
    function scheduleSearch() {
      if (searchTimer !== undefined) window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(() => { void search(); }, 250);
    }
    onMounted(() => { void search(); });
    onBeforeUnmount(() => {
      if (searchTimer !== undefined) window.clearTimeout(searchTimer);
    });

    return () => h(Select, {
      mode: 'multiple',
      labelInValue: true,
      value: selected.value,
      options: options.value,
      showSearch: true,
      filterOption: false,
      optionFilterProp: 'label',
      allowClear: true,
      maxTagCount: 'responsive',
      loading: loadingUsers.value,
      placeholder: '搜索并选择一个或多个参与人',
      notFoundContent: '暂无匹配用户',
      style: { width: '100%' },
      onSearch: (value: string) => { keyword.value = value; scheduleSearch(); },
      'onUpdate:value': updateValue,
      onChange: updateValue,
      onClear: () => updateValue([]),
    });
  },
});

const DefaultGraph: FlowGraph = {
  name: '',
  displayName: '',
  type: 'approval',
  nodes: [
    { id: 'start', type: 'snaker:start', x: 280, y: 280, properties: { width: 120, height: 80 }, text: { x: 280, y: 320, value: '开始' } },
    { id: 'apply', type: 'snaker:task', x: 480, y: 280, properties: { width: 120, height: 80, assignee: 'applicant', taskType: 'Major', performType: 'ANY', autoExecute: 'N' }, text: { x: 480, y: 280, value: '发起申请' } },
    { id: 'end', type: 'snaker:end', x: 680, y: 280, properties: { width: 120, height: 80 }, text: { x: 680, y: 320, value: '结束' } },
  ],
  edges: [
    { id: 't1', type: 'snaker:transition', sourceNodeId: 'start', targetNodeId: 'apply', properties: {} },
    { id: 't2', type: 'snaker:transition', sourceNodeId: 'apply', targetNodeId: 'end', properties: {} },
  ],
};

const { api, can } = useJeeflowUiClient();
const rows = ref<DesignRow[]>([]);
const loading = ref(false);
const errorMessage = ref('');
const editing = ref(false);
const saving = ref(false);
const mode = ref<'canvas' | 'dingtalk'>('dingtalk');
const current = ref<DesignRow | null>(null);
const designName = ref('');
const designDisplayName = ref('');
const graph = ref<FlowGraph>(cloneGraph(DefaultGraph));

const taskPattern = computed(() => {
  return [{
  type: 'snaker:task',
  label: '审批人',
  form: {
    labelWidth: '120px',
    formItems: [
      { name: 'name', label: '唯一编码', component: 'Input', componentProps: { placeholder: '请输入唯一编码' } },
      { name: 'displayName', label: '显示名称', component: 'Input', componentProps: { placeholder: '请输入显示名称' } },
      { name: 'form', label: '表单', component: 'Input', componentProps: { placeholder: '请输入表单' } },
      { name: 'assignee', label: '参与人', render: () => UserSearchSelect },
      { name: 'assignmentHandler', label: '参与人处理类', component: 'Input', componentProps: { placeholder: '请输入处理类' } },
      { name: 'candidateUsers', label: '候选用户', component: 'Input', componentProps: { placeholder: '多个用户用英文逗号分隔' } },
      { name: 'candidateGroups', label: '候选用户组', component: 'Input', componentProps: { placeholder: '多个用户组用英文逗号分隔' } },
      { name: 'candidateHandler', label: '候选用户处理类', component: 'Input', componentProps: { placeholder: '请输入处理类' } },
      { name: 'taskType', label: '任务类型', component: 'Select', componentProps: { options: [{ label: '主办', value: 'Major' }, { label: '协办', value: 'Aidant' }] } },
      { name: 'performType', label: '参与类型', component: 'Select', componentProps: { options: [{ label: '普通参与', value: 'ANY' }, { label: '会签参与', value: 'ALL' }] } },
    ],
  },
}];
});

const Designer = FlowDesigner as Component;
const title = computed(() => (current.value ? `编辑流程：${current.value.displayName || current.value.name}` : '新建流程'));

function cloneGraph(value: FlowGraph): FlowGraph {
  return JSON.parse(JSON.stringify(value)) as FlowGraph;
}

function isGraph(value: unknown): value is FlowGraph {
  return typeof value === 'object' && value !== null && 'nodes' in value && 'edges' in value && Array.isArray(value.nodes) && Array.isArray(value.edges);
}
type GraphNode = {
  id?: unknown;
  type?: unknown;
  text?: { value?: unknown };
  properties?: Record<string, unknown>;
};

function validateTaskAssignments() {
  for (const rawNode of graph.value.nodes) {
    if (!rawNode || typeof rawNode !== 'object') continue;
    const node = rawNode as GraphNode;
    if (node.type !== 'snaker:task' && node.type !== 'snaker:custom') continue;
    const properties = node.properties ?? {};
    const assignee = String(properties.assignee ?? '').trim();
    const assignmentHandler = String(properties.assignmentHandler ?? '').trim();
    if (!assignee && !assignmentHandler) {
      const name = String(node.text?.value ?? node.id ?? '未命名');
      throw new Error(`任务节点“${name}”未配置参与人，请先选择参与人或配置参与人处理类`);
    }
  }
}



async function reload() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const result = await api.processDesign.page({ pageNum: 1, pageSize: 100, orderBy: 't.update_time desc' });
    rows.value = result.rows as DesignRow[];
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error);
  } finally {
    loading.value = false;
  }
}

function createNew() {
  current.value = null;
  designName.value = '';
  designDisplayName.value = '';
  graph.value = cloneGraph(DefaultGraph);
  editing.value = true;
}
async function edit(row: DesignRow) {
  const detail = await api.processDesign.detail(row.id);
  current.value = row;
  designName.value = row.name;
  designDisplayName.value = row.displayName || row.name;
  graph.value = isGraph(detail.jsonObject) && detail.jsonObject.nodes.length > 0 ? detail.jsonObject : cloneGraph(DefaultGraph);
  graph.value.name = designName.value;
  graph.value.displayName = designDisplayName.value;
  editing.value = true;
}

function closeEditor() {
  editing.value = false;
  reload();
}

async function saveGraph(validateAssignments = false) {
  if (!designName.value.trim()) throw new Error('请填写流程编码');
  graph.value.name = designName.value.trim();
  graph.value.displayName = designDisplayName.value.trim() || designName.value.trim();
  graph.value.type = 'approval';
  if (!graph.value.nodes.length || !graph.value.edges.length) throw new Error('流程图不能为空');
  if (validateAssignments) validateTaskAssignments();

  saving.value = true;
  try {
    let id = current.value?.id;
    if (!id) {
      const created = await api.processDesign.save({ name: designName.value.trim(), displayName: designDisplayName.value.trim() || designName.value.trim(), type: 'approval' });
      id = created.id;
      current.value = { id, name: designName.value.trim(), displayName: designDisplayName.value.trim() || designName.value.trim(), type: 'approval', isDeployed: 0 };
    } else {
      await api.processDesign.update(id, { name: graph.value.name, displayName: graph.value.displayName });
    }
    await api.processDesign.updateDefine(id, { content: JSON.stringify(graph.value) });
  } finally {
    saving.value = false;
  }
}

async function saveDraft() {
  try {
    await saveGraph();
    message.success('草稿已保存');
    closeEditor();
  } catch (error) {
    message.error(error instanceof Error ? error.message : String(error));
  }
}

async function saveAndDeploy() {
  try {
    await saveGraph(true);
    if (current.value?.id) await api.processDesign.deploy(current.value.id);
    message.success('流程已保存并发布');
    closeEditor();
  } catch (error) {
    message.error(error instanceof Error ? error.message : String(error));
  }
}

function isAllowed(permission: string) {
  return can([permission]);
}
onMounted(reload);
</script>

<template>
  <div class="jf-page jf-page--full workflow-design-page">
    <template v-if="!editing">
      <div class="jf-page-title workflow-design-toolbar">
        <span>流程设计</span>
        <span class="toolbar-spacer" />
        <button v-if="isAllowed('wf:processDesign:save')" class="jf-btn jf-btn--primary jf-btn--sm" @click="createNew">新建流程</button>
      </div>
      <div v-if="loading" class="jf-loading">加载中...</div>
      <div v-else-if="errorMessage" class="jf-empty">{{ errorMessage }}</div>
      <table v-else-if="rows.length" class="jf-table">
        <thead><tr><th>编码</th><th>显示名</th><th>类型</th><th>部署状态</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id">
            <td>{{ row.name }}</td>
            <td>{{ row.displayName || row.name }}</td>
            <td>{{ row.type || 'approval' }}</td>
            <td>{{ row.isDeployed === 1 ? '已部署' : '未部署' }}</td>
            <td><button class="jf-btn jf-btn--ghost jf-btn--sm" @click="edit(row)">编辑</button></td>
          </tr>
        </tbody>
      </table>
      <div v-else class="jf-empty">暂无流程设计</div>
    </template>

    <template v-else>
      <div class="workflow-design-toolbar">
        <strong>{{ title }}</strong>
        <input v-model="designName" class="jf-input" placeholder="流程编码" />
        <input v-model="designDisplayName" class="jf-input" placeholder="流程名称" />
        <WorkflowModeSegmented v-model="mode" />
        <span class="toolbar-spacer" />
        <button class="jf-btn jf-btn--ghost jf-btn--sm" @click="closeEditor">返回</button>
        <button class="jf-btn jf-btn--ghost jf-btn--sm" :disabled="saving" @click="saveDraft">保存草稿</button>
        <button class="jf-btn jf-btn--primary jf-btn--sm" :disabled="saving" @click="saveAndDeploy">保存并发布</button>
      </div>
      <div class="workflow-designer-host">
        <Designer v-model:value="graph" :mode="mode" :dnd-panel="taskPattern" @on-save="saveGraph" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.workflow-design-page {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  background: var(--jf-content-bg, #f5f7fa);
}

.workflow-design-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  min-height: 56px;
  padding: 0 20px;
  background: var(--jf-header-bg, #fff);
  border-bottom: 1px solid var(--jf-border, #eef0f3);
}

.workflow-design-toolbar .jf-input { width: 180px; }
.toolbar-spacer { flex: 1; }
.workflow-designer-host { display: flex; flex: 1; min-height: 0; height: 100%; }
.workflow-designer-host :deep(.workflow-user-search) { width: 100%; }
</style>
