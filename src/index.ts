
import { Payload, Plugin } from "vuex/types";
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
  // 加了下划线在顶部的 sub key
  const _lowSubKey = '_' + _subKey
  const needLog = opt.log ? true : false

  let closerStore = {}
  const moduleResult = function (store: any) {
    // const storeActionKeys = Object.keys(store._actions)
    // console.log(storeActionKeys);
    closerStore = store

    store.registerModule([_lowSubKey], {
      namespaced: true,
      state: {
        // boolean
        b: {},
        // count
        c: {}
      },
      mutations: {
        onActionDispatch(state: any, { actionType, value }: { actionType: string, value: boolean }) {
          function changeLoadingState(st: typeof state, { targetCount, actionType }: { targetCount: number, actionType: string }) {

            let currentCount = targetCount >= 0 ? targetCount : 0;
            (st.c as any)[actionType] = currentCount;
            (st.b as any)[actionType] = currentCount > 0
          }
          /**
           * 初始化 action 的计数和状态
           */
          if (!state.b.hasOwnProperty(actionType)) {
            state.b = {
              ...state.b,
              [actionType]: false
            }
            state.c = {
              ...state.c,
              [actionType]: 0
            }
            // Vue.set(state.b, actionType, false)
            // Vue.set(state.c, actionType, 0)
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
        // boolean 形式
        stateB(state: any) {
          return (path: string | string[]) => {
            if (typeof path === 'string') {
              return (state.b as any)[path] || false
            }
            if (Array.isArray(path)) {
              return (state.b as any)[path[0]] || false
            }
          }
        },
        // count 形式
        stateC(state: any) {
          return (path: string) => {
            return (state.c as any)[path] || 0
          }
        }
      }
    })

    /**
     * 订阅 action
     */
    store.subscribeAction({
      before: (action: any, state: any) => {
        store.commit(`${_lowSubKey}/onActionDispatch`, {
          actionType: action.type,
          value: true
        })
        if (needLog) {
          consoleLog('start', `before action:  ${action.type}`)
        }
      },
      after: (action: any, state: any) => {
        store.commit(`${_lowSubKey}/onActionDispatch`, {
          actionType: action.type,
          value: false
        })
        if (needLog) {
          consoleLog('success', `after action:  ${action.type}`)
        }
      }
    })

  }
  moduleResult.install = function (Vue: any) {
    Object.defineProperty(Vue.prototype, `$loadingB`, {
      value: function (path: string): boolean {
        return (closerStore as any).getters[`${_lowSubKey}/stateB`](path)
      }
    })

    Object.defineProperty(Vue.prototype, `$loadingC`, {
      value: function (path: string): number {
        return (closerStore as any).getters[`${_lowSubKey}/stateC`](path)
      }
    })
  }
  return moduleResult
}

export default actionSubscribe
