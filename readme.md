# vuex-action-monitor

[![NPM Download](https://img.shields.io/npm/dm/vuex-action-monitor.svg)](https://www.npmjs.com/package/vuex-action-monitor)
[![NPM Version](https://img.shields.io/npm/v/vuex-action-monitor.svg)](https://www.npmjs.com/package/vuex-action-monitor)
[![NPM License](https://img.shields.io/npm/l/vuex-action-monitor.svg)](https://github.com/tianfanfan/vuex-action-monitor/blob/master/LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/tianfanfan/vuex-action-monitor/pulls)

### Table of Contents

- [Introduction](#introduction)
- [Install](#install)
- [Usage](#usage)
  - [In Store](#in-store)
  - [In Component](#in-component)
  - [TypeScript](#typescript)
- [Options](#options)
- [API](#api)
- [License](#license)

### Introduction

vuex-action-monitor is a Vue 2 plugin that monitors all Vuex actions' start and end states, providing real-time loading indicators via getters and Vue prototype methods.

### Install

```sh
npm install -S vuex-action-monitor
```

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

#### In Component

```html
<template>
  <div class="page">
    <!-- count: total active count for ['foo', 'bar'] -->
    <span> {{ $loadingC(['foo', 'bar']) }} </span>

    <!-- boolean: true if any of ['foo', 'bar'] is loading -->
    <span> {{ $loadingB(['foo', 'bar']) }} </span>

    <!-- boolean: true only if ALL of ['foo', 'bar'] are loading -->
    <span> {{ $loadingB([['foo', 'bar']]) }} </span>

    <!-- raw state access -->
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
    // you can also use getters directly
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

For TypeScript support in Vue components, add the type augmentation to your project's `*.d.ts` file:

```typescript
// If using the default key 'loading':
import 'vuex-action-monitor/src/shims-vue'

// If using a custom key (e.g. 'api'), declare your own:
declare module 'vue/types/vue' {
  interface Vue {
    $apiB(path: string | string[]): boolean
    $apiC(path: string | string[]): number
  }
}
```

Then in your components:

```typescript
export default {
  computed: {
    fooLoading(): boolean {
      return this.$loadingB('foo')   // ✅ typed
    },
    totalActive(): number {
      return this.$loadingC(['foo', 'bar'])  // ✅ typed
    },
  },
}
```

### Options

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `log` | no | `false` | Whether to console.log action dispatch events |
| `key` | no | `'loading'` | The module key registered in vuex store |
| `logIgnore` | no | `[]` | Action type names to exclude from logging |

### API

**`actionSubscribe(opt?: ActionSubOption): ActionSubscribeReturn`**

Returns a plugin function with an `install` method for `Vue.use()`.

**ActionSubOption**

```typescript
interface ActionSubOption {
  log?: boolean       // enable console logging
  key?: string        // module name in store (default: 'loading')
  logIgnore?: string[] // action names to skip logging
}
```

**Prototype Methods** (added to `Vue.prototype`)

| Method | Signature | Description |
|--------|-----------|-------------|
| `$loadingB` | `(path: string \| string[]) => boolean` | Returns `true` if any given action is active. Nested arrays use AND logic |
| `$loadingC` | `(path: string \| string[]) => number` | Returns the total count of all given active actions |

**Getters** (registered under `store.getters['<key>/...']`)

| Getter | Signature | Description |
|--------|-----------|-------------|
| `stateB` | `(path: string \| string[]) => boolean` | Boolean loading state (OR for flat array, AND for nested) |
| `stateC` | `(path: string \| string[]) => number` | Sum of loading counts |

### License

[MIT](./LICENSE)

[⬆ Back to Top](#user-content-table-of-contents)
