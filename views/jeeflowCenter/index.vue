<script setup lang="ts">
import type { Component } from 'vue';

import { computed, provide } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  JfApplyListPage,
  JfCcListPage,
  JfDonePage,
  JfMyInstancePage,
  JfProcessDefinePage,
  JfSurrogatePage,
  JfTodoPage,
  JfWorkbenchPage,
  JeeflowUiKey,
} from '../../assets/jeeflow-ui/jeeflow-ui.js';
import ProcessDesignSwitchable from './ProcessDesignSwitchable.vue';
import { useJeeflowUiClient } from '../../client';

const route = useRoute();
const router = useRouter();
const jeeflowUi = useJeeflowUiClient();
provide(JeeflowUiKey, jeeflowUi);

const pageByPath: Record<string, Component> = {
  '/workflow/center': JfWorkbenchPage,
  '/workflow/processInstance/applyList': JfApplyListPage,
  '/workflow/processTask/todo': JfTodoPage,
  '/workflow/processTask/done': JfDonePage,
  '/workflow/processInstance/my': JfMyInstancePage,
  '/workflow/processInstance/cc': JfCcListPage,
  '/workflow/processDesign': ProcessDesignSwitchable,
  '/workflow/processDefine': JfProcessDefinePage,
  '/workflow/processSurrogate': JfSurrogatePage,
};

const workflowPath = computed(() => route.path.replace(/^\/plugins(?=\/workflow\/)/, ''));
const currentComponent = computed(() => pageByPath[workflowPath.value] ?? JfWorkbenchPage);

const workflowPrefix = computed(() =>
  route.path.startsWith('/plugins/workflow/') ? '/plugins/workflow' : '/workflow',
);

const routeByKey: Record<string, string> = {
  workbench: '/center',
  apply: '/processInstance/applyList',
  todo: '/processTask/todo',
  done: '/processTask/done',
  mine: '/processInstance/my',
  cc: '/processInstance/cc',
  define: '/processDefine',
  design: '/processDesign',
  surrogate: '/processSurrogate',
};

function onGoto(key: string) {
  const suffix = routeByKey[key];
  if (!suffix) return;
  const path = `${workflowPrefix.value}${suffix}`;
  if (path !== route.path) router.push(path);
}
</script>

<template>
  <div class="jeeflow-page-host">
    <component :is="currentComponent" :key="route.path" @goto="onGoto" />
  </div>
</template>

<style scoped>
.jeeflow-page-host {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  height: 100%;
}
</style>
