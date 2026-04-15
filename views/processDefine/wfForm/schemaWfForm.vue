<script lang="ts" setup>
import type { UploadChangeParam } from 'antdv-next';

/**
 * 元数据表单 - 根据流程定义 formSchemaJsonStr 动态渲染表单
 */
import { computed, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { useAccessStore } from '@vben/stores';

import { message } from 'antdv-next';

defineOptions({
  name: 'SchemaWfForm',
});

const props = defineProps<{
  disabled?: boolean;
  flowData?: any;
  processInstance?: any;
}>();
// 文件上传配置
const accessStore = useAccessStore();
const API_BASE_URL = import.meta.env.VITE_GLOB_API_URL;
const uploadAction = `${API_BASE_URL}/api/v1/rustfs/storage/upload`;
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${accessStore.accessToken}`,
}));

// 文件上传状态变化处理
function handleUploadChange(info: UploadChangeParam, fieldName: string) {
  if (info.file.status === 'done') {
    // 上传成功，从响应中获取 URL
    const response = info.file.response;
    if (response?.code === 200 && response?.data?.key) {
      info.file.url = response.data.key;
      message.success(`${info.file.name} 上传成功`);
    }
  } else if (info.file.status === 'error') {
    message.error(`${info.file.name} 上传失败`);
  }
  // 更新表单状态
  formState.value[fieldName] = info.fileList;
}

// 表单数据
const formState = ref<Record<string, any>>({});

// 解析 formSchemaJsonStr（支持从 flowData 或 processInstance.jsonObject 读取）
const formConfig = computed(() => {
  // 优先从 flowData 读取
  let jsonStr = props.flowData?.formSchemaJsonStr;
  // 如果没有，尝试从 processInstance.jsonObject 读取
  if (!jsonStr && props.processInstance?.jsonObject?.formSchemaJsonStr) {
    jsonStr = props.processInstance.jsonObject.formSchemaJsonStr;
  }
  if (!jsonStr) return null;
  try {
    return typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
  } catch {
    return null;
  }
});

// 表单 schema
const formSchema = computed(() => formConfig.value?.schemas || []);

// 表单标题
const _formTitle = computed(
  () => formConfig.value?.title || props.flowData?.displayName || '元数据表单',
);

// 表单布局
const formLayout = computed(() => formConfig.value?.layout || 'horizontal');

// 标签宽度
const labelWidth = computed(() => formConfig.value?.labelWidth || 100);

// 初始化表单
function initForm() {
  // 设置初始值
  if (props.processInstance?.formData) {
    formState.value = { ...props.processInstance.formData };
  } else {
    // 设置默认值
    formSchema.value.forEach((field: any) => {
      if (field.defaultValue !== undefined) {
        formState.value[field.field] = field.defaultValue;
      }
    });
  }
}

// 获取表单值
function getFieldsValue() {
  return { ...formState.value };
}

// 设置表单值
function setFieldsValue(values: Record<string, any>) {
  formState.value = { ...formState.value, ...values };
}

// 验证表单
async function validate() {
  // 基础验证
  for (const field of formSchema.value) {
    if (field.required && !formState.value[field.field]) {
      throw new Error(`${field.label}不能为空`);
    }
  }
  return formState.value;
}

// 重置表单
function resetFields() {
  formState.value = {};
}

watch(
  () => props.flowData,
  () => initForm(),
  { immediate: true, deep: true },
);

watch(
  () => props.processInstance,
  () => initForm(),
  { deep: true },
);

defineExpose({
  getFieldsValue,
  setFieldsValue,
  validate,
  resetFields,
});
</script>

<template>
  <Form
    :layout="formLayout"
    :disabled="disabled"
    :name="_formTitle"
    :label-col="
      formLayout === 'horizontal'
        ? { style: { width: `${labelWidth}px` } }
        : undefined
    "
  >
    <template v-if="formSchema.length > 0">
      <Row :gutter="16">
        <Col
          v-for="field in formSchema"
          :key="field.field"
          :span="field.colProps?.span || 24"
        >
          <FormItem :label="field.label" :required="field.rules?.[0]?.required">
            <!-- Input -->
            <Input
              v-if="field.component === 'Input'"
              v-model:value="formState[field.field]"
              :placeholder="field.componentProps?.placeholder"
            />
            <!-- InputPassword -->
            <a-input-password
              v-else-if="field.component === 'InputPassword'"
              v-model:value="formState[field.field]"
              :placeholder="field.componentProps?.placeholder"
            />
            <!-- InputNumber -->
            <InputNumber
              v-else-if="field.component === 'InputNumber'"
              v-model:value="formState[field.field]"
              :placeholder="field.componentProps?.placeholder"
              :min="field.componentProps?.min"
              :max="field.componentProps?.max"
              style="width: 100%"
            />
            <!-- InputTextArea -->
            <a-textarea
              v-else-if="field.component === 'InputTextArea'"
              v-model:value="formState[field.field]"
              :placeholder="field.componentProps?.placeholder"
              :rows="field.componentProps?.rows || 4"
            />
            <!-- Select -->
            <Select
              v-else-if="field.component === 'Select'"
              v-model:value="formState[field.field]"
              :placeholder="field.componentProps?.placeholder"
              :options="field.componentProps?.options"
              style="width: 100%"
            />
            <!-- RadioGroup -->
            <RadioGroup
              v-else-if="field.component === 'RadioGroup'"
              v-model:value="formState[field.field]"
              :options="field.componentProps?.options"
            />
            <!-- CheckboxGroup -->
            <CheckboxGroup
              v-else-if="field.component === 'CheckboxGroup'"
              v-model:value="formState[field.field]"
              :options="field.componentProps?.options"
            />
            <!-- Checkbox -->
            <Checkbox
              v-else-if="field.component === 'Checkbox'"
              v-model:checked="formState[field.field]"
            >
              {{ field.componentProps?.label || field.label }}
            </Checkbox>
            <!-- DatePicker -->
            <DatePicker
              v-else-if="field.component === 'DatePicker'"
              v-model:value="formState[field.field]"
              :placeholder="field.componentProps?.placeholder"
              style="width: 100%"
            />
            <!-- TimePicker -->
            <TimePicker
              v-else-if="field.component === 'TimePicker'"
              v-model:value="formState[field.field]"
              :placeholder="field.componentProps?.placeholder"
              style="width: 100%"
            />
            <!-- Upload 附件上传 -->
            <Upload
              v-else-if="field.component === 'Upload'"
              :file-list="formState[field.field]"
              :action="uploadAction"
              :headers="uploadHeaders"
              :max-count="field.componentProps?.maxCount || 5"
              name="file"
              @change="
                (info: UploadChangeParam) =>
                  handleUploadChange(info, field.field)
              "
            >
              <Button>
                <IconifyIcon icon="ant-design:upload-outlined" />
                上传文件
              </Button>
            </Upload>
            <!-- 默认 Input -->
            <Input
              v-else
              v-model:value="formState[field.field]"
              :placeholder="field.componentProps?.placeholder"
            />
          </FormItem>
        </Col>
      </Row>
    </template>
    <template v-else>
      <!-- 如果没有 schema，显示原始表单数据 -->
      <div
        v-if="
          processInstance?.formData &&
          Object.keys(processInstance.formData).length > 0
        "
      >
        <FormItem
          v-for="(_, key) in processInstance.formData"
          :key="key"
          :label="String(key)"
        >
          <Input v-model:value="formState[key]" />
        </FormItem>
      </div>
      <div v-else class="py-8 text-center text-gray-400">暂无表单配置</div>
    </template>
  </Form>
</template>
