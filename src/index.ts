
interface actionSubOption {
  log?: boolean;
  key?: string;
  logIgnore?: string[]
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

function actionSubscribe(opt: actionSubOption = {}) {
  // sub key
  const _subKey = opt.key ? opt.key : 'loading'
  // sub key in store
  const slotSubKey = _subKey
  const needLog = opt.log ? true : false

  const _logIgnore = opt.logIgnore ? opt.logIgnore : []

  let closerStore = {}
  const moduleResult = function (store: any) {
    // const storeActionKeys = Object.keys(store._actions)
    // console.log(storeActionKeys);
    closerStore = store

    store.registerModule([slotSubKey], {
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
              /**
               * 数组有一个是 true ,就为 true
               */
              return path.some((key: string | string[]) => {
                if (typeof key === 'string') {
                  return state.b[key] || false
                }
                if (Array.isArray(key)) {
                  return key.every((k) => {
                    return state.b[k] || false
                  }) || false
                }

              })
            }

            throw new Error('args must be a string or an array of string[]')
          }
        },
        // count 形式
        stateC(state: any) {
          return (path: string | string[]) => {
            if (typeof path === 'string') {
              return (state.c as any)[path] || 0
            }

            if (Array.isArray(path)) {
              return path.map(key => {
                return state.c[key] || 0
              }).reduce((a, b) => a + b, 0)
            }
            throw new Error('args must be a string or an array of string')
          }
        }
      }
    })

    /**
     * 订阅 action
     */
    store.subscribeAction({
      before: (action: any, state: any) => {
        store.commit(`${slotSubKey}/onActionDispatch`, {
          actionType: action.type,
          value: true
        })
        if (needLog && !_logIgnore.includes(action.type)) {
          consoleLog('start', `before action:  ${action.type}`)
        }
      },
      after: (action: any, state: any) => {
        store.commit(`${slotSubKey}/onActionDispatch`, {
          actionType: action.type,
          value: false
        })
        if (needLog && !_logIgnore.includes(action.type)) {
          consoleLog('success', `after action:  ${action.type}`)
        }
      }
    })

  }
  moduleResult.install = function (Vue: any) {
    if (Vue._installed_vuex_action_monitor) return
    Vue._installed_vuex_action_monitor = true
    const slotSubKeyB = `$${slotSubKey}B`
    if (!Vue.prototype[slotSubKeyB]) {
      Object.defineProperty(Vue.prototype, slotSubKeyB, {
        value: function (path: string): boolean {
          return (closerStore as any).getters[`${slotSubKey}/stateB`](path)
        },
        writable: true,
        enumerable: true,
        configurable: true
      })
    }

    const slotSubKeyC = `$${slotSubKey}C`
    if (!Vue.prototype[slotSubKeyC]) {
      Object.defineProperty(Vue.prototype, slotSubKeyC, {
        value: function (path: string): number {
          return (closerStore as any).getters[`${slotSubKey}/stateC`](path)
        },
        writable: true,
        enumerable: true,
        configurable: true
      })
    }
  }
  return moduleResult
}

export default actionSubscribe
