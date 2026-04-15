<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';
import SnakerFlowDesigner from '#/plugins/workflow/components/SnakerFlowDesigner';

import {
  getProcessDesignDetailApi,
  saveProcessDesignApi,
} from '#/plugins/workflow/api/processDesign';

import { wfFormOptions } from '../processDefine/componentMap';
import { taskFormOptions } from '../processTask/componentMap';
import AssigneeInput from './snakerflow/assigneeInput.vue';
import CandidateGroupsInput from './snakerflow/candidateGroupsInput.vue';

// @ts-ignore
// 扩展 SnakerFlowDesigner 组件的类型声明
declare module 'snakerflow-designer-vue' {
  export interface SnakerFlowDesignerSlots {
    'form-item-process-instanceUrl': { field: string; model: any };
    'form-item-task-form': { field: string; model: any };
    'form-item-task-assignee': { field: string; model: any };
    'form-item-task-assignmentHandler': { field: string; model: any };
  }
}

const emit = defineEmits<{
  success: [];
}>();

const flowData = ref<Record<string, any>>({});
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
    if (isOpen) {
      const { id } = modalApi.getData();
      recordId.value = id;
      flowData.value = {};
      try {
        const data = await getProcessDesignDetailApi(id);

        // 获取 jsonObject 中的数据
        const jsonObj = data.jsonObject || {};

        // 始终确保流程基本属性被正确初始化（优先使用 jsonObject 中的值，否则使用流程设计的值）
        flowData.value = {
          ...jsonObj,
          name: jsonObj.name || data.name || '',
          displayName: jsonObj.displayName || data.displayName || '',
          type: jsonObj.type ?? data.type ?? '',
        };
      } catch (error) {
        console.error(error);
      }
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
      <div class="h-full w-full">
        <SnakerFlowDesigner
          v-if="recordId"
          v-model="flowData"
          :show-doc="false"
          node-render-type="html"
          @on-save="handleSave"
          :extend-property-keys="[
            'candidateUsers',
            'candidateGroups',
            'candidateHandler',
            'assigneeText',
          ]"
          v-bind="$attrs"
        >
          <template #form-item-process-instanceUrl="{ model, field }">
            <a-form :label-col="{ flex: '120px' }" :model="model">
              <a-form-item label="实例启动表单" :colon="false">
                <a-select
                  v-model:value="model[field]"
                  :options="wfFormOptions"
                  :styles="{ popup: { root: { zIndex: 9999 } } }"
                  allow-clear
                />
              </a-form-item>
            </a-form>
          </template>
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
              <a-form-item label="候选人处理类" :colon="false">
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
    </Modal>
  </div>
</template>
