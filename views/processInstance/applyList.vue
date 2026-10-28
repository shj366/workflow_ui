<script lang="ts" setup>
import type { ProcessDesignTypeGroup } from '#/plugins/workflow/api/processDesign';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { listProcessDesignByTypeApi } from '#/plugins/workflow/api/processDesign';

import StartProcess from '../processDefine/startProcess.vue';

const dataSource = ref<ProcessDesignTypeGroup[]>([]);
const startProcessRef = ref();
const loadError = ref('');

const handleClick = (item: ProcessDesignTypeGroup['items'][number]) => {
  startProcessRef.value?.setData({ id: item.processDefineId });
  startProcessRef.value?.open();
};

onMounted(async () => {
  loadError.value = '';
  try {
    const data = await listProcessDesignByTypeApi();
    dataSource.value = (data || []).map((group) => {
      const type = String(group.type ?? '').trim();
      return {
        ...group,
        type,
        title: type || group.title || '默认分类',
        items: group.items.map((item) => ({
          ...item,
          type: String(item.type ?? type).trim(),
        })),
      };
    });
  } catch (error) {
    console.error(error);
    loadError.value =
      error instanceof Error ? error.message : '流程列表加载失败';
  }
});
</script>

<template>
  <Page auto-content-height>
    <a-alert
      v-if="loadError"
      class="mb-4"
      type="error"
      :message="loadError"
      show-icon
    />
    <template v-for="group in dataSource" :key="group.type">
      <a-card
        v-if="group.items.length > 0"
        :title="group.title"
        style="margin-bottom: 12px"
      >
        <a-row :gutter="[16, 16]">
          <a-col
            v-for="item in group.items"
            :key="item.id"
            :xs="24"
            :sm="8"
            :md="6"
            :lg="4"
            :xl="3"
          >
            <div class="process-item" @click="handleClick(item)">
              <div class="process-icon">
                <IconifyIcon
                  :icon="item.icon || 'ant-design:file-text-outlined'"
                  class="text-3xl text-blue-500"
                />
              </div>
              <div class="process-name">
                {{ item.displayName || item.name }}
              </div>
              <div class="process-version">版本 v{{ item.version }}</div>
            </div>
          </a-col>
        </a-row>
      </a-card>
    </template>
    <div
      v-if="!loadError && dataSource.length === 0"
      style="
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 400px;
      "
    >
      <a-empty v-if="dataSource.length === 0" description="暂无可发起的流程" />
    </div>
    <StartProcess ref="startProcessRef" />
  </Page>
</template>

<style scoped>
.process-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 112px;
  padding: 12px 8px;
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

.process-version {
  margin-top: 4px;
  font-size: 12px;
  color: #8c8c8c;
}

@media (max-width: 600px) {
  :deep(.ant-card-head) {
    min-height: 44px;
    padding: 0 12px;
  }

  :deep(.ant-card-body) {
    padding: 8px 12px;
  }

  .process-item {
    min-height: 104px;
  }
}
</style>
