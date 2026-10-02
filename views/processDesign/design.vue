<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';
import SnakerFlowDesigner from '#/plugins/workflow/components/SnakerFlowDesigner';

import {
  getProcessDesignDetailApi,
  saveProcessDesignApi,
} from '#/plugins/workflow/api/processDesign';

import { taskFormOptions } from '../processTask/componentMap';
import AssigneeInput from './snakerflow/assigneeInput.vue';
import CandidateGroupsInput from './snakerflow/candidateGroupsInput.vue';


const emit = defineEmits<{
  success: [];
}>();

const DEFAULT_FLOW_DATA = {
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
const flowData = ref<Record<string, any>>({});
const designerMode = ref<'canvas' | 'dingtalk'>('dingtalk');
function cloneDefaultFlow() {
  return JSON.parse(JSON.stringify(DEFAULT_FLOW_DATA)) as Record<string, any>;
}
function normalizeDesignerGraph(
  jsonObject: Record<string, any> | undefined,
  data: { name?: string; displayName?: string; type?: string },
) {
  const hasGraph = Boolean(
    jsonObject && Array.isArray(jsonObject.nodes) && Array.isArray(jsonObject.edges),
  );
  const graph = hasGraph ? jsonObject! : cloneDefaultFlow();
  const nodes = (graph.nodes || []).map((node: any) => {
    if (!String(node.type || '').endsWith('task')) return node;
    const properties = node.properties || {};
    const taskType = typeof properties.taskType === 'string' && properties.taskType.trim()
      ? properties.taskType
      : 'Major';
    const performType = typeof properties.performType === 'string' && properties.performType.trim()
      ? properties.performType
      : 'ANY';
    return {
      ...node,
      properties: {
        ...properties,
        taskType,
        performType,
      },
    };
  });
  const graphType = data.type != null && data.type !== ''
    ? String(data.type).trim()
    : hasGraph && graph.type != null && graph.type !== ''
      ? String(graph.type).trim()
      : 'approval';
  return {
    ...graph,
    nodes,
    name: graph.name || data.name || '',
    displayName: graph.displayName || data.displayName || '',
    type: graphType,
  };
}
const recordId = ref<number>(0);
const assigneeConfigWay = ref(2);
const assignmentHandlerConfigWay = ref(1); // 默认为文本输入
const candidateUsersConfigWay = ref(2);
const candidateGroupsConfigWay = ref(2);
const candidateHandlerConfigWay = ref(1); // 默认为文本输入

const handleSetAssigneeText = (text: string, model: any) => {
  model.assigneeText = text;
};

const normalizeFlowData = (payload: any) => {
  const current = flowData.value?.json || flowData.value || {};
  const incomingJson = payload?.json ?? payload ?? {};
  const normalized = {
    ...current,
    ...incomingJson,
  };

  if (payload?.xml) {
    normalized.xml = payload.xml;
  } else if (flowData.value?.xml) {
    normalized.xml = flowData.value.xml;
  }

  return normalized;
};

const persistFlowData = async (payload: any, closeAfterSuccess = false) => {
  // 获取最新的数据以保留 formSchemaJsonStr
  let latestJsonObj: any = {};
  try {
    const detail = await getProcessDesignDetailApi(recordId.value);
    latestJsonObj = detail.jsonObject || {};
  } catch (error) {
    console.warn('Failed to fetch latest data before save', error);
  }

  const normalized = normalizeFlowData(payload);

  // 合并数据：确保 formSchemaJsonStr 使用最新的
  const finalJson = {
    ...latestJsonObj,
    ...normalized,
  };

  // 显式保护 formSchemaJsonStr
  if (latestJsonObj.formSchemaJsonStr) {
    finalJson.formSchemaJsonStr = latestJsonObj.formSchemaJsonStr;
  }

  flowData.value = finalJson;
  try {
    await saveProcessDesignApi({
      id: recordId.value,
      jsonObject: finalJson,
    });
    message.success('保存成功');
    emit('success');
    if (closeAfterSuccess) {
      modalApi.close();
    }
  } catch (error) {
    console.error(error);
  }
};

const handleSave = async (data: any) => {
  await persistFlowData(data, false);
};

const [Modal, modalApi] = useVbenModal({
  title: '流程设计',
  fullscreen: true,
  footer: false,
  onOpenChange: async (isOpen) => {
    if (!isOpen) return;
    const { id } = modalApi.getData();
    recordId.value = id;
    designerMode.value = 'dingtalk';
    flowData.value = {};
    try {
      const data = await getProcessDesignDetailApi(id);
      flowData.value = normalizeDesignerGraph(data.jsonObject, data);
    } catch (error) {
      console.error(error);
      flowData.value = cloneDefaultFlow();
    }
  },
});
defineExpose({
  open: modalApi.open,
  setData: modalApi.setData,
});
</script>

<template>
  <div class="h-full w-full">
    <Modal>
      <div class="workflow-design-editor">
        <div class="mb-2 flex items-center justify-end">
          <a-radio-group v-model:value="designerMode" button-style="solid" size="small">
            <a-radio-button value="dingtalk">钉钉模式</a-radio-button>
            <a-radio-button value="canvas">画布模式</a-radio-button>
          </a-radio-group>
        </div>
        <div class="workflow-designer-host">
          <SnakerFlowDesigner
            v-if="recordId"
            v-model="flowData"
            :mode="designerMode"
            @on-save="handleSave"
            :extend-property-keys="[
              'candidateUsers',
              'candidateGroups',
              'candidateHandler',
              'assigneeText',
            ]"
            v-bind="$attrs"
          >
          <template #form-item-task-form="{ model, field }">
            <a-form :label-col="{ flex: '120px' }" :model="model">
              <a-form-item label="表单" :colon="false">
                <a-select
                  v-model:value="model[field]"
                  :options="taskFormOptions"
                  :styles="{ popup: { root: { zIndex: 9999 } } }"
                  allow-clear
                />
              </a-form-item>
            </a-form>
          </template>
          <template #form-item-task-assignee="{ model, field }">
            <a-form :label-col="{ flex: '120px' }" :model="model">
              <a-form-item label="参与者" :colon="false">
                <a-radio-group
                  v-model:value="assigneeConfigWay"
                  button-style="solid"
                  size="small"
                >
                  <a-radio-button :value="2">下拉选择</a-radio-button>
                  <a-radio-button :value="1">文本输入</a-radio-button>
                </a-radio-group>
                <div style="margin-top: 8px">
                  <AssigneeInput
                    v-if="assigneeConfigWay === 2"
                    v-model:value="model[field]"
                    @set-assignee-text="handleSetAssigneeText($event, model)"
                  />
                  <a-input v-else v-model:value="model[field]" />
                </div>
              </a-form-item>
            </a-form>
          </template>
          <template #form-item-task-assignmentHandler="{ model, field }">
            <a-form :label-col="{ flex: '120px' }" :model="model">
              <a-form-item label="参与者处理类" :colon="false">
                <a-radio-group
                  v-model:value="assignmentHandlerConfigWay"
                  button-style="solid"
                  size="small"
                >
                  <a-radio-button :value="2" disabled>下拉选择</a-radio-button>
                  <a-radio-button :value="1">文本输入</a-radio-button>
                </a-radio-group>
                <div style="margin-top: 8px">
                  <a-input
                    v-model:value="model[field]"
                    placeholder="请输入全限定类名或Bean名称"
                  />
                </div>
              </a-form-item>
              <a-form-item label="候选用户" :colon="false">
                <a-radio-group
                  v-model:value="candidateUsersConfigWay"
                  button-style="solid"
                  size="small"
                >
                  <a-radio-button :value="2">下拉选择</a-radio-button>
                  <a-radio-button :value="1">文本输入</a-radio-button>
                </a-radio-group>
                <div style="margin-top: 8px">
                  <AssigneeInput
                    v-if="candidateUsersConfigWay === 2"
                    v-model:value="model.candidateUsers"
                  />
                  <a-input v-else v-model:value="model.candidateUsers" />
                </div>
              </a-form-item>
              <a-form-item label="候选用户组" :colon="false">
                <a-radio-group
                  v-model:value="candidateGroupsConfigWay"
                  button-style="solid"
                  size="small"
                >
                  <a-radio-button :value="2">下拉选择</a-radio-button>
                  <a-radio-button :value="1">文本输入</a-radio-button>
                </a-radio-group>
                <div style="margin-top: 8px">
                  <CandidateGroupsInput
                    v-if="candidateGroupsConfigWay === 2"
                    v-model:value="model.candidateGroups"
                  />
                  <a-input v-else v-model:value="model.candidateGroups" />
                </div>
              </a-form-item>
              <a-form-item label="候选用户处理类" :colon="false">
                <a-radio-group
                  v-model:value="candidateHandlerConfigWay"
                  button-style="solid"
                  size="small"
                >
                  <a-radio-button :value="2" disabled>下拉选择</a-radio-button>
                  <a-radio-button :value="1">文本输入</a-radio-button>
                </a-radio-group>
                <div style="margin-top: 8px">
                  <a-input
                    v-model:value="model.candidateHandler"
                    placeholder="请输入全限定类名或Bean名称"
                  />
                </div>
              </a-form-item>
            </a-form>
          </template>
          </SnakerFlowDesigner>
        </div>
      </div>
    </Modal>
  </div>
</template>
<style scoped>
.workflow-design-editor {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.workflow-designer-host {
  flex: 1;
  width: 100%;
  min-height: 0;
}

.workflow-designer-host :deep(.flow-container) {
  width: 100%;
  height: 100%;
}
:global(.fd-drawer-root) {
  z-index: 2000 !important;
}
:global(.fd-modal-root) {
  z-index: 2100 !important;
}
</style>
