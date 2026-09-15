import { ref, onMounted, onBeforeUnmount } from 'vue'

/**
 * 响应式获取全局移动端预览状态
 *
 * App.vue 中的"📱 移动端"按钮会把 `:root`（documentElement）上的
 * `is-mobile-preview` class 切换。钉钉模式的移动端样式
 * （packages/flow-designer/src/dingtalk/styles/dingtalk.scss 中的
 * `:root.is-mobile-preview` 块）依赖此 class 触发。
 *
 * 子组件（Example / VbenProcessCase / NodeApiCase）如果需要在
 * 移动端预览时调整自身 UI（比如隐藏演示用的 mode-switch 按钮），
 * 可以用这个 composable 拿到响应式状态。
 *
 * 使用：
 * ```ts
 * const isMobilePreview = useIsMobilePreview()
 * const showDevOnly = computed(() => import.meta.env.DEV && !isMobilePreview.value)
 * ```
 */
export function useIsMobilePreview() {
  const isMobilePreview = ref(false)
  let observer: MutationObserver | null = null

  const sync = () => {
    isMobilePreview.value = document.documentElement.classList.contains('is-mobile-preview')
  }

  onMounted(() => {
    sync()
    observer = new MutationObserver(sync)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return isMobilePreview
}
