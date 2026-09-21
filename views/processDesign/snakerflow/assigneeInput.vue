<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { Select } from 'antdv-next';

import { getSysUserInfoApi, getSysUserListApi } from '#/api/core/user';

type UserOption = { label: string; value: string };

const props = defineProps<{ value?: string }>();
const emit = defineEmits<{
  (event: 'update:value', value: string): void;
  (event: 'setAssigneeText', value: string): void;
}>();

const keyword = ref('');
const options = ref<UserOption[]>([{ label: '发起人', value: 'applicant' }]);
const selected = ref<UserOption[]>([]);
const loading = ref(false);
let timer: number | undefined;
let requestId = 0;
let selectedRequestId = 0;

function parseUsers(value: unknown): UserOption[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.flatMap(parseUsers);
  const source = value as { data?: unknown; items?: unknown[]; rows?: unknown[]; list?: unknown[]; id?: unknown };
  if (source.data !== undefined) return parseUsers(source.data);
  const rows = source.items ?? source.rows ?? source.list;
  if (Array.isArray(rows)) return rows.flatMap(parseUsers);
  if (source.id === undefined) return [];
  const user = value as { id: unknown; nickname?: unknown; username?: unknown; dept?: { name?: unknown }; dept_name?: unknown };
  const name = String(user.nickname || user.username || user.id);
  const department = String(user.dept?.name || user.dept_name || '未分配部门');
  return [{ label: `${name}（${department}）`, value: String(user.id) }];
}

function unique(values: UserOption[]) {
  return [...new Map(values.map((value) => [value.value, value])).values()];
}

function ids(value?: string) {
  return value?.split(',').map((item) => item.trim()).filter(Boolean) ?? [];
}

async function loadSelected(value?: string) {
  const currentRequestId = ++selectedRequestId;
  const loaded = await Promise.all(ids(value).map(async (id) => {
    if (id === 'applicant') return { label: '发起人', value: id };
    const existing = options.value.find((option) => option.value === id);
    if (existing) return existing;
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) return { label: id, value: id };
    try {
      return parseUsers(await getSysUserInfoApi(numericId))[0] ?? { label: id, value: id };
    } catch {
      return { label: id, value: id };
    }
  }));
  if (currentRequestId === selectedRequestId) {
    selected.value = loaded;
    options.value = unique([{ label: '发起人', value: 'applicant' }, ...loaded, ...options.value]);
  }
}

async function search() {
  const currentRequestId = ++requestId;
  loading.value = true;
  try {
    const result = await getSysUserListApi({ keyword: keyword.value.trim() || undefined, page: 1, size: 200, status: 1 });
    if (currentRequestId === requestId) options.value = unique([{ label: '发起人', value: 'applicant' }, ...selected.value, ...parseUsers(result)]);
  } finally {
    if (currentRequestId === requestId) loading.value = false;
  }
}

function update(value: unknown) {
  if (!Array.isArray(value)) throw new TypeError('参与人选择值必须是用户 ID 列表');
  const next = value.map((item) => {
    const raw: { value?: unknown; label?: unknown } = item && typeof item === 'object'
      ? item as { value?: unknown; label?: unknown }
      : { value: item };
    const id = String(raw.value ?? '');
    return options.value.find((option) => option.value === id) ?? { label: String(raw.label ?? id), value: id };
  }).filter((item) => item.value);
  selected.value = next;
  options.value = unique([{ label: '发起人', value: 'applicant' }, ...next, ...options.value]);
  const idsValue = next.map((item) => item.value).join(',');
  emit('update:value', idsValue);
  emit('setAssigneeText', next.map((item) => item.label).join(','));
}

watch(() => props.value, (value) => void loadSelected(value), { immediate: true });
function scheduleSearch() {
  if (timer !== undefined) window.clearTimeout(timer);
  timer = window.setTimeout(() => void search(), 250);
}
onMounted(() => void search());
onBeforeUnmount(() => { if (timer !== undefined) window.clearTimeout(timer); });
</script>

<template>
  <Select
    v-model:value="selected"
    mode="multiple"
    label-in-value
    show-search
    :filter-option="false"
    option-filter-prop="label"
    :options="options"
    :loading="loading"
    :max-tag-count="'responsive'"
    allow-clear
    placeholder="搜索并选择一个或多个参与人"
    style="width: 100%"
    @search="(value) => { keyword = value; scheduleSearch(); }"
    @change="update"
  />
</template>
