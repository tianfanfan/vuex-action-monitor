# vuex-action-monitor

[![Build Status](https://travis-ci.com/tianfanfan/vuex-action-monitor.svg?branch=master)](https://travis-ci.com/tianfanfan/vuex-action-monitor)
[![NPM Download](https://img.shields.io/npm/dm/vuex-action-monitor.svg)](https://www.npmjs.com/package/vuex-action-monitor)
[![NPM Version](https://img.shields.io/npm/v/vuex-action-monitor.svg)](https://www.npmjs.com/package/vuex-action-monitor)
[![NPM License](https://img.shields.io/npm/l/vuex-action-monitor.svg)](https://github.com/tianfanfan/vuex-action-monitor/blob/master/LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/tianfanfan/vuex-action-monitor/pulls)
[![Automated Release Notes by gren](https://img.shields.io/badge/%F0%9F%A4%96-release%20notes-00B2EE.svg)](https://github-tools.github.io/github-release-notes/)

### Table of Contents

- [Feature](#Feature)
- [Install](#Install)
- [License](#license)

### Introduction

vuex-action-monitor is a library that monitor all vuex actions start and end.

### Install

```sh
  npm install -S vuex-action-monitor
```

### Use in store

Install and use in store.js:

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
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve()
        }, 3000)
      })
    },
    async bar(context, payload) {
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve()
        }, 3000)
      })
    },
  },
})

export default store
```

### Use in Component

```html
<template>
  <div class="goodsPage">
    <span>
      {{ $loadingC(['foo', 'bar']) }}
    </span>

    <span>
      {{ $loadingB(['foo', 'bar']) }}
    </span>


    <span>
      {{ $loadingB([['foo', 'bar']]) }}
    </span>

    {{ $store.state.loading.b }} {{ $loadingB('foo') }} {{ $loadingC('foo') }}
  </div>
</template>
<script>
  export default {
    data() {
      return {}
    },
    computed() {
      // you can use methods
      fooLoadingCount() {
        return this.$loadingC("foo");
      },
      // you can use methods
      loadingCBoolean() {
        return this.$loadingB("foo");
      },
      // 你也可以通过此方式拿到真实数据
      // you can use state
      fooLoadingCount2() {
        return this.$store.state._loading.b.foo
      }
      // 你也可以通过 getter 计算
      // you can use getter
      fooLoadingCount3() {
        return this.$store.getters.['_loading/stateC']('foo')
      }
    }
  }
</script>
<style scoped></style>
```

### Options

- `log`(required: `false`, default: `false`): need console log the state or not.
- `key` (required: `false`, default: `loading`): the key of this module in vuex store.

### Feature

Then you will have two getters function in any vue components

- `$loadingC`: `$loadingC(string | string[])` Returns the total of all activie actions.
- `$loadingC`: `$loadingC(string | string[ string | string [] ])` Returns the boolean of activie actions, if Receive a two-dimensional array ,the first dimension's relationship is `or` the second dimension's relationship is `and`.

### License

[MIT](./LICENSE)

[⬆ Back to Top](#user-content-table-of-contents)
