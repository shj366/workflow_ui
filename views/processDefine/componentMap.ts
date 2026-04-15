import type { Component } from 'vue';

import { markRaw } from 'vue';

const componentMap = new Map<string, Component>();
export const wfFormOptions: Array<{ label: string; value: string }> = [];

// Scan for *WfForm.vue components relative to this file
// Adjust glob pattern to match your project structure
const modules = import.meta.glob('../../views/**/*WfForm.vue', { eager: true });

Object.keys(modules).forEach((key) => {
  const mod = modules[key] as any;
  const component = (mod && (mod.default || mod)) || {};

  const fileName =
    key
      .split('/')
      .pop()
      ?.replace(/\.\w+$/, '') || '';

  // 组件名优先：支持 "key|中文标题" 格式；否则退回到文件名
  const rawName = (component.name as string | undefined) || fileName;
  const [rawKey, rawLabel] = rawName.split('|');

  const value = (rawKey || '').trim();
  if (!value) {
    return;
  }

  // label 选择优先级：组件自带 displayName > 管道右侧中文标题 > key 本身
  const displayName = (component as any).displayName as string | undefined;
  const label =
    (displayName && displayName.trim()) ||
    (rawLabel && rawLabel.trim()) ||
    value;

  wfFormOptions.push({
    value,
    label,
  });

  componentMap.set(value, markRaw(component));
});

export { componentMap };
