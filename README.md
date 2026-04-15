# Workflow Plugin

`workflow审批流` 插件为系统提供审批流相关能力，支持可视化流程设计、任务审批、流程实例追踪等。

## 功能概览

- 流程设计 (Process Design)：基于 `snakerflow-designer-vue` 构建的可视化建模工具，支持节点配置、属性定义与 XML/JSON 转换。
- 流程定义 (Process Define)：管理工作流模版，提供定义预览、管理与流程发起功能。
- 任务中心 (Task Center)：处理待办与已办任务，支持审批、回退等工作流操作。
- 实例跟踪 (Instance History)：监控流程运行状态，提供实时流程图进度展示与审批链路查询。

## 核心组件

- **SnakerFlowDesigner**：标准化的流程设计器包装组件
- **ProcessDesignForm**：流程设计表单组件
- **TaskDrawer**：任务处理抽屉组件
- **HistoryDrawer**：流程历史抽屉组件

## 技术栈

- **框架**：Vue 3 + TypeScript
- **UI库**：antdv-next
- **流程设计器**：snakerflow-designer-vue

## 依赖说明

这个仓库是 `pnpm workspace` monorepo，并统一使用 `catalog:` 管理依赖来源

如果缺少相关依赖，需要手动 `apps/web-antdv-next/package.json` 中添加：

```json
{
  "dependencies": {
    "snakerflow-designer-vue": "catalog:"
  }
}
```

在根目录 `pnpm-workspace.yaml` 的 `catalog` 中添加：

```yaml
catalog:
  'snakerflow-designer-vue': '^3.0.40'
```

## 🤝 贡献指南

欢迎提交Issue和Pull Request来共同改进此插件。

## 插件预览
<img width="1689" height="948" alt="f544b3c5-5ab9-4b43-abb9-bb7258d804b9" src="https://github.com/user-attachments/assets/42635a69-ceb7-494b-a668-8ced106faef3" />
<img width="1912" height="948" alt="a925f88f-81b9-4a60-83ec-7576d21f0ec6" src="https://github.com/user-attachments/assets/032c1fb4-3f17-4208-8fa6-20612b9850c0" />
<img width="1688" height="948" alt="24b75875-20db-4a9f-a24a-6aa435a554bc" src="https://github.com/user-attachments/assets/035a6bc8-3530-41ec-8a8f-b8c3622c3298" />


