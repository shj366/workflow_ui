import { markRaw } from 'vue';

import SnakerFlowDesignerModule from 'snakerflow-designer-vue';

import 'snakerflow-designer-vue/element-plus/dist/index.css';

const SnakerFlowDesigner = markRaw(
  (SnakerFlowDesignerModule as any).default || SnakerFlowDesignerModule,
);

export default SnakerFlowDesigner;
