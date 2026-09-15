<template>
  <div class="hello-world-wrap">
    <div class="case-selector">
      <label>演示流程：</label>
      <select :value="caseParam" @change="onCaseChange">
        <option value="leave">请假（6 节点决策）</option>
        <option value="expense">报销（7 节点决策）</option>
        <option value="countersign">会签（5 节点）</option>
        <option value="fork">分支合并（7 节点）</option>
        <option value="custom">自定义节点（4 节点）</option>
        <option value="empty">空画布</option>
      </select>
    </div>
    <FlowDesigner
    v-model:value="graphData"
    :theme="theme"
    :highLight="highLightData"
    @on-init="handleInit"
    @on-save="handleSave"
    />
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import FlowDesigner from '../../packages/index'
// import FlowDesigner from 'mldong-flow-designer-plus'
// import 'mldong-flow-designer-plus/lib/style.css'
import type { FDHighLightType } from '../../packages/flow-designer/src/types';
import CustomHtml from './CustomHtml';
// import LeaveJson from '../assets/leave.json'  // 旧默认示例
// 5 个真业务 case（从 mldong-doc/docs/mldong/wf/ 后端文档反推）
import LeaveJson from '../assets/wf-leave.json'         // 6 节点决策请假
import ExpenseJson from '../assets/wf-expense.json'    // 7 节点决策报销
import CountersignJson from '../assets/wf-countersign.json' // 5 节点会签
import ForkJoinJson from '../assets/wf-fork-join.json' // 7 节点分支合并
import CustomNodeJson from '../assets/wf-custom-node.json' // 4 节点自定义

// 通过 ?case=leave|expense|countersign|fork|custom|empty 切换演示流程
// 也支持顶部下拉框切换
const initialCaseParam = (typeof location !== 'undefined' ? new URLSearchParams(location.search).get('case') : '') || 'leave'
const caseParam = ref(initialCaseParam)
const caseMap: Record<string, any> = {
  leave: LeaveJson,
  expense: ExpenseJson,
  countersign: CountersignJson,
  fork: ForkJoinJson,
  custom: CustomNodeJson,
  empty: { nodes: [], edges: [] },
}
const onCaseChange = (e: Event) => {
  const v = (e.target as HTMLSelectElement).value
  caseParam.value = v
  graphData.value = caseMap[v] || LeaveJson
  // 同步到 URL（不刷新页面）
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href)
    url.searchParams.set('case', v)
    window.history.replaceState({}, '', url.toString())
  }
}
// import MyInput from './MyInput.vue'
const theme = {
  activeColor: 'red'
}
// const processForm = ref({
//   labelWidth: '130px',
//   formItems: [{
//     name: "name1",
//     label: "流程定义唯一编码1",
//     component: "Input",
//     componentProps: {
//       placeholder: '请输入流程定义唯一编码1'
//     }
//   }, {
//     name: "name",
//     label: "流程定义唯一编码",
//     component: 'Input',
//     componentProps: {
//       placeholder: '请输入流程定义唯一编码'
//     }
//   },]
// })
const highLightData = ref<FDHighLightType>()
// const dndPanel :Array<FDPatternItem>= [{
//       sort: 1,
//       type: 'custom-html-test',
//       text: '测试',
//       label: '测试',
//       icon: StartSvg,
//       hide: false,
//       nodeClick(event: any){
//         console.log('start', event)
//       }
//     },{
//       type: 'subProcess',
//       sort: 100,
//       drawerTitle: '自定义子流程节点属性',
//       form: {
//         labelWidth: '130px',
//         formItems: [{
//           name: "name1",
//           label: "流程定义唯一编码1",
//           component: 'Input',
//           componentProps: {
//             placeholder: '请输入流程定义唯一编码1'
//           }
//         }, ]
//       }
//     }]
// const control = [{
//   key: 'save',
//   // hide: true
// }, {
//       key: 'my-zoom-out',
//       iconClass: 'lf-control-save',
//       title: '自定义保存',
//       text: '自定义保存',
//       // sort: 45,
//       onClick: (lf: any) => {
        
//         console.log(lf.getGraphData())
//       },
//     },]
const graphData = ref(caseMap[initialCaseParam] || LeaveJson);
  // const handleClick = () =>{
  //   highLightData.value = {
  //     "historyNodeNames": ["1"],
  //     "historyEdgeNames": ["1-2"],
  //     "activeNodeNames": ["2"]
  //   }
  // }
  const handleInit = (lf: any) => {
    lf.register(CustomHtml);
  }
  const handleSave = (data: any) => {
    console.log('save', data)
  } 
</script>
<style scoped>
.hello-world-wrap {
  position: relative;
  width: 100%;
  height: 100%;
}
.case-selector {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 4px 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  font-size: 13px;
  color: #333;
}
.case-selector select {
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 13px;
  cursor: pointer;
  outline: none;
}
.case-selector select:hover {
  border-color: #1890ff;
}
.lf-control-myicon {
  background: url('../../packages/flow-designer/src/assets/start.svg');
}
</style>
