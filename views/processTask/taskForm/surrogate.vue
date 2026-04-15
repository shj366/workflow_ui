<script lang="ts" setup>
import { ref } from 'vue';

import { message } from 'antdv-next';

import { fetchUserListApi } from '#/plugins/workflow/api/processInstance';
import { surrogateTaskApi } from '#/plugins/workflow/api/processTask';

const emit = defineEmits<{
  success: [];
}>();

const visible = ref(false);
const confirmLoading = ref(false);
const loadingUsers = ref(false);
const currentTask = ref<any>(null);
const userList = ref<any[]>([]);
const selectedRowKeys = ref<string[]>([]);

const rowSelection = {
  type: 'radio' as const,
  get selectedRowKeys() {
    return selectedRowKeys.value;
  },
  onChange: (keys: (number | string)[]) => {
    selectedRowKeys.value = keys as string[];
  },
};

async function open(record: any) {
  currentTask.value = record;
  visible.value = true;
  selectedRowKeys.value = [];
  loadingUsers.value = true;
  try {
    const data = await fetchUserListApi();
    userList.value = data || [];
  } catch {
    userList.value = [];
  } finally {
    loadingUsers.value = false;
  }
}

function handleCancel() {
  visible.value = false;
}

async function handleOk() {
  if (!currentTask.value) return;

  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择代理人');
    return;
  }

  confirmLoading.value = true;
  try {
    await surrogateTaskApi({
      processTaskId: currentTask.value.id,
      userId: selectedRowKeys.value[0]!,
    });
    message.success('委托成功');
    visible.value = false;
    emit('success');
  } catch (error: any) {
    message.error(error?.message || '委托失败');
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
    title="委托任务"
    :width="800"
    :destroy-on-hidden="true"
    :confirm-loading="confirmLoading"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-table
      row-key="username"
      :data-source="userList"
      :pagination="false"
      size="small"
      :loading="loadingUsers"
      :row-selection="rowSelection"
    >
      <a-table-column title="用户名" data-index="username" key="username" />
      <a-table-column title="姓名" data-index="nickname" key="nickname" />
    </a-table>
  </a-modal>
</template>
