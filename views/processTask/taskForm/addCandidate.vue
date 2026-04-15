<script lang="ts" setup>
import { ref } from 'vue';

import { message } from 'antdv-next';

import { fetchUserListApi } from '#/plugins/workflow/api/processInstance';
import { addCandidateApi } from '#/plugins/workflow/api/processTask';

const emit = defineEmits<{
  success: [];
}>();

const visible = ref(false);
const currentTask = ref<any>(null);
const userList = ref<any[]>([]);
const selectedRowKeys = ref<string[]>([]);

const rowSelection = {
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
  try {
    const data = await fetchUserListApi();
    userList.value = data;
  } catch (error) {
    console.error(error);
    userList.value = [];
  }
}

async function handleOk() {
  if (!currentTask.value) return;
  if (selectedRowKeys.value.length === 0) {
    message.error('参与人不能为空！');
    return;
  }
  await addCandidateApi({
    processTaskId: currentTask.value.id,
    actorIds: selectedRowKeys.value,
  });
  message.success('加签成功');
  visible.value = false;
  emit('success');
}

function handleCancel() {
  visible.value = false;
}

defineExpose({
  open,
});
</script>

<template>
  <a-modal
    v-model:open="visible"
    title="请选择参与人"
    :width="800"
    :destroy-on-hidden="true"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-table
      row-key="username"
      :data-source="userList"
      :pagination="false"
      size="small"
      :row-selection="rowSelection"
    >
      <a-table-column title="用户名" data-index="username" key="username" />
      <a-table-column title="姓名" data-index="nickname" key="nickname" />
    </a-table>
  </a-modal>
</template>
