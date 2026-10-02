<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';

import { fetchUserListApi } from '#/plugins/workflow/api/processInstance';
import { buildWorkflowUserTree } from '#/plugins/workflow/utils/userTree';

const props = defineProps<{ value?: string }>();
const emit = defineEmits<{
  (event: 'update:value', value: string): void;
  (event: 'setAssigneeText', value: string): void;
}>();

const loading = ref(false);
const users = ref<Awaited<ReturnType<typeof fetchUserListApi>>>([]);
const selected = ref<string[]>([]);

const treeData = computed(() => [
  {
    key: 'user:applicant',
    value: 'applicant',
    title: '发起人',
    isLeaf: true,
  },
  ...buildWorkflowUserTree(users.value),
]);

function valueTokens(value?: string) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeSelectedValues(value?: string) {
  const usersById = new Map(users.value.map((user) => [user.id, user.username]));
  return valueTokens(value).map((item) => usersById.get(item) || item);
}

function selectedLabels(values: string[]) {
  const labels = new Map(users.value.map((user) => [user.username, user.nickname || user.username]));
  return values.map((value) => value === 'applicant' ? '发起人' : labels.get(value) || value);
}

function update(value: unknown) {
  if (!Array.isArray(value)) {
    throw new TypeError('参与人选择值必须是用户列表');
  }
  selected.value = value.map(String);
  emit('update:value', selected.value.join(','));
  emit('setAssigneeText', selectedLabels(selected.value).join('、'));
}

async function loadUsers() {
  loading.value = true;
  try {
    const data = await fetchUserListApi();
    if (!Array.isArray(data)) throw new Error('用户列表响应格式错误');
    users.value = data;
    selected.value = normalizeSelectedValues(props.value);
  } finally {
    loading.value = false;
  }
}
watch(() => props.value, (value) => {
  selected.value = normalizeSelectedValues(value);
}, { immediate: true });

onMounted(() => void loadUsers());
</script>

<template>
  <a-tree-select
    :value="selected"
    mode="multiple"
    :tree-data="treeData"
    :loading="loading"
    tree-default-expand-all
    tree-checkable
    show-search
    tree-node-filter-prop="title"
    show-checked-strategy="SHOW_CHILD"
    :max-tag-count="'responsive'"
    allow-clear
    placeholder="搜索并选择一个或多个审批人"
    style="width: 100%"
    @update:value="update"
  />
</template>
