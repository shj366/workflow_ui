import { requestClient } from '#/api/request';

export interface ProcessDefinePageQuery {
  page: number;
  size: number;
  name?: string;
  displayName?: string;
  type?: number;
  state?: number;
}

export interface ProcessDefineItem {
  id: string;
  name: string;
  displayName?: string;
  display_name?: string;
  type?: number;
  state?: number;
  version?: number;
  content?: string; // base64 or string
  createdTime?: string;
  created_time?: string;
  updatedTime?: string;
  created_by?: string;
  updated_by?: string;
}

export interface ProcessDefinePageResult {
  items: ProcessDefineItem[];
  total: number;
}

/** 分页查询流程定义列表 */
export async function fetchProcessDefinePageApi(
  params: ProcessDefinePageQuery,
) {
  return await requestClient.get<ProcessDefinePageResult>(
    '/api/v1/wf/processDefine/page',
    {
      params,
    },
  );
}

/** 部署流程定义 */
export async function deployProcessDefineApi(file: File) {
  const form = new FormData();
  form.append('file', file);
  return await requestClient.post<ProcessDefineItem>(
    '/api/v1/wf/processDefine/deploy',
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
}

/** 获取流程定义详情 */
export async function getProcessDefineDetailApi(id: string) {
  return await requestClient.get<any>('/api/v1/wf/processDefine/detail', {
    params: { id },
  });
}

/** 保存流程设计 */
export async function saveProcessDesignApi(data: {
  id: string;
  jsonObject: any;
}) {
  return await requestClient.post<ProcessDefineItem>(
    '/api/v1/wf/processDefine/saveDesign',
    data,
  );
}

/** 启用/禁用流程定义 */
export async function upAndDownProcessDefineApi(data: {
  ids: string[];
  opType: number;
}) {
  return await requestClient.post<number>(
    '/api/v1/wf/processDefine/upAndDown',
    data,
  );
}
