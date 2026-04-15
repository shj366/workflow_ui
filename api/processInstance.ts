import { requestClient } from '#/api/request';

export interface StartProcessRequest {
  processDefineId: string;
  businessNo?: string;
  args?: Record<string, any>;
}

export interface StartAndExecuteRequest {
  processDefineId: string;
  formData?: Record<string, any>;
}

export interface ProcessInstanceItem {
  id: string;
  processDefineId: string;
  state: number;
  businessNo?: string;
  operator?: string;
  createdTime?: string;
  createTime?: string;
  variable?: string;
  // 后端从 variable 解析出的扩展数据（发起人信息、表单字段等）
  ext?: Record<string, any>;
  // 表单数据，仅包含以 f_ 开头的字段及其去前缀后的键名
  formData?: Record<string, any>;
  defineName?: string;
  displayName?: string;
  version?: number;
}

/** 启动流程实例 */
export async function startProcessApi(data: StartProcessRequest) {
  return await requestClient.post<ProcessInstanceItem>(
    '/api/v1/wf/processInstance/start',
    data,
  );
}

/** 启动流程并执行第一个任务（发起申请） */
export async function startAndExecuteApi(data: StartAndExecuteRequest) {
  return await requestClient.post<ProcessInstanceItem>(
    '/api/v1/wf/processInstance/startAndExecute',
    data,
  );
}

export interface ProcessInstancePageQuery {
  page: number;
  size: number;
  businessNo?: string;
  state?: number;
}

export interface ProcessInstancePageResult {
  items: ProcessInstanceItem[];
  total: number;
}

/** 分页查询我发起的流程 */
export async function fetchMyProcessInstancePageApi(
  params: ProcessInstancePageQuery,
) {
  return await requestClient.get<ProcessInstancePageResult>(
    '/api/v1/wf/processInstance/my',
    {
      params,
    },
  );
}

export interface ProcessCCInstanceItem {
  id: string;
  processInstanceId: string;
  actorId: string;
  state: number;
  // 抄送时间
  createTime?: string;
  // 流程实例创建时间
  instanceCreateTime?: string;
  // 关联的流程实例基础信息
  businessNo?: string;
  operator?: string;
  processState?: number;
  // 实例扩展信息（从流程实例 variable 解析），包含 autoGenTitle / f_title / u_realName 等
  instanceExt?: Record<string, any>;
}

export interface ProcessCCPageQuery {
  page: number;
  size: number;
  state?: number;
}

export interface ProcessCCPageResult {
  items: ProcessCCInstanceItem[];
  total: number;
}

/** 分页查询抄送给我的流程 */
export async function fetchCcProcessInstancePageApi(
  params: ProcessCCPageQuery,
) {
  return await requestClient.get<ProcessCCPageResult>(
    '/api/v1/wf/processInstance/cc',
    {
      params,
    },
  );
}

/** 标记抄送为已读 */
export async function markCcAsReadApi(ccId: string) {
  return await requestClient.post<boolean>(
    `/api/v1/wf/processInstance/cc/read/${ccId}`,
  );
}

/** 撤回流程实例 */
export async function withdrawProcessInstanceApi(ids: string[]) {
  return await requestClient.post<number>(
    '/api/v1/wf/processInstance/withdraw',
    ids,
  );
}

export interface ProcessInstanceDetail {
  id: string;
  processDefineId: string;
  state: number;
  businessNo?: string;
  operator?: string;
  createdTime?: string;
  displayName?: string;
  defineName?: string;
  version?: number;
  jsonObject?: Record<string, any>;
  formData?: Record<string, any>;
}

/** 获取流程实例详情 */
export async function getProcessInstanceDetailApi(id: string) {
  return await requestClient.get<ProcessInstanceDetail>(
    '/api/v1/wf/processInstance/detail',
    {
      params: { id },
    },
  );
}

export interface ApprovalRecord {
  id: string;
  taskName: string;
  displayName: string;
  operator: string;
  taskState: number;
  createdTime?: string;
  finishTime?: string;
  operatorName?: string;
  approvalComment?: string;
  submitType?: string;
}

/** 获取审批记录 */
export async function getApprovalRecordApi(id: string) {
  return await requestClient.get<ApprovalRecord[]>(
    '/api/v1/wf/processInstance/approvalRecord',
    {
      params: { id },
    },
  );
}

export interface HighLightData {
  activeNodes: string[];
  historyNodes: string[];
  // 兼容 mldong 的 SnakerFlowDesigner 使用的字段
  activeNodeNames?: string[];
  historyNodeNames?: string[];
  historyEdgeNames?: string[];
}

/** 获取流程高亮数据 */
export async function getHighLightApi(id: string) {
  return await requestClient.get<HighLightData>(
    '/api/v1/wf/processInstance/highLight',
    {
      params: { id },
    },
  );
}

/** 获取用户列表（用于选择下一节点处理人） */
export async function fetchUserListApi() {
  return await requestClient.get<
    Array<{ id: string; nickname: string; username: string }>
  >('/api/v1/wf/processInstance/users');
}
