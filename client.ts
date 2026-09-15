import { useAccess } from '@vben/access';
import { useAccessStore, useUserStore } from '@vben/stores';
import { z } from 'zod';

import {
  createJeeflowUi,
  type JeeflowRoleRow,
  type JeeflowUiContext,
  type JeeflowUserRow,
} from '@mldong/jeeflow-ui';

import { getAllSysRoleApi } from '#/api/role';
import {
  getSysUserInfoApi,
  getSysUserListApi,
} from '#/api/core/user';

const workflowPermissionMap: Record<string, string[]> = {
  'wf:processDesign:listByType': ['workflow:apply:add'],
  'wf:processDesign:page': ['workflow:process-design:add'],
  'wf:processDesign:save': ['workflow:process-design:add', 'workflow:process-design:edit'],
  'wf:processDesign:deploy': ['workflow:process-design:deploy'],
  'wf:processDesign:remove': ['workflow:process-design:del'],
  'wf:processDefine:page': ['workflow:process-define:add'],
  'wf:processTask:todoList': ['workflow:task:todo:view'],
  'wf:processTask:doneList': ['workflow:task:done:view'],
  'wf:processTask:execute': ['workflow:task:complete'],
  'wf:processInstance:page': ['workflow:instance:my:view'],
  'wf:processInstance:ccList': ['workflow:instance:cc:view'],
};

const UserRecordSchema = z.object({
  id: z.union([z.string(), z.number()]),
  username: z.string().optional(),
  nickname: z.string().optional(),
  dept: z.object({ name: z.string().optional() }).optional(),
  dept_name: z.string().optional(),
});
const UserCollectionSchema = z.union([
  UserRecordSchema.array(),
  z.object({ items: UserRecordSchema.array().optional(), rows: UserRecordSchema.array().optional() }),
  UserRecordSchema,
]);
const RoleRecordSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
});

type UserRecord = z.infer<typeof UserRecordSchema>;

let context: JeeflowUiContext | undefined;

export function useJeeflowUiClient(): JeeflowUiContext {
  if (context) return context;

  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const { hasAccessByCodes } = useAccess();

  context = createJeeflowUi({
    baseUrl: '/api/v1',
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
        const parsed = RoleRecordSchema.array().safeParse(await getAllSysRoleApi());
        if (!parsed.success) return [];
        return parsed.data
          .filter((role) => !keyword || role.name.includes(keyword))
          .map((role) => ({ roleId: String(role.id), roleName: role.name }));
      },
    },
  });

  return context;
}

function extractUsers(value: unknown): JeeflowUserRow[] {
  const parsed = UserCollectionSchema.safeParse(value);
  if (!parsed.success) return [];
  const rows: UserRecord[] = Array.isArray(parsed.data)
    ? parsed.data
    : 'id' in parsed.data
      ? [parsed.data]
      : parsed.data.items ?? parsed.data.rows ?? [];
  return rows.map((user) => ({
    userId: String(user.id),
    realName: user.nickname || user.username || String(user.id),
    deptName: user.dept?.name || user.dept_name,
  }));
}
