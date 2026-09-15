import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'fs'
import { execSync } from 'node:child_process'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    {
      // svg → base64 datauri
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
    },
    {
      // 在 dist/ 注入 build-info.json + index.html 注入 window.__BUILD__
      // 用于演示站/部署时反查「现在跑的是哪个 commit」
      name: 'build-info-inject',
      apply: 'build',
      // 1) transformIndexHtml 阶段往 index.html 注入 <script>window.__BUILD__=...</script>
      transformIndexHtml() {
        // 读 git 信息（失败降级 unknown，不阻断 build）
        let commit = 'unknown'
        let commitFull = 'unknown'
        let branch = 'unknown'
        try {
          commitFull = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim()
          commit = commitFull.slice(0, 7)
          branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim()
        } catch {
          // 仓不在 git 里 / git 不可用 —— 降级
        }
        const info = {
          commit,
          commitFull,
          branch,
          buildTime: new Date().toISOString(),
          buildTimestamp: Date.now(),
        }
        return [
          {
            tag: 'script',
            attrs: { type: 'text/javascript' },
            children: `window.__BUILD__=${JSON.stringify(info)};`,
            injectTo: 'head',
          },
        ]
      },
      // 2) generateBundle 阶段写 dist/build-info.json
      generateBundle(_options, bundle) {
        let commit = 'unknown'
        let commitFull = 'unknown'
        let branch = 'unknown'
        try {
          commitFull = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim()
          commit = commitFull.slice(0, 7)
          branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim()
        } catch {
          // 降级
        }
        const info = {
          commit,
          commitFull,
          branch,
          buildTime: new Date().toISOString(),
          buildTimestamp: Date.now(),
        }
        this.emitFile({
          type: 'asset',
          fileName: 'build-info.json',
          source: JSON.stringify(info, null, 2),
        })
        console.log(`[build-info] commit=${commit} branch=${branch} time=${info.buildTime}`)
      },
    } satisfies Plugin,
  ],
})
