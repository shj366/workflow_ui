import type { Component } from 'vue';

import { defineComponent, h } from 'vue';

import FlowDesigner from 'mldong-flow-designer-plus';

import { wfFormOptions } from '../views/processDefine/componentMap';
import { taskFormOptions } from '../views/processTask/componentMap';
import AssigneeInput from '../views/processDesign/snakerflow/assigneeInput.vue';

import 'mldong-flow-designer-plus/lib/style.css';

const CANVAS_TASK_NODE_SIZE = { width: 185, height: 35 } as const;

function getExpressionLabel(expression: string) {
  const equality = expression.match(/^\s*[\w.]+\s*==\s*'([^']+)'\s*$/);
  if (equality) {
    return equality[1];
  }

  const inequality = expression.match(/^\s*[\w.]+\s*!=\s*'([^']+)'\s*$/);
  if (inequality) {
    return `非${inequality[1]}`;
  }

  if (/\s+in\s*\(/.test(expression)) {
    const values = [...expression.matchAll(/'([^']+)'/g)].map(
      (match) => match[1],
    );
    if (values.length > 0) {
      return values.join('、');
    }
  }

  return expression;
}

function normalizeFlowData(value: Record<string, any>, mode: string) {
  const nodes = Array.isArray(value.nodes)
    ? value.nodes.map((node: Record<string, any>) => {
        if (mode !== 'canvas' || node.type !== 'snaker:task') {
          return node;
        }

        if (
          node.properties?.width === CANVAS_TASK_NODE_SIZE.width &&
          node.properties?.height === CANVAS_TASK_NODE_SIZE.height
        ) {
          return node;
        }

        return {
          ...node,
          properties: {
            ...node.properties,
            ...CANVAS_TASK_NODE_SIZE,
          },
        };
      })
    : value.nodes;
  const edges = Array.isArray(value.edges)
    ? value.edges.map((edge: Record<string, any>) => {
        const type =
          edge.type === 'snaker:line' ? 'snaker:transition' : edge.type;
        const expression =
          typeof edge.properties?.expr === 'string'
            ? edge.properties.expr.trim()
            : '';
        const label =
          typeof edge.text?.value === 'string' ? edge.text.value.trim() : '';
        const expressionLabel = expression
          ? getExpressionLabel(expression)
          : '';

        if (type === edge.type && (label || !expressionLabel)) {
          return edge;
        }

        return {
          ...edge,
          type,
          ...(label || !expressionLabel
            ? {}
            : { text: { ...edge.text, value: expressionLabel } }),
        };
      })
    : value.edges;
  const hasNodeChanges =
    Array.isArray(nodes) &&
    nodes.some(
      (node: Record<string, unknown>, index: number) =>
        node !== value.nodes[index],
    );
  const hasEdgeChanges =
    Array.isArray(edges) &&
    edges.some(
      (edge: Record<string, unknown>, index: number) =>
        edge !== value.edges[index],
    );
  return hasNodeChanges || hasEdgeChanges
    ? {
        ...value,
        ...(hasNodeChanges ? { nodes } : {}),
        ...(hasEdgeChanges ? { edges } : {}),
      }
    : value;
}

const taskForm = {
  labelWidth: '120px',
  formItems: [
    {
      name: 'name',
      label: '唯一编码',
      component: 'Input',
      componentProps: { placeholder: '请输入唯一编码' },
    },
    {
      name: 'displayName',
      label: '显示名称',
      component: 'Input',
      componentProps: { placeholder: '请输入显示名称' },
    },
    {
      name: 'form',
      label: '表单',
      component: 'Select',
      componentProps: {
        options: taskFormOptions,
        placeholder: '请选择表单',
        allowClear: true,
      },
    },
    { name: 'assignee', label: '参与人', render: () => AssigneeInput },
    {
      name: 'assignmentHandler',
      label: '参与人处理类',
      component: 'Input',
      componentProps: { placeholder: 'role:角色名 或 dept_leader' },
    },
    { name: 'candidateUsers', label: '候选用户', render: () => AssigneeInput },
    {
      name: 'taskType',
      label: '任务类型',
      component: 'Select',
      defaultValue: 'Major',
      componentProps: {
        options: [
          { label: '主办', value: 'Major' },
          { label: '协办', value: 'Aidant' },
        ],
      },
    },
    {
      name: 'performType',
      label: '参与类型',
      component: 'Select',
      defaultValue: 'ANY',
      componentProps: {
        options: [
          { label: '普通参与', value: 'ANY' },
          { label: '会签参与', value: 'ALL' },
        ],
      },
    },
    {
      name: 'preInterceptors',
      label: '前置拦截器',
      component: 'Input',
      componentProps: { placeholder: '多个拦截器使用英文逗号分隔' },
    },
    {
      name: 'postInterceptors',
      label: '后置拦截器',
      component: 'Input',
      componentProps: { placeholder: '多个拦截器使用英文逗号分隔' },
    },
  ],
};

const processForm = {
  labelWidth: '130px',
  formItems: [
    { name: 'name', label: '流程定义唯一编码', component: 'Input' },
    { name: 'displayName', label: '流程定义显示名称', component: 'Input' },
    {
      name: 'type',
      label: '流程类型',
      component: 'Input',
      rules: 'required',
      componentProps: { placeholder: '请输入流程类型' },
    },
    {
      name: 'instanceUrl',
      label: '实例启动表单',
      component: 'Select',
      componentProps: { options: wfFormOptions },
    },
    { name: 'instanceNoClass', label: '实例编号生成器', component: 'Input' },
    {
      name: 'preInterceptors',
      label: '流程前置拦截器',
      component: 'Input',
      componentProps: { placeholder: '多个拦截器使用英文逗号分隔' },
    },
    {
      name: 'postInterceptors',
      label: '流程后置拦截器',
      component: 'Input',
      componentProps: { placeholder: '多个拦截器使用英文逗号分隔' },
    },
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
    return () =>
      h(
        FlowDesigner as Component,
        {
          ...attrs,
          value: normalizeFlowData(
            props.modelValue as Record<string, any>,
            props.mode,
          ),
          mode: props.mode,
          typePrefix: 'snaker:',
          defaultEdgeType: 'snaker:transition',
          dagreOptions: {
            rankdir: 'LR',
            nodesep: 80,
            ranksep: 120,
            isDefaultAnchor: true,
          },
          initDndPanel: true,
          processForm,
          dndPanel: [{ type: 'snaker:task', label: '审批人', form: taskForm }],
          'onUpdate:value': (value: Record<string, unknown>) =>
            emit('update:modelValue', value),
          onOnSave: (value: Record<string, unknown>) => emit('on-save', value),
          onNodeClick: (value: unknown) => emit('node-click', value),
          onEdgeClick: (value: unknown) => emit('edge-click', value),
        },
        slots,
      );
  },
});

export default SnakerFlowDesigner;
