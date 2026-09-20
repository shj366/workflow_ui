import type { Component, InjectionKey } from 'vue'
export interface JeeflowUserRow { userId: string; realName: string; deptName?: string; postName?: string }
export interface JeeflowRoleRow { roleId: string; roleName: string }
export interface JfMenuItem { key: string; title: string; icon?: string; component?: Component; perms?: string[] }
export interface JeeflowPageResult<T> { rows: T[]; recordCount: number; totalPage: number; pageNum: number; pageSize: number }
export interface JeeflowTaskRow { id: string; taskName: string; displayName?: string; createTime?: string; instanceCreateTime?: string; instanceExt?: Record<string, unknown> }
export interface JeeflowDefine { id: string; name: string; displayName?: string; type?: string; state?: number; version?: number }
export interface JeeflowDesign extends JeeflowDefine { isDeployed?: number; jsonObject?: Record<string, unknown> | null }
export interface JeeflowUiContext {
  api: { processTask: { todoList(query: { pageNum?: number; pageSize?: number }): Promise<JeeflowPageResult<JeeflowTaskRow>> }; processDesign: { page(query: Record<string, unknown>): Promise<JeeflowPageResult<JeeflowDesign>>; detail(id: string): Promise<JeeflowDesign>; save(data: Record<string, unknown>): Promise<{ id: string }>; update(id: string, data: Record<string, unknown>): Promise<void>; updateDefine(id: string, data: Record<string, unknown>): Promise<void>; deploy(id: string): Promise<{ processDefineId: string }>; redeploy(id: string): Promise<{ processDefineId: string }>; remove(id: string | string[]): Promise<void> } }
  can(codes: string[]): boolean
}
export interface JeeflowUiConfig { baseUrl: string | (() => string); getToken?: () => string | null; getOperator: () => string; hasPermission?: (codes: string[]) => boolean; adapters?: Record<string, unknown> }
export declare const JeeflowUiKey: InjectionKey<JeeflowUiContext>
export declare function createJeeflowUi(config: JeeflowUiConfig): JeeflowUiContext
export declare const JfLayout: Component
export declare const JfApplyListPage: Component
export declare const JfCcListPage: Component
export declare const JfDonePage: Component
export declare const JfMyInstancePage: Component
export declare const JfProcessDefinePage: Component
export declare const JfProcessDesignPage: Component
export declare const JfSurrogatePage: Component
export declare const JfTodoPage: Component
export declare const JfWorkbenchPage: Component
