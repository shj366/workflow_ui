import type { VbenFormProps } from '@vben/common-ui';
import type { VxeGridProps } from '@vben/plugins/vxe-table';

export const querySchema: VbenFormProps['schema'] = [
  {
    component: 'Input',
    fieldName: 'taskName',
    label: '任务编码',
    componentProps: {
      placeholder: '请输入任务编码',
    },
  },
  {
    component: 'Input',
    fieldName: 'displayName',
    label: '任务名称',
    componentProps: {
      placeholder: '请输入任务名称',
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
    title: '标题',
    field: 'title',
    minWidth: 200,
    formatter: ({ row }) => {
      return (row.instanceExt && row.instanceExt.autoGenTitle) || '';
    },
  },
  {
    title: '摘要',
    field: 'summary',
    minWidth: 200,
    formatter: ({ row }) => {
      return (
        (row.instanceExt &&
          (row.instanceExt.f_title || row.instanceExt.title)) ||
        ''
      );
    },
  },
  {
    field: 'displayName',
    title: '当前节点',
    minWidth: 150,
  },
  {
    field: 'instanceExt.u_realName',
    title: '发起人',
    minWidth: 100,
    formatter: ({ row }) => {
      return (row.instanceExt && row.instanceExt.u_realName) || '';
    },
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
    field: 'createdTime',
    title: '待办时间',
    width: 180,
    sortable: true,
    formatter: ({ row }) => {
      const v = row.createdTime as string | undefined;
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

export function useColumns(): VxeGridProps['columns'] {
  return columns || [];
}

export function useDoneColumns(): VxeGridProps['columns'] {
  return [
    ...(columns || []).filter((c) => c.field !== 'action'),
    {
      field: 'finishTime',
      title: '完成时间',
      width: 180,
      formatter: ({ row }) => {
        const v = row.finishTime as string | undefined;
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
}
