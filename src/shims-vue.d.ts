// Vue 原型扩展声明 — 对应 actionSubscribe({ key: 'loading' }) 时的默认实例方法
// 如果使用了自定义 key，需要在你的项目中自行声明：
//
//   declare module 'vue/types/vue' {
//     interface Vue {
//       $yourKeyB(path: string | string[]): boolean
//       $yourKeyC(path: string | string[]): number
//     }
//   }

declare module 'vue/types/vue' {
  interface Vue {
    $loadingB(path: string | string[]): boolean
    $loadingC(path: string | string[]): number
  }
}
