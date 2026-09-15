<script setup lang="ts">
import { computed, provide, ref } from 'vue';

import {
  JfApplyListPage,
  JfCcListPage,
  JfDonePage,
  JfLayout,
  JfMyInstancePage,
  JfProcessDefinePage,
  JfProcessDesignPage,
  JfSurrogatePage,
  JfTodoPage,
  JfWorkbenchPage,
  JeeflowUiKey,
} from '@mldong/jeeflow-ui';
import type { JfMenuItem } from '@mldong/jeeflow-ui';

import { useJeeflowUiClient } from '../../client';

const menus: JfMenuItem[] = [
  { key: 'workbench', title: '工作台', icon: 'home', component: JfWorkbenchPage },
  { key: 'apply', title: '发起申请', icon: 'apply', component: JfApplyListPage, perms: ['wf:processDesign:listByType'] },
  { key: 'todo', title: '我的待办', icon: 'todo', component: JfTodoPage, perms: ['wf:processTask:todoList'] },
  { key: 'done', title: '我的已办', icon: 'done', component: JfDonePage, perms: ['wf:processTask:doneList'] },
  { key: 'mine', title: '我发起的', icon: 'mine', component: JfMyInstancePage, perms: ['wf:processInstance:page'] },
  { key: 'cc', title: '我的抄送', icon: 'cc', component: JfCcListPage, perms: ['wf:processInstance:ccList'] },
  { key: 'define', title: '流程定义', icon: 'define', component: JfProcessDefinePage, perms: ['wf:processDefine:page'] },
  { key: 'design', title: '流程设计', icon: 'design', component: JfProcessDesignPage, perms: ['wf:processDesign:page'] },
  { key: 'surrogate', title: '我的委托', icon: 'surrogate', component: JfSurrogatePage, perms: ['wf:processSurrogate:page'] },
];

const jeeflowUi = useJeeflowUiClient();
provide(JeeflowUiKey, jeeflowUi);

const currentKey = ref('workbench');
const currentComponent = computed(() =>
  menus.find((menu) => menu.key === currentKey.value)?.component ?? JfWorkbenchPage,
);

function onSelect(key: string) {
  if (menus.some((menu) => menu.key === key)) currentKey.value = key;
}
</script>

<template>
  <JfLayout :menus="menus" title="流程中心" :default-key="currentKey" @select="onSelect">
    <component :is="currentComponent" :key="currentKey" @goto="onSelect" />
  </JfLayout>
</template>
