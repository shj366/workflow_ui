<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { ProcessInstanceItem } from '#/plugins/workflow/api/processInstance';

import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  fetchMyProcessInstancePageApi,
  withdrawProcessInstanceApi,
} from '#/plugins/workflow/api/processInstance';

import { querySchema, useColumns } from './data';
import HistoryDrawer from './HistoryDrawer.vue';

const historyDrawerRef = ref();

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: {
    content: '查询',
  },
  schema: querySchema,
};

const gridOptions = reactive<VxeTableGridOptions<ProcessInstanceItem>>({
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
  columns: useColumns(),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await fetchMyProcessInstancePageApi({
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

function handleDetail(row: ProcessInstanceItem) {
  historyDrawerRef.value?.setData({ instanceId: row.id });
  historyDrawerRef.value?.open();
}

async function handleWithdraw(row: ProcessInstanceItem) {
  try {
    await withdrawProcessInstanceApi([row.id]);
    message.success('撤回成功');
    gridApi.grid?.commitProxy('query');
  } catch {
    message.error('撤回失败');
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #action="{ row }">
        <a-space>
          <a style="color: #1677ff; cursor: pointer" @click="handleDetail(row)">
            详情
          </a>
          <a-popconfirm
            v-if="row.state === 10"
            title="确定要撤回该流程吗？"
            @confirm="handleWithdraw(row)"
          >
            <a style="color: #ff4d4f; cursor: pointer">撤回</a>
          </a-popconfirm>
        </a-space>
      </template>
    </Grid>
    <HistoryDrawer ref="historyDrawerRef" />
  </Page>
</template>
