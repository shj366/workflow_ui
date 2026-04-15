<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { TabTypeValues } from './data';

import { computed, h, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  fetchCcProcessInstancePageApi,
  fetchMyProcessInstancePageApi,
  markCcAsReadApi,
  withdrawProcessInstanceApi,
} from '#/plugins/workflow/api/processInstance';
import {
  fetchDoneTaskPageApi,
  fetchTodoTaskPageApi,
} from '#/plugins/workflow/api/processTask';

import HistoryDrawer from '../processInstance/HistoryDrawer.vue';
import TaskDrawer from '../processTask/TaskDrawer.vue';
import Surrogate from '../processTask/taskForm/surrogate.vue';
import { getColumns, getQuerySchema, TabType } from './data';

const route = useRoute();
const ALL_TAB_VALUES = Object.values(TabType) as TabTypeValues[];
const getValidTab = (tab?: string): TabTypeValues =>
  ALL_TAB_VALUES.includes(tab as TabTypeValues)
    ? (tab as TabTypeValues)
    : TabType.TODO;

const activeTab = ref<TabTypeValues>(getValidTab(route.query.tab as string));

// Refs for drawers/modals
const taskDrawerRef = ref();
const surrogateRef = ref();
const historyDrawerRef = ref();

// State cache
interface TabState {
  formValues: Record<string, any>;
  pagination: { currentPage: number; pageSize: number };
}

const tabStates = reactive<Record<string, TabState>>({
  [TabType.TODO]: {
    formValues: {},
    pagination: { currentPage: 1, pageSize: 20 },
  },
  [TabType.DONE]: {
    formValues: {},
    pagination: { currentPage: 1, pageSize: 20 },
  },
  [TabType.MY_INITIATED]: {
    formValues: {},
    pagination: { currentPage: 1, pageSize: 20 },
  },
  [TabType.CC]: {
    formValues: {},
    pagination: { currentPage: 1, pageSize: 20 },
  },
});

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: {
    content: '查询',
  },
  schema: getQuerySchema(TabType.TODO),
};

const gridOptions: VxeTableGridOptions = {
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
  columns: getColumns(TabType.TODO),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        // Update cache
        const currentState = tabStates[activeTab.value];
        if (currentState) {
          currentState.pagination = {
            currentPage: page.currentPage,
            pageSize: page.pageSize,
          };
          currentState.formValues = formValues;
        }

        const params = {
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
        };

        switch (activeTab.value) {
          case TabType.CC: {
            return await fetchCcProcessInstancePageApi(params);
          }
          case TabType.DONE: {
            return await fetchDoneTaskPageApi(params);
          }
          case TabType.MY_INITIATED: {
            return await fetchMyProcessInstancePageApi(params);
          }
          case TabType.TODO: {
            return await fetchTodoTaskPageApi(params);
          }
          default: {
            return { items: [], total: 0 };
          }
        }
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions,
  gridOptions,
  separator: { backgroundColor: '#ededed' },
});

onMounted(() => {
  handleTabChange(activeTab.value);
});

watch(
  () => route.query.tab,
  (tab) => {
    const nextTab = getValidTab(tab as string);
    if (nextTab !== activeTab.value) {
      activeTab.value = nextTab;
      handleTabChange(nextTab);
    }
  },
);

// Tab Switch Handler
const handleTabChange = async (key: any) => {
  const newTab = key as TabTypeValues;

  // 1. Update Columns
  gridApi.grid.loadColumn(getColumns(newTab) || []);

  // 2. Update Form Schema
  const gridFormApi = gridApi.formApi;
  if (gridFormApi) {
    await gridFormApi.setState({ schema: getQuerySchema(newTab) });

    // Restore filters
    const cachedState = tabStates[newTab];
    if (cachedState) {
      await gridFormApi.setValues(cachedState.formValues);
    }
  }

  // 3. Restore Pagination and Reload
  const cachedState = tabStates[newTab];
  if (cachedState) {
    await nextTick();
    gridApi.query({
      page: {
        currentPage: cachedState.pagination.currentPage,
        pageSize: cachedState.pagination.pageSize,
      },
    });
  }
};

// Action Handlers
function handleTodoAction(type: 'handle' | 'surrogate', row: any) {
  if (type === 'handle') {
    taskDrawerRef.value?.setData({ task: row });
    taskDrawerRef.value?.open();
  } else {
    surrogateRef.value?.open(row);
  }
}

function handleDoneAction(row: any) {
  // Reuse task drawer for details, adjust logic inside drawer if needed or just show as is
  taskDrawerRef.value?.setData({ task: row });
  taskDrawerRef.value?.open();
}

