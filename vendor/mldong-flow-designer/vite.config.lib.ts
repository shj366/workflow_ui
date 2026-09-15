import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'fs'
// https://vitejs.dev/config/
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
        outDir: './lib',
        // 不压缩
        minify: false,
        // 启用sourcemap
        sourcemap: true,
        lib: {
            entry: './packages/index.ts', // 根据实际情况调整入口文件
            name: 'FlowDesigner',
            formats: ['es', 'umd'],
        },
        rollupOptions: {
            external: ['vue'], // 外部依赖，根据实际情况添加
        },
    }, 
})
