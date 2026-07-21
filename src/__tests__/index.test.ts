import { describe, it, expect, vi, beforeEach } from 'vitest'
import actionSubscribe from '../index'
import type { ActionSubOption } from '../index'

// ── Mock Store 工厂 ───────────────────────────────────

type GetterPath = string | string[] | (string | string[])[]
interface MockGetters {
  [key: string]: (path: GetterPath) => boolean | number
}

function createMockStore() {
  const moduleRegistry: Record<string, any> = {}
  const getters: MockGetters = {}
  let actionSubscriber: {
    before?: (action: any, state: any) => void
    after?: (action: any, state: any) => void
    error?: (action: any, state: any) => void
  } | null = null

  const store = {
    registerModule: vi.fn((path: string[], module: any) => {
      const key = path[path.length - 1]
      moduleRegistry[key] = module

      // 将 getters 复制到 store.getters，模拟 vuex 行为
      if (module.getters) {
        for (const name of Object.keys(module.getters)) {
          getters[`${key}/${name}`] = module.getters[name](module.state)
        }
      }
    }),
    subscribeAction: vi.fn((sub: typeof actionSubscriber) => {
      actionSubscriber = sub
    }),
    commit: vi.fn((type: string, payload: any) => {
      // 模拟 vuex commit: 找到对应 mutation 并调用
      const [moduleName, mutationName] = type.split('/')
      const mod = moduleRegistry[moduleName]
      if (mod && mod.mutations && mod.mutations[mutationName]) {
        mod.mutations[mutationName](mod.state, payload)
        // commit 后重新绑定 getters
        if (mod.getters) {
          for (const name of Object.keys(mod.getters)) {
            getters[`${moduleName}/${name}`] = mod.getters[name](mod.state)
          }
        }
      }
    }),
    getters,
    _getModule: (name: string) => moduleRegistry[name],
    _triggerAction: (phase: 'before' | 'after' | 'error', action: any) => {
      if (actionSubscriber && actionSubscriber[phase]) {
        actionSubscriber[phase]!(action, {})
      }
    }
  }

  return store
}

// ── Vue mock ──────────────────────────────────────────

function createMockVue() {
  const proto: Record<string, any> = {}
  return {
    prototype: proto,
    _installed_vuex_action_monitor: false,
    use(_plugin: any) {
      // no-op
    }
  }
}

// ── Tests ─────────────────────────────────────────────

