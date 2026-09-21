<script lang="ts" setup>
import type { Component } from 'vue';

import type {
  ApprovalRecord,
  HighLightData,
  ProcessInstanceDetail,
} from '#/plugins/workflow/api/processInstance';
import type { ProcessTaskItem } from '#/plugins/workflow/api/processTask';

import { computed, h, ref, shallowRef } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message } from 'antdv-next';
import SnakerFlowDesigner from '#/plugins/workflow/components/SnakerFlowDesigner';

import {
  fetchUserListApi,
  getApprovalRecordApi,
  getHighLightApi,
  getProcessInstanceDetailApi,
} from '#/plugins/workflow/api/processInstance';
import {
  completeProcessTaskApi,
  getTaskDetailApi,
} from '#/plugins/workflow/api/processTask';

import { taskFormComponentMap } from './componentMap';
import AddCandidate from './taskForm/addCandidate.vue';
import SelectJumpNode from './taskForm/selectJumpNode.vue';
import Surrogate from './taskForm/surrogate.vue';

const emit = defineEmits<{
  success: [];
}>();

// 获取 API 基础 URL
const API_BASE_URL = import.meta.env.VITE_GLOB_API_URL || '';

const activeKey = ref('form');
const loading = ref(false);
const submitting = ref(false);
const currentTask = ref<null | ProcessTaskItem>(null);
const detail = ref<null | ProcessInstanceDetail>(null);
const approvalRecord = ref<ApprovalRecord[]>([]);
const highLight = ref<HighLightData | null>(null);
const flowData = ref<any>({});
const taskDetail = ref<any>(null);
const taskFormComponent = shallowRef<Component | null>(null);

// 审批记录子标签激活 key（时间轴 / 表格）
const recordActiveKey = ref('time');

// 表单数据
const formData = ref({
  approvalComment: '',
  approvalAttachment: [] as any[],
  assignNextOperator: false,
  nextOperator: undefined as string | undefined,
  isCc: false,
  ccActors: [] as string[],
});

// 用户列表（存储完整信息，指定处理人用 username，抄送用 id）
const userList = ref<Array<{ id: string; label: string; value: string }>>([]);

// 抄送人选项列表（使用 id 作为 value）
const ccUserOptions = computed(() =>
  userList.value.map((u) => ({ label: u.label, value: u.id })),
);

// 弹窗组件引用
const addCandidateRef = ref<InstanceType<typeof AddCandidate>>();
const selectJumpNodeRef = ref<InstanceType<typeof SelectJumpNode>>();
const surrogateRef = ref<InstanceType<typeof Surrogate>>();

// 打开加签弹窗
function openAddCandidate() {
  if (currentTask.value) {
    addCandidateRef.value?.open(currentTask.value);
  }
}

// 打开跳转弹窗
function openSelectJumpNode() {
  if (currentTask.value) {
    selectJumpNodeRef.value?.open(currentTask.value);
  }
}

// 打开委托弹窗
function openSurrogate() {
  if (currentTask.value) {
    surrogateRef.value?.open(currentTask.value);
  }
}

// 高级操作成功回调
function handleAdvancedSuccess() {
  drawerApi.close();
  emit('success');
}

const stateMap: Record<number, { color: string; text: string }> = {
  10: { text: '进行中', color: 'processing' },
  20: { text: '已完成', color: 'success' },
  30: { text: '已撤回', color: 'warning' },
  40: { text: '强行中止', color: 'error' },
  50: { text: '挂起', color: 'default' },
  99: { text: '已废弃', color: 'default' },
};

const taskStateMap: Record<number, { color: string; text: string }> = {
  10: { text: '进行中', color: 'blue' },
  20: { text: '已完成', color: 'green' },
};

