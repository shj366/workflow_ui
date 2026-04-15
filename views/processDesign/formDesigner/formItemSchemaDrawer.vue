<script lang="ts" setup>
/**
 * 表单项属性配置抽屉
 */
import { computed, nextTick, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

const emit = defineEmits<{
  ok: [values: any];
}>();

const visible = ref(false);
const isEdit = ref(false);
const loading = ref(false);

// 组件类型列表及其特有属性
const componentList = [
  {
    label: '文本输入',
    value: 'Input',
    props: ['placeholder'],
  },
  {
    label: '密码输入',
    value: 'InputPassword',
    props: ['placeholder'],
  },
  {
    label: '数字输入',
    value: 'InputNumber',
    props: ['placeholder', 'min', 'max', 'step'],
  },
  {
    label: '多行文本',
    value: 'InputTextArea',
    props: ['placeholder', 'rows', 'maxLength', 'showCount'],
  },
  {
    label: '下拉选择',
    value: 'Select',
    props: ['placeholder', 'options'],
  },
  {
    label: '单选组',
    value: 'RadioGroup',
    props: ['options'],
  },
  {
    label: '复选组',
    value: 'CheckboxGroup',
    props: ['options'],
  },
  {
    label: '日期选择',
    value: 'DatePicker',
    props: ['placeholder'],
  },
  {
    label: '时间选择',
    value: 'TimePicker',
    props: ['placeholder'],
  },
  {
    label: '附件上传',
    value: 'Upload',
    props: [],
  },
];

const componentOptions = componentList.map((c) => ({
  label: c.label,
  value: c.value,
}));

// 表单数据
const formState = ref<{
  colSpan?: number;
  component: string;
  defaultValue?: any;
  field: string;
  label: string;
  max?: number;
  maxLength?: number;
  message?: string;
  min?: number;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  showCount?: boolean;
  step?: number;
}>({
  field: '',
  label: '',
  component: 'Input',
  required: false,
  message: '',
  placeholder: '',
  colSpan: 24,
  options: [],
});

// 当前组件的特有属性
const currentComponentProps = computed(() => {
  const comp = componentList.find((c) => c.value === formState.value.component);
  return comp?.props || [];
});

// 选项列表（用于 Select/RadioGroup/CheckboxGroup）
const optionsList = ref<Array<{ label: string; value: string }>>([]);

watch(
  () => formState.value.component,
  () => {
    // 组件类型改变时，重置特有属性
    if (
      ['CheckboxGroup', 'RadioGroup', 'Select'].includes(
        formState.value.component,
      ) &&
      optionsList.value.length === 0
    ) {
      optionsList.value = [{ label: '选项1', value: '1' }];
    }
  },
);

function open(data?: any) {
  visible.value = true;
  isEdit.value = !!data?.field;

  nextTick(() => {
    if (data && data.field) {
      formState.value = {
        ...data,
        required: data.rules?.[0]?.required || false,
        message: data.rules?.[0]?.message || '',
        placeholder: data.componentProps?.placeholder || '',
        min: data.componentProps?.min,
        max: data.componentProps?.max,
        step: data.componentProps?.step,
        rows: data.componentProps?.rows,
        maxLength: data.componentProps?.maxLength,
        showCount: data.componentProps?.showCount,
      };
      optionsList.value = data.componentProps?.options || [];
    } else {
      formState.value = {
        field: '',
        label: '',
        component: 'Input',
        required: false,
        message: '',
        placeholder: '',
        colSpan: 24,
      };
      optionsList.value = [];
    }
  });
}

function addOption() {
  optionsList.value.push({ label: '', value: '' });
}

function removeOption(index: number) {
  optionsList.value.splice(index, 1);
}

function handleOk() {
  if (!formState.value.field || !formState.value.label) {
    return;
  }

  // 构建完整的字段配置
  const result: any = {
    field: formState.value.field,
    label: formState.value.label,
    component: formState.value.component,
    defaultValue: formState.value.defaultValue,
    colProps: {
      span: formState.value.colSpan || 24,
    },
    rules: formState.value.required
      ? [
          {
            required: true,
            message:
              formState.value.message || `请输入${formState.value.label}`,
            trigger: 'blur',
          },
        ]
      : [],
    componentProps: {},
  };

  // 添加组件特有属性
  if (formState.value.placeholder) {
    result.componentProps.placeholder = formState.value.placeholder;
  }
  if (formState.value.min !== undefined) {
    result.componentProps.min = formState.value.min;
  }
  if (formState.value.max !== undefined) {
    result.componentProps.max = formState.value.max;
  }
  if (formState.value.step !== undefined) {
    result.componentProps.step = formState.value.step;
  }
  if (formState.value.rows !== undefined) {
    result.componentProps.rows = formState.value.rows;
  }
  if (formState.value.maxLength !== undefined) {
    result.componentProps.maxLength = formState.value.maxLength;
  }
  if (formState.value.showCount !== undefined) {
    result.componentProps.showCount = formState.value.showCount;
  }
  if (
    ['CheckboxGroup', 'RadioGroup', 'Select'].includes(
      formState.value.component,
    )
  ) {
    result.componentProps.options = optionsList.value.filter(
      (o) => o.label && o.value,
    );
  }

  emit('ok', result);
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
    :title="isEdit ? '编辑表单项' : '新增表单项'"
    :width="600"
    :z-index="2000"
    @cancel="visible = false"
  >
    <a-form layout="vertical" :model="formState">
      <a-form-item label="字段名" required>
        <a-input
          v-model:value="formState.field"
          placeholder="英文字段名，如 f_name"
          :disabled="isEdit"
        />
      </a-form-item>

      <a-form-item label="标签" required>
        <a-input
          v-model:value="formState.label"
          placeholder="显示标签，如 姓名"
        />
      </a-form-item>

      <a-form-item label="组件类型">
        <a-select
          v-model:value="formState.component"
          :options="componentOptions"
        />
      </a-form-item>

      <a-form-item label="栅格宽度">
        <a-select v-model:value="formState.colSpan">
          <a-select-option :value="24">整行 (24)</a-select-option>
          <a-select-option :value="12">半行 (12)</a-select-option>
          <a-select-option :value="8">三分之一 (8)</a-select-option>
          <a-select-option :value="6">四分之一 (6)</a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="默认值">
        <a-input
          v-model:value="formState.defaultValue"
          placeholder="默认值"
          allow-clear
        />
      </a-form-item>

      <a-divider>校验规则</a-divider>

      <a-form-item>
        <a-checkbox v-model:checked="formState.required">必填</a-checkbox>
      </a-form-item>

      <a-form-item v-if="formState.required" label="校验提示">
        <a-input
          v-model:value="formState.message"
          :placeholder="`请输入${formState.label}`"
        />
      </a-form-item>

      <a-divider>组件属性</a-divider>

      <!-- 占位内容 -->
      <a-form-item
        v-if="currentComponentProps.includes('placeholder')"
        label="占位内容"
      >
        <a-input
          v-model:value="formState.placeholder"
          placeholder="请输入..."
        />
      </a-form-item>

      <!-- 数字输入特有属性 -->
      <template v-if="formState.component === 'InputNumber'">
        <a-form-item label="最小值">
          <a-input-number v-model:value="formState.min" style="width: 100%" />
        </a-form-item>
        <a-form-item label="最大值">
          <a-input-number v-model:value="formState.max" style="width: 100%" />
        </a-form-item>
        <a-form-item label="步长">
          <a-input-number
            v-model:value="formState.step"
            :min="1"
            style="width: 100%"
          />
        </a-form-item>
      </template>

      <!-- 多行文本特有属性 -->
      <template v-if="formState.component === 'InputTextArea'">
        <a-form-item label="行数">
          <a-input-number
            v-model:value="formState.rows"
            :min="1"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="最大长度">
          <a-input-number
            v-model:value="formState.maxLength"
            :min="1"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item>
          <a-checkbox v-model:checked="formState.showCount">
            显示字数
          </a-checkbox>
        </a-form-item>
      </template>

      <!-- 选项列表 -->
      <template
        v-if="
          ['CheckboxGroup', 'RadioGroup', 'Select'].includes(
            formState.component,
          )
        "
      >
        <a-form-item label="选项列表">
          <a-button type="dashed" block @click="addOption">
            <IconifyIcon icon="ant-design:plus-outlined" />
            添加选项
          </a-button>
        </a-form-item>

        <a-form-item
          v-for="(option, index) in optionsList"
          :key="index"
          :label="`选项 ${index + 1}`"
        >
          <a-input-group compact>
            <a-input
              v-model:value="option.label"
              placeholder="标签"
              style="width: 50%"
            />
            <a-input
              v-model:value="option.value"
              placeholder="值"
              style="width: 40%"
            />
            <a-button danger style="width: 10%" @click="removeOption(index)">
              <IconifyIcon icon="ant-design:delete-outlined" />
            </a-button>
          </a-input-group>
        </a-form-item>
      </template>
    </a-form>

    <template #footer>
      <a-button @click="visible = false">取消</a-button>
      <a-button type="primary" :loading="loading" @click="handleOk">
        确定
      </a-button>
    </template>
  </a-modal>
</template>
