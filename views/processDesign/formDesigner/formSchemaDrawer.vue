<script lang="ts" setup>
/**
 * 表单属性配置抽屉
 */
import { nextTick, ref } from 'vue';

const emit = defineEmits<{
  ok: [values: any];
}>();

const visible = ref(false);
const formState = ref<{
  labelWidth?: number;
  layout?: string;
  title?: string;
}>({
  title: '',
  layout: 'horizontal',
  labelWidth: 100,
});

function open(data?: any) {
  visible.value = true;
  nextTick(() => {
    formState.value = data
      ? { ...data }
      : {
          title: '',
          layout: 'horizontal',
          labelWidth: 100,
        };
  });
}

function handleOk() {
  emit('ok', { ...formState.value });
  visible.value = false;
}

defineExpose({
  open,
  show: open,
});
</script>

<template>
  <a-modal
    v-model:open="visible"
    title="表单属性"
    :width="500"
    :z-index="2000"
    @cancel="visible = false"
  >
    <a-form layout="vertical" :model="formState">
      <a-form-item label="表单标题">
        <a-input v-model:value="formState.title" placeholder="请输入表单标题" />
      </a-form-item>
      <a-form-item label="表单布局">
        <a-radio-group v-model:value="formState.layout" button-style="solid">
          <a-radio-button value="horizontal">水平</a-radio-button>
          <a-radio-button value="vertical">垂直</a-radio-button>
          <a-radio-button value="inline">行内</a-radio-button>
        </a-radio-group>
      </a-form-item>
      <a-form-item label="标签宽度(px)">
        <a-input-number
          v-model:value="formState.labelWidth"
          :min="60"
          :max="300"
          style="width: 100%"
        />
      </a-form-item>
    </a-form>
    <template #footer>
      <div class="flex justify-end gap-2">
        <a-button @click="visible = false">取消</a-button>
        <a-button type="primary" @click="handleOk">确定</a-button>
      </div>
    </template>
  </a-modal>
</template>