// 提交类型中文映射
const submitTypeMap: Record<string, { color: string; text: string }> = {
  apply: { text: '发起申请', color: 'blue' },
  agree: { text: '同意', color: 'green' },
  reject: { text: '拒绝', color: 'red' },
  rollback: { text: '退回上一步', color: 'orange' },
  rollbackToOperator: { text: '退回发起人', color: 'orange' },
  jump: { text: '跳转', color: 'purple' },
  addCandidate: { text: '加签', color: 'cyan' },
  surrogate: { text: '委托', color: 'geekblue' },
  withdraw: { text: '已撤回', color: 'default' },
  // 数字类型兼容（mldong 使用数字）
  '0': { text: '发起申请', color: 'blue' },
  '1': { text: '同意', color: 'green' },
  '2': { text: '拒绝', color: 'red' },
  '3': { text: '退回上一步', color: 'orange' },
  '4': { text: '跳转', color: 'purple' },
  '5': { text: '重新提交', color: 'blue' },
  '6': { text: '退回发起人', color: 'orange' },
  '20': { text: '会签不同意', color: 'red' },
};

// 是否已办任务（用于控制审批表单显示）
const isDoneTask = computed(() => currentTask.value?.taskState === 20);

// 过滤掉系统字段，只显示业务表单数据
const displayFormData = computed(() => {
  if (!detail.value?.formData) return {};
  const systemFields = new Set([
    'autoGenTitle',
    'is_new',
    'method',
    'orderId',
    'parent_id',
    'process_instance_id',
    'processId',
    'processInstanceId',
    'taskId',
    'u_realName',
    'u_username',
    'user_id',
  ]);
  return Object.fromEntries(
    Object.entries(detail.value.formData).filter(
      ([key]) => !systemFields.has(key),
    ),
  );
});

// 审批记录的开始节点 / 结束节点名称（复用 HistoryDrawer 逻辑）
const startNodeName = computed(() => {
  if (approvalRecord.value.length === 0) return '';
  const first = approvalRecord.value[0];
  if (!first) return '';
  return (first.displayName || first.taskName || '') as string;
});

const endNodeName = computed(() => {
  if (approvalRecord.value.length === 0) return '';
  const reversed = [...approvalRecord.value].toReversed();
  const finished = reversed.find((item) => item.finishTime);
  const target =
    finished || approvalRecord.value[approvalRecord.value.length - 1];
  if (!target) {
    return '';
  }
  return (target.displayName || target.taskName || '') as string;
});

// 判断是否为文件数组
function isFileArray(value: any): boolean {
  return (
    Array.isArray(value) && value.length > 0 && value[0]?.uid && value[0]?.name
  );
}

