import { requestClient } from '#/api/request';

export interface ProcessDesignItem {
  id: number;
  name: string;
  displayName?: string;
  display_name?: string; // fallback for legacy snake_case usage
  type?: number;
  icon?: string;
  is_deployed: number;
  isDeployed?: number;
  jsonObject?: any;
  json_object?: any;
  remark?: string;
  create_time?: string;
  update_time?: string;
  createTime?: string;
  updateTime?: string;
}

export interface ProcessDesignCreate {
  name: string;
  display_name?: string;
  type?: number;
  icon?: string;
  remark?: string;
}

export interface ProcessDesignUpdate {
  name?: string;
  display_name?: string;
  type?: number;
  icon?: string;
  remark?: string;
}

export interface ProcessDesignSaveDesign {
  id: number;
  jsonObject?: any;
}

/**
 * 分页查询流程设计
 */
export async function fetchProcessDesignPageApi(params: {
  display_name?: string;
  name?: string;
  page: number;
  size: number;
}) {
  return requestClient.get<any>('/api/v1/wf/processDesign/page', { params });
}

/**
 * 获取流程设计详情
 */
export async function getProcessDesignDetailApi(id: number) {
  return requestClient.get<ProcessDesignItem>(
    `/api/v1/wf/processDesign/detail?id=${id}`,
  );
}

/**
 * 创建流程设计
 */
export async function createProcessDesignApi(data: ProcessDesignCreate) {
  return requestClient.post('/api/v1/wf/processDesign/create', data);
}

/**
 * 更新流程设计
 */
export async function updateProcessDesignApi(
  id: number,
  data: ProcessDesignUpdate,
) {
  return requestClient.post('/api/v1/wf/processDesign/update', { id, ...data });
}

/**
 * 保存流程设计JSON
 */
export async function saveProcessDesignApi(data: ProcessDesignSaveDesign) {
  return requestClient.post('/api/v1/wf/processDesign/saveDesign', data);
}

/**
 * 删除流程设计
 */
export async function deleteProcessDesignApi(ids: number[]) {
  return requestClient.post('/api/v1/wf/processDesign/delete', { ids });
}

/**
 * 部署流程设计
 */
export async function deployProcessDesignApi(id: number) {
  return requestClient.post(`/api/v1/wf/processDesign/deploy?id=${id}`);
}

/**
 * 重新部署流程设计
 */
export async function redeployProcessDesignApi(id: string) {
  return await requestClient.post<{ id: string }>(
    '/api/v1/wf/processDesign/redeploy',
    null,
    {
      params: { id },
    },
  );
}

export interface ProcessDesignTypeGroup {
  type: number;
  title: string;
  items: {
    displayName: string;
    icon: string;
    id: string;
    name: string;
    processDefineId: string;
    type: number;
  }[];
}

/** 按类型获取已部署的流程设计列表 */
export async function listProcessDesignByTypeApi() {
  return await requestClient.post<ProcessDesignTypeGroup[]>(
    '/api/v1/wf/processDesign/listByType',
  );
}

/** 获取部门用户树 */
export async function getUserTreeApi() {
  return await requestClient.get<any[]>('/api/v1/wf/processDesign/userTree');
}
