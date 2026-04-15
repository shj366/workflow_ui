<script lang="ts" setup>
import { ref, watch } from 'vue';

import { getAllSysRoleApi } from '#/api/role';

const props = defineProps<{
  value?: string;
}>();

const emit = defineEmits(['update:value', 'change']);

const mValue = ref<string[]>([]);
const visible = ref(false);
const dataSource = ref<any[]>([]);
const targetKeys = ref<string[]>([]);
const options = ref<any[]>([]);

watch(
  () => props.value,
  (val) => {
    const keys = val ? val.split(',') : [];
    mValue.value = keys;
    targetKeys.value = keys;
  },
  { immediate: true },
);

const handleClick = () => {
  visible.value = true;
  if (dataSource.value.length === 0) {
    loadData();
  } else {
    targetKeys.value = mValue.value;
  }
};

const loadData = async () => {
  try {
    const roles = await getAllSysRoleApi();

    dataSource.value = roles.map((role: any) => ({
      key: String(role.id),
      title: role.name,
    }));

    options.value = roles.map((role: any) => ({
      label: role.name,
      value: String(role.id),
    }));
  } catch (error) {
    console.error(error);
  }
};

const handleOk = () => {
  mValue.value = targetKeys.value;
  const val = targetKeys.value.join(',');
  emit('update:value', val);
  emit('change', val);

  visible.value = false;
};

const handleCancel = () => {
  visible.value = false;
};
</script>

<template>
  <div>
    <a-row :gutter="8">
      <a-col :span="20">
        <a-select
          v-model:value="mValue"
          mode="multiple"
          disabled
          :options="options"
          style="width: 100%"
        />
      </a-col>
      <a-col :span="4">
        <a-button type="primary" @click="handleClick"> 选择 </a-button>
      </a-col>
    </a-row>

    <a-modal
      v-model:open="visible"
      title="选择候选用户组"
      @ok="handleOk"
      @cancel="handleCancel"
      :width="700"
      :z-index="10000"
    >
      <a-transfer
        :data-source="dataSource"
        :target-keys="targetKeys"
        :render="(item: any) => item.title"
        :show-search="true"
        :titles="['待选角色', '已选角色']"
        :list-style="{
          width: '300px',
          height: '400px',
        }"
        @change="(keys: any) => (targetKeys = keys)"
      />
    </a-modal>
  </div>
</template>
