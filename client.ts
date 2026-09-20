import { useAppConfig } from '@vben/hooks';
import { useAccess } from '@vben/access';
import { useAccessStore, useUserStore } from '@vben/stores';

import { createJeeflowUi } from './assets/jeeflow-ui/jeeflow-ui.js';
import type {
  JeeflowRoleRow,
  JeeflowUiContext,
  JeeflowUserRow,
} from './assets/jeeflow-ui/jeeflow-ui.js';
import './assets/jeeflow-ui/jeeflow-ui.css';
import { getAllSysRoleApi } from '#/api/role';
import { requestClient } from '#/api/request';
import { getDictDataDetailApi } from '#/plugins/dict/api';
import {
  getSysUserInfoApi,
  getSysUserListApi,
} from '#/api/core/user';

const workflowPermissionMap: Record<string, string[]> = {
  'wf:processDesign:listByType': ['workflow:apply:add'],
  'wf:processDesign:page': ['workflow:process-design:add'],
  'wf:processDesign:save': ['workflow:process-design:add', 'workflow:process-design:edit'],
  'wf:processDesign:update': ['workflow:process-design:edit'],
  'wf:processDesign:updateDefine': ['workflow:process-design:edit'],
  'wf:processDesign:deploy': ['workflow:process-design:deploy'],
  'wf:processDesign:redeploy': ['workflow:process-design:deploy'],
  'wf:processDesign:remove': ['workflow:process-design:del'],
  'wf:processDefine:page': ['workflow:process-define:add'],
  'wf:processDefine:remove': ['workflow:process-define:del'],
  'wf:processDefine:upAndDown': ['workflow:process-define:edit'],
  'wf:processDefine:startAndExecute': ['workflow:process:start'],
  'wf:processTask:todoList': ['workflow:task:todo:view'],
  'wf:processTask:doneList': ['workflow:task:done:view'],
  'wf:processTask:execute': ['workflow:task:complete'],
  'wf:processTask:jumpAbleTaskNameList': ['workflow:task:jump'],
  'wf:processTask:candidatePage': ['workflow:task:add-candidate'],
  'wf:processTask:addCandidate': ['workflow:task:add-candidate'],
  'wf:processTask:surrogate': ['workflow:task:surrogate'],
  'wf:processInstance:page': ['workflow:instance:my:view'],
  'wf:processInstance:withdraw': ['workflow:instance:my:withdraw'],
  'wf:processInstance:ccList': ['workflow:instance:cc:view'],
  'wf:processInstance:createCCInstance': ['workflow:task:cc'],
  'wf:processInstance:updateCCStatus': ['workflow:instance:cc:read'],
  'wf:processSurrogate:page': ['workflow:task:surrogate'],
  'wf:processSurrogate:save': ['workflow:task:surrogate'],
  'wf:processSurrogate:remove': ['workflow:task:surrogate'],
};

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);
const apiBaseUrl = `${apiURL.replace(/\/+$/, '')}/api/v1`;


let context: JeeflowUiContext | undefined;

export function useJeeflowUiClient(): JeeflowUiContext {
  if (context) return context;

  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const { hasAccessByCodes } = useAccess();

  context = createJeeflowUi({
    baseUrl: apiBaseUrl,
    getToken: () => accessStore.accessToken || null,
    getOperator: () => String(userStore.userInfo?.id ?? ''),
    hasPermission: (codes: string[]) => {
      if (userStore.userInfo?.is_superuser === true) return true;
      const mappedCodes = codes.flatMap((code) => workflowPermissionMap[code] ?? []);
      return mappedCodes.length > 0 && hasAccessByCodes(mappedCodes);
    },
    adapters: {
      listUsers: async (keyword: string): Promise<JeeflowUserRow[]> => {
        const result = await getSysUserListApi({
          username: keyword || undefined,
          page: 1,
          size: 50,
        });
        return extractUsers(result);
      },
      getUsersByIds: async (ids: string[]): Promise<JeeflowUserRow[]> => {
        const users = await Promise.all(
          ids.map((id) => getSysUserInfoApi(Number(id)).catch(() => null)),
        );
        return users.flatMap((user) => extractUsers(user));
      },
      listRoles: async (keyword: string): Promise<JeeflowRoleRow[]> => {
        const roles = await getAllSysRoleApi();
        return roles
          .filter((role) => !keyword || role.name.includes(keyword))
          .map((role) => ({ roleId: String(role.id), roleName: role.name }));
      },
      getDict: async (code: string) => {
        const items = await getDictDataDetailApi(code);
        return items
          .filter((item) => item.status === 1)
          .map((item) => ({ value: item.value, label: item.label }));
      },
      upload: async (file: File) => {
        const result = await requestClient.upload<{ url: string }>('/api/v1/sys/files/upload', { file });
        if (!result?.url) throw new Error('文件上传响应缺少 url');
        return result.url;
      },
    },
  });

  return context;
}

function extractUsers(value: unknown): JeeflowUserRow[] {
  const rows = Array.isArray(value)
    ? value
    : isUserCollection(value)
      ? value.items ?? value.rows ?? [value]
      : [];
  return rows.filter(isUserRecord).map((user) => ({
    userId: String(user.id),
    realName: user.nickname || user.username || String(user.id),
    deptName: user.dept?.name || user.dept_name,
  }));
}

type UserRecord = {
  id: string | number;
  username?: string;
  nickname?: string;
  dept?: { name?: string };
  dept_name?: string;
};

function isUserCollection(value: unknown): value is { items?: unknown[]; rows?: unknown[] } & UserRecord {
  return typeof value === 'object' && value !== null;
}

function isUserRecord(value: unknown): value is UserRecord {
  if (typeof value !== 'object' || value === null || !('id' in value)) return false;
  const record = value as { id: unknown };
  return typeof record.id === 'string' || typeof record.id === 'number';
}
