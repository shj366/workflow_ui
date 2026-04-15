<script lang="ts" setup>
import { reactive } from 'vue';

defineOptions({
  name: 'DefaultTaskForm',
});

// 简单示例任务表单模型，字段前缀 tf_ 对齐 mldong 的任务表单变量约定
const formModel = reactive<Record<string, any>>({
  tf_approvalComment: '',
});

// 暴露方法供父组件调用
defineExpose({
  getFieldsValue() {
    return { ...formModel };
  },
  setFieldsValue(data: Record<string, any>) {
    Object.assign(formModel, data);
  },
});
</script>

<template>
  <a-card title="默认任务表单">
    <a-form layout="vertical">
      <a-form-item label="审批意见" name="tf_approvalComment">
        <a-textarea
          v-model:value="formModel.tf_approvalComment"
          placeholder="请输入审批意见"
          :rows="4"
        />
      </a-form-item>
    </a-form>
  </a-card>
</template>
