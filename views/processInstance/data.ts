import type { VbenFormProps } from '@vben/common-ui';
import type { VxeGridProps } from '@vben/plugins/vxe-table';

export const querySchema: VbenFormProps['schema'] = [
  {
    component: 'Input',
    fieldName: 'displayName',
    label: '流程名称',
    componentProps: {
      placeholder: '请输入流程名称',
    },
  },
  {
    component: 'Input',
    fieldName: 'businessNo',
    label: '业务单号',
    componentProps: {
      placeholder: '请输入业务单号',
    },
  },
  {
    component: 'Select',
    fieldName: 'state',
    label: '状态',
    componentProps: {
      placeholder: '请选择状态',
      options: [
        { label: '进行中', value: 10 },
        { label: '已完成', value: 20 },
        { label: '已撤回', value: 30 },
        { label: '强行中止', value: 40 },
        { label: '挂起', value: 50 },
        { label: '已废弃', value: 99 },
      ],
    },
  },
];

export const columns: VxeGridProps['columns'] = [
  {
    type: 'checkbox',
    width: 48,
    fixed: 'left',
  },
  {
    title: '序号',
    type: 'seq',
    width: 60,
    fixed: 'left',
  },
  {
    field: 'ext.autoGenTitle',
    title: '标题',
    minWidth: 200,
    formatter: ({ row }) => row.ext?.autoGenTitle ?? '',
  },
  {
    field: 'ext.f_title',
    title: '摘要',
    minWidth: 180,
    formatter: ({ row }) => row.ext?.f_title ?? '',
  },
  {
    field: 'ext.u_realName',
    title: '发起人',
    minWidth: 100,
    formatter: ({ row }) => row.ext?.u_realName ?? row.operator ?? '',
  },
  {
    field: 'createdTime',
    title: '发起时间',
    width: 180,
    sortable: true,
    formatter: ({ row }) => {
      const v = (row.createdTime || row.createTime) as string | undefined;
      if (!v) return '';
      const s = v.replace('T', ' ');
      return s.length > 19 ? s.slice(0, 19) : s;
    },
  },
  {
    field: 'ext.u_deptName',
    title: '发起人所属部门',
    minWidth: 150,
    formatter: ({ row }) => row.ext?.u_deptName ?? '',
  },
  {
    field: 'ext.u_postName',
    title: '发起人职务',
    minWidth: 150,
    formatter: ({ row }) => row.ext?.u_postName ?? '',
  },
  {
    field: 'displayName',
    title: '流程名称',
    minWidth: 150,
  },
  {
    field: 'businessNo',
    title: '业务单号',
    minWidth: 120,
  },
  {
    field: 'version',
    title: '定义版本',
    width: 90,
  },
  {
    field: 'state',
    title: '状态',
    width: 100,
    formatter: ({ cellValue }) => {
      const map: Record<number, string> = {
        10: '进行中',
        20: '已完成',
        30: '已撤回',
        40: '强行中止',
        50: '挂起',
        99: '已废弃',
      };
      return map[cellValue] || cellValue;
    },
  },
  {
    field: 'action',
    title: '操作',
    width: 150,
    fixed: 'right',
    slots: { default: 'action' },
  },
];

export function useColumns(): VxeGridProps['columns'] {
  return columns;
}

export const ccQuerySchema: VbenFormProps['schema'] = [
  {
    component: 'Select',
    fieldName: 'state',
    label: '阅读状态',
    componentProps: {
      placeholder: '请选择状态',
      options: [
        { label: '未读', value: 0 },
        { label: '已读', value: 1 },
      ],
    },
  },
];

export const ccColumns: VxeGridProps['columns'] = [
  {
    type: 'checkbox',
    width: 48,
    fixed: 'left',
  },
  {
    title: '序号',
    type: 'seq',
    width: 60,
    fixed: 'left',
  },
  {
    field: 'instanceExt.autoGenTitle',
    title: '标题',
    minWidth: 220,
    formatter: ({ row }) => row.instanceExt?.autoGenTitle ?? '',
  },
  {
    field: 'instanceExt.f_title',
    title: '摘要',
    minWidth: 200,
    formatter: ({ row }) => row.instanceExt?.f_title ?? '',
  },
  {
    field: 'processState',
    title: '流程状态',
    width: 100,
    formatter: ({ cellValue }) => {
      const map: Record<number, string> = {
        10: '进行中',
        20: '已完成',
        30: '已撤回',
        40: '强行中止',
        50: '挂起',
        99: '已废弃',
      };
      return map[cellValue] || cellValue;
    },
  },
  {
    field: 'state',
    title: '阅读状态',
    width: 80,
    formatter: ({ cellValue }) => (cellValue === 1 ? '已读' : '未读'),
  },
  {
    field: 'instanceExt.u_realName',
    title: '发起人',
    width: 100,
    formatter: ({ row }) => row.instanceExt?.u_realName ?? row.operator ?? '',
  },
  {
    field: 'instanceCreateTime',
    title: '发起时间',
    width: 180,
    sortable: true,
    formatter: ({ row }) => {
      const v = row.instanceCreateTime as string | undefined;
      if (!v) return '';
      const s = v.replace('T', ' ');
      return s.length > 19 ? s.slice(0, 19) : s;
    },
  },
  {
    field: 'createTime',
    title: '抄送时间',
    width: 180,
    sortable: true,
    formatter: ({ row }) => {
      const v = row.createTime as string | undefined;
      if (!v) return '';
      const s = v.replace('T', ' ');
      return s.length > 19 ? s.slice(0, 19) : s;
    },
  },
  {
    field: 'action',
    title: '操作',
    width: 120,
    fixed: 'right',
    slots: { default: 'action' },
  },
];

export function useCcColumns(): VxeGridProps['columns'] {
  return ccColumns;
}
