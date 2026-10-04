<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type {
  ProcessDefineItem,
  ProcessDefinePageResult,
} from '#/plugins/workflow/api/processDefine';

import { reactive, ref } from 'vue';

import { Modal, message } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  fetchProcessDefinePageApi,
  upAndDownProcessDefineApi,
} from '#/plugins/workflow/api/processDefine';

import { querySchema, useColumns } from './data';
import ProcessViewer from './design.vue';
import StartProcess from './startProcess.vue';

const viewerRef = ref();
const startProcessRef = ref();
function buildVersionTree(items: ProcessDefineItem[]): ProcessDefineItem[] {
  const groups = new Map<string, ProcessDefineItem>();
  const rows: ProcessDefineItem[] = [];
  for (const item of items) {
    const key = `${item.name}\u0000${item.type || ''}\u0000${item.displayName || item.display_name || ''}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        ...item,
        id: `group:${key}`,
        isVersionGroup: true,
        parentId: undefined,
        children: undefined,
      };
      groups.set(key, group);
      group.versionCount = 0;
      rows.push(group);
    }
    group.versionCount = (group.versionCount || 0) + 1;
    rows.push({
      ...item,
      parentId: group.id,
      children: undefined,
      isVersionGroup: false,
    });
  }
  return rows;
}

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: {
    content: '查询',
  },
  schema: querySchema,
};

const gridOptions = reactive<VxeTableGridOptions<ProcessDefineItem>>({
  rowConfig: {
    keyField: 'id',
  },
  treeConfig: {
    parentField: 'parentId',
    transform: true,
    expandAll: true,
    reserve: true,
    showLine: true,
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
        const result = await fetchProcessDefinePageApi({
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });
        return {
          ...result,
          items: buildVersionTree(result.items),
        } satisfies ProcessDefinePageResult;
      },
    },
  },
});

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions,
  gridOptions,
});
function expandAll() {
  gridApi.grid?.setAllTreeExpand(true);
}

function collapseAll() {
  gridApi.grid?.setAllTreeExpand(false);
}

function getFlowDisplayName(row: ProcessDefineItem) {
  return row.display_name || row.displayName || row.name || `#${row.id}`;
}

async function handleView(row: ProcessDefineItem) {
  viewerRef.value?.setData({ id: row.id });
  viewerRef.value?.open();
}

async function handleStart(row: ProcessDefineItem) {
  if (row.state === 0) {
    message.warning('该流程已禁用，无法发起');
    return;
  }

  startProcessRef.value?.setData({ id: row.id });
  startProcessRef.value?.open();
}

async function handleUpAndDown(row: ProcessDefineItem) {
  const newState = row.state === 1 ? 0 : 1;
  const actionText = newState === 1 ? '启用' : '禁用';

  Modal.confirm({
    title: `确认${actionText}`,
    content: `确定要${actionText}流程【${getFlowDisplayName(row)}】吗？`,
    onOk: async () => {
      try {
        await upAndDownProcessDefineApi({
          ids: [row.id],
          opType: newState,
        });
        message.success(`${actionText}成功`);
        gridApi.grid.commitProxy('query');
      } catch (error) {
        console.error(error);
      }
    },
  });
}

function getMoreMenuItems(row: ProcessDefineItem) {
  return [
    {
      key: 'start',
      label: '发起',
      disabled: row.state === 0,
    },
    ...(row.state === 0 ? [{ key: 'enable', label: '启用' }] : []),
    ...(row.state === 1 ? [{ key: 'disable', label: '禁用' }] : []),
  ];
}

function handleMoreAction(key: string, row: ProcessDefineItem) {
  if (key === 'start') {
    void handleStart(row);
    return;
  }

  if (key === 'enable' || key === 'disable') {
    void handleUpAndDown(row);
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <a-button class="mr-2" @click="expandAll">展开全部</a-button>
        <a-button @click="collapseAll">折叠全部</a-button>
      </template>
      <template #name="{ row }">
        {{ row.isVersionGroup ? row.name : '' }}
      </template>
      <template #displayName="{ row }">
        {{ row.isVersionGroup ? row.displayName || row.display_name : '' }}
      </template>
      <template #type="{ row }">
        {{ row.isVersionGroup ? row.type : '' }}
      </template>
      <template #version="{ row }">
        {{ row.isVersionGroup ? '' : `v${row.version}` }}
      </template>
      <template #state="{ row }">
        <a-tag v-if="!row.isVersionGroup" :color="row.state === 1 ? 'success' : 'error'">
          {{ row.state === 1 ? '可用' : '禁用' }}
        </a-tag>
      </template>
      <template #remark="{ row }">
        {{ row.isVersionGroup ? '' : row.remark || '' }}
      </template>
      <template #action="{ row }">
        <template v-if="row.isVersionGroup">
          <span class="text-gray-500">{{ row.versionCount || 0 }} 个版本</span>
        </template>
        <template v-else>
          <a
            style="margin-right: 8px; color: #1677ff; cursor: pointer"
            @click="handleView(row)"
          >
            查看
          </a>
          <a-dropdown
            :menu="{
              items: getMoreMenuItems(row),
              onClick: ({ key }) => handleMoreAction(key as string, row),
            }"
          >
            <a style="color: #1677ff; cursor: pointer" @click.prevent> 更多 </a>
          </a-dropdown>
        </template>
      </template>
    </Grid>

    <div class="hidden">
      <ProcessViewer ref="viewerRef" />
      <StartProcess ref="startProcessRef" />
    </div>
  </Page>
</template>
