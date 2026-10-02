import { requestClient } from '#/api/request';

export interface ProcessDesignVersion {
  id: string;
  name: string;
  displayName?: string;
  type?: string;
  state?: number;
  version?: number;
  createdTime?: string;
  created_time?: string;
  isVersion?: boolean;
}

export interface ProcessDesignItem {
  id: number;
  name: string;
  displayName?: string;
  display_name?: string;
  type?: string;
  icon?: string;
  is_deployed: number;
  isDeployed?: number;
  jsonObject?: {
    formSchemaJsonStr?: string;
    [key: string]: unknown;
  };
  json_object?: {
    formSchemaJsonStr?: string;
    [key: string]: unknown;
  };
  remark?: string;
  create_time?: string;
  update_time?: string;
  createTime?: string;
  updateTime?: string;
  state?: number;
  version?: number;
  isVersion?: boolean;
  children?: ProcessDesignVersion[];
  versionCount?: number;
}

export interface ProcessDesignCreate {
  name: string;
  display_name?: string;
  type?: string;
  icon?: string;
  remark?: string;
}

export interface ProcessDesignUpdate {
  name?: string;
  display_name?: string;
  type?: string;
  icon?: string;
  remark?: string;
}

export interface ProcessDesignSaveDesign {
  id: number;
  jsonObject?: Record<string, unknown>;
}


function normalizeProcessType<T extends { type?: unknown }>(data: T): T {
  if (data.type === undefined || data.type === null) {
    return data;
  }
  return { ...data, type: String(data.type).trim() };
}

function normalizeProcessDesignJson(jsonObject: unknown): unknown {
  if (!jsonObject || typeof jsonObject !== 'object' || Array.isArray(jsonObject)) {
    return jsonObject;
  }
  if (!('type' in jsonObject)) {
    return jsonObject;
  }
  const type = jsonObject.type;
  return type === undefined || type === null
    ? jsonObject
    : { ...jsonObject, type: String(type).trim() };
}

/**
 * 分页查询流程设计
 */
export async function fetchProcessDesignPageApi(params: {
  display_name?: string;
  name?: string;
  page: number;
  size: number;
  type?: string | number;
}) {
  const normalizedParams = {
    ...params,
    ...(params.type === undefined || params.type === null
      ? {}
      : { type: String(params.type).trim() }),
  };
  return requestClient.get<unknown>('/api/v1/wf/processDesign/page', {
    params: normalizedParams,
  });
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
  return requestClient.post(
    '/api/v1/wf/processDesign/create',
    normalizeProcessType(data),
  );
}

/**
 * 更新流程设计
 */
export async function updateProcessDesignApi(
  id: number | string,
  data: ProcessDesignUpdate,
) {
  return requestClient.post(
    '/api/v1/wf/processDesign/update',
    { id, ...normalizeProcessType(data) },
  );
}

/**
 * 保存流程设计JSON
 */
export async function saveProcessDesignApi(data: ProcessDesignSaveDesign) {
  return requestClient.post('/api/v1/wf/processDesign/saveDesign', {
    ...data,
    jsonObject: normalizeProcessDesignJson(data.jsonObject),
  });
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
  type: string;
  title: string;
  items: {
    displayName: string;
    icon: string;
    id: string;
    name: string;
    processDefineId: string;
    type: string;
    version: number;
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
