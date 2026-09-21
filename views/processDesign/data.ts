import type { VbenFormSchema } from '@vben/common-ui';
import type { VxeGridPropTypes } from '@vben/plugins/vxe-table';

export const querySchema: VbenFormSchema[] = [
  {
    fieldName: 'name',
    label: '唯一编码',
    component: 'Input',
    componentProps: {
      placeholder: '请输入唯一编码',
    },
  },
  {
    fieldName: 'displayName',
    label: '显示名称',
    component: 'Input',
    componentProps: {
      placeholder: '请输入显示名称',
    },
  },
];

export function useColumns(): VxeGridPropTypes.Columns {
  return [
    {
      type: 'checkbox',
      width: 50,
      fixed: 'left',
    },
    {
      field: 'displayName',
      title: '显示名称',
      minWidth: 150,
    },
    {
      field: 'name',
      title: '唯一编码',
      minWidth: 150,
    },
    {
      field: 'type',
      title: '流程类型',
      width: 120,
    },
    {
      field: 'isDeployed',
      title: '是否已部署',
      width: 120,
      slots: { default: 'isDeployed' },
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 150,
    },
    {
      field: 'updateTime',
      title: '更新时间',
      width: 180,
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: { default: 'action' },
    },
  ];
}

export const formSchema: VbenFormSchema[] = [
  {
    fieldName: 'name',
    label: '唯一编码',
    component: 'Input',
    rules: 'required',
    componentProps: {
      placeholder: '请输入唯一编码',
    },
  },
  {
    fieldName: 'displayName',
    label: '显示名称',
    component: 'Input',
    rules: 'required',
    componentProps: {
      placeholder: '请输入显示名称',
    },
  },
  {
    fieldName: 'type',
    label: '流程类型',
    component: 'Input',
    componentProps: {
      placeholder: '请输入流程类型',
    },
  },
  {
    fieldName: 'icon',
    label: '图标',
    component: 'Input',
    componentProps: {
      placeholder: '请输入图标',
    },
  },
  {
    fieldName: 'remark',
    label: '备注',
    component: 'Textarea',
    componentProps: {
      placeholder: '请输入备注',
    },
  },
];
