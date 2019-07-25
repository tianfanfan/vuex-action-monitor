
import { Payload, Plugin } from "vuex/types/index";
import Vue from 'vue'

declare module 'vue/types/vue' {
  interface Vue {
    $loadingB: (path: string | string[]) => boolean,
    $loadingC: (path: string) => number
  }
}

interface actionSubOption<S> {
  log?: boolean;
  key?: string;
}

function consoleLog(tag: 'success' | 'start', ...content: any[]) {
  const colorMap = {
    success: '#2ecc71',
    start: '#00BCD4'
  }
  const style = `
    background: ${colorMap[tag]};
    border-radius: 0.5em;
    color: white;
    font-weight: bold;
    padding: 2px 0.5em;
  `
  console.log("%c" + tag, style, ...content)
}

function actionSubscribe<S>(opt: actionSubOption<S> = {}): Plugin<S> {
  // sub key
  const _subKey = opt.key ? opt.key : 'loading'
  // å äºä¸åçº¿å¨é¡¶é¨ç sub key
  const _lowSubKey = '_' + _subKey
  const needLog = opt.log ? true : false

  return function (store) {
    // const storeActionKeys = Object.keys(store._actions)
    // console.log(storeActionKeys);
    store.registerModule([_lowSubKey], {
      namespaced: true,
      state: {
        // boolean
        b: {},
        // count
        c: {}
      },
      mutations: {
        onActionDispatch(state, { actionType, value }) {
          function changeLoadingState(st: typeof state, { targetCount, actionType }: { targetCount: number, actionType: string }) {

            let currentCount = targetCount >= 0 ? targetCount : 0;
            (st.c as any)[actionType] = currentCount;
            (st.b as any)[actionType] = currentCount > 0
          }
          /**
           * åå§å action çè®¡æ°åç¶æ
           */
          if (!state.b.hasOwnProperty(actionType)) {
            Vue.set(state.b, actionType, false)
            Vue.set(state.c, actionType, 0)
          }

          let beforeCount = (<any>state.c)[actionType] || 0;
          if (value) {
            let targetCount = beforeCount + 1
            changeLoadingState(state, { targetCount, actionType })
          } else {
            let targetCount = beforeCount - 1;
            changeLoadingState(state, { targetCount, actionType })
          }
        },
      },
      getters: {
        // boolean å½¢å¼
        stateB(state) {
          return (path: string) => {
            return (state.b as any)[path] || false
          }
        },
        // count å½¢å¼
        stateC(state) {
          return (path: string) => {
            return (state.c as any)[path] || 0
          }
        }
      }
    })

    /**
     * è®¢é action
     */
    store.subscribeAction({
      before: (action, state) => {
        store.commit(`${_lowSubKey}/onActionDispatch`, {
          actionType: action.type,
          value: true
        })
        if (needLog) {
          consoleLog('start', `before action:  ${action.type}`)
        }
      },
      after: (action, state) => {
        store.commit(`${_lowSubKey}/onActionDispatch`, {
          actionType: action.type,
          value: false
        })
        if (needLog) {
          consoleLog('success', `after action:  ${action.type}`)
        }
      }
    })

    /**
     * å®ä¹æä»¶ç Key å° store å®ä¾ä¸
     */

    Object.defineProperty(Vue.prototype, `$loadingB`, {
      value: function (path: string): boolean {
        return store.getters[`${_lowSubKey}/stateB`](path)
      }
    })

    Object.defineProperty(Vue.prototype, `$loadingC`, {
      value: function (path: string): number {
        return store.getters[`${_lowSubKey}/stateC`](path)
      }
    })
  }
}

export default actionSubscribe
