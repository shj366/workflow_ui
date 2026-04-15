<script lang="ts" setup>
import type {
  ApprovalRecord,
  HighLightData,
  ProcessInstanceDetail,
} from '#/plugins/workflow/api/processInstance';

import { computed, h, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message } from 'antdv-next';
import SnakerFlowDesigner from '#/plugins/workflow/components/SnakerFlowDesigner';

import {
  getApprovalRecordApi,
  getHighLightApi,
  getProcessInstanceDetailApi,
} from '#/plugins/workflow/api/processInstance';

// 获取 API 基础 URL
const API_BASE_URL = import.meta.env.VITE_GLOB_API_URL || '';

const activeKey = ref('form');
const loading = ref(false);
const detail = ref<null | ProcessInstanceDetail>(null);
const approvalRecord = ref<ApprovalRecord[]>([]);
const highLight = ref<HighLightData | null>(null);
const flowData = ref<Record<string, any>>({});

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
  // 数字类型兼容
  '0': { text: '发起申请', color: 'blue' },
  '1': { text: '同意', color: 'green' },
  '2': { text: '拒绝', color: 'red' },
  '3': { text: '退回上一步', color: 'orange' },
  '4': { text: '跳转', color: 'purple' },
  '5': { text: '重新提交', color: 'blue' },
  '6': { text: '退回发起人', color: 'orange' },
  '20': { text: '会签不同意', color: 'red' },
};

// 通用表单字段中文标签映射（业务字段应在各自 WfForm 组件中定义）
const formLabelMap: Record<string, string> = {
  f_title: '申请标题',
  f_remark: '申请说明',
};

// 表单中不展示的技术字段
const hiddenFormKeys = new Set<string>([
  'approvalComment',
  'autoGenTitle',
  'business_no',
  'submit_type',
  'submitType',
  'u_deptName',
  'u_postName',
  'u_realName',
  'u_username',
  'user_id',
]);

// 审批记录子标签激活 key（时间轴 / 表格）
const recordActiveKey = ref('time');

// 审批记录的开始节点 / 结束节点名称
const startNodeName = computed(() => {
  if (approvalRecord.value.length === 0) return '';
  const first = approvalRecord.value[0];
  if (!first) return '';
  return (first.displayName || first.taskName || '') as string;
});

const endNodeName = computed(() => {
  if (approvalRecord.value.length === 0) return '';
  // 优先取最后一个有完成时间的节点，否则取最后一条记录
  const reversed = [...approvalRecord.value].toReversed();
  const finished = reversed.find((item) => item.finishTime);
  const target =
    finished || approvalRecord.value[approvalRecord.value.length - 1];
  if (!target) {
    return '';
  }
  return (target.displayName || target.taskName || '') as string;
});

// 过滤后的表单条目，避免在模板中直接访问 fieldKey 导致 Vue 警告
const visibleFormEntries = computed(() => {
  const formData = detail.value?.formData ?? {};
  return Object.entries(formData).filter(
    ([key]) => !hiddenFormKeys.has(String(key)),
  );
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

  // 文件数组由模板单独处理，这里不格式化
  if (isFileArray(value)) {
    return '';
  }

  // 检测是否为普通数组
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  // 检测是否为对象（可能是嵌套数据）
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

// 预览文件（如果有 URL）
function previewFile(file: any) {
  // 如果有服务器返回的 URL
  if (file.url) {
    window.open(getFullFileUrl(file.url), '_blank');
    return;
  }
  // 如果有 response 中的 URL
  if (file.response?.data?.url) {
    window.open(getFullFileUrl(file.response.data.url), '_blank');
    return;
  }
  if (file.response?.url) {
    window.open(getFullFileUrl(file.response.url), '_blank');
    return;
  }
  // 如果有 originFileObj 且是真正的 File/Blob 对象
  if (file.originFileObj instanceof Blob) {
    const url = URL.createObjectURL(file.originFileObj);
    window.open(url, '_blank');
    return;
  }
  // 文件已保存但未上传到服务器，只能显示文件名
  message.info(`文件 "${file.name}" 未上传到服务器，无法预览`);
}

const baseDescriptionsItems = computed(() => {
  const d = detail.value;
  if (!d) return [];
  return [
    { label: '流程名称', content: d.displayName },
    { label: '版本', content: `v${d.version}` },
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
  return visibleFormEntries.value.map(([fieldKey, value]) => {
    return {
      label: formLabelMap[String(fieldKey)] || String(fieldKey),
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
            h('span', {}, item.operator),
            h(IconifyIcon, {
              icon: 'ant-design:clock-circle-outlined',
              class: 'ml-2',
            }),
            h('span', {}, formatTime(item.finishTime)),
          ],
        ),
        item.submitType
          ? h('div', { class: 'mb-1 flex items-center gap-1 text-xs' }, [
              h(
                'a-tag',
                {
                  color:
                    (item.submitType
                      ? submitTypeMap[item.submitType]?.color
                      : 'default') || 'default',
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
          ? h('div', { class: 'mb-1 flex items-center gap-1 text-sm' }, [
              h(IconifyIcon, { icon: 'ant-design:message-outlined' }),
              h('span', {}, item.approvalComment),
            ])
          : null,
      ]),
    });
  });

  if (
    detail.value?.state !== undefined &&
    detail.value?.state === 20 &&
    endNodeName.value
  ) {
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
  title: '流程详情',
  class: 'w-1/2',
  onOpenChange: async (isOpen) => {
    if (isOpen) {
      const { instanceId } = drawerApi.getData();
      activeKey.value = 'form';
      recordActiveKey.value = 'time';
      loading.value = true;
      try {
        const [detailData, recordData, highLightData] = await Promise.all([
          getProcessInstanceDetailApi(instanceId),
          getApprovalRecordApi(instanceId),
          getHighLightApi(instanceId),
        ]);
        detail.value = detailData;
        flowData.value = (detailData && detailData.jsonObject) || {};
        approvalRecord.value = recordData;
        highLight.value = highLightData;
      } finally {
        loading.value = false;
      }
    }
  },
});

function formatTime(time?: string) {
  if (!time) return '';
  return time.replace('T', ' ').slice(0, 19);
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

          <!-- 标签页: 表单 → 流程图 → 审批记录 -->
          <a-tabs v-model:active-key="activeKey" :items="tabItems">
            <template #contentRender="{ item }">
              <!-- 表单标签页 -->
              <template v-if="item.key === 'form'">
                <div
                  v-if="
                    detail.formData && Object.keys(detail.formData).length > 0
                  "
                  class="mt-4"
                >
                  <a-descriptions
                    :column="1"
                    :items="formDescriptionsItems"
                    bordered
                    size="small"
                  />
                </div>
                <div v-else class="py-8 text-center text-gray-400">
                  暂无表单数据
                </div>
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
                      :show-doc="false"
                      :viewer="true"
                      node-render-type="html"
                      :high-light="highLight"
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
  </div>
</template>
