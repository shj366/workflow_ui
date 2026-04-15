<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { useVbenDrawer } from '@vben/common-ui';

import { message } from 'antdv-next';
import SnakerFlowDesigner from '#/plugins/workflow/components/SnakerFlowDesigner';

import { getProcessDefineDetailApi } from '#/plugins/workflow/api/processDefine';
import { startAndExecuteApi } from '#/plugins/workflow/api/processInstance';

import { componentMap as wfFormComponentMap } from './componentMap';

const router = useRouter();
const flowData = ref({});
const recordId = ref('');
const activeKey = ref('form');
const loading = ref(false);
const formKey = ref<any>(null);
const wfFormRef = ref<any>(null);

const [Drawer, drawerApi] = useVbenDrawer({
  title: '发起流程',
  onOpenChange: async (isOpen) => {
    if (isOpen) {
      const { id } = drawerApi.getData();
      recordId.value = id;
      flowData.value = {};
      activeKey.value = 'form';
      formKey.value = null;
      try {
        const data = await getProcessDefineDetailApi(id);
        const jsonObject = data.jsonObject || {};
        flowData.value = jsonObject;

        // 根据流程定义配置的“实例启动表单”选择对应的 WfForm 组件
        // 兼容字段名：设计器里是 process-instanceUrl，旧数据可能是 instanceUrl
        const instanceUrl = (jsonObject['process-instanceUrl'] ||
          jsonObject.instanceUrl) as string | undefined;

        const formComponentMap = wfFormComponentMap as Map<string, any>;
        const fallbackKey = 'DefaultWfForm';

        formKey.value =
          instanceUrl && formComponentMap.has(instanceUrl)
            ? formComponentMap.get(instanceUrl)
            : formComponentMap.get(fallbackKey);
      } catch (error) {
        console.error(error);
      }
    }
  },
  onConfirm: handleSubmit,
});

async function handleSubmit() {
  loading.value = true;
  try {
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
          <component :is="formKey" ref="wfFormRef" :flow-data="flowData" />
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
