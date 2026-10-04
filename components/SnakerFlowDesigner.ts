import type { Component } from 'vue';

import { defineComponent, h } from 'vue';

import FlowDesigner from 'mldong-flow-designer-plus';
import 'mldong-flow-designer-plus/lib/style.css';

import AssigneeInput from '../views/processDesign/snakerflow/assigneeInput.vue';
import { wfFormOptions } from '../views/processDefine/componentMap';

const taskForm = {
  labelWidth: '120px',
  formItems: [
    { name: 'name', label: '唯一编码', component: 'Input', componentProps: { placeholder: '请输入唯一编码' } },
    { name: 'displayName', label: '显示名称', component: 'Input', componentProps: { placeholder: '请输入显示名称' } },
    { name: 'form', label: '表单', component: 'Input', componentProps: { placeholder: '请输入表单标识' } },
    { name: 'assignee', label: '参与人', render: () => AssigneeInput },
    { name: 'assignmentHandler', label: '参与人处理类', component: 'Input', componentProps: { placeholder: 'role:角色名 或 dept_leader' } },
    { name: 'candidateUsers', label: '候选用户', render: () => AssigneeInput },
    { name: 'taskType', label: '任务类型', component: 'Select', defaultValue: 'Major', componentProps: { options: [{ label: '主办', value: 'Major' }, { label: '协办', value: 'Aidant' }] } },
    { name: 'performType', label: '参与类型', component: 'Select', defaultValue: 'ANY', componentProps: { options: [{ label: '普通参与', value: 'ANY' }, { label: '会签参与', value: 'ALL' }] } },
    { name: 'preInterceptors', label: '前置拦截器', component: 'Input', componentProps: { placeholder: '多个拦截器使用英文逗号分隔' } },
    { name: 'postInterceptors', label: '后置拦截器', component: 'Input', componentProps: { placeholder: '多个拦截器使用英文逗号分隔' } },
  ],
};

const processForm = {
  labelWidth: '130px',
  formItems: [
    { name: 'name', label: '流程定义唯一编码', component: 'Input' },
    { name: 'displayName', label: '流程定义显示名称', component: 'Input' },
    { name: 'type', label: '流程类型', component: 'Input', rules: 'required', componentProps: { placeholder: '请输入流程类型' } },
    {
      name: 'instanceUrl',
      label: '实例启动表单',
      component: 'Select',
      componentProps: { options: wfFormOptions },
    },
    { name: 'instanceNoClass', label: '实例编号生成器', component: 'Input' },
    { name: 'preInterceptors', label: '流程前置拦截器', component: 'Input', componentProps: { placeholder: '多个拦截器使用英文逗号分隔' } },
    { name: 'postInterceptors', label: '流程后置拦截器', component: 'Input', componentProps: { placeholder: '多个拦截器使用英文逗号分隔' } },
  ],
};

const SnakerFlowDesigner = defineComponent({
  name: 'SnakerFlowDesigner',
  inheritAttrs: false,
  props: {
    modelValue: { type: Object, default: () => ({}) },
    mode: { type: String, default: 'dingtalk' },
  },
  emits: ['update:modelValue', 'on-save', 'node-click', 'edge-click'],
  setup(props, { emit, attrs, slots }) {
    return () => h(
      FlowDesigner as Component,
      {
        ...attrs,
        value: props.modelValue,
        mode: props.mode,
        typePrefix: 'snaker:',
        defaultEdgeType: 'snaker:transition',
        initDndPanel: true,
        processForm,
        dndPanel: [{ type: 'snaker:task', label: '审批人', form: taskForm }],
        'onUpdate:value': (value: Record<string, unknown>) => emit('update:modelValue', value),
        'onOnSave': (value: Record<string, unknown>) => emit('on-save', value),
        onNodeClick: (value: unknown) => emit('node-click', value),
        onEdgeClick: (value: unknown) => emit('edge-click', value),
      },
      slots,
    );
  },
});

export default SnakerFlowDesigner;