// 格式化表单值，处理文件类型等特殊数据
function formatFormValue(value: any): string {
  if (value === null || value === undefined) return '-';

  // 文件数组由模板单独处理
  if (isFileArray(value)) {
    return '';
  }

  // 检测是否为普通数组
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  // 检测是否为对象
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

// 获取文件完整 URL（相对路径拼接后端地址）
function getFullFileUrl(fileUrl: string): string {
  if (!fileUrl) return '';
  return fileUrl.startsWith('http') ? fileUrl : `${API_BASE_URL}${fileUrl}`;
}

// 预览文件
function previewFile(file: any) {
  if (file.url) {
    window.open(getFullFileUrl(file.url), '_blank');
    return;
  }
  if (file.response?.data?.url) {
    window.open(getFullFileUrl(file.response.data.url), '_blank');
    return;
  }
  if (file.response?.url) {
    window.open(getFullFileUrl(file.response.url), '_blank');
    return;
  }
  if (file.originFileObj instanceof Blob) {
    const url = URL.createObjectURL(file.originFileObj);
    window.open(url, '_blank');
    return;
  }
  message.info(`文件 "${file.name}" 未上传到服务器，无法预览`);
}

const baseDescriptionsItems = computed(() => {
  const d = detail.value;
  const t = currentTask.value;
  if (!d) return [];
  return [
    { label: '流程名称', content: d.displayName },
    { label: '当前节点', content: t?.displayName || t?.taskName || '-' },
    { label: '业务单号', content: d.businessNo || '-' },
    { label: '发起人', content: d.operator },
    { label: '发起时间', content: formatTime(d.createdTime) },
    {
      label: '状态',
      content: h(
        'a-tag',
        {
          color:
            (d.state === undefined ? 'default' : stateMap[d.state]?.color) ||
            'default',
        },
        {
          default: () =>
            (d.state === undefined ? d.state : stateMap[d.state]?.text) ||
            d.state,
        },
      ),
    },
  ];
});

const formDescriptionsItems = computed(() => {
  return Object.entries(displayFormData.value).map(([key, value]) => {
    return {
      label: String(key),
      content: isFileArray(value)
        ? h(
            'a-space',
            {},
            {
              default: () =>
                (value as any[]).map((file) =>
                  h(
                    'a-tag',
                    {
                      color: 'blue',
                      class: 'cursor-pointer',
                      onClick: () => previewFile(file),
                    },
                    {
                      default: () => [
                        h(IconifyIcon, {
                          icon: 'ant-design:file-outlined',
                          class: 'mr-1',
                        }),
                        file.name,
                      ],
                    },
                  ),
                ),
            },
          )
        : formatFormValue(value),
    };
  });
});

const timelineItems = computed(() => {
  const items = [];
  if (startNodeName.value) {
    items.push({
      color: 'gray',
      children: h(
        'div',
        { class: 'text-sm text-gray-600' },
        `开始节点：${startNodeName.value}`,
      ),
    });
  }

  approvalRecord.value.forEach((item) => {
    items.push({
      color: item.taskState === 20 ? 'green' : 'blue',
      children: h('div', {}, [
        h('div', { class: 'mb-1 flex items-center gap-2' }, [
          h('strong', {}, item.displayName || item.taskName),
          h(
            'a-tag',
            {
              color:
                (item.taskState === undefined
                  ? 'default'
                  : taskStateMap[item.taskState]?.color) || 'default',
              size: 'small',
            },
            {
              default: () =>
                (item.taskState === undefined
                  ? item.taskState
                  : taskStateMap[item.taskState]?.text) || item.taskState,
            },
          ),
        ]),
        h(
          'div',
          { class: 'mb-1 flex items-center gap-1 text-sm text-gray-500' },
          [
            h(IconifyIcon, { icon: 'ant-design:user-outlined' }),
            h(
              'span',
              {},
              (item.operatorName || item.operator) as string | undefined,
            ),
          ],
        ),
        h('div', { class: 'mb-1 text-xs text-gray-500' }, [
          h('span', {}, `开始：${formatTime(item.createdTime) || '-'}`),
          item.finishTime
            ? h(
                'span',
                { class: 'ml-4' },
                `结束：${formatTime(item.finishTime)}`,
              )
            : null,
        ]),
        item.submitType
          ? h('div', { class: 'mb-1 flex items-center gap-1 text-xs' }, [
              h(
                'a-tag',
                {
                  color:
                    (item.submitType
                      ? submitTypeMap[item.submitType]?.color
                      : 'default') || 'default',
                  size: 'small',
                },
                {
                  default: () =>
                    (item.submitType
                      ? submitTypeMap[item.submitType]?.text
                      : item.submitType) || item.submitType,
                },
              ),
            ])
          : null,
        item.approvalComment
          ? h(
              'div',
              { class: 'flex items-center gap-1 text-sm text-gray-600' },
              [
                h(IconifyIcon, { icon: 'ant-design:message-outlined' }),
                h('span', {}, item.approvalComment),
              ],
            )
          : null,
      ]),
    });
  });

  if (detail.value?.state === 20 && endNodeName.value) {
    items.push({
      color: 'gray',
      children: h(
        'div',
        { class: 'text-sm text-gray-600' },
        `结束节点：${endNodeName.value}`,
      ),
    });
  }
  return items;
});

const tabItems = [
  {
    key: 'form',
    label: '表单',
  },
  {
    key: 'flow',
    label: '流程图',
  },
  {
    key: 'record',
    label: '审批记录',
  },
];

const recordTabItems = [
  {
    key: 'time',
    label: '时间轴',
  },
  {
    key: 'table',
    label: '表格',
  },
];

const [Drawer, drawerApi] = useVbenDrawer({
  title: '任务办理',
  class: 'w-1/2',
  onOpenChange: async (isOpen) => {
    if (isOpen) {
      const { task } = drawerApi.getData();
      currentTask.value = task;
      activeKey.value = 'form';
      recordActiveKey.value = 'time';
      formData.value = {
        approvalComment: '',
        approvalAttachment: [],
        assignNextOperator: false,
        nextOperator: undefined,
        isCc: false,
        ccActors: [],
      };
      loading.value = true;
      try {
        // 兼容处理：后端可能返回 process_instance_id 或 processInstanceId
        const instanceId =
          task.processInstanceId || (task as any).process_instance_id;

        if (!instanceId) {
          console.error('Task data is missing processInstanceId:', task);
          message.error('无法获取流程实例ID');
          return;
        }

        const [detailData, recordData, highLightData, taskDetailData] =
          await Promise.all([
            getProcessInstanceDetailApi(instanceId),
            getApprovalRecordApi(instanceId),
            getHighLightApi(instanceId),
            getTaskDetailApi(task.id),
          ]);
        await loadUserList();

        detail.value = detailData;
        approvalRecord.value = recordData;
        highLight.value = highLightData;
        flowData.value = detailData?.jsonObject || {};
        taskDetail.value = taskDetailData;

        // 动态加载 TaskForm 组件（只有明确指定了 taskFormKey 且不是默认表单时才加载）
        // 因为 TaskDrawer 本身已有审批操作区域，不需要重复加载默认表单
        taskFormComponent.value =
          taskDetailData?.taskFormKey &&
          taskDetailData.taskFormKey !== 'defaultTaskForm'
            ? taskFormComponentMap.get(taskDetailData.taskFormKey) || null
            : null;
      } catch (error) {
        console.error('Failed to load task details:', error);
      } finally {
        loading.value = false;
      }
    }
  },
});

async function loadUserList() {
  try {
    const data = await fetchUserListApi();
    userList.value = data.map((u: any) => ({
      label: u.nickname || u.username,
      value: u.username, // 指定下一节点处理人用 username
      id: String(u.id), // 抄送用 id
    }));
  } catch {
    userList.value = [];
  }
}

function formatTime(time?: string) {
  if (!time) return '';
  return time.replace('T', ' ').slice(0, 19);
}

async function handleSubmit(
  submitType: 'agree' | 'reject' | 'rollback' | 'rollbackToOperator',
) {
  if (!currentTask.value) return;

  submitting.value = true;
  try {
    const args: Record<string, any> = {
      submitType,
      approvalComment: formData.value.approvalComment,
    };

    // 如果指定了下一节点处理人（仅同意时有效）
    if (
      submitType === 'agree' &&
      formData.value.assignNextOperator &&
      formData.value.nextOperator
    ) {
      args.assignee = formData.value.nextOperator;
    }

    // 如果选择了抄送
    if (formData.value.isCc && formData.value.ccActors.length > 0) {
      args.ccActors = formData.value.ccActors;
    }

    await completeProcessTaskApi({
      taskId: currentTask.value.id,
      args,
    });

    const msgMap: Record<string, string> = {
      agree: '审批通过',
      reject: '已拒绝',
      rollback: '已退回上一步',
      rollbackToOperator: '已退回发起人',
    };
    message.success(msgMap[submitType] || '操作成功');
    drawerApi.close();
    emit('success');
  } finally {
    submitting.value = false;
  }
}

defineExpose({
  open: drawerApi.open,
  setData: drawerApi.setData,
});
</script>

<template>
  <div>
    <Drawer :footer="false">
      <a-spin :spinning="loading">
        <div v-if="detail" class="p-4">
          <!-- 基本信息 -->
          <a-descriptions
            :column="2"
            :items="baseDescriptionsItems"
            bordered
            class="mb-4"
            size="small"
          />

          <!-- 标签页 -->
          <a-tabs v-model:active-key="activeKey" :items="tabItems">
            <template #contentRender="{ item }">
              <!-- 表单标签页 -->
              <template v-if="item.key === 'form'">
                <!-- 原始表单数据 -->
                <div
                  v-if="Object.keys(displayFormData).length > 0"
                  class="mb-4"
                >
                  <a-descriptions
                    :column="1"
                    :items="formDescriptionsItems"
                    bordered
                    size="small"
                    title="申请信息"
                  />
                </div>

                <!-- 动态任务表单组件 -->
                <div v-if="taskFormComponent" class="mb-4">
                  <component
                    :is="taskFormComponent"
                    :disabled="isDoneTask"
                    :process-instance="detail"
                    :process-task="currentTask"
                    :task-form-data="taskDetail?.taskFormData"
                  />
                </div>

                <!-- 审批表单：仅对进行中的任务显示，已办详情不再显示审批操作 -->
                <a-card v-if="!isDoneTask" class="mt-4" title="操作区域">
                  <a-form layout="vertical">
                    <a-form-item label="审批意见" required>
                      <a-textarea
                        v-model:value="formData.approvalComment"
                        placeholder="请输入审批意见"
                        :rows="3"
                      />
                    </a-form-item>
                    <a-form-item label="上传附件">
                      <a-upload
                        v-model:file-list="formData.approvalAttachment"
                        :before-upload="() => false"
                        :max-count="5"
                      >
                        <a-button>
                          <IconifyIcon icon="ant-design:upload-outlined" />
                          选择文件
                        </a-button>
                      </a-upload>
                    </a-form-item>
                    <a-row :gutter="16">
                      <a-col :span="6">
                        <a-form-item>
                          <a-checkbox
                            v-model:checked="formData.assignNextOperator"
                          >
                            指定下一节点处理人
                          </a-checkbox>
                        </a-form-item>
                      </a-col>
                      <a-col :span="6">
                        <a-form-item>
                          <a-checkbox v-model:checked="formData.isCc">
                            是否抄送
                          </a-checkbox>
                        </a-form-item>
                      </a-col>
                    </a-row>
                    <a-form-item
                      v-if="formData.assignNextOperator"
                      label="下一节点处理人"
                    >
                      <a-select
                        v-model:value="formData.nextOperator"
                        :filter-option="
                          (input: string, option: any) =>
                            option.label
                              .toLowerCase()
                              .includes(input.toLowerCase())
                        "
                        :options="userList"
                        placeholder="请选择下一节点处理人"
                        show-search
                        style="width: 100%"
                      />
                    </a-form-item>
                    <a-form-item v-if="formData.isCc" label="抄送给">
                      <a-select
                        v-model:value="formData.ccActors"
                        :filter-option="
                          (input: string, option: any) =>
                            option.label
                              .toLowerCase()
                              .includes(input.toLowerCase())
                        "
                        :options="ccUserOptions"
                        mode="multiple"
                        placeholder="请选择抄送人"
                        show-search
                        style="width: 100%"
                      />
                    </a-form-item>
                    <a-form-item>
                      <a-space wrap>
                        <a-button
                          :loading="submitting"
                          type="primary"
                          @click="handleSubmit('agree')"
                        >
                          <IconifyIcon icon="ant-design:check-outlined" />
                          同意
                        </a-button>
                        <a-button
                          :loading="submitting"
                          danger
                          @click="handleSubmit('reject')"
                        >
                          <IconifyIcon icon="ant-design:close-outlined" />
                          拒绝
                        </a-button>
                        <a-button
                          :loading="submitting"
                          @click="handleSubmit('rollback')"
                        >
                          <IconifyIcon icon="ant-design:rollback-outlined" />
                          退回上一步
                        </a-button>
                        <a-button
                          :loading="submitting"
                          @click="handleSubmit('rollbackToOperator')"
                        >
                          <IconifyIcon icon="ant-design:undo-outlined" />
                          退回发起人
                        </a-button>
                        <a-button @click="openAddCandidate">
                          <IconifyIcon icon="ant-design:user-add-outlined" />
                          加签
                        </a-button>
                        <a-button @click="openSelectJumpNode">
                          <IconifyIcon icon="ant-design:swap-outlined" />
                          跳转
                        </a-button>
                        <a-button @click="openSurrogate">
                          <IconifyIcon icon="ant-design:team-outlined" />
                          委托
                        </a-button>
                      </a-space>
                    </a-form-item>
                  </a-form>
                </a-card>
              </template>
              <!-- 流程图标签页 -->
              <template v-else-if="item.key === 'flow'">
                <div class="py-4">
                  <div
                    v-if="detail?.jsonObject"
                    class="rounded border border-dashed border-gray-300"
                    style="height: calc(100vh - 350px); overflow-y: auto"
                  >
                    <SnakerFlowDesigner
                      v-if="activeKey === 'flow'"
                      v-model="flowData"
                      :high-light="highLight || undefined"
                      :show-doc="false"
                      :viewer="true"
                      node-render-type="html"
                    />
                  </div>
                  <div
                    v-else
                    class="rounded border border-dashed border-gray-300 py-4 text-center text-gray-400"
                  >
                    暂无流程图数据
                  </div>
                </div>
              </template>
              <!-- 审批记录标签页 -->
              <template v-else-if="item.key === 'record'">
                <a-tabs
                  v-model:active-key="recordActiveKey"
                  :items="recordTabItems"
                  tab-placement="start"
                >
                  <template #contentRender="{ item: recordItem }">
                    <!-- 时间轴标签页 -->
                    <template v-if="recordItem.key === 'time'">
                      <a-timeline :items="timelineItems" class="mt-4" />
                      <div
                        v-if="approvalRecord.length === 0"
                        class="py-8 text-center text-gray-400"
                      >
                        暂无审批记录
                      </div>
                    </template>
                    <!-- 表格标签页 -->
                    <template v-else-if="recordItem.key === 'table'">
                      <div
                        v-if="approvalRecord.length > 0"
                        class="mt-4 overflow-auto"
                      >
                        <table
                          class="min-w-full border border-gray-200 text-xs"
                        >
                          <thead class="bg-gray-50">
                            <tr>
                              <th class="border px-2 py-1">节点</th>
                              <th class="border px-2 py-1">办理人</th>
                              <th class="border px-2 py-1">状态</th>
                              <th class="border px-2 py-1">开始时间</th>
                              <th class="border px-2 py-1">完成时间</th>
                              <th class="border px-2 py-1">提交类型</th>
                              <th class="border px-2 py-1">意见</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr
                              v-for="record in approvalRecord"
                              :key="record.id"
                            >
                              <td class="border px-2 py-1">
                                {{ record.displayName || record.taskName }}
                              </td>
                              <td class="border px-2 py-1">
                                {{ record.operatorName || record.operator }}
                              </td>
                              <td class="border px-2 py-1">
                                {{
                                  taskStateMap[record.taskState]?.text ||
                                  record.taskState
                                }}
                              </td>
                              <td class="border px-2 py-1">
                                {{ formatTime(record.createdTime) }}
                              </td>
                              <td class="border px-2 py-1">
                                {{ formatTime(record.finishTime) }}
                              </td>
                              <td class="border px-2 py-1">
                                <a-tag
                                  v-if="record.submitType"
                                  :color="
                                    submitTypeMap[record.submitType]?.color ||
                                    'default'
                                  "
                                >
                                  {{
                                    submitTypeMap[record.submitType]?.text ||
                                    record.submitType
                                  }}
                                </a-tag>
                                <span v-else>-</span>
                              </td>
                              <td class="border px-2 py-1">
                                {{ record.approvalComment || '-' }}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div v-else class="py-8 text-center text-gray-400">
                        暂无审批记录
                      </div>
                    </template>
                  </template>
                </a-tabs>
              </template>
            </template>
          </a-tabs>
        </div>
      </a-spin>
    </Drawer>

    <!-- 加签弹窗 -->
    <AddCandidate ref="addCandidateRef" @success="handleAdvancedSuccess" />
    <!-- 跳转弹窗 -->
    <SelectJumpNode ref="selectJumpNodeRef" @success="handleAdvancedSuccess" />
    <!-- 委托弹窗 -->
    <Surrogate ref="surrogateRef" @success="handleAdvancedSuccess" />
  </div>
</template>
