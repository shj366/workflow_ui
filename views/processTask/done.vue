<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { ProcessTaskItem } from '#/plugins/workflow/api/processTask';

import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchDoneTaskPageApi } from '#/plugins/workflow/api/processTask';

import { querySchema, useDoneColumns } from './data';
import TaskDrawer from './TaskDrawer.vue';

const taskDrawerRef = ref<InstanceType<typeof TaskDrawer>>();

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: {
    content: '查询',
  },
  schema: querySchema,
};

const gridOptions = reactive<VxeTableGridOptions<ProcessTaskItem>>({
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
  columns: useDoneColumns(),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await fetchDoneTaskPageApi({
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });
      },
    },
  },
});

const [Grid] = useVbenVxeGrid({
  formOptions,
  gridOptions,
});

async function handleDetail(row: ProcessTaskItem) {
  // 已办详情：复用任务办理抽屉，但不显示审批操作（在 TaskDrawer 内根据 taskState 控制）
  taskDrawerRef.value?.setData({ task: row });
  taskDrawerRef.value?.open();
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #action="{ row }">
        <a style="color: #1677ff; cursor: pointer" @click="handleDetail(row)">
          详情
        </a>
      </template>
    </Grid>
    <TaskDrawer ref="taskDrawerRef" />
  </Page>
</template>
