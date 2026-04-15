<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { ProcessCCInstanceItem } from '#/plugins/workflow/api/processInstance';

import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  fetchCcProcessInstancePageApi,
  markCcAsReadApi,
} from '#/plugins/workflow/api/processInstance';

import { ccQuerySchema, useCcColumns } from './data';
import HistoryDrawer from './HistoryDrawer.vue';

const historyDrawerRef = ref();
const gridRef = ref();

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: {
    content: '查询',
  },
  schema: ccQuerySchema,
};

const gridOptions = reactive<VxeTableGridOptions<ProcessCCInstanceItem>>({
  rowConfig: {
    keyField: 'id',
  },
  checkboxConfig: {
    highlight: true,
  },
  height: 'auto',
  exportConfig: {},
  printConfig: {},
  toolbarConfig: {
    export: true,
    print: true,
    refresh: true,
    refreshOptions: {
      code: 'query',
    },
    custom: true,
    zoom: true,
  },
  columns: useCcColumns(),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await fetchCcProcessInstancePageApi({
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });
      },
    },
  },
});

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions,
  gridOptions,
});

async function handleDetail(row: ProcessCCInstanceItem) {
  // 标记为已读
  if (row.state === 0) {
    try {
      await markCcAsReadApi(row.id);
      // 刷新列表
      gridApi.grid?.commitProxy('query');
    } catch (error) {
      console.error('标记已读失败', error);
    }
  }
  // 打开详情
  historyDrawerRef.value?.setData({ instanceId: row.processInstanceId });
  historyDrawerRef.value?.open();
}
</script>

<template>
  <Page auto-content-height>
    <Grid ref="gridRef">
      <template #action="{ row }">
        <a style="color: #1677ff; cursor: pointer" @click="handleDetail(row)">
          详情
        </a>
      </template>
    </Grid>
    <HistoryDrawer ref="historyDrawerRef" />
  </Page>
</template>
