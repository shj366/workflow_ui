import type { ProcessTaskItem } from './api/processTask';

import { fetchTodoTaskPageApi } from './api/processTask';

type WorkflowClient = {
  api: {
    processTask: {
      todoList: (query: { pageNum?: number; pageSize?: number }) => Promise<{
        rows: ProcessTaskItem[];
        recordCount: number;
      }>;
    };
  };
};

let context: WorkflowClient | undefined;

export function useJeeflowUiClient(): WorkflowClient {
  if (!context) {
    context = {
      api: {
        processTask: {
          async todoList(query) {
            const result = await fetchTodoTaskPageApi({
              page: query.pageNum ?? 1,
              size: query.pageSize ?? 10,
            });
            return { rows: result.items as ProcessTaskItem[], recordCount: result.total };
          },
        },
      },
    };
  }
  return context;
}
