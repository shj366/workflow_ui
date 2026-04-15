import { requestClient } from '#/api/request';

export interface ProcessTaskPageQuery {
  page: number;
  size: number;
  taskName?: string;
  displayName?: string;
}

export interface ProcessTaskItem {
  id: string;
  // 流程实例 ID
  processInstanceId: string;
  // 任务编码 / 名称
  taskName: string;
  displayName?: string;
  // 任务状态（10：进行中；20：已完成）
  taskState: number;
  // 当前处理人
  operator?: string;
  // 任务到达时间
  createTime?: string;
  // 任务完成时间
  finishTime?: string;
  // 实例创建时间
  instanceCreateTime?: string;
  // 实例扩展信息（从流程实例 variable 解析），包含 autoGenTitle / f_title / u_realName 等
  instanceExt?: Record<string, any>;
}

export interface ProcessTaskPageResult {
  items: ProcessTaskItem[];
  total: number;
}

/** 分页查询待办任务 */
export async function fetchTodoTaskPageApi(params: ProcessTaskPageQuery) {
  return await requestClient.get<ProcessTaskPageResult>(
    '/api/v1/wf/processTask/todo',
    {
      params,
    },
  );
}

/** 分页查询已办任务 */
export async function fetchDoneTaskPageApi(params: ProcessTaskPageQuery) {
  return await requestClient.get<ProcessTaskPageResult>(
    '/api/v1/wf/processTask/done',
    {
      params,
    },
  );
}

export interface CompleteTaskRequest {
  taskId: string;
  args?: Record<string, any>;
}

/** 完成任务 */
export async function completeProcessTaskApi(data: CompleteTaskRequest) {
  return await requestClient.post('/api/v1/wf/processTask/complete', data);
}

/** 获取流程实例的任务列表 */
export async function fetchTaskListApi(instanceId: string) {
  return await requestClient.get<ProcessTaskItem[]>(
    '/api/v1/wf/processTask/list',
    {
      params: { instanceId },
    },
  );
}

/** 加签/增加参与人 */
export async function addCandidateApi(data: {
  actorIds: string[];
  processTaskId: number | string;
}) {
  return await requestClient.post('/api/v1/wf/processTask/addCandidate', data);
}

/** 获取任务详情（含节点表单数据） */
export async function getTaskDetailApi(taskId: number | string) {
  return await requestClient.get<{
    displayName?: string;
    ext: Record<string, any>;
    id: number;
    operator?: string;
    processInstanceId: number;
    taskFormData: Record<string, any>;
    taskFormKey?: string;
    taskName: string;
    taskState: number;
  }>('/api/v1/wf/processTask/detail', {
    params: { taskId },
  });
}

/** 获取可跳转的节点列表 */
export async function getJumpAbleTaskNameListApi(taskId: number | string) {
  return await requestClient.get<Array<{ nodeId: string; nodeName: string }>>(
    '/api/v1/wf/processTask/jumpAbleTaskNameList',
    {
      params: { taskId },
    },
  );
}

/** 跳转到指定节点 */
export async function jumpTaskApi(data: {
  processTaskId: number | string;
  targetNodeId: string;
}) {
  return await requestClient.post('/api/v1/wf/processTask/jump', data);
}

/** 委托任务给其他人 */
export async function surrogateTaskApi(data: {
  processTaskId: number | string;
  userId: string;
}) {
  return await requestClient.post('/api/v1/wf/processTask/surrogate', data);
}
