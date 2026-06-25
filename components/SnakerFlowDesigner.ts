import { markRaw } from 'vue';

// @ts-expect-error - No types available for snakerflow-designer-vue
import SnakerFlowDesignerModule from 'snakerflow-designer-vue';

import 'snakerflow-designer-vue/element-plus/dist/index.css';

const SnakerFlowDesigner = markRaw(
  (SnakerFlowDesignerModule as any).default || SnakerFlowDesignerModule,
);

export default SnakerFlowDesigner;
