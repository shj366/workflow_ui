import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'fs'
// 钉钉精简包（mldong-flow-designer-dingtalk）构建配置
// 入口为 packages/index.dingtalk.ts，不含 @logicflow/* 依赖
export default defineConfig({
    plugins: [vue(),{
        name: 'svg-transform',
        transform(code, id) {
          if (id.endsWith('.svg')) {
            const base64Str = fs.readFileSync(id, 'base64')
            return {
              code: `export default 'data:image/svg+xml;base64,${base64Str}'`,
              map: null,
            }
          }
        },
      }],
    build: {
        outDir: './lib-lite',
        // 不压缩
        minify: false,
        // 启用sourcemap
        sourcemap: true,
        lib: {
            entry: './packages/index.dingtalk.ts', // 精简入口（仅钉钉模式）
            name: 'MldongFlowDesignerDingtalk',
            // 显式指定产物文件名，避免随主 package.json name 变化
            fileName: 'mldong-flow-designer-dingtalk',
            formats: ['es', 'umd'],
        },
        rollupOptions: {
            external: ['vue'], // 外部依赖，根据实际情况添加
        },
    }, 
})
