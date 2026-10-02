<script lang="ts" setup>
import { computed, ref } from 'vue';

import { message } from 'antdv-next';

import { fetchUserListApi } from '#/plugins/workflow/api/processInstance';
import { addCandidateApi } from '#/plugins/workflow/api/processTask';
import { buildWorkflowUserTree } from '#/plugins/workflow/utils/userTree';

const emit = defineEmits<{
  success: [];
}>();
const visible = ref(false);
const currentTask = ref<any>(null);
const userList = ref<Awaited<ReturnType<typeof fetchUserListApi>>>([]);
const selectedUsernames = ref<string[]>([]);
const userTree = computed(() => buildWorkflowUserTree(userList.value));

async function open(record: any) {
  currentTask.value = record;
  visible.value = true;
  selectedUsernames.value = [];
  try {
    const data = await fetchUserListApi();
    if (!Array.isArray(data)) throw new Error('用户列表响应格式错误');
    userList.value = data;
  } catch (error) {
    console.error(error);
    userList.value = [];
  }
}

async function handleOk() {
  if (!currentTask.value) return;
  if (selectedUsernames.value.length === 0) {
    message.error('参与人不能为空！');
    return;
  }
  await addCandidateApi({
    processTaskId: currentTask.value.id,
    actorIds: selectedUsernames.value,
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
    class="workflow-user-modal"
    title="请选择参与人"
    :width="800"
    :destroy-on-hidden="true"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-tree-select
      v-model:value="selectedUsernames"
      class="w-full"
      placeholder="请选择参与人"
      :tree-data="userTree"
      tree-default-expand-all
      tree-checkable
      show-search
      tree-node-filter-prop="title"
      show-checked-strategy="SHOW_CHILD"
      allow-clear
    />
  </a-modal>
</template>
