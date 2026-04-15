import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'PluginWfCenter',
    path: '/plugins/workflow/center',
    component: () => import('../views/workflowCenter/index.vue'),
    meta: {
      icon: 'ant-design:appstore-outlined',
      title: '工作中心',
      order: 1,
    },
  },
  {
    name: 'PluginWfApplyList',
    path: '/plugins/workflow/processInstance/applyList',
    component: () => import('../views/processInstance/applyList.vue'),
    meta: {
      icon: 'ant-design:form-outlined',
      title: '发起申请',
    },
  },
  {
    name: 'PluginWfProcessDesign',
    path: '/plugins/workflow/processDesign',
    component: () => import('../views/processDesign/index.vue'),
    meta: {
      icon: 'ant-design:cluster-outlined',
      title: '流程设计',
    },
  },
  {
    name: 'PluginWfProcessDefine',
    path: '/plugins/workflow/processDefine',
    component: () => import('../views/processDefine/index.vue'),
    meta: {
      icon: 'ant-design:setting-outlined',
      title: '流程定义',
    },
  },
  {
    name: 'ProcessTaskTodo',
    path: '/plugins/workflow/processTask/todo',
    component: () => import('../views/processTask/todo.vue'),
    meta: {
      icon: 'ant-design:profile-outlined',
      title: '待办任务',
    },
  },
  {
    name: 'ProcessTaskDone',
    path: '/plugins/workflow/processTask/done',
    component: () => import('../views/processTask/done.vue'),
    meta: {
      icon: 'ant-design:check-circle-outlined',
      title: '已办任务',
    },
  },
  {
    name: 'ProcessInstanceMy',
    path: '/plugins/workflow/processInstance/my',
    component: () => import('../views/processInstance/my.vue'),
    meta: {
      icon: 'ant-design:user-switch-outlined',
      title: '我的流程',
    },
  },
  {
    name: 'ProcessInstanceCc',
    path: '/plugins/workflow/processInstance/cc',
    component: () => import('../views/processInstance/ccList.vue'),
    meta: {
      icon: 'ant-design:mail-outlined',
      title: '抄送给我',
    },
  },
];

export default routes;
