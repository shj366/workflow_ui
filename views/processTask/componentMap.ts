import type { Component } from 'vue';

import { markRaw } from 'vue';

const taskFormComponentMap = new Map<string, Component>();
export const taskFormOptions: Array<{ label: string; value: string }> = [];

// Match both `TaskForm.vue` and the existing `taskForm.vue` naming convention.
const modules = import.meta.glob('../../views/**/*[Tt]askForm.vue', {
  eager: true,
});

Object.keys(modules).forEach((key) => {
  const mod = modules[key] as any;
  const component = mod.default || {};

  const fileName =
    key
      .split('/')
      .pop()
      ?.replace(/\.\w+$/, '') || '';
  const componentName = component.name || fileName;

  const cArr = componentName.split('|');
  const value = cArr[0];
  const label = cArr.length >= 2 ? cArr[1] : cArr[0];

  taskFormComponentMap.set(value, markRaw(component));
  taskFormOptions.push({
    value,
    label,
  });
});

export { taskFormComponentMap };
