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
    console.log.apply(console, ["%c" + tag, style].concat(content));
}
function actionSubscribe(opt) {
    if (opt === void 0) { opt = {}; }
    // sub key
    var _subKey = opt.key ? opt.key : 'loading';
    // sub key in store
    var slotSubKey = _subKey;
    var needLog = opt.log ? true : false;
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
                        state.b = __assign({}, state.b, (_b = {}, _b[actionType] = false, _b));
                        state.c = __assign({}, state.c, (_c = {}, _c[actionType] = 0, _c));
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
                        throw new Error('path must be a string or an array of string');
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
                if (needLog) {
                    consoleLog('start', "before action:  " + action.type);
                }
            },
            after: function (action, state) {
                store.commit(slotSubKey + "/onActionDispatch", {
                    actionType: action.type,
                    value: false
                });
                if (needLog) {
                    consoleLog('success', "after action:  " + action.type);
                }
            }
        });
    };
    moduleResult.install = function (Vue) {
        Object.defineProperty(Vue.prototype, "$" + slotSubKey + "B", {
            value: function (path) {
                return closerStore.getters[slotSubKey + "/stateB"](path);
            }
        });
        Object.defineProperty(Vue.prototype, "$" + slotSubKey + "C", {
            value: function (path) {
                return closerStore.getters[slotSubKey + "/stateC"](path);
            }
        });
    };
    return moduleResult;
}
exports.default = actionSubscribe;
