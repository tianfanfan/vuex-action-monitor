# vuex-action-monitor

[![npm version](https://img.shields.io/npm/v/vuex-action-monitor.svg?style=flat-square)](https://www.npmjs.com/package/vuex-action-monitor)
[![npm downloads](https://img.shields.io/npm/dm/vuex-action-monitor.svg?style=flat-square)](https://www.npmjs.com/package/vuex-action-monitor)
[![npm license](https://img.shields.io/npm/l/vuex-action-monitor.svg?style=flat-square)](https://github.com/tianfanfan/vuex-action-monitor/blob/master/LICENSE)
[![github stars](https://img.shields.io/github/stars/tianfanfan/vuex-action-monitor?style=flat-square)](https://github.com/tianfanfan/vuex-action-monitor/stargazers)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/tianfanfan/vuex-action-monitor/pulls)

### Table of Contents / 目录

- [Introduction / 简介](#introduction)
- [Install / 安装](#install)
- [Usage / 使用](#usage)
  - [In Store / 在 Store 中](#in-store)
  - [In Component / 在组件中](#in-component)
  - [TypeScript](#typescript)
- [Options / 配置项](#options)
- [API](#api)
- [License / 协议](#license)

---

### Introduction

vuex-action-monitor is a Vue 2 plugin that monitors the start and end of all Vuex actions, providing real-time loading state via getters and Vue prototype methods.

> vuex-action-monitor 是一个 Vue 2 插件，用于监听所有 Vuex action 的开始和结束状态，通过 getter 和 Vue 原型方法提供实时 loading 状态。

### Install

```sh
npm install vuex-action-monitor
```

> ```sh
> npm install vuex-action-monitor
> ```

### Usage

#### In Store

```javascript
// store.js or store.ts
import Vue from 'vue'
import Vuex from 'vuex'
import actionMonit from 'vuex-action-monitor'

const actionMonitor = actionMonit({
  log: true,
  key: 'loading',
})

Vue.use(Vuex)
Vue.use(actionMonitor)

const store = new Vuex.Store({
  plugins: [actionMonitor],
  state: {},
  mutations: {},
  actions: {
    async foo(context, payload) {
      await new Promise((resolve) => {
        setTimeout(() => resolve(), 3000)
      })
    },
    async bar(context, payload) {
      await new Promise((resolve) => {
        setTimeout(() => resolve(), 3000)
      })
    },
  },
})

export default store
```

> 在 store 中引入并注册为插件即可。

#### In Component

```html
<template>
  <div class="page">
    <!-- count: sum of active counts for ['foo', 'bar'] -->
    <!-- 计数：['foo', 'bar'] 中正在执行的 action 总数 -->
    <span> {{ $loadingC(['foo', 'bar']) }} </span>

    <!-- boolean: true if ANY of ['foo', 'bar'] is active (OR logic) -->
    <!-- 布尔：['foo', 'bar'] 中任意一个在执行即为 true -->
    <span> {{ $loadingB(['foo', 'bar']) }} </span>

    <!-- boolean: true only if ALL of ['foo', 'bar'] are active (AND logic) -->
    <!-- 布尔：[['foo', 'bar']] 中全部在执行才为 true -->
    <span> {{ $loadingB([['foo', 'bar']]) }} </span>

    <!-- raw state access / 直接访问 state -->
    {{ $store.state.loading.b }}
  </div>
</template>

<script>
export default {
  computed: {
    fooLoadingCount() {
      return this.$loadingC('foo')
    },
    fooLoading() {
      return this.$loadingB('foo')
    },
    // you can also use getters directly / 也可以直接使用 getter
    fooLoadingCount2() {
      return this.$store.getters['loading/stateC']('foo')
    },
  },
}
</script>
```

#### TypeScript

Import the plugin and its types:

```typescript
import actionMonit, { type ActionSubOption } from 'vuex-action-monitor'

const options: ActionSubOption = {
  log: true,
  key: 'loading',
  logIgnore: ['noisyAction'],
}

const actionMonitor = actionMonit(options)
```

> 导入插件及其类型。

For TypeScript support in Vue components, add the following augmentation to a `*.d.ts` file in your project:

> 在 Vue 组件中获得类型提示，需要将以下声明添加到项目中的 `*.d.ts` 文件：

```typescript
// If using the default key 'loading' / 使用默认 key 'loading' 时：
import 'vuex-action-monitor/src/shims-vue'

// If using a custom key (e.g. 'api'), declare your own / 使用自定义 key（如 'api'）时：
declare module 'vue/types/vue' {
  interface Vue {
    $apiB(path: string | string[]): boolean
    $apiC(path: string | string[]): number
  }
}
```

Then in your components / 然后在组件中：

```typescript
export default {
  computed: {
    fooLoading(): boolean {
      return this.$loadingB('foo')   // ✅ typed / 有类型
    },
    totalActive(): number {
      return this.$loadingC(['foo', 'bar'])  // ✅ typed / 有类型
    },
  },
}
```

### Options

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `log` | no | `false` | Whether to print action dispatch events to the console / 是否在控制台打印 action 执行日志 |
| `key` | no | `'loading'` | The module key registered in the Vuex store / 在 Vuex store 中注册的 module 名称 |
| `logIgnore` | no | `[]` | Action type names to exclude from logging / 不需要打印日志的 action 名称列表 |

### API

**`actionSubscribe(opt?: ActionSubOption): ActionSubscribeReturn`**

Returns a plugin function with an `install` method for `Vue.use()`.

> 返回一个带有 `install` 方法的插件函数，可用于 `Vue.use()`。

**ActionSubOption**

```typescript
interface ActionSubOption {
  log?: boolean        // enable console logging / 启用控制台日志
  key?: string         // module name in store, default: 'loading' / store 中的 module 名称，默认 'loading'
  logIgnore?: string[] // action names to skip logging / 跳过日志的 action 名称
}
```

**Prototype Methods** / 原型方法 *(added to / 挂载到 `Vue.prototype`)*

| Method | Signature | Description |
|--------|-----------|-------------|
| `$loadingB` | `(path: string \| (string \| string[])[]) => boolean` | Returns `true` if any of the given actions is active. Flat arrays use OR logic, nested arrays use AND logic / 给定 action 中任意一个为 active 则返回 `true`。一维数组为 OR 逻辑，嵌套数组为 AND 逻辑 |
| `$loadingC` | `(path: string \| string[]) => number` | Returns the sum of active counts for the given actions / 返回给定 action 的 active 计数总和 |

**Getters** / *(registered under / 注册在 `store.getters['<key>/...']`)*

| Getter | Signature | Description |
|--------|-----------|-------------|
| `stateB` | `(path: string \| (string \| string[])[]) => boolean` | Boolean loading state — OR for flat array, AND for nested / 布尔值 loading 状态 — 一维数组 OR，嵌套数组 AND |
| `stateC` | `(path: string \| string[]) => number` | Sum of loading counts / loading 计数总和 |

### License

[MIT](./LICENSE)

[⬆ Back to Top / 回到顶部](#table-of-contents--目录)
