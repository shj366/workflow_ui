<script lang="ts" setup>
import { ref, watch } from 'vue';

import { getUserTreeApi } from '#/plugins/workflow/api/processDesign';

const props = defineProps<{
  value?: string;
}>();

const emit = defineEmits(['update:value', 'setAssigneeText']);

const mValue = ref<string[]>([]);
const visible = ref(false);
const treeData = ref<any[]>([]);
const checkedKeys = ref<string[]>([]);
const options = ref<any[]>([]);

watch(
  () => props.value,
  (val) => {
    mValue.value = val ? val.split(',') : [];
    checkedKeys.value = mValue.value;
  },
  { immediate: true },
);

const handleClick = () => {
  visible.value = true;
  if (treeData.value.length === 0) {
    loadData();
  } else {
    checkedKeys.value = mValue.value;
  }
};

const transformTreeData = (data: any[], userOpts: any[]) => {
  return data.map((item) => {
    const node: any = {
      key: item.value,
      title: item.label,
      disableCheckbox: item.nodeType === '1', // 部门不可选
      selectable: false,
    };

    if (item.nodeType === '2') {
      // 用户节点
      userOpts.push({
        label: item.label,
        value: item.value,
      });
      node.isLeaf = true;
    }

    node.children =
      item.children && item.children.length > 0
        ? transformTreeData(item.children, userOpts)
        : [];
    return node;
  });
};

const loadData = async () => {
  try {
    const data = await getUserTreeApi();
    const userOpts: any[] = [];
    treeData.value = transformTreeData(data, userOpts);
    options.value = userOpts;
  } catch (error) {
    console.error(error);
  }
};

const handleOk = () => {
  // 过滤掉部门 (虽然设置了 disableCheckbox，但 ant design vue 可能会返回父节点)
  // 这里主要依赖 treeData 中的 disableCheckbox 配置
  // checkedKeys 这里应该是用户 ID 列表

  mValue.value = checkedKeys.value;
  const val = checkedKeys.value.join(',');
  emit('update:value', val);

  // 设置显示的文本
  const texts = checkedKeys.value.map((u) => {
    const opt = options.value.find((o) => o.value === u);
    return opt ? opt.label : u;
  });
  emit('setAssigneeText', texts.join(','));

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
      title="选择参与者"
      @ok="handleOk"
      @cancel="handleCancel"
      :z-index="10000"
    >
      <a-tree
        v-if="treeData.length > 0"
        checkable
        :tree-data="treeData"
        v-model:checked-keys="checkedKeys"
        default-expand-all
        :height="400"
      />
    </a-modal>
  </div>
</template>
