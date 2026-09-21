import type { Component } from 'vue';

import { markRaw } from 'vue';

import DefaultWfForm from './wfForm/defaultWfForm.vue';
import SchemaWfForm from './wfForm/schemaWfForm.vue';

const componentMap = new Map<string, Component>();
export const wfFormOptions: Array<{ label: string; value: string }> = [];

function registerForm(value: string, label: string, component: Component) {
  if (componentMap.has(value)) return;
  componentMap.set(value, markRaw(component));
  wfFormOptions.push({ value, label });
}

// 内置表单显式注册，避免 glob 在不同构建模式下无法展开，导致下拉框为空。
registerForm('DefaultWfForm', '默认表单', DefaultWfForm);
registerForm('SchemaWfForm', '元数据表单', SchemaWfForm);

export { componentMap };
