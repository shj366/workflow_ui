<script lang="ts" setup>
/**
 * 表单设计器 - 用于设计流程表单
 * 对齐 mldong 实现
 */
import { computed, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { message } from 'antdv-next';

import {
  getProcessDesignDetailApi,
  saveProcessDesignApi,
} from '#/plugins/workflow/api/processDesign';

import FormItemSchemaDrawer from './formItemSchemaDrawer.vue';
import FormSchemaDrawer from './formSchemaDrawer.vue';

const emit = defineEmits<{
  success: [];
}>();

const visible = ref(false);
const loading = ref(false);
const currentRecord = ref<any>(null);
const flowData = ref<any>({});

// 表单属性
const formSchema = ref<{
  labelWidth?: number;
  layout?: string;
  showResetButton?: boolean;
  showSubmitButton?: boolean;
  title?: string;
}>({
  title: '',
  labelWidth: 100,
  layout: 'horizontal',
  showResetButton: false,
  showSubmitButton: false,
});

// 表单字段列表
const schemas = ref<Array<any>>([]);

// 抽屉组件引用
const formSchemaDrawerRef = ref<InstanceType<typeof FormSchemaDrawer>>();
const formItemSchemaDrawerRef =
  ref<InstanceType<typeof FormItemSchemaDrawer>>();

// 表格列配置
const columns = [
  { title: '字段名', dataIndex: 'field', key: 'field', width: 120 },
  { title: '标签', dataIndex: 'label', key: 'label', width: 120 },
  { title: '组件', dataIndex: 'component', key: 'component', width: 100 },
  { title: '必填', dataIndex: 'required', key: 'required', width: 60 },
  { title: '操作', key: 'action', width: 180 },
];

const dataSource = computed(() => schemas.value || []);

// 默认 schema 配置
const defaultSchemaStr = JSON.stringify({
  labelWidth: 100,
  layout: 'horizontal',
  showResetButton: false,
  showSubmitButton: false,
  schemas: [
    {
      field: 'f_title',
      label: '标题',
      component: 'Input',
      rules: [{ required: true, message: '请输入标题', trigger: 'blur' }],
      colProps: { span: 12 },
      componentProps: { placeholder: '请输入标题' },
    },
    {
      field: 'f_desc',
      label: '描述',
      component: 'InputTextArea',
      rules: [{ required: false }],
      colProps: { span: 24 },
      componentProps: { placeholder: '请输入描述', rows: 4 },
    },
  ],
});

async function open(record: any) {
  currentRecord.value = record;
  visible.value = true;
  loading.value = true;

  try {
    const data = await getProcessDesignDetailApi(record.id);
    flowData.value = data?.jsonObject || {};

    // 对齐 mldong：从 formSchemaJsonStr 读取表单配置
    const formSchemaJsonStr = data?.jsonObject?.formSchemaJsonStr;

    let parsed;
    try {
      if (formSchemaJsonStr) {
        parsed =
          typeof formSchemaJsonStr === 'string'
            ? JSON.parse(formSchemaJsonStr)
            : formSchemaJsonStr;
      }
    } catch (error) {
      console.warn('JSON parse failed for formSchemaJsonStr', error);
    }

    // 只有在没有数据时才使用默认配置
    // 如果 parsed 是空对象，说明可能保存了空配置，不应该强制回退到 default
    if (!parsed) {
      // 如果完全没有字段（比如新建流程），使用默认模板
      parsed = formSchemaJsonStr ? {} : JSON.parse(defaultSchemaStr);
    }

    formSchema.value = {
      title: parsed.title || '',
      labelWidth: parsed.labelWidth || 100,
      layout: parsed.layout || 'horizontal',
      showResetButton: parsed.showResetButton || false,
      showSubmitButton: parsed.showSubmitButton || false,
    };
    schemas.value = parsed.schemas || [];
  } catch (error) {
    console.error('Failed to load form designer:', error);
    message.error('加载失败');
  } finally {
    loading.value = false;
  }
}

function handleAdd() {
  formItemSchemaDrawerRef.value?.open();
}

function handleEdit(record: any) {
  formItemSchemaDrawerRef.value?.open(record);
}

function handleDelete(record: any) {
  const index = schemas.value.findIndex((s) => s.field === record.field);
  if (index !== -1) {
    schemas.value.splice(index, 1);
  }
}

function handleUpDown(index: number, direction: 'down' | 'up') {
  const newIndex = direction === 'up' ? index - 1 : index + 1;
  if (newIndex < 0 || newIndex >= schemas.value.length) return;

  const temp = schemas.value[index];
  schemas.value[index] = schemas.value[newIndex]!;
  schemas.value[newIndex] = temp!;
}

// 表单项配置抽屉确定事件
function handleFormItemSchemaDrawerOk(values: any) {
  const schemaList = [...schemas.value];
  const index = schemaList.findIndex((s) => s.field === values.field);
  if (index === -1) {
    schemaList.push(values);
  } else {
    schemaList[index] = { ...schemaList[index], ...values };
  }
  schemas.value = schemaList;
}

// 表单属性抽屉确定事件
function handleFormSchemaDrawerOk(values: any) {
  formSchema.value = { ...formSchema.value, ...values };
}

function handleOpenFormSchema() {
  formSchemaDrawerRef.value?.open({
    ...formSchema.value,
    title: formSchema.value.title || '元数据表单',
  });
}

async function handleOk() {
  if (!currentRecord.value) return;

  loading.value = true;
  try {
    // 对齐 mldong：构建 formSchemaJsonStr
    const formSchemaJsonStr = JSON.stringify({
      ...formSchema.value,
      schemas: schemas.value,
    });

    // 获取现有的 jsonObject，保留流程设计数据
    const newJsonObject = {
      ...flowData.value,
      formSchemaJsonStr, // 对齐 mldong 存储结构
    };

    await saveProcessDesignApi({
      id: currentRecord.value.id,
      jsonObject: newJsonObject,
    });

    message.success('保存成功');
    visible.value = false;
    emit('success');
  } catch (error) {
    console.error('Failed to save form schema:', error);
    message.error('保存失败');
  } finally {
    loading.value = false;
  }
}

function handleCancel() {
  visible.value = false;
}

defineExpose({
  open,
});
</script>

<template>
  <div>
    <a-modal
      v-model:open="visible"
      title="表单设计"
      width="90%"
      :z-index="1000"
      :confirm-loading="loading"
      destroy-on-hidden
      @ok="handleOk"
      @cancel="handleCancel"
    >
      <a-row :gutter="16">
        <!-- 表单预览区域 -->
        <a-col :span="14">
          <a-card :title="formSchema.title || '元数据表单'" :loading="loading">
            <a-form
              :layout="(formSchema.layout || 'horizontal') as any"
              :label-col="
                formSchema.layout === 'horizontal'
                  ? { style: { width: `${formSchema.labelWidth || 100}px` } }
                  : undefined
              "
            >
              <template v-if="schemas.length > 0">
                <a-row :gutter="16">
                  <a-col
                    v-for="field in schemas"
                    :key="field.field"
                    :span="field.colProps?.span || 24"
                  >
                    <a-form-item
                      :label="field.label"
                      :required="field.rules?.[0]?.required"
                    >
                      <a-input
                        v-if="field.component === 'Input'"
                        :placeholder="field.componentProps?.placeholder"
                        disabled
                      />
                      <a-input
                        v-else-if="field.component === 'InputPassword'"
                        type="password"
                        :placeholder="field.componentProps?.placeholder"
                        disabled
                      />
                      <a-input-number
                        v-else-if="field.component === 'InputNumber'"
                        :placeholder="field.componentProps?.placeholder"
                        :min="field.componentProps?.min"
                        :max="field.componentProps?.max"
                        style="width: 100%"
                        disabled
                      />
                      <a-textarea
                        v-else-if="field.component === 'InputTextArea'"
                        :placeholder="field.componentProps?.placeholder"
                        :rows="field.componentProps?.rows || 4"
                        disabled
                      />
                      <a-select
                        v-else-if="field.component === 'Select'"
                        :placeholder="field.componentProps?.placeholder"
                        :options="field.componentProps?.options"
                        style="width: 100%"
                        disabled
                      />
                      <a-select
                        v-else-if="field.component === 'RadioGroup'"
                        :placeholder="field.componentProps?.placeholder"
                        :options="field.componentProps?.options"
                        style="width: 100%"
                        disabled
                      />
                      <a-checkbox
                        v-else-if="field.component === 'Checkbox'"
                        disabled
                      >
                        {{ field.label }}
                      </a-checkbox>
                      <a-date-picker
                        v-else-if="field.component === 'DatePicker'"
                        :placeholder="field.componentProps?.placeholder"
                        style="width: 100%"
                        disabled
                      />
                      <a-time-picker
                        v-else-if="field.component === 'TimePicker'"
                        :placeholder="field.componentProps?.placeholder"
                        style="width: 100%"
                        disabled
                      />
                      <a-upload
                        v-else-if="field.component === 'Upload'"
                        :before-upload="() => false"
                        disabled
                      >
                        <a-button disabled>
                          <IconifyIcon icon="ant-design:upload-outlined" />
                          上传文件
                        </a-button>
                      </a-upload>
                      <a-input
                        v-else
                        :placeholder="field.componentProps?.placeholder"
                        disabled
                      />
                    </a-form-item>
                  </a-col>
                </a-row>
              </template>
              <div v-else class="py-8 text-center text-gray-400">
                暂无字段，请在右侧添加
              </div>
            </a-form>
          </a-card>
        </a-col>

        <!-- 字段列表区域 -->
        <a-col :span="10">
          <a-card title="字段列表">
            <template #extra>
              <a-space>
                <a-button type="primary" size="small" @click="handleAdd">
                  <IconifyIcon icon="ant-design:plus-outlined" />
                  新增
                </a-button>
                <a-button size="small" @click="handleOpenFormSchema">
                  <IconifyIcon icon="ant-design:setting-outlined" />
                  表单属性
                </a-button>
              </a-space>
            </template>

            <a-table
              :data-source="dataSource"
              :columns="columns"
              :pagination="false"
              size="small"
              row-key="field"
            >
              <template #bodyCell="{ column, record, index }">
                <template v-if="column.key === 'required'">
                  <span
                    :class="
                      record.rules?.[0]?.required
                        ? 'text-red-500'
                        : 'text-gray-400'
                    "
                  >
                    {{ record.rules?.[0]?.required ? '是' : '否' }}
                  </span>
                </template>
                <template v-if="column.key === 'action'">
                  <a-space>
                    <a
                      :class="{ 'text-gray-300': index === 0 }"
                      @click="handleUpDown(index, 'up')"
                    >
                      上移
                    </a>
                    <a
                      :class="{
                        'text-gray-300': index === dataSource.length - 1,
                      }"
                      @click="handleUpDown(index, 'down')"
                    >
                      下移
                    </a>
                    <a @click="handleEdit(record)">编辑</a>
                    <a-popconfirm
                      title="确定删除吗？"
                      @confirm="handleDelete(record)"
                    >
                      <a class="text-red-500">删除</a>
                    </a-popconfirm>
                  </a-space>
                </template>
              </template>
            </a-table>
          </a-card>
        </a-col>
      </a-row>
    </a-modal>

    <!-- 表单属性配置抽屉 -->
    <FormSchemaDrawer
      ref="formSchemaDrawerRef"
      @ok="handleFormSchemaDrawerOk"
    />
    <!-- 表单项配置抽屉 -->
    <FormItemSchemaDrawer
      ref="formItemSchemaDrawerRef"
      @ok="handleFormItemSchemaDrawerOk"
    />
  </div>
</template>
