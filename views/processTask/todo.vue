<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { ProcessTaskItem } from '#/plugins/workflow/api/processTask';

import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchTodoTaskPageApi } from '#/plugins/workflow/api/processTask';

import { querySchema, useColumns } from './data';
import TaskDrawer from './TaskDrawer.vue';
import Surrogate from './taskForm/surrogate.vue';

const taskDrawerRef = ref<InstanceType<typeof TaskDrawer>>();
const surrogateRef = ref<InstanceType<typeof Surrogate>>();

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
  columns: useColumns(),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await fetchTodoTaskPageApi({
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

function handleComplete(row: ProcessTaskItem) {
  taskDrawerRef.value?.setData({ task: row });
  taskDrawerRef.value?.open();
}

function handleSurrogate(row: ProcessTaskItem) {
  surrogateRef.value?.open(row);
}

function handleSuccess() {
  gridApi.reload();
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #action="{ row }">
        <a style="color: #1677ff; cursor: pointer" @click="handleComplete(row)">
          办理
        </a>
        <a
          style="margin-left: 12px; color: #1677ff; cursor: pointer"
          @click="handleSurrogate(row)"
        >
          委托
        </a>
      </template>
    </Grid>
    <TaskDrawer ref="taskDrawerRef" @success="handleSuccess" />
    <Surrogate ref="surrogateRef" @success="handleSuccess" />
  </Page>
</template>
