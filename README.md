# Workflow Plugin

`workflow审批流` 插件为系统提供审批流相关能力，支持可视化流程设计、任务审批、流程实例追踪等。

## 功能概览

- 流程设计 (Process Design)：使用 `mldong-flow-designer-plus` 适配原 workflow 插件，支持 canvas/dingtalk 双模式与统一 JSON 流程定义。
- 流程定义 (Process Define)：管理工作流模版，提供定义预览、管理与流程发起功能。
- 任务中心 (Task Center)：处理待办与已办任务，支持审批、回退等工作流操作。
- 实例跟踪 (Instance History)：监控流程运行状态，提供实时流程图进度展示与审批链路查询。

## 核心组件

- **SnakerFlowDesigner**：兼容原页面调用方式的 mldong-flow-designer-plus 包装组件。
- **AssigneeInput**：基于 Flzk 用户数据的多选参与人组件。
- **ProcessDesignForm**：流程表单设计组件。
- **HistoryDrawer**：流程历史抽屉组件

## 技术栈

- **框架**：Vue 3 + TypeScript
- **UI库**：antdv-next
- **流程设计器**：mldong-flow-designer-plus

原 workflow 页面和表单设计器保留，接口通过 adapter 对接 jeeflow 统一门面。

## 🤝 贡献指南

欢迎提交Issue和Pull Request来共同改进此插件。
