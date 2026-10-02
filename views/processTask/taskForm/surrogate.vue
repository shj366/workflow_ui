<script lang="ts" setup>
import { computed, ref } from 'vue';

import { message } from 'antdv-next';

import { fetchUserListApi } from '#/plugins/workflow/api/processInstance';
import { surrogateTaskApi } from '#/plugins/workflow/api/processTask';
import { buildWorkflowUserTree } from '#/plugins/workflow/utils/userTree';

const emit = defineEmits<{
  success: [];
}>();
const visible = ref(false);
const confirmLoading = ref(false);
const loadingUsers = ref(false);
const currentTask = ref<any>(null);
const userList = ref<Awaited<ReturnType<typeof fetchUserListApi>>>([]);
const selectedUsername = ref<string>();
const userTree = computed(() => buildWorkflowUserTree(userList.value));

async function open(record: any) {
  currentTask.value = record;
  visible.value = true;
  selectedUsername.value = undefined;
  loadingUsers.value = true;
  try {
    const data = await fetchUserListApi();
    if (!Array.isArray(data)) {
      throw new Error('用户列表响应格式错误');
    }
    userList.value = data;
  } catch {
    userList.value = [];
  } finally {
    loadingUsers.value = false;
  }
}
async function handleOk() {
  if (!currentTask.value) return;
  if (!selectedUsername.value) {
    message.warning('请选择代理人');
    return;
  }
  confirmLoading.value = true;
  try {
    await surrogateTaskApi({
      processTaskId: currentTask.value.id,
      userId: selectedUsername.value,
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
    class="surrogate-modal"
    title="委托任务"
    :width="800"
    :destroy-on-hidden="true"
    :confirm-loading="confirmLoading"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-tree-select
      v-model:value="selectedUsername"
      class="w-full"
      placeholder="请选择代理人"
      :tree-data="userTree"
      :loading="loadingUsers"
      tree-default-expand-all
      show-search
      tree-node-filter-prop="title"
      allow-clear
    />
  </a-modal>
</template>

<style scoped>
.surrogate-modal :deep(.ant-modal-body) {
  max-height: calc(100vh - 220px);
  overflow: hidden;
}

.surrogate-modal :deep(.ant-select-tree) {
  max-height: calc(100vh - 300px);
  overflow-y: auto;
}
</style>
