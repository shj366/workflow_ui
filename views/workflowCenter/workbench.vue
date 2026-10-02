<script lang="ts" setup>
import type { ProcessTaskItem } from '#/plugins/workflow/api/processTask';

import { onMounted, reactive, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import {
  fetchCcProcessInstancePageApi,
  fetchMyProcessInstancePageApi,
} from '#/plugins/workflow/api/processInstance';
import {
  fetchDoneTaskPageApi,
  fetchTodoTaskPageApi,
} from '#/plugins/workflow/api/processTask';

const emit = defineEmits<{
  goto: [tab: 'todo' | 'done' | 'my_initiated' | 'cc'];
  openTask: [task: ProcessTaskItem];
  openInstance: [instanceId: string];
}>();

const loading = ref(false);
const loadError = ref('');
const recentTasks = ref<ProcessTaskItem[]>([]);
const recentDoneTasks = ref<ProcessTaskItem[]>([]);

const cards = reactive([
  {
    id: 'todo',
    route: 'todo' as const,
    label: '待办任务',
    description: '需要你处理',
    badge: '优先处理',
    icon: 'ant-design:clock-circle-filled',
    tone: 'blue',
    count: null as number | null,
  },
  {
    id: 'unread-cc',
    route: 'cc' as const,
    label: '未读抄送',
    description: '待查看消息',
    badge: '未读',
    icon: 'ant-design:bell-filled',
    tone: 'orange',
    count: null as number | null,
  },
  {
    id: 'active-mine',
    route: 'my_initiated' as const,
    label: '进行中流程',
    description: '我发起的流程',
    badge: '跟进中',
    icon: 'ant-design:sync-outlined',
    tone: 'purple',
    count: null as number | null,
  },
  {
    id: 'completed-mine',
    route: 'my_initiated' as const,
    label: '已完成流程',
    description: '我发起的流程',
    badge: '已完成',
    icon: 'ant-design:check-square-filled',
    tone: 'green',
    count: null as number | null,
  },
  {
    id: 'done',
    route: 'done' as const,
    label: '已办任务',
    description: '我的审批记录',
    badge: '历史记录',
    icon: 'ant-design:check-circle-filled',
    tone: 'cyan',
    count: null as number | null,
  },
  {
    id: 'cc',
    route: 'cc' as const,
    label: '全部抄送',
    description: '收到的流程知会',
    badge: '知会',
    icon: 'ant-design:mail-filled',
    tone: 'pink',
    count: null as number | null,
  },
]);

function formatTime(value?: string) {
  if (!value) return '-';
  return value.replace('T', ' ').slice(0, 19);
}

function taskTitle(task: ProcessTaskItem) {
  return task.instanceExt?.autoGenTitle || task.instanceExt?.f_title || task.displayName || task.taskName;
}

async function reload() {
  loading.value = true;
  loadError.value = '';
  try {
    const [todo, done, activeMine, completedMine, cc, unreadCc] = await Promise.all([
      fetchTodoTaskPageApi({ page: 1, size: 5 }),
      fetchDoneTaskPageApi({ page: 1, size: 5 }),
      fetchMyProcessInstancePageApi({ page: 1, size: 1, state: 10 }),
      fetchMyProcessInstancePageApi({ page: 1, size: 1, state: 20 }),
      fetchCcProcessInstancePageApi({ page: 1, size: 1 }),
      fetchCcProcessInstancePageApi({ page: 1, size: 1, state: 0 }),
    ]);
    recentTasks.value = todo.items;
    recentDoneTasks.value = done.items;
    cards[0]!.count = todo.total;
    cards[1]!.count = unreadCc.total;
    cards[2]!.count = activeMine.total;
    cards[3]!.count = completedMine.total;
    cards[4]!.count = done.total;
    cards[5]!.count = cc.total;
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : '工作台数据加载失败';
  } finally {
    loading.value = false;
  }
}

defineExpose({ reload });
onMounted(() => void reload());
</script>

<template>
  <div class="workflow-workbench">

    <a-alert v-if="loadError" class="mb-4" type="error" :message="loadError" show-icon />

    <a-spin :spinning="loading">
      <div class="workbench-cards">
        <a-card
          v-for="card in cards"
          :key="card.id"
          hoverable
          :class="['workbench-card', `workbench-card--${card.tone}`]"
          @click="emit('goto', card.route)"
        >
          <div class="workbench-card-topline">
            <span class="workbench-card-badge">{{ card.badge }}</span>
            <IconifyIcon icon="ant-design:arrow-up-right-outlined" class="workbench-card-arrow" />
          </div>
          <div class="workbench-card-main">
            <div class="workbench-card-icon">
              <IconifyIcon :icon="card.icon" />
            </div>
            <div class="workbench-card-value">{{ card.count ?? '-' }}</div>
          </div>
          <div class="workbench-card-label">{{ card.label }}</div>
          <div class="workbench-card-description">{{ card.description }}</div>
        </a-card>
      </div>

      <div class="workbench-panels">
        <a-card class="workbench-panel" :body-style="{ padding: 0 }">
          <template #title>
            <div class="flex items-center gap-2">
              <IconifyIcon icon="ant-design:field-time-outlined" />
              最近待办
            </div>
          </template>
          <template #extra>
            <a-button type="link" size="small" @click="emit('goto', 'todo')">
              查看全部
              <IconifyIcon icon="ant-design:arrow-right-outlined" />
            </a-button>
          </template>
          <div v-if="recentTasks.length" class="workbench-task-list">
            <div v-for="task in recentTasks" :key="task.id" class="workbench-task">
              <div class="workbench-task-main">
                <div class="workbench-task-title">{{ taskTitle(task) }}</div>
                <div class="workbench-task-meta">
                  {{ task.displayName || task.taskName }} · {{ formatTime(task.createTime) }}
                </div>
              </div>
              <div class="workbench-task-actions">
                <a-button type="primary" size="small" @click="emit('openTask', task)">办理</a-button>
                <a-button size="small" @click="emit('openInstance', task.processInstanceId)">详情</a-button>
              </div>
            </div>
          </div>
          <a-empty v-else description="暂无待办任务" class="py-8" />
        </a-card>

        <a-card class="workbench-panel" :body-style="{ padding: 0 }">
          <template #title>
            <div class="flex items-center gap-2">
              <IconifyIcon icon="ant-design:check-circle-outlined" />
              最近已办
            </div>
          </template>
          <template #extra>
            <a-button type="link" size="small" @click="emit('goto', 'done')">
              查看全部
              <IconifyIcon icon="ant-design:arrow-right-outlined" />
            </a-button>
          </template>
          <div v-if="recentDoneTasks.length" class="workbench-task-list">
            <div v-for="task in recentDoneTasks" :key="task.id" class="workbench-task">
              <div class="workbench-task-main">
                <div class="workbench-task-title">{{ taskTitle(task) }}</div>
                <div class="workbench-task-meta">
                  {{ task.displayName || task.taskName }} · {{ formatTime(task.finishTime) }}
                </div>
              </div>
              <div class="workbench-task-actions">
                <a-button size="small" @click="emit('openInstance', task.processInstanceId)">详情</a-button>
              </div>
            </div>
          </div>
          <a-empty v-else description="暂无已办任务" class="py-8" />
        </a-card>
      </div>
    </a-spin>
  </div>
</template>

<style scoped>
.workflow-workbench {
  height: 100%;
  overflow: auto;
  padding: 16px;
  background: #f5f7fa;
}


.workbench-cards {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.workbench-panels {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.workbench-card {
  position: relative;
  overflow: hidden;
  border: 1px solid #edf0f5;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 2px 8px rgb(31 35 41 / 4%);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.workbench-card::after {
  position: absolute;
  right: -28px;
  bottom: -42px;
  width: 118px;
  height: 118px;
  border-radius: 50%;
  background: var(--card-soft);
  content: '';
  opacity: 0.75;
  pointer-events: none;
}

.workbench-card:hover {
  border-color: var(--card-color);
  box-shadow: 0 10px 24px rgb(31 35 41 / 10%);
  transform: translateY(-2px);
}

.workbench-card :deep(.ant-card-body) {
  position: relative;
  z-index: 1;
  min-height: 84px;
  padding: 8px 10px;
}

.workbench-card--blue { --card-color: #1677ff; --card-soft: #e6f4ff; }
.workbench-card--orange { --card-color: #fa8c16; --card-soft: #fff7e6; }
.workbench-card--purple { --card-color: #722ed1; --card-soft: #f9f0ff; }
.workbench-card--green { --card-color: #52c41a; --card-soft: #f6ffed; }
.workbench-card--cyan { --card-color: #13c2c2; --card-soft: #e6fffb; }
.workbench-card--pink { --card-color: #eb2f96; --card-soft: #fff0f6; }

.workbench-card-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.workbench-card-badge {
  padding: 3px 8px;
  border-radius: 999px;
  color: var(--card-color);
  background: var(--card-soft);
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
}

.workbench-card-arrow {
  color: #b7bdc8;
  font-size: 16px;
  transition: color 0.2s ease, transform 0.2s ease;
}

.workbench-card:hover .workbench-card-arrow {
  color: var(--card-color);
  transform: translate(2px, -2px);
}

.workbench-card-main {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 7px;
}
.workbench-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border-radius: 6px;
  color: var(--card-color);
  background: var(--card-soft);
  font-size: 14px;
}

.workbench-card-value {
  color: #1f2937;
  font-size: 20px;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  line-height: 1;
}

.workbench-card-label {
  margin-top: 4px;
  color: #303846;
  font-size: 12px;
  font-weight: 600;
}

.workbench-card-description {
  margin-top: 1px;
  color: #98a0ad;
  font-size: 11px;
}

.workbench-panel :deep(.ant-card-head) {
  min-height: 52px;
}

.workbench-task-list {
  display: flex;
  flex-direction: column;
}

.workbench-task {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

.workbench-task-main {
  min-width: 0;
}

.workbench-task-title {
  overflow: hidden;
  color: #1f2937;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workbench-task-meta {
  margin-top: 6px;
  color: #86909c;
  font-size: 12px;
}

.workbench-task-actions {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
}

@media (max-width: 1200px) {
  .workbench-cards {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .workbench-panels {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .workbench-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .workflow-workbench {
    padding: 12px;
  }

  .workbench-header,
  .workbench-task {
    align-items: flex-start;
    flex-direction: column;
  }

  .workbench-task-actions {
    width: 100%;
  }
}
</style>
