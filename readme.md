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

### Feature

vuex-action-monitor 是一个监听 vuex 所有的 action 开始结束的库

### Install

```sh
npm install -S vuex-action-monitor
```

### Default Import

Install the components in global:

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
    async foobar(context, payload) {
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

### Example

```html
<template>
  <div class="goodsPage">
    {{ $store.state.loading.b }} {{ $loadingB('foobar') }} {{ $loadingC('foobar') }}
  </div>
</template>
<script>
  export default {
    data() {
      return {}
    },
    computed() {
      // you can use methods
      foobarLoadingCount() {
        return this.$loadingC("foobar");
      },
      // you can use methods
      loadingCBoolean() {
        return this.$loadingB("foobar");
      },
      // 你也可以通过此方式拿到真实数据
      // you can use state
      foobarLoadingCount2() {
        return this.$store.state._loading.b.foobar
      }
      // 你也可以通过 getter 计算
      // you can use getter
      foobarLoadingCount3() {
        return this.$store.getters.['_loading/stateC']('foobar')
      }
    }
  }
</script>
<style scoped></style>
```

### Props

- `log`(required: `false`, default: `false`): need console log the state or not.
- `key` (required: `false`, default: `loading`): the key of this module in vuex store.

### License

[MIT](./LICENSE)

[⬆ Back to Top](#vuex-action-monitor)
