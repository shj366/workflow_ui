import type { VbenFormProps } from '@vben/common-ui';
import type { VxeGridProps } from '@vben/plugins/vxe-table';

import {
  ccQuerySchema,
  querySchema as myQuerySchema,
  useCcColumns,
  useColumns as useMyColumns,
} from '../processInstance/data';
import {
  querySchema as todoQuerySchema,
  useDoneColumns,
  useColumns as useTodoColumns,
} from '../processTask/data';

export const TabType = {
  TODO: 'todo',
  DONE: 'done',
  MY_INITIATED: 'my_initiated',
  CC: 'cc',
} as const;

export type TabTypeValues = (typeof TabType)[keyof typeof TabType];

export const getColumns = (tabType: TabTypeValues): VxeGridProps['columns'] => {
  switch (tabType) {
    case TabType.CC: {
      return useCcColumns();
    }
    case TabType.DONE: {
      return useDoneColumns();
    }
    case TabType.MY_INITIATED: {
      return useMyColumns();
    }
    case TabType.TODO: {
      return useTodoColumns();
    }
    default: {
      return [];
    }
  }
};

export const getQuerySchema = (
  tabType: TabTypeValues,
): VbenFormProps['schema'] => {
  switch (tabType) {
    case TabType.CC: {
      return ccQuerySchema;
    }
    case TabType.DONE:
    case TabType.TODO: {
      // Assuming Done uses the same schema as Todo (based on done.vue code)
      return todoQuerySchema;
    }
    case TabType.MY_INITIATED: {
      return myQuerySchema;
    }
    default: {
      return [];
    }
  }
};