function handleMyAction(type: 'detail' | 'withdraw', row: any) {
  if (type === 'detail') {
    historyDrawerRef.value?.setData({ instanceId: row.id });
    historyDrawerRef.value?.open();
  } else if (type === 'withdraw') {
    handleWithdraw(row);
  }
}

async function handleWithdraw(row: any) {
  try {
    await withdrawProcessInstanceApi([row.id]);
    message.success('撤回成功');
    gridApi.query();
  } catch {
    message.error('撤回失败');
  }
}

async function handleCcAction(row: any) {
  // Mark as read if unread (state === 0)
  if (row.state === 0) {
    try {
      await markCcAsReadApi(row.id);
      // Ideally refresh the row or grid, but full refresh might be too heavy.
      // For now, we let it be or refresh.
      gridApi.query();
    } catch (error) {
      console.error('标记已读失败', error);
    }
  }
  historyDrawerRef.value?.setData({ instanceId: row.processInstanceId });
  historyDrawerRef.value?.open();
}

function handleSuccess() {
  gridApi.reload();
}

// Tab items for Ant Design Vue 4.x
const tabItems = computed(() => [
  {
    key: TabType.TODO,
    label: () =>
      h('span', { class: 'flex items-center' }, [
        h(IconifyIcon, {
          icon: 'ant-design:field-time-outlined',
          class: 'mr-1',
        }),
        '待办任务',
      ]),
  },
  {
    key: TabType.DONE,
    label: () =>
      h('span', { class: 'flex items-center' }, [
        h(IconifyIcon, {
          icon: 'ant-design:carry-out-outlined',
          class: 'mr-1',
        }),
        '已办任务',
      ]),
  },
  {
    key: TabType.MY_INITIATED,
    label: () =>
      h('span', { class: 'flex items-center' }, [
        h(IconifyIcon, {
          icon: 'ant-design:user-switch-outlined',
          class: 'mr-1',
        }),
        '我发起的',
      ]),
  },
  {
    key: TabType.CC,
    label: () =>
      h('span', { class: 'flex items-center' }, [
        h(IconifyIcon, { icon: 'ant-design:mail-outlined', class: 'mr-1' }),
        '抄送给我',
      ]),
  },
]);
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full flex-col">
      <div class="">
        <!-- bg-card rounded-t-lg px-12 -->
        <a-tabs
          v-model:active-key="activeTab"
          size="middle"
          @change="handleTabChange"
          :tab-bar-style="{ margin: 0, border: 'none' }"
          type="card"
          :items="tabItems"
        />
      </div>
      <div class="workflow-center-grid flex-1 overflow-hidden rounded-tr-lg">
        <Transition name="workflow-center-fade">
          <Grid>
            <template #action="{ row }">
              <!-- Todo Actions -->
              <template v-if="activeTab === TabType.TODO">
                <a-space>
                  <a
                    class="cursor-pointer text-primary"
                    @click="handleTodoAction('handle', row)"
                  >
                    办理
                  </a>
                  <a
                    class="cursor-pointer text-primary"
                    @click="handleTodoAction('surrogate', row)"
                  >
                    委托
                  </a>
                </a-space>
              </template>

              <!-- Done Actions -->
              <template v-if="activeTab === TabType.DONE">
                <a
                  class="cursor-pointer text-primary"
                  @click="handleDoneAction(row)"
                >
                  详情
                </a>
              </template>

              <!-- My Initiated Actions -->
              <template v-if="activeTab === TabType.MY_INITIATED">
                <a-space>
                  <a
                    class="cursor-pointer text-primary"
                    @click="handleMyAction('detail', row)"
                  >
                    详情
                  </a>
                  <a-popconfirm
                    v-if="row.state === 10"
                    title="确定要撤回该流程吗？"
                    @confirm="handleMyAction('withdraw', row)"
                  >
                    <a class="cursor-pointer text-red-500">撤回</a>
                  </a-popconfirm>
                </a-space>
              </template>

              <!-- CC Actions -->
              <template v-if="activeTab === TabType.CC">
                <a
                  class="cursor-pointer text-primary"
                  @click="handleCcAction(row)"
                >
                  详情
                </a>
              </template>
            </template>
          </Grid>
        </Transition>
      </div>
    </div>

    <!-- Components -->
    <TaskDrawer ref="taskDrawerRef" @success="handleSuccess" />
    <Surrogate ref="surrogateRef" @success="handleSuccess" />
    <HistoryDrawer ref="historyDrawerRef" />
  </Page>
