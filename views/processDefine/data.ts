import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { $t } from '@vben/locales';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'name',
    label: '编码',
    componentProps: {
      allowClear: true,
    },
  },
  {
    component: 'Input',
    fieldName: 'displayName',
    label: '显示名称',
    componentProps: {
      allowClear: true,
    },
  },
  {
    component: 'Select',
    fieldName: 'state',
    label: '状态',
    componentProps: {
      allowClear: true,
      options: [
        { label: '可用', value: 1 },
        { label: '禁用', value: 0 },
      ],
    },
  },
];

const columns: VxeGridProps['columns'] = [
  { type: 'seq', width: 60, title: $t('common.table.id') },
  {
    field: 'name',
    title: '编码',
    minWidth: 150,
  },
  {
    field: 'displayName',
    title: '显示名称',
    minWidth: 150,
  },
  {
    field: 'type',
    title: '类型',
    width: 100,
  },
  {
    field: 'version',
    title: '版本',
    width: 80,
  },
  {
    field: 'state',
    title: '状态',
    width: 100,
    cellRender: {
      name: 'CellTag',
      options: [
        { label: '可用', value: 1, color: 'success' },
        { label: '禁用', value: 0, color: 'error' },
      ],
    },
  },
  {
    field: 'createdTime',
    title: '创建时间',
    width: 180,
    sortable: true,
    formatter: ({ row }) => {
      const v = row.created_time as string | undefined;
      if (!v) return '';
      const s = v.replace('T', ' ');
      return s.length > 19 ? s.slice(0, 19) : s;
    },
  },
  {
    field: 'action',
    title: '操作',
    width: 140,
    fixed: 'right',
    slots: { default: 'action' },
  },
];

export function useColumns(): VxeGridProps['columns'] {
  return columns;
}
