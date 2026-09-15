#!/usr/bin/env node
/**
 * mldong-flow-designer-dingtalk 精简包发布脚本
 *
 * 流程：build:lib:lite → 组装 dist-publish/ staging 目录 → npm publish
 * dist-publish 为临时产物目录（已 gitignore），不进 git。
 *
 * 用法：
 *   node scripts/publish-lite.mjs --dry-run     # 试跑（不真正发布）
 *   node scripts/publish-lite.mjs               # 正式发布（latest）
 *   node scripts/publish-lite.mjs --tag next    # 指定 dist-tag
 *   node scripts/publish-lite.mjs --registry=https://registry.npmjs.org/
 *   node scripts/publish-lite.mjs --build-only  # 仅组装 dist-publish/（CI 用内置 npm 发布任务时用）
 */
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const staging = path.join(root, 'dist-publish')
const PKG_NAME = 'mldong-flow-designer-dingtalk'
const FILE_NAME = 'mldong-flow-designer-dingtalk'

// 透传给 npm publish 的额外参数（--dry-run / --tag / --registry 等）
// --build-only 为本脚本自有参数：仅构建组装 dist-publish/，不执行发布（供 CI 内置 npm 发布任务消费）
const args = process.argv.slice(2)
const buildOnly = args.includes('--build-only')
const extraArgs = args.filter(a => a !== '--build-only').join(' ')

const rootPkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))

// 1. 构建精简产物
console.log('[lite] 构建 lib-lite ...')
execSync('npm run build:lib:lite', { cwd: root, stdio: 'inherit' })

// 2. 清理并组装 staging 目录
if (existsSync(staging)) rmSync(staging, { recursive: true, force: true })
mkdirSync(staging)
cpSync(path.join(root, 'lib-lite'), path.join(staging, 'lib'), { recursive: true })
cpSync(path.join(root, 'packages'), path.join(staging, 'packages'), { recursive: true })
for (const f of ['LICENSE']) {
  const src = path.join(root, f)
  if (existsSync(src)) cpSync(src, path.join(staging, f))
}

// 3. 生成精简包 package.json（砍掉 @logicflow 三件套与 UI 库依赖，仅保留 vue peer）
const litePkg = {
  name: PKG_NAME,
  version: rootPkg.version,
  type: 'module',
  description: '钉钉风格流程设计器（精简版，无 LogicFlow 依赖）',
  keywords: ['工作流', '流程设计器', '钉钉审批流', 'Vue3'],
  main: `./lib/${FILE_NAME}.umd.cjs`,
  module: `./lib/${FILE_NAME}.js`,
  types: './packages/types/index.dingtalk.d.ts',
  exports: {
    '.': {
      types: './packages/types/index.dingtalk.d.ts',
      import: `./lib/${FILE_NAME}.js`,
      require: `./lib/${FILE_NAME}.umd.cjs`,
    },
    './lib/style.css': './lib/style.css',
    './*': './*',
  },
  files: ['lib', 'packages'],
  author: rootPkg.author,
  license: rootPkg.license,
  homepage: rootPkg.homepage,
  repository: rootPkg.repository,
  bugs: rootPkg.bugs,
  peerDependencies: {
    vue: rootPkg.peerDependencies?.vue || '^3.4.0',
  },
}
writeFileSync(path.join(staging, 'package.json'), JSON.stringify(litePkg, null, 2) + '\n')

// 4. 生成精简包 README（避免把双模式包文档原样带过去）
const readme = `# ${PKG_NAME}

钉钉风格流程设计器（精简版）。仅含钉钉树形设计器，**不含 LogicFlow 画布**，零 LogicFlow 依赖，适合纯审批流场景极简引入。

> 版本与双模式包 \`mldong-flow-designer-plus\` 联动发布（同一 commit、同一版本号）。
> 需要 canvas/dingtalk 双模式或存量画布流程兼容时，请使用双模式包。

## 安装

\`\`\`shell
npm install ${PKG_NAME} --registry=https://registry.npmmirror.com
\`\`\`

## 使用

\`\`\`ts
import { createApp } from 'vue'
import FlowDesigner from '${PKG_NAME}'
import '${PKG_NAME}/lib/style.css'

createApp(App).use(FlowDesigner).mount('#app')
\`\`\`

\`\`\`html
<MldongFlowDesignerPlus v-model:value="graphData" @on-save="handleSave" />
\`\`\`

组件 props/events 与双模式包的钉钉模式完全一致，\`@on-init\` 回调参数为 \`FDDesignerAPI\`（命名与 LogicFlow 实例对齐）。
`
writeFileSync(path.join(staging, 'README.md'), readme)

// 5. 发布
if (buildOnly) {
  console.log('[lite] --build-only：仅组装完成，产物在 dist-publish/，由 CI 发布任务接管。')
  process.exit(0)
}
console.log(`[lite] 发布 ${PKG_NAME}@${litePkg.version} ${extraArgs}`.trim())
execSync(`npm publish ${extraArgs}`.trim(), { cwd: staging, stdio: 'inherit' })
console.log('[lite] 完成。staging 目录保留在 dist-publish/ 可供检查，确认后可删除。')
