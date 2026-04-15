<script lang="ts" setup>
import { ref } from 'vue';

import SnakerFlowDesigner from '#/plugins/workflow/components/SnakerFlowDesigner';

import { getProcessDefineDetailApi } from '#/plugins/workflow/api/processDefine';

const visible = ref(false);
const activeKey = ref('processGraph');
const flowData = ref<any>({});
const currentRecord = ref<any>(null);

async function open(record: any) {
  currentRecord.value = record;
  visible.value = true;
  activeKey.value = 'processGraph';

  try {
    const data = await getProcessDefineDetailApi(record.id);
    flowData.value = data?.jsonObject || {};
  } catch (error) {
    console.error('Failed to load process define:', error);
    flowData.value = {};
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
  <a-modal
    v-model:open="visible"
    title="流程预览"
    width="80%"
    :footer="null"
    destroy-on-close
    @cancel="handleCancel"
  >
    <a-tabs v-model:active-key="activeKey">
      <a-tab-pane key="processGraph" tab="流程图">
        <div class="preview-container">
          <SnakerFlowDesigner
            v-if="visible && activeKey === 'processGraph'"
            v-model="flowData"
            :show-doc="false"
            :viewer="true"
            node-render-type="html"
            :wf-config="{
              showHelp: false,
            }"
          />
        </div>
      </a-tab-pane>
      <a-tab-pane key="processData" tab="流程数据">
        <div class="preview-container overflow-auto">
          <pre class="rounded bg-gray-50 p-4 text-xs">{{
            JSON.stringify(flowData, null, 2)
          }}</pre>
        </div>
      </a-tab-pane>
    </a-tabs>
  </a-modal>
</template>

<style scoped>
.preview-container {
  height: calc(100vh - 200px);
  overflow-y: auto;
}
</style>