</template>

<style scoped>
:deep(.workflow-center-grid .bg-background-deep) {
  height: 0 !important;
}

:deep(.workflow-center-grid .relative.rounded.py-3) {
  padding-bottom: 0.25rem !important;
}

:deep(.workflow-center-grid .bg-card) {
  border-top-left-radius: 0 !important;
  border-top-right-radius: 0 !important;
}

/* Grid 内容切换动画：淡入 + 轻微上移 */
.workflow-center-fade-enter-active,
.workflow-center-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.workflow-center-fade-enter-from,
.workflow-center-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

/* 去掉 Tabs card 类型标签的圆角（边框后面单独控制） */
:deep(.ant-tabs-card > .ant-tabs-nav .ant-tabs-nav-list > .ant-tabs-tab) {
  border-radius: 0 !important;
}

/* 第一个标签：左侧圆角（在 nav-list 里的第一个 tab） */
:deep(
  .ant-tabs-card > .ant-tabs-nav .ant-tabs-nav-list > .ant-tabs-tab:first-child
) {
  border-top-left-radius: 0.5rem !important;
}

/* 最后一个标签：右侧圆角
 * AntD 结构里，nav-list 的最后一个 child 是 ink-bar，
 * 真正的最后一个 tab 通常是倒数第二个，所以用 nth-last-child(2)
 */
:deep(
  .ant-tabs-card
    > .ant-tabs-nav
    .ant-tabs-nav-list
    > .ant-tabs-tab:nth-last-child(2)
) {
  border-top-right-radius: 0.5rem !important;
}

/* 去掉 Tabs 容器顶部边框，避免空白线条 */
:deep(.ant-tabs-card > .ant-tabs-nav) {
  margin: 0;
}

/* 内容区域与标签对齐，避免 card 风格多余边框影响 */
:deep(.ant-tabs-card > .ant-tabs-content-holder) {
  border: none !important;
}

/* 去掉 Tabs 标签下面的整条横向边框线 */
:deep(.ant-tabs-top.ant-tabs-card > .ant-tabs-nav::before),
:deep(.ant-tabs-top > .ant-tabs-nav::before) {
  border-bottom: none !important;
}

/* Tabs 未选中状态：文字稍淡，浅灰边框 + 轻微阴影，不需要下边线 */
:deep(.ant-tabs-card > .ant-tabs-nav .ant-tabs-tab) {
  position: relative;
  color: rgb(0 0 0 / 65%);
  background-color: #fff !important;
  border: none !important;
  box-shadow: 0 1px 3px rgb(0 0 0 / 6%);
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

/* Tabs 下划线动画：默认收起，从中间展开 */
:deep(.ant-tabs-card > .ant-tabs-nav .ant-tabs-tab)::after {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 100%;
  height: 2px;
  content: '';
  background-color: hsl(var(--primary));
  transform: translateX(-50%) scaleX(0);
  transform-origin: center;
  transition: transform 0.2s ease;
}

/* 相邻标签之间：去掉水平间隔，改为在后一个标签的左侧画竖线 */
:deep(.ant-tabs-card > .ant-tabs-nav .ant-tabs-tab + .ant-tabs-tab) {
  margin-left: 0;
}

/* 标签之间的竖线分隔：用 ::before 画细线，只作用于除了第一个以外的标签左侧 */
:deep(.ant-tabs-card > .ant-tabs-nav .ant-tabs-tab + .ant-tabs-tab)::before {
  position: absolute;
  top: 25%;
  bottom: 25%;
  left: 0;
  width: 1px;
  content: '';
  background-color: rgb(0 0 0 / 20%);
}

/* Tabs 悬停时：颜色稍亮，仍然无边框背景 */
:deep(.ant-tabs-card > .ant-tabs-nav .ant-tabs-tab:hover) {
  color: hsl(var(--primary));
}

/* Tabs 选中状态：白色背景、主色文字、半粗体、浅灰边框 + 底部高亮线 */
:deep(.ant-tabs-card > .ant-tabs-nav .ant-tabs-tab-active) {
  font-weight: 400;
  color: hsl(var(--primary));
  background-color: #fff !important;
  border-color: #d9d9d9;
  box-shadow: 0 1px 3px rgb(0 0 0 / 6%);
  transform: translateY(-1px);
}

/* 选中状态：让下划线展开显示 */
:deep(.ant-tabs-card > .ant-tabs-nav .ant-tabs-tab-active)::after {
  transform: translateX(-50%) scaleX(1);
}
</style>
