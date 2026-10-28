<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { TabTypeValues } from './data';

import { computed, h, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { useMediaQuery } from '@vueuse/core';
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
import {
  ccReadStateOptions,
  getCcReadStateLabel,
  getProcessStateLabel,
  processStateOptions,
} from '../processInstance/data';
import TaskDrawer from '../processTask/TaskDrawer.vue';
import Surrogate from '../processTask/taskForm/surrogate.vue';
import { getColumns, getQuerySchema, TabType } from './data';
import Workbench from './workbench.vue';

const route = useRoute();
const ALL_TAB_VALUES = Object.values(TabType) as TabTypeValues[];
const getValidTab = (tab?: string): TabTypeValues =>
  ALL_TAB_VALUES.includes(tab as TabTypeValues)
    ? (tab as TabTypeValues)
    : TabType.WORKBENCH;

const activeTab = ref<TabTypeValues>(getValidTab(route.query.tab as string));
const isMobile = useMediaQuery('(max-width: 767px)');
const mobileRows = ref<any[]>([]);
const mobileTotal = ref(0);
const mobileLoading = ref(false);
const mobileError = ref('');
const mobileFiltersExpanded = ref(false);
const mobileFilters = reactive({
  taskName: '',
  displayName: '',
  businessNo: '',
  state: undefined as number | undefined,
});

// Refs for drawers/modals
const workbenchRef = ref();
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

async function loadMobilePage(page = 1) {
  if (activeTab.value === TabType.WORKBENCH) return;

  mobileLoading.value = true;
  mobileError.value = '';
  try {
    const state = tabStates[activeTab.value];
    const pageSize = state?.pagination.pageSize ?? 20;
    const params = { page, size: pageSize };
    let result;

    switch (activeTab.value) {
      case TabType.TODO: {
        result = await fetchTodoTaskPageApi({
          ...params,
          taskName: mobileFilters.taskName,
          displayName: mobileFilters.displayName,
        });
        break;
      }
      case TabType.DONE: {
        result = await fetchDoneTaskPageApi({
          ...params,
          taskName: mobileFilters.taskName,
          displayName: mobileFilters.displayName,
        });
        break;
      }
      case TabType.MY_INITIATED: {
        result = await fetchMyProcessInstancePageApi({
          ...params,
          displayName: mobileFilters.displayName,
          businessNo: mobileFilters.businessNo,
          state: mobileFilters.state,
        });
        break;
      }
      case TabType.CC: {
        result = await fetchCcProcessInstancePageApi({
          ...params,
          state: mobileFilters.state,
        });
        break;
      }
      default: {
        throw new Error(`不支持的工作中心页签: ${activeTab.value}`);
      }
    }

    mobileRows.value = result.items;
    mobileTotal.value = result.total;
    if (state) {
      state.pagination.currentPage = page;
      state.formValues = { ...mobileFilters };
    }
  } catch (error) {
    mobileRows.value = [];
    mobileTotal.value = 0;
    mobileError.value =
      error instanceof Error ? error.message : '工作列表加载失败';
  } finally {
    mobileLoading.value = false;
  }
}

function applyMobileFilters() {
  mobileFiltersExpanded.value = false;
  void loadMobilePage(1);
}

function resetMobileFilters() {
  mobileFilters.taskName = '';
  mobileFilters.displayName = '';
  mobileFilters.businessNo = '';
  mobileFilters.state = undefined;
  mobileFiltersExpanded.value = false;
  void loadMobilePage(1);
}

function mobileTitle(row: any) {
  return (
    row.instanceExt?.autoGenTitle ||
    row.ext?.autoGenTitle ||
    row.displayName ||
    row.taskName ||
    row.businessNo ||
    '未命名流程'
  );
}

function mobileSummary(row: any) {
  return row.instanceExt?.f_title || row.ext?.f_title || row.summary || '';
}

function mobileTime(value?: string) {
  return value ? value.replace('T', ' ').slice(0, 16) : '-';
}

function refreshCurrentList() {
  if (isMobile.value) {
    void loadMobilePage(tabStates[activeTab.value]?.pagination.currentPage);
  } else {
    gridApi.query();
  }
}

onMounted(() => {
  if (activeTab.value !== TabType.WORKBENCH)
    void handleTabChange(activeTab.value);
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
  if (newTab === TabType.WORKBENCH) {
    await nextTick();
    workbenchRef.value?.reload();
    return;
  }

  if (isMobile.value) {
    const cachedState = tabStates[newTab];
    Object.assign(
      mobileFilters,
      {
        taskName: '',
        displayName: '',
        businessNo: '',
        state: undefined,
      },
      cachedState?.formValues,
    );
    await loadMobilePage(cachedState?.pagination.currentPage ?? 1);
    return;
  }

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

function handleWorkbenchGoto(tab: 'cc' | 'done' | 'my_initiated' | 'todo') {
  activeTab.value = tab;
  void handleTabChange(tab);
}

function handleWorkbenchTask(task: any) {
  taskDrawerRef.value?.setData({ task });
  taskDrawerRef.value?.open();
}

function handleWorkbenchInstance(instanceId: string) {
  historyDrawerRef.value?.setData({ instanceId });
  historyDrawerRef.value?.open();
}

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
    refreshCurrentList();
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
      refreshCurrentList();
    } catch (error) {
      console.error('标记已读失败', error);
    }
  }
  historyDrawerRef.value?.setData({ instanceId: row.processInstanceId });
  historyDrawerRef.value?.open();
}

