// postinstall.mjs
// 物理替换 rollup 原生二进制为 @rollup/wasm-node (解决 GLIBC < 2.32 兼容问题)
// 不依赖 overrides/包管理器，直接覆盖 node_modules 文件

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 定位 rollup 和 wasm 包
const rollupDist = path.join(__dirname, 'node_modules', 'rollup', 'dist');
const wasmDist = path.join(__dirname, 'node_modules', '@rollup', 'wasm-node', 'dist');

if (!fs.existsSync(rollupDist)) {
  console.log('[postinstall] rollup dist not found, skipping');
  process.exit(0);
}

if (!fs.existsSync(wasmDist)) {
  // 如果 wasm-node 不存在，添加为依赖后可能还没有安装
  // 尝试在 rollup 旁边找（pnpm 虚拟 store）
  const wasmAlt = path.join(__dirname, 'node_modules', '.pnpm', '@rollup+wasm-node@4.62.3', 'node_modules', '@rollup', 'wasm-node', 'dist');
  if (fs.existsSync(wasmAlt)) {
    console.log('[postinstall] found @rollup/wasm-node in pnpm store');
    copyWasm(wasmAlt);
  } else {
    console.log('[postinstall] @rollup/wasm-node not found, skipping');
    process.exit(0);
  }
} else {
  copyWasm(wasmDist);
}

function copyWasm(srcDist) {
  // 检查 native.js 是否已经是 WASM 版（通过检查内容特征）
  const nativeJsPath = path.join(rollupDist, 'native.js');
  if (fs.existsSync(nativeJsPath)) {
    const content = fs.readFileSync(nativeJsPath, 'utf8');
    if (content.includes('./wasm-node/bindings_wasm.js')) {
      console.log('[postinstall] rollup already uses WASM, skipping');
      process.exit(0);
    }
  }

  // 复制 wasm-node 目录（WASM 二进制绑定）
  const wasmNodeSrc = path.join(srcDist, 'wasm-node');
  const wasmNodeDst = path.join(rollupDist, 'wasm-node');
  if (fs.existsSync(wasmNodeSrc)) {
    fs.rmSync(wasmNodeDst, { recursive: true, force: true });
    fs.cpSync(wasmNodeSrc, wasmNodeDst, { recursive: true });
    console.log('[postinstall] copied wasm-node bindings');
  } else {
    console.log('[postinstall] wasm-node dir not found in:', srcDist);
    process.exit(1);
  }

  // 复制 WASM 版的 native.js（加载 wasm 而非原生二进制）
  const wasmNativeJs = path.join(srcDist, 'native.js');
  if (fs.existsSync(wasmNativeJs)) {
    fs.copyFileSync(wasmNativeJs, nativeJsPath);
    console.log('[postinstall] replaced native.js with WASM version');
  }

  // 复制 WASM 版的 parseAst（兼容 rollup/parseAst 导出）
  for (const name of ['parseAst.js', 'parseAst.cjs']) {
    const parseAstSrc = path.join(srcDist, name);
    const parseAstDst = path.join(rollupDist, name);
    if (fs.existsSync(parseAstSrc)) {
      fs.copyFileSync(parseAstSrc, parseAstDst);
    }
  }

  console.log('[postinstall] ✅ rollup native binary replaced with WASM');
}
