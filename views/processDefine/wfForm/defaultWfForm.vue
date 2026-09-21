<script lang="ts" setup>
import { reactive } from 'vue';

defineOptions({
  name: 'DefaultWfForm|默认表单',
});

const formState = reactive<Record<string, any>>({
  f_title: '',
  f_remark: '',
});

// 暴露方法供父组件调用
defineExpose({
  getFieldsValue() {
    return { ...formState };
  },
  setFieldsValue(data: Record<string, any>) {
    Object.assign(formState, data);
  },
});
</script>

<template>
  <a-card title="申请表单">
    <a-form :model="formState" layout="vertical">
      <a-form-item
        label="申请标题"
        name="f_title"
        :rules="[{ required: true, message: '请输入申请标题' }]"
      >
        <a-input
          v-model:value="formState.f_title"
          placeholder="请输入申请标题"
        />
      </a-form-item>
      <a-form-item label="申请说明" name="f_remark">
        <a-textarea
          v-model:value="formState.f_remark"
          placeholder="请输入申请说明"
          :rows="4"
        />
      </a-form-item>
    </a-form>
    <p class="mt-4 text-xs text-gray-400">
      提示：这是默认流程表单。如需自定义表单，可在
      <code>views/wf/processDefine/wfForm</code> 目录下添加 *WfForm.vue 文件。
    </p>
  </a-card>
</template>