function handleSuccess() {
  refreshCurrentList();
}

watch(isMobile, async (mobile) => {
  if (activeTab.value === TabType.WORKBENCH) return;
  if (mobile) {
    await loadMobilePage(tabStates[activeTab.value]?.pagination.currentPage);
    return;
  }
  await nextTick();
  await handleTabChange(activeTab.value);
});

// Tab items for Ant Design Vue 4.x
const tabItems = computed(() => [
  {
    key: TabType.WORKBENCH,
    label: () =>
      h('span', { class: 'flex items-center' }, [
        h(IconifyIcon, {
          icon: 'ant-design:home-outlined',
          class: 'mr-1',
        }),
        '工作台',
      ]),
  },
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
          class="workflow-center-tabs"
          v-model:active-key="activeTab"
          size="middle"
          @change="handleTabChange"
          :tab-bar-style="{ margin: 0, border: 'none' }"
          type="card"
          :items="tabItems"
        />
      </div>
      <div
        class="workflow-center-grid min-h-0 flex-1 overflow-auto rounded-tr-lg"
      >
        <Workbench
          v-if="activeTab === TabType.WORKBENCH"
          ref="workbenchRef"
          @goto="handleWorkbenchGoto"
          @open-task="handleWorkbenchTask"
          @open-instance="handleWorkbenchInstance"
        />
        <Transition v-else name="workflow-center-fade">
          <div v-if="isMobile" class="mobile-task-list">
            <div class="mobile-filter-toolbar">
              <a-button
                :aria-expanded="mobileFiltersExpanded"
                @click="mobileFiltersExpanded = !mobileFiltersExpanded"
              >
                <IconifyIcon icon="ant-design:filter-outlined" />
                筛选
              </a-button>
              <span>{{ mobileTotal }} 条</span>
            </div>
            <a-form
              v-if="mobileFiltersExpanded"
              class="mobile-task-filters"
              layout="vertical"
            >
              <a-form-item
                v-if="activeTab === TabType.TODO || activeTab === TabType.DONE"
                label="任务编码"
              >
                <a-input
                  v-model:value="mobileFilters.taskName"
                  placeholder="请输入任务编码"
                  allow-clear
                />
              </a-form-item>
              <a-form-item
                v-if="activeTab === TabType.TODO || activeTab === TabType.DONE"
                label="任务名称"
              >
                <a-input
                  v-model:value="mobileFilters.displayName"
                  placeholder="请输入任务名称"
                  allow-clear
                />
              </a-form-item>
              <a-form-item
                v-if="activeTab === TabType.MY_INITIATED"
                label="流程名称"
              >
                <a-input
                  v-model:value="mobileFilters.displayName"
                  placeholder="请输入流程名称"
                  allow-clear
                />
              </a-form-item>
              <a-form-item
                v-if="activeTab === TabType.MY_INITIATED"
                label="业务单号"
              >
                <a-input
                  v-model:value="mobileFilters.businessNo"
                  placeholder="请输入业务单号"
                  allow-clear
                />
              </a-form-item>
              <a-form-item
                v-if="
                  activeTab === TabType.MY_INITIATED || activeTab === TabType.CC
                "
                :label="activeTab === TabType.CC ? '阅读状态' : '流程状态'"
              >
                <a-select
                  v-model:value="mobileFilters.state"
                  allow-clear
                  placeholder="全部状态"
                  :options="
                    activeTab === TabType.CC
                      ? ccReadStateOptions
                      : processStateOptions
                  "
                />
              </a-form-item>
              <div class="mobile-filter-actions">
                <a-button type="primary" @click="applyMobileFilters"
                  >查询</a-button
                >
                <a-button @click="resetMobileFilters">重置</a-button>
              </div>
            </a-form>

            <a-alert
              v-if="mobileError"
              class="mb-3"
              type="error"
              :message="mobileError"
              show-icon
            />
            <a-spin :spinning="mobileLoading">
              <div v-if="mobileRows.length" class="mobile-task-cards">
                <a-card
                  v-for="row in mobileRows"
                  :key="row.id"
                  size="small"
                  class="mobile-task-card"
                >
                  <div class="mobile-task-heading">
                    <div class="mobile-task-title">{{ mobileTitle(row) }}</div>
                    <a-tag
                      v-if="activeTab === TabType.MY_INITIATED"
                      color="blue"
                    >
                      {{ getProcessStateLabel(row.state) }}
                    </a-tag>
                    <a-tag
                      v-else-if="activeTab === TabType.CC"
                      :color="row.state === 0 ? 'orange' : 'default'"
                    >
                      {{ getCcReadStateLabel(row.state) }}
                    </a-tag>
                  </div>
                  <div v-if="mobileSummary(row)" class="mobile-task-summary">
                    {{ mobileSummary(row) }}
                  </div>
                  <div class="mobile-task-meta">
                    <template
                      v-if="
                        activeTab === TabType.TODO || activeTab === TabType.DONE
                      "
                    >
                      <span
                        >当前节点：{{
                          row.displayName || row.taskName || '-'
                        }}</span
                      >
                      <span
                        >发起人：{{ row.instanceExt?.u_realName || '-' }}</span
                      >
                      <span
                        >发起时间：{{
                          mobileTime(row.instanceCreateTime)
                        }}</span
                      >
                      <span
                        >{{
                          activeTab === TabType.TODO ? '待办时间' : '完成时间'
                        }}：{{
                          mobileTime(
                            activeTab === TabType.TODO
                              ? row.createdTime
                              : row.finishTime,
                          )
                        }}</span
                      >
                    </template>
                    <template v-else-if="activeTab === TabType.MY_INITIATED">
                      <span
                        >流程：{{
                          row.displayName || row.defineName || '-'
                        }}</span
                      >
                      <span>业务单号：{{ row.businessNo || '-' }}</span>
                      <span
                        >发起时间：{{
                          mobileTime(row.createdTime || row.createTime)
                        }}</span
                      >
                    </template>
                    <template v-else>
                      <span
                        >发起人：{{
                          row.instanceExt?.u_realName || row.operator || '-'
                        }}</span
                      >
                      <span
                        >流程状态：{{
                          getProcessStateLabel(row.processState)
                        }}</span
                      >
                      <span
                        >发起时间：{{
                          mobileTime(row.instanceCreateTime)
                        }}</span
                      >
                      <span>抄送时间：{{ mobileTime(row.createTime) }}</span>
                    </template>
                  </div>
                  <div class="mobile-task-actions">
                    <template v-if="activeTab === TabType.TODO">
                      <a-button
                        type="primary"
                        @click="handleTodoAction('handle', row)"
                        >办理</a-button
                      >
                      <a-button @click="handleTodoAction('surrogate', row)"
                        >委托</a-button
                      >
                    </template>
                    <a-button
                      v-else-if="activeTab === TabType.DONE"
                      @click="handleDoneAction(row)"
                    >
                      详情
                    </a-button>
                    <template v-else-if="activeTab === TabType.MY_INITIATED">
                      <a-button @click="handleMyAction('detail', row)"
                        >详情</a-button
                      >
                      <a-popconfirm
                        v-if="row.state === 10"
                        title="确定要撤回该流程吗？"
                        @confirm="handleMyAction('withdraw', row)"
                      >
                        <a-button danger>撤回</a-button>
                      </a-popconfirm>
                    </template>
                    <a-button v-else @click="handleCcAction(row)"
                      >查看流程</a-button
                    >
                  </div>
                </a-card>
              </div>
              <a-empty
                v-else-if="!mobileError && !mobileLoading"
                description="暂无记录"
              />
            </a-spin>
            <a-pagination
              v-if="mobileTotal > 0"
              class="mobile-task-pagination"
              :current="tabStates[activeTab]?.pagination.currentPage"
              :page-size="tabStates[activeTab]?.pagination.pageSize"
              :total="mobileTotal"
              :show-size-changer="false"
              :show-total="(total: number) => `共 ${total} 条`"
              @change="loadMobilePage"
            />
          </div>
          <Grid v-else>
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

@media (max-width: 767px) {
  .workflow-center-tabs {
    overflow: hidden;
  }

  :deep(.workflow-center-tabs > .ant-tabs-nav) {
    margin-bottom: 0;
  }

  :deep(.workflow-center-tabs .ant-tabs-nav-wrap) {
    overflow-x: auto;
    scrollbar-width: none;
  }

  :deep(.workflow-center-tabs .ant-tabs-nav-wrap::-webkit-scrollbar) {
    display: none;
  }

  :deep(.workflow-center-tabs .ant-tabs-tab) {
    padding: 8px 10px;
    white-space: nowrap;
  }

  :deep(.workflow-center-grid .vxe-toolbar) {
    flex-wrap: wrap;
  }
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

.mobile-task-list {
  padding: 12px;
}

.mobile-task-filters {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 10px;
  margin-bottom: 12px;
  padding: 10px 12px;
  background: var(--color-background, #fff);
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.mobile-filter-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #6b7280;
  font-size: 12px;
}

.mobile-task-filters :deep(.ant-form-item) {
  min-width: 0;
  margin-bottom: 6px;
}

.mobile-task-filters :deep(.ant-form-item-label) {
  padding-bottom: 2px;
}

.mobile-filter-actions {
  grid-column: 1 / -1;
}

.mobile-filter-actions,
.mobile-task-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mobile-task-cards {
  display: grid;
  gap: 10px;
}

.mobile-task-heading {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  justify-content: space-between;
}

.mobile-task-title {
  min-width: 0;
  font-weight: 600;
  overflow-wrap: anywhere;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.mobile-task-summary {
  display: -webkit-box;
  margin-top: 4px;
  color: #6b7280;
  overflow: hidden;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.mobile-task-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 3px 10px;
  margin: 7px 0;
  color: #6b7280;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.mobile-task-meta > span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-task-card :deep(.ant-card-body) {
  padding: 10px 12px;
}

.mobile-task-pagination {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 16px;
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
