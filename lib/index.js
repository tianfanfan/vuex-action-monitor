"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
function consoleLog(tag) {
    var content = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        content[_i - 1] = arguments[_i];
    }
    var colorMap = {
        success: '#2ecc71',
        start: '#00BCD4'
    };
    var style = "\n    background: " + colorMap[tag] + ";\n    border-radius: 0.5em;\n    color: white;\n    font-weight: bold;\n    padding: 2px 0.5em;\n  ";
    console.log.apply(console, __spreadArrays(["%c" + tag, style], content));
}
function actionSubscribe(opt) {
    if (opt === void 0) { opt = {}; }
    // sub key
    var _subKey = opt.key ? opt.key : 'loading';
    // sub key in store
    var slotSubKey = _subKey;
    var needLog = opt.log ? true : false;
    var _logIgnore = opt.logIgnore ? opt.logIgnore : [];
    var closerStore = {};
    var moduleResult = function (store) {
        // const storeActionKeys = Object.keys(store._actions)
        // console.log(storeActionKeys);
        closerStore = store;
        store.registerModule([slotSubKey], {
            namespaced: true,
            state: {
                // boolean
                b: {},
                // count
                c: {}
            },
            mutations: {
                onActionDispatch: function (state, _a) {
                    var _b, _c;
                    var actionType = _a.actionType, value = _a.value;
                    function changeLoadingState(st, _a) {
                        var targetCount = _a.targetCount, actionType = _a.actionType;
                        var currentCount = targetCount >= 0 ? targetCount : 0;
                        st.c[actionType] = currentCount;
                        st.b[actionType] = currentCount > 0;
                    }
                    /**
                     * 初始化 action 的计数和状态
                     */
                    if (!state.b.hasOwnProperty(actionType)) {
                        state.b = __assign(__assign({}, state.b), (_b = {}, _b[actionType] = false, _b));
                        state.c = __assign(__assign({}, state.c), (_c = {}, _c[actionType] = 0, _c));
                        // Vue.set(state.b, actionType, false)
                        // Vue.set(state.c, actionType, 0)
                    }
                    var beforeCount = state.c[actionType] || 0;
                    if (value) {
                        var targetCount = beforeCount + 1;
                        changeLoadingState(state, { targetCount: targetCount, actionType: actionType });
                    }
                    else {
                        var targetCount = beforeCount - 1;
                        changeLoadingState(state, { targetCount: targetCount, actionType: actionType });
                    }
                },
            },
            getters: {
                // boolean 形式
                stateB: function (state) {
                    return function (path) {
                        if (typeof path === 'string') {
                            return state.b[path] || false;
                        }
                        if (Array.isArray(path)) {
                            /**
                             * 数组有一个是 true ,就为 true
                             */
                            return path.some(function (key) {
                                if (typeof key === 'string') {
                                    return state.b[key] || false;
                                }
                                if (Array.isArray(key)) {
                                    return key.every(function (k) {
                                        return state.b[k] || false;
                                    }) || false;
                                }
                            });
                        }
                        throw new Error('args must be a string or an array of string[]');
                    };
                },
                // count 形式
                stateC: function (state) {
                    return function (path) {
                        if (typeof path === 'string') {
                            return state.c[path] || 0;
                        }
                        if (Array.isArray(path)) {
                            return path.map(function (key) {
                                return state.c[key] || 0;
                            }).reduce(function (a, b) { return a + b; }, 0);
                        }
                        throw new Error('args must be a string or an array of string');
                    };
                }
            }
        });
        /**
         * 订阅 action
         */
        store.subscribeAction({
            before: function (action, state) {
                store.commit(slotSubKey + "/onActionDispatch", {
                    actionType: action.type,
                    value: true
                });
                if (needLog && !_logIgnore.includes(action.type)) {
                    consoleLog('start', "before action:  " + action.type);
                }
            },
            after: function (action, state) {
                store.commit(slotSubKey + "/onActionDispatch", {
                    actionType: action.type,
                    value: false
                });
                if (needLog && !_logIgnore.includes(action.type)) {
                    consoleLog('success', "after action:  " + action.type);
                }
            }
        });
    };
    moduleResult.install = function (Vue) {
        if (Vue._installed_vuex_action_monitor)
            return;
        Vue._installed_vuex_action_monitor = true;
        var slotSubKeyB = "$" + slotSubKey + "B";
        if (!Vue.prototype[slotSubKeyB]) {
            Object.defineProperty(Vue.prototype, slotSubKeyB, {
                value: function (path) {
                    return closerStore.getters[slotSubKey + "/stateB"](path);
                },
                writable: true,
                enumerable: true,
                configurable: true
            });
        }
        var slotSubKeyC = "$" + slotSubKey + "C";
        if (!Vue.prototype[slotSubKeyC]) {
            Object.defineProperty(Vue.prototype, slotSubKeyC, {
                value: function (path) {
                    return closerStore.getters[slotSubKey + "/stateC"](path);
                },
                writable: true,
                enumerable: true,
                configurable: true
            });
        }
    };
    return moduleResult;
}
exports.default = actionSubscribe;
