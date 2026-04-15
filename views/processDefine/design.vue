<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import SnakerFlowDesigner from '#/plugins/workflow/components/SnakerFlowDesigner';

import { getProcessDefineDetailApi } from '#/plugins/workflow/api/processDefine';

const flowData = ref({});
const recordId = ref('');
const activeKey = ref('processGraph');

const tabItems = [
  {
    key: 'processGraph',
    label: '流程图',
  },
  {
    key: 'processData',
    label: '流程数据',
  },
];

const [Modal, modalApi] = useVbenModal({
  title: '流程查看',
  fullscreen: true,
  footer: false,
  onOpenChange: async (isOpen) => {
    if (isOpen) {
      const { id } = modalApi.getData();
      recordId.value = id;
      flowData.value = {};
      activeKey.value = 'processGraph';
      try {
        const data = await getProcessDefineDetailApi(id);
        flowData.value = data.jsonObject || {};
      } catch (error) {
        console.error(error);
      }
    }
  },
});

defineExpose({
  open: modalApi.open,
  setData: modalApi.setData,
});
</script>

<template>
  <div class="h-full w-full">
    <Modal>
      <div class="h-full w-full">
        <a-tabs v-model:active-key="activeKey" :items="tabItems">
          <template #contentRender="{ item }">
            <!-- 流程图标签页 -->
            <template v-if="item.key === 'processGraph'">
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
            <!-- 流程数据标签页 -->
            <template v-else-if="item.key === 'processData'">
              <div class="json-container">
                <pre>{{ JSON.stringify(flowData, null, 2) }}</pre>
              </div>
            </template>
          </template>
        </a-tabs>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.designer-container {
  height: calc(100vh - 120px);
  overflow: hidden;
}

.json-container {
  height: calc(100vh - 120px);
  padding: 16px;
  overflow-y: auto;
  background: #f5f5f5;
  border-radius: 4px;
}

.json-container pre {
  margin: 0;
  word-break: break-all;
  white-space: pre-wrap;
}
</style>
