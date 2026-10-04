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
    component: 'Input',
    fieldName: 'type',
    label: '类型',
    componentProps: {
      allowClear: true,
      placeholder: '请输入流程类型',
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
    slots: { default: 'name' },
  },
  {
    field: 'displayName',
    title: '名称',
    minWidth: 150,
    slots: { default: 'displayName' },
  },
  {
    field: 'type',
    title: '流程类型',
    width: 120,
    slots: { default: 'type' },
  },
  {
    field: 'version',
    title: '版本',
    width: 80,
    slots: { default: 'version' },
  },
  {
    field: 'state',
    title: '状态',
    width: 100,
    slots: { default: 'state' },
  },
  {
    field: 'remark',
    title: '备注',
    minWidth: 180,
    slots: { default: 'remark' },
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