describe('actionSubscribe', () => {
  describe('basic configuration', () => {
    it('should use default key "loading"', () => {
      const store = createMockStore()
      const plugin = actionSubscribe()

      plugin(store as any)

      expect(store.registerModule).toHaveBeenCalled()
      const path = store.registerModule.mock.calls[0][0]
      expect(path).toEqual(['loading'])
    })

    it('should accept custom key', () => {
      const store = createMockStore()
      const plugin = actionSubscribe({ key: 'api' })

      plugin(store as any)

      const path = store.registerModule.mock.calls[0][0]
      expect(path).toEqual(['api'])
    })

    it('should register a namespaced module', () => {
      const store = createMockStore()
      const plugin = actionSubscribe()

      plugin(store as any)

      const path = store.registerModule.mock.calls[0][0]
      const module = store.registerModule.mock.calls[0][1]
      expect(path).toEqual(['loading'])
      expect(module.namespaced).toBe(true)
    })
  })

  describe('module state', () => {
    it('should initialize with empty b and c', () => {
      const store = createMockStore()
      const plugin = actionSubscribe()
      plugin(store as any)

      const mod = store._getModule('loading')
      expect(mod.state.b).toEqual({})
      expect(mod.state.c).toEqual({})
    })
  })

  describe('mutation: onActionDispatch', () => {
    it('should initialize state for a new action type', () => {
      const store = createMockStore()
      const plugin = actionSubscribe()
      plugin(store as any)

      store.commit('loading/onActionDispatch', {
        actionType: 'foo',
        value: true
      })

      const mod = store._getModule('loading')
      expect(mod.state.b['foo']).toBe(true)
      expect(mod.state.c['foo']).toBe(1)
    })

    it('should increment count on second dispatch', () => {
      const store = createMockStore()
      const plugin = actionSubscribe()
      plugin(store as any)

      store.commit('loading/onActionDispatch', {
        actionType: 'foo',
        value: true
      })
      store.commit('loading/onActionDispatch', {
        actionType: 'foo',
        value: true
      })

      const mod = store._getModule('loading')
      expect(mod.state.c['foo']).toBe(2)
      expect(mod.state.b['foo']).toBe(true)
    })

    it('should decrement count on value=false', () => {
      const store = createMockStore()
      const plugin = actionSubscribe()
      plugin(store as any)

      store.commit('loading/onActionDispatch', {
        actionType: 'foo',
        value: true
      })
      store.commit('loading/onActionDispatch', {
        actionType: 'foo',
        value: true
      })
      store.commit('loading/onActionDispatch', {
        actionType: 'foo',
        value: false
      })

      const mod = store._getModule('loading')
      expect(mod.state.c['foo']).toBe(1)
      expect(mod.state.b['foo']).toBe(true)
    })

    it('should set boolean to false when count reaches 0', () => {
      const store = createMockStore()
      const plugin = actionSubscribe()
      plugin(store as any)

      store.commit('loading/onActionDispatch', {
        actionType: 'foo',
        value: true
      })
      store.commit('loading/onActionDispatch', {
        actionType: 'foo',
        value: false
      })

      const mod = store._getModule('loading')
      expect(mod.state.c['foo']).toBe(0)
      expect(mod.state.b['foo']).toBe(false)
    })

    it('should not go below 0', () => {
      const store = createMockStore()
      const plugin = actionSubscribe()
      plugin(store as any)

      store.commit('loading/onActionDispatch', {
        actionType: 'foo',
        value: false
      })

      const mod = store._getModule('loading')
      expect(mod.state.c['foo']).toBe(0)
      expect(mod.state.b['foo']).toBe(false)
    })
  })

  describe('getters', () => {
    function setupWithActions(store: ReturnType<typeof createMockStore>, actions: [string, boolean][]) {
      for (const [type, value] of actions) {
        store.commit('loading/onActionDispatch', { actionType: type, value })
      }
    }

    describe('stateB (boolean)', () => {
      it('should return false for unknown action', () => {
        const store = createMockStore()
        const plugin = actionSubscribe()
        plugin(store as any)

        expect(store.getters['loading/stateB']('unknown')).toBe(false)
      })

      it('should return true for active action', () => {
        const store = createMockStore()
        const plugin = actionSubscribe()
        plugin(store as any)
        setupWithActions(store, [['foo', true]])

        expect(store.getters['loading/stateB']('foo')).toBe(true)
      })

      it('should return true if any in array is active (OR logic)', () => {
        const store = createMockStore()
        const plugin = actionSubscribe()
        plugin(store as any)
        setupWithActions(store, [['foo', true]])

        expect(store.getters['loading/stateB'](['foo', 'bar'])).toBe(true)
      })

      it('should return false if none in array is active', () => {
        const store = createMockStore()
        const plugin = actionSubscribe()
        plugin(store as any)

        expect(store.getters['loading/stateB'](['foo', 'bar'])).toBe(false)
      })

      it('should support nested array (AND logic)', () => {
        const store = createMockStore()
        const plugin = actionSubscribe()
        plugin(store as any)
        setupWithActions(store, [
          ['foo', true],
          ['bar', false]
        ])

        // [['foo', 'bar']] — all must be active → false because bar is not
        expect(store.getters['loading/stateB']([['foo', 'bar']])).toBe(false)

        // activate bar too
        store.commit('loading/onActionDispatch', {
          actionType: 'bar',
          value: true
        })

        // now both are active → true
        expect(store.getters['loading/stateB']([['foo', 'bar']])).toBe(true)
      })
    })

    describe('stateC (count)', () => {
      it('should return 0 for unknown action', () => {
        const store = createMockStore()
        const plugin = actionSubscribe()
        plugin(store as any)

        expect(store.getters['loading/stateC']('unknown')).toBe(0)
      })

      it('should return count for single action', () => {
        const store = createMockStore()
        const plugin = actionSubscribe()
        plugin(store as any)
        setupWithActions(store, [
          ['foo', true],
          ['foo', true]
        ])

        expect(store.getters['loading/stateC']('foo')).toBe(2)
      })

      it('should sum counts for array of actions', () => {
        const store = createMockStore()
        const plugin = actionSubscribe()
        plugin(store as any)
        setupWithActions(store, [
          ['foo', true],
          ['foo', true],
          ['bar', true]
        ])

        expect(store.getters['loading/stateC'](['foo', 'bar'])).toBe(3)
      })
    })
  })

  describe('action subscription lifecycle', () => {
    it('should trigger before → after sequence', () => {
      const store = createMockStore()
      const plugin = actionSubscribe()
      plugin(store as any)

      store._triggerAction('before', { type: 'fetchData' })
      expect(store.getters['loading/stateB']('fetchData')).toBe(true)
      expect(store.getters['loading/stateC']('fetchData')).toBe(1)

      store._triggerAction('after', { type: 'fetchData' })
      expect(store.getters['loading/stateB']('fetchData')).toBe(false)
      expect(store.getters['loading/stateC']('fetchData')).toBe(0)
    })

    it('should trigger before → error sequence', () => {
      const store = createMockStore()
      const plugin = actionSubscribe()
      plugin(store as any)

      store._triggerAction('before', { type: 'fetchData' })
      expect(store.getters['loading/stateB']('fetchData')).toBe(true)

      store._triggerAction('error', { type: 'fetchData' })
      expect(store.getters['loading/stateB']('fetchData')).toBe(false)
      expect(store.getters['loading/stateC']('fetchData')).toBe(0)
    })
  })

  describe('console logging', () => {
    it('should not log when log option is false (default)', () => {
      const store = createMockStore()
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const plugin = actionSubscribe()

      plugin(store as any)
      store._triggerAction('before', { type: 'testAction' })

      // console.log may be called by other things, but not with our tag
      const calls = logSpy.mock.calls.filter((c) => typeof c[0] === 'string' && c[0].includes('%c'))
      expect(calls.length).toBe(0)

      logSpy.mockRestore()
    })

    it('should log before/after when log is true', () => {
      const store = createMockStore()
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const plugin = actionSubscribe({ log: true })

      plugin(store as any)
      store._triggerAction('before', { type: 'testAction' })
      store._triggerAction('after', { type: 'testAction' })

      const calls = logSpy.mock.calls.filter((c) => typeof c[0] === 'string' && c[0].includes('%c'))
      expect(calls.length).toBe(2)

      logSpy.mockRestore()
    })

    it('should respect logIgnore list', () => {
      const store = createMockStore()
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const plugin = actionSubscribe({
        log: true,
        logIgnore: ['noisyAction']
      })

      plugin(store as any)
      store._triggerAction('before', { type: 'noisyAction' })
      store._triggerAction('before', { type: 'importantAction' })

      const calls = logSpy.mock.calls.filter((c) => typeof c[0] === 'string' && c[0].includes('%c'))
      // only importantAction should be logged
      expect(calls.length).toBe(1)
      expect(calls[0][2]).toContain('importantAction')

      logSpy.mockRestore()
    })
  })

  describe('install method', () => {
    it('should add $loadingB and $loadingC to Vue.prototype', () => {
      const plugin = actionSubscribe()
      const Vue = createMockVue()

      plugin.install(Vue as any)

      expect(typeof Vue.prototype['$loadingB']).toBe('function')
      expect(typeof Vue.prototype['$loadingC']).toBe('function')
    })

    it('should skip install if already installed', () => {
      const plugin = actionSubscribe()
      const Vue = createMockVue()

      plugin.install(Vue as any)
      expect(Vue._installed_vuex_action_monitor).toBe(true)

      // second install should return early
      const protoKeysBefore = Object.keys(Vue.prototype)
      plugin.install(Vue as any)
      const protoKeysAfter = Object.keys(Vue.prototype)
      expect(protoKeysAfter.length).toBe(protoKeysBefore.length)
    })

    it('should use custom key in prototype method names', () => {
      const plugin = actionSubscribe({ key: 'api' })
      const Vue = createMockVue()

      plugin.install(Vue as any)

      expect(typeof Vue.prototype['$apiB']).toBe('function')
      expect(typeof Vue.prototype['$apiC']).toBe('function')
    })
  })

  describe('concurrent actions', () => {
    it('should track multiple actions independently', () => {
      const store = createMockStore()
      const plugin = actionSubscribe()
      plugin(store as any)

      store._triggerAction('before', { type: 'actionA' })
      store._triggerAction('before', { type: 'actionA' })
      store._triggerAction('before', { type: 'actionB' })

      expect(store.getters['loading/stateC']('actionA')).toBe(2)
      expect(store.getters['loading/stateC']('actionB')).toBe(1)
      expect(store.getters['loading/stateC'](['actionA', 'actionB'])).toBe(3)

      // actionA completes once
      store._triggerAction('after', { type: 'actionA' })
      expect(store.getters['loading/stateC']('actionA')).toBe(1)
      expect(store.getters['loading/stateB']('actionA')).toBe(true) // still 1 active
      expect(store.getters['loading/stateB']('actionB')).toBe(true)
    })

    it('should return correct aggregate boolean', () => {
      const store = createMockStore()
      const plugin = actionSubscribe()
      plugin(store as any)

      store._triggerAction('before', { type: 'actionA' })
      store._triggerAction('before', { type: 'actionB' })

      // [actionA, actionB] OR → true
      expect(store.getters['loading/stateB'](['actionA', 'actionB'])).toBe(true)
      // [['actionA', 'actionB']] AND → true (both active)
      expect(store.getters['loading/stateB']([['actionA', 'actionB']])).toBe(true)

      store._triggerAction('after', { type: 'actionB' })

      // [['actionA', 'actionB']] AND → false (actionB is done)
      expect(store.getters['loading/stateB']([['actionA', 'actionB']])).toBe(false)
    })
  })

  describe('type exports', () => {
    it('should export ActionSubOption type', () => {
      const opts: ActionSubOption = {
        log: true,
        key: 'test',
        logIgnore: ['a', 'b']
      }
      expect(opts.log).toBe(true)
      expect(opts.key).toBe('test')
    })
  })

  describe('return type', () => {
    it('should return function with install method', () => {
      const result = actionSubscribe()
      expect(typeof result).toBe('function')
      expect(typeof result.install).toBe('function')
    })

    it('should be usable as both plugin and install', () => {
      const store = createMockStore()
      const plugin = actionSubscribe()

      // can be used as store plugin
      plugin(store as any)
      expect(store.registerModule).toHaveBeenCalled()

      // can be used as Vue.use() plugin
      const Vue = createMockVue()
      plugin.install(Vue as any)
      expect(typeof Vue.prototype['$loadingB']).toBe('function')
    })
  })
})
