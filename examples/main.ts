import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
// 演示站宿主 UI 仍用 element-plus（仅 examples 自用，npm 包不依赖）
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
createApp(App).use(ElementPlus).mount('#app')
