// ── Vuex Store 类型（本地声明，避免 vuex 3 exports 兼容问题）──

interface VuexStore {
  registerModule(path: string[], module: {
    namespaced?: boolean
    state?: Record<string, unknown>
    mutations?: Record<string, (...args: any[]) => void>
    getters?: Record<string, (state: any) => (...args: any[]) => any>
  }): void
  subscribeAction(handler: {
    before?: (action: { type: string; payload: unknown }, state: unknown) => void
    after?: (action: { type: string; payload: unknown }, state: unknown) => void
    error?: (action: { type: string; payload: unknown }, state: unknown) => void
  }): void
  commit(type: string, payload?: unknown): void
}

// ── 公共类型 ──────────────────────────────────────────

export interface ActionSubOption {
  /** 是否在控制台打印 action 执行日志，默认 false */
  log?: boolean
  /** 在 vuex store 中注册的 module 名称，默认 'loading' */
  key?: string
  /** 不需要打印日志的 action 名称列表 */
  logIgnore?: string[]
}

/** actionSubscribe 返回的插件函数类型 */
export interface ActionSubscribeReturn {
  (store: VuexStore): void
  install(Vue: any): void
}

// ── 内部类型 ──────────────────────────────────────────

type LogTag = 'success' | 'start' | 'error'

interface LoadingState {
  b: Record<string, boolean>
  c: Record<string, number>
}

interface DispatchPayload {
  actionType: string
  value: boolean
}

// ── 工具函数 ──────────────────────────────────────────

function consoleLog(tag: LogTag, ...content: unknown[]): void {
  const colorMap: Record<LogTag, string> = {
    success: '#2ecc71',
    start: '#00BCD4',
    error: '#ff4411',
  }
  const style = `
    background: ${colorMap[tag]};
    border-radius: 0.5em;
    color: white;
    font-weight: bold;
    padding: 2px 0.5em;
  `
  console.log('%c' + tag, style, ...content)
}

// ── 主函数 ────────────────────────────────────────────

function actionSubscribe(opt: ActionSubOption = {}): ActionSubscribeReturn {
  const _subKey = opt.key ? opt.key : 'loading'
  const slotSubKey = _subKey
  const needLog = opt.log ? true : false
  const _logIgnore = opt.logIgnore ? opt.logIgnore : []

  function moduleResult(store: VuexStore): void {
    store.registerModule([slotSubKey], {
      namespaced: true,
      state: {
        b: {} as Record<string, boolean>,
        c: {} as Record<string, number>,
      },
      mutations: {
        onActionDispatch(
          state: LoadingState,
          { actionType, value }: DispatchPayload
        ): void {
          function changeLoadingState(
            st: LoadingState,
            {
              targetCount,
              actionType,
            }: { targetCount: number; actionType: string }
          ): void {
            const currentCount = targetCount >= 0 ? targetCount : 0
            st.c[actionType] = currentCount
            st.b[actionType] = currentCount > 0
          }

          // 初始化 action 的计数和状态
          if (!Object.prototype.hasOwnProperty.call(state.b, actionType)) {
            state.b = {
              ...state.b,
              [actionType]: false,
            }
            state.c = {
              ...state.c,
              [actionType]: 0,
            }
          }

          const beforeCount: number = state.c[actionType] || 0
          if (value) {
            const targetCount = beforeCount + 1
            changeLoadingState(state, { targetCount, actionType })
          } else {
            const targetCount = beforeCount - 1
            changeLoadingState(state, { targetCount, actionType })
          }
        },
      },
      getters: {
        // boolean 形式 — some(OR) / every(AND)
        stateB(state: LoadingState) {
          return (path: string | (string | string[])[]): boolean => {
            if (typeof path === 'string') {
              return state.b[path] || false
            }

            if (Array.isArray(path)) {
              return path.some(
                (key: string | string[]): boolean => {
                  if (typeof key === 'string') {
                    return state.b[key] || false
                  }
                  if (Array.isArray(key)) {
                    return (
                      key.every((k: string) => {
                        return state.b[k] || false
                      }) || false
                    )
                  }
                  return false
                }
              )
            }

            throw new Error(
              'args must be a string or an array of string[]'
            )
          }
        },
        // count 形式 — 求和
        stateC(state: LoadingState) {
          return (path: string | string[]): number => {
            if (typeof path === 'string') {
              return state.c[path] || 0
            }

            if (Array.isArray(path)) {
              return path
                .map((key: string) => {
                  return state.c[key] || 0
                })
                .reduce((a: number, b: number) => a + b, 0)
            }
            throw new Error('args must be a string or an array of string')
          }
        },
      },
    })

    // 订阅 action
    store.subscribeAction({
      before(action: { type: string; payload: unknown }, _state: unknown): void {
        store.commit(`${slotSubKey}/onActionDispatch`, {
          actionType: action.type,
          value: true,
        })
        if (needLog && !_logIgnore.includes(action.type)) {
          consoleLog('start', `before action:  ${action.type}`)
        }
      },
      after(action: { type: string; payload: unknown }, _state: unknown): void {
        store.commit(`${slotSubKey}/onActionDispatch`, {
          actionType: action.type,
          value: false,
        })
        if (needLog && !_logIgnore.includes(action.type)) {
          consoleLog('success', `after action:  ${action.type}`)
        }
      },
      error(action: { type: string; payload: unknown }, _state: unknown): void {
        store.commit(`${slotSubKey}/onActionDispatch`, {
          actionType: action.type,
          value: false,
        })
        if (needLog && !_logIgnore.includes(action.type)) {
          consoleLog('error', `after action:  ${action.type}`)
        }
      },
    })
  }

  moduleResult.install = function (Vue: any): void {
    if (Vue._installed_vuex_action_monitor) return
    Vue._installed_vuex_action_monitor = true

    const slotSubKeyB = `$${slotSubKey}B`
    if (!Vue.prototype[slotSubKeyB]) {
      Object.defineProperty(Vue.prototype, slotSubKeyB, {
        value: function (path: string | string[]): boolean {
          const closerStore = this.$store
          return closerStore.getters[`${slotSubKey}/stateB`](path)
        },
        writable: true,
        enumerable: true,
        configurable: true,
      })
    }

    const slotSubKeyC = `$${slotSubKey}C`
    if (!Vue.prototype[slotSubKeyC]) {
      Object.defineProperty(Vue.prototype, slotSubKeyC, {
        value: function (path: string | string[]): number {
          const closerStore = this.$store
          return closerStore.getters[`${slotSubKey}/stateC`](path)
        },
        writable: true,
        enumerable: true,
        configurable: true,
      })
    }
  }

  return moduleResult
}

export default actionSubscribe
