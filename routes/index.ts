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
];

export default routes;
