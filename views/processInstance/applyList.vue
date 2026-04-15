<script lang="ts" setup>
import type { ProcessDesignTypeGroup } from '#/plugins/workflow/api/processDesign';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { listProcessDesignByTypeApi } from '#/plugins/workflow/api/processDesign';

import StartProcess from '../processDefine/startProcess.vue';

const dataSource = ref<ProcessDesignTypeGroup[]>([]);
const startProcessRef = ref();

const handleClick = (item: any) => {
  startProcessRef.value?.setData({ id: item.processDefineId });
  startProcessRef.value?.open();
};

onMounted(async () => {
  try {
    const data = await listProcessDesignByTypeApi();
    dataSource.value = data || [];
  } catch (error) {
    console.error(error);
  }
});
</script>

<template>
  <Page auto-content-height>
    <template v-for="group in dataSource" :key="group.type">
      <a-card v-if="group.items.length > 0" :title="group.title" class="mb-4">
        <a-row :gutter="[16, 16]">
          <a-col
            v-for="item in group.items"
            :key="item.id"
            :xs="12"
            :sm="8"
            :md="6"
            :lg="4"
            :xl="3"
          >
            <div class="process-item" @click="handleClick(item)">
              <div class="process-icon">
                <IconifyIcon
                  icon="ant-design:file-text-outlined"
                  class="text-3xl text-blue-500"
                />
              </div>
              <div class="process-name">
                {{ item.displayName || item.name }}
              </div>
            </div>
          </a-col>
        </a-row>
      </a-card>
    </template>
    <a-empty v-if="dataSource.length === 0" description="暂无可发起的流程" />
    <StartProcess ref="startProcessRef" />
  </Page>
</template>

<style scoped>
.process-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s;
}

.process-item:hover {
  background-color: #f5f5f5;
}

.process-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin-bottom: 8px;
}

.process-name {
  font-size: 14px;
  color: #333;
  text-align: center;
}
</style>
