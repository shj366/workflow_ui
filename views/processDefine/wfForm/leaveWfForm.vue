<script lang="ts" setup name="leaveWfForm|请假表单">
import { reactive } from 'vue';

// 简单示例表单模型，实际发起流程时由上层通过 v-model 或 attrs 接管
const formModel = reactive<Record<string, any>>({
  f_title: '',
  f_remark: '',
});
</script>

<template>
  <a-card title="请假申请表单">
    <a-form layout="vertical">
      <a-form-item label="请假标题" name="f_title">
        <a-input
          v-model:value="formModel.f_title"
          placeholder="请输入请假标题"
        />
      </a-form-item>
      <a-form-item label="请假原因" name="f_remark">
        <a-textarea
          v-model:value="formModel.f_remark"
          placeholder="请输入请假原因"
          :rows="4"
        />
      </a-form-item>
    </a-form>
  </a-card>
</template>
