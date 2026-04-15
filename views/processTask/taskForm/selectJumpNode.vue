<script lang="ts" setup>
import type { FormInstance } from 'antdv-next';

import { reactive, ref } from 'vue';

import { message } from 'antdv-next';

import {
  getJumpAbleTaskNameListApi,
  jumpTaskApi,
} from '#/plugins/workflow/api/processTask';

const emit = defineEmits<{
  success: [];
}>();

const visible = ref(false);
const confirmLoading = ref(false);
const loadingNodes = ref(false);
const currentTask = ref<any>(null);
const nodeList = ref<Array<{ nodeId: string; nodeName: string }>>([]);
const formRef = ref<FormInstance>();

const formState = reactive({
  targetNodeId: undefined as string | undefined,
});

const rules = {
  targetNodeId: [
    {
      type: 'string' as const,
      required: true,
      message: '请选择目标节点',
      trigger: 'change' as const,
    },
  ],
};

async function open(record: any) {
  currentTask.value = record;
  formState.targetNodeId = undefined;
  visible.value = true;
  loadingNodes.value = true;
  try {
    const data = await getJumpAbleTaskNameListApi(record.id);
    nodeList.value = data || [];
  } catch {
    nodeList.value = [];
  } finally {
    loadingNodes.value = false;
  }
}

function handleCancel() {
  visible.value = false;
}

async function handleOk() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  if (!currentTask.value || !formState.targetNodeId) return;

  confirmLoading.value = true;
  try {
    await jumpTaskApi({
      processTaskId: currentTask.value.id,
      targetNodeId: formState.targetNodeId,
    });
    message.success('跳转成功');
    visible.value = false;
    emit('success');
  } catch (error: any) {
    message.error(error?.message || '跳转失败');
  } finally {
    confirmLoading.value = false;
  }
}

defineExpose({
  open,
});
</script>

<template>
  <a-modal
    v-model:open="visible"
    title="选择跳转节点"
    :width="500"
    :destroy-on-hidden="true"
    :confirm-loading="confirmLoading"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form
      ref="formRef"
      :model="formState"
      :rules="rules"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 18 }"
      style="margin-top: 20px"
    >
      <a-form-item label="节点" name="targetNodeId">
        <a-select
          v-model:value="formState.targetNodeId"
          placeholder="请选择目标节点"
          allow-clear
          :loading="loadingNodes"
        >
          <a-select-option
            v-for="item in nodeList"
            :key="item.nodeId"
            :value="item.nodeId"
          >
            {{ item.nodeName }}
          </a-select-option>
        </a-select>
      </a-form-item>
    </a-form>
  </a-modal>
</template>
