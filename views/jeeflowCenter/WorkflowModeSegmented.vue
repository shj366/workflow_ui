<script setup lang="ts">
const props = defineProps<{
  modelValue: 'canvas' | 'dingtalk';
}>();

const emit = defineEmits<{
  'update:modelValue': [value: 'canvas' | 'dingtalk'];
}>();

const options = [
  { label: '画布模式', value: 'canvas' as const },
  { label: '钉钉模式', value: 'dingtalk' as const },
];

function select(value: 'canvas' | 'dingtalk') {
  if (props.modelValue !== value) emit('update:modelValue', value);
}
</script>

<template>
  <div class="workflow-mode-segmented" role="tablist" aria-label="流程设计器模式">
    <button
      v-for="option in options"
      :key="option.value"
      class="workflow-mode-segmented__item"
      :class="{ 'is-active': modelValue === option.value }"
      type="button"
      role="tab"
      :aria-selected="modelValue === option.value"
      @click="select(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.workflow-mode-segmented {
  display: inline-flex;
  align-items: center;
  padding: 3px;
  border: 1px solid var(--jf-border, #d9d9d9);
  border-radius: 7px;
  background: var(--jf-fill, #f5f5f5);
}

.workflow-mode-segmented__item {
  min-width: 76px;
  padding: 4px 10px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--jf-text-secondary, #666);
  cursor: pointer;
  font-size: 12px;
  line-height: 20px;
  transition: color 0.15s, background 0.15s, box-shadow 0.15s;
}

.workflow-mode-segmented__item:hover {
  color: var(--jf-primary, #1677ff);
}

.workflow-mode-segmented__item.is-active {
  background: var(--jf-bg, #fff);
  color: var(--jf-primary, #1677ff);
  box-shadow: 0 1px 3px rgb(0 0 0 / 12%);
  font-weight: 600;
}
</style>
