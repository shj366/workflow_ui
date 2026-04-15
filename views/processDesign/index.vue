<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type {
  ProcessDesignCreate,
  ProcessDesignItem,
} from '#/plugins/workflow/api/processDesign';

import { reactive, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { Modal as AntModal, message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createProcessDesignApi,
  deleteProcessDesignApi,
  deployProcessDesignApi,
  fetchProcessDesignPageApi,
  redeployProcessDesignApi,
  updateProcessDesignApi,
} from '#/plugins/workflow/api/processDesign';

import { formSchema, querySchema, useColumns } from './data';
import ProcessDesigner from './design.vue';
import FormDesigner from './formDesigner/index.vue';

const designRef = ref();
const formDesignerRef = ref();

const isUpdate = ref(false);
const currentRecordId = ref<number>();

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: {
    content: '查询',
  },
  schema: querySchema,
};

const gridOptions = reactive<VxeTableGridOptions<ProcessDesignItem>>({
  rowConfig: {
    keyField: 'id',
  },
  checkboxConfig: {
    highlight: true,
  },
  height: 'auto',
  exportConfig: {},
  printConfig: {},
  toolbarConfig: {
    export: true,
    print: true,
    refresh: true,
    refreshOptions: {
      code: 'query',
    },
    custom: true,
    zoom: true,
  },
  columns: useColumns(),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await fetchProcessDesignPageApi({
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });
      },
    },
  },
});

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions,
  gridOptions,
});

const [Form, formApi] = useVbenForm({
  schema: formSchema,
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  title: '流程设计',
  onOpenChange: (isOpen) => {
    if (!isOpen) {
      return;
    }

    const data = modalApi.getData<ProcessDesignItem>();
    if (data?.id) {
      isUpdate.value = true;
      currentRecordId.value = data.id;
      formApi.setValues(data);
      modalApi.setState({ title: '编辑流程设计' });
      return;
    }

    isUpdate.value = false;
    currentRecordId.value = undefined;
    formApi.resetForm();
    modalApi.setState({ title: '新增流程设计' });
  },
  onConfirm: async () => {
    try {
      const { valid } = await formApi.validate();
      if (!valid) {
        return;
      }

      modalApi.lock();
      const values = await formApi.getValues<ProcessDesignCreate>();

      if (isUpdate.value && currentRecordId.value) {
        await updateProcessDesignApi(currentRecordId.value, values);
        message.success('更新成功');
      } else {
        await createProcessDesignApi(values);
        message.success('创建成功');
      }

      gridApi.reload();
      modalApi.close();
    } catch (error) {
      console.error(error);
    } finally {
      modalApi.unlock();
    }
  },
});

function getDesignDisplayName(row: ProcessDesignItem) {
  return row.displayName || row.name || `#${row.id}`;
}

function handleAdd() {
  modalApi.setData({}).open();
}

function handleEdit(row: ProcessDesignItem) {
  modalApi.setData(row).open();
}

function handleDesign(row: ProcessDesignItem) {
  designRef.value?.setData({ id: row.id });
  designRef.value?.open();
}

async function handleDeploy(row: ProcessDesignItem) {
  if (row.isDeployed === 1) {
    message.warning('该流程已部署，请使用重新部署');
    return;
  }

  AntModal.confirm({
    title: '确认部署',
    content: `部署后将生成新的流程定义版本，确定部署【${getDesignDisplayName(row)}】吗？`,
    onOk: async () => {
      try {
        await deployProcessDesignApi(row.id);
        message.success('部署成功');
        gridApi.reload();
      } catch (error) {
        console.error(error);
      }
    },
  });
}

function handleRedeploy(row: ProcessDesignItem) {
  AntModal.confirm({
    title: '确认重新部署',
    content: `重新部署将覆盖最新版本流程定义，确定继续处理【${getDesignDisplayName(row)}】吗？`,
    onOk: async () => {
      try {
        await redeployProcessDesignApi(String(row.id));
        message.success('重新部署成功');
        gridApi.reload();
      } catch (error) {
        console.error(error);
      }
    },
  });
}

async function handleDelete(row: ProcessDesignItem) {
  AntModal.confirm({
    title: '确认删除',
    content: `确定要删除流程设计【${getDesignDisplayName(row)}】吗？`,
    onOk: async () => {
      try {
        await deleteProcessDesignApi([row.id]);
        message.success('删除成功');
        gridApi.reload();
      } catch (error) {
        console.error(error);
      }
    },
  });
}

function handleFormDesign(row: ProcessDesignItem) {
  formDesignerRef.value?.open(row);
}

function handleSuccess() {
  gridApi.reload();
}

function getMoreMenuItems(row: ProcessDesignItem) {
  return [
    { key: 'edit', label: '编辑' },
    { key: 'form-design', label: '表单设计' },
    {
      key: 'deploy',
      label: '部署',
      disabled: row.isDeployed === 1,
    },
    {
      key: 'redeploy',
      label: '重新部署',
      disabled: row.isDeployed === 1,
    },
    {
      key: 'delete',
      label: '删除',
      danger: true,
    },
  ];
}

function handleMoreAction(key: string, row: ProcessDesignItem) {
  switch (key) {
    case 'delete': {
      void handleDelete(row);
      break;
    }
    case 'deploy': {
      void handleDeploy(row);
      break;
    }
    case 'edit': {
      handleEdit(row);
      break;
    }
    case 'form-design': {
      handleFormDesign(row);
      break;
    }
    case 'redeploy': {
      handleRedeploy(row);
      break;
    }
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <a-button type="primary" @click="handleAdd"> 新增 </a-button>
      </template>

      <template #isDeployed="{ row }">
        <a-tag v-if="row.isDeployed === 1" color="success">已部署</a-tag>
        <a-tag v-else color="default">未部署</a-tag>
      </template>

      <template #action="{ row }">
        <a
          style="margin-right: 8px; color: #1677ff; cursor: pointer"
          @click="handleDesign(row)"
        >
          设计
        </a>
        <a-dropdown
          :menu="{
            items: getMoreMenuItems(row),
            onClick: ({ key }) => handleMoreAction(key as string, row),
          }"
        >
          <a style="color: #1677ff; cursor: pointer" @click.prevent> 更多 </a>
        </a-dropdown>
      </template>
    </Grid>

    <Modal>
      <Form />
    </Modal>

    <div class="hidden">
      <ProcessDesigner ref="designRef" @success="handleSuccess" />
      <FormDesigner ref="formDesignerRef" @success="handleSuccess" />
    </div>
  </Page>
</template>
