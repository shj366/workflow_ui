<script lang="ts" setup>
import type { Component } from 'vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { useVbenDrawer } from '@vben/common-ui';

import { message } from 'antdv-next';
import SnakerFlowDesigner from '#/plugins/workflow/components/SnakerFlowDesigner';

import { getProcessDefineDetailApi } from '#/plugins/workflow/api/processDefine';
import { startAndExecuteApi } from '#/plugins/workflow/api/processInstance';

import { componentMap as wfFormComponentMap } from './componentMap';
import SchemaWfForm from './wfForm/schemaWfForm.vue';

const router = useRouter();
const flowData = ref<Record<string, unknown>>({});
const recordId = ref('');
const activeKey = ref('form');
const loading = ref(false);
const formKey = ref<Component | null>(null);
const processVersion = ref<number | null>(null);
const wfFormRef = ref<{ getFieldsValue?: () => Record<string, unknown>; validate?: () => Promise<unknown> } | null>(null);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function extractJsonObject(response: unknown): Record<string, unknown> {
  let payload: unknown = response;
  for (let index = 0; index < 4; index += 1) {
    if (typeof payload === 'string' && payload.trim()) {
      payload = JSON.parse(payload);
      continue;
    }
    if (!isRecord(payload)) return {};
    if ('jsonObject' in payload || 'json_object' in payload || 'content' in payload) break;
    if (!('data' in payload)) return {};
    payload = payload.data;
  }
  if (!isRecord(payload)) return {};

  const rawJson = payload.jsonObject ?? payload.json_object ?? payload.content;
  if (isRecord(rawJson)) return rawJson;
  if (typeof rawJson === 'string' && rawJson.trim()) {
    const parsed: unknown = JSON.parse(rawJson);
    return isRecord(parsed) ? parsed : {};
  }
  return {};
}

function extractVersion(response: unknown): number | null {
  let payload: unknown = response;
  for (let index = 0; index < 4; index += 1) {
    if (!isRecord(payload)) return null;
    if (typeof payload.version === 'number') return payload.version;
    if (!('data' in payload)) return null;
    payload = payload.data;
  }
  return null;
}
function extractDetailField(response: unknown, field: string): unknown {
  let payload: unknown = response;
  for (let index = 0; index < 4; index += 1) {
    if (!isRecord(payload)) return undefined;
    if (field in payload) return payload[field];
    if (!('data' in payload)) return undefined;
    payload = payload.data;
  }
  return undefined;
}

const [Drawer, drawerApi] = useVbenDrawer({
  title: '发起流程',
  onOpenChange: async (isOpen) => {
    if (!isOpen) return;
    const { id } = drawerApi.getData();
    recordId.value = id;
    flowData.value = {};
    activeKey.value = 'form';
    formKey.value = null;
    processVersion.value = null;
    drawerApi.setState({ title: '发起流程' });
    try {
      const response = await getProcessDefineDetailApi(id);
      const jsonObject = extractJsonObject(response);
      flowData.value = jsonObject;
      processVersion.value = extractVersion(response);
      const processName = String(
        extractDetailField(response, 'displayName') ||
          extractDetailField(response, 'display_name') ||
          jsonObject.displayName ||
          jsonObject.name ||
          '流程',
      );
      const versionText = processVersion.value === null ? '' : ` v${processVersion.value}`;
      drawerApi.setState({ title: `发起流程：${processName}${versionText}` });

      const instanceUrl = (jsonObject['process-instanceUrl'] ||
        jsonObject.instanceUrl) as string | undefined;
      const fallbackKey = 'DefaultWfForm';
      if (jsonObject.formSchemaJsonStr) {
        formKey.value = SchemaWfForm;
      } else if (instanceUrl && wfFormComponentMap.has(instanceUrl)) {
        formKey.value = wfFormComponentMap.get(instanceUrl) ?? null;
      } else {
        formKey.value = wfFormComponentMap.get(fallbackKey) ?? null;
      }
    } catch (error) {
      console.error(error);
    }
  },
  onConfirm: handleSubmit,
});

async function handleSubmit() {
  loading.value = true;
  try {
    // 动态元数据表单暴露 validate；先校验必填字段，再读取提交值。
    if (wfFormRef.value?.validate) {
      await wfFormRef.value.validate();
    }

    // 通过 ref 获取子组件的表单数据
    let formData: Record<string, any> = {};
    if (wfFormRef.value?.getFieldsValue) {
      formData = wfFormRef.value.getFieldsValue() || {};
    }

    await startAndExecuteApi({
      processDefineId: recordId.value,
      formData,
    });
    message.success('发起流程成功');
    drawerApi.close();
    // 跳转到工作中心的“我发起的”页签
    router.push({
      path: '/workflow/center',
      query: { tab: 'my_initiated' },
    });
  } catch (error) {
    console.error(error);
    message.error(error instanceof Error ? error.message : '发起流程失败');
  } finally {
    loading.value = false;
  }
}

defineExpose({
  open: drawerApi.open,
  setData: drawerApi.setData,
});

// Tab items 配置
const tabItems = [
  {
    key: 'form',
    label: '表单',
  },
  {
    key: 'process',
    label: '流程图',
  },
];
</script>

<template>
  <Drawer class="w-[60%]" :confirm-loading="loading">
    <a-tabs v-model:active-key="activeKey" :items="tabItems">
      <template #contentRender="{ item }">
        <!-- 表单标签页 -->
        <template v-if="item.key === 'form'">
          <component :is="formKey" :key="formKey" ref="wfFormRef" :flow-data="flowData" />
        </template>
        <!-- 流程图标签页 -->
        <template v-else-if="item.key === 'process'">
          <div class="designer-container">
            <SnakerFlowDesigner
              v-if="recordId"
              v-model="flowData"
              :show-doc="false"
              :viewer="true"
              node-render-type="html"
            />
          </div>
        </template>
      </template>
    </a-tabs>
  </Drawer>
</template>

<style scoped>
.designer-container {
  height: calc(100vh - 200px);
  overflow: hidden;
}
</style>
