"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = __importDefault(require("vue"));
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
    // 加了下划线在顶部的 sub key
    var _lowSubKey = '_' + _subKey;
    var needLog = opt.log ? true : false;
    var closerStore = {};
    var moduleResult = function (store) {
        // const storeActionKeys = Object.keys(store._actions)
        // console.log(storeActionKeys);
        closerStore = store;
        store.registerModule([_lowSubKey], {
            namespaced: true,
            state: {
                // boolean
                b: {},
                // count
                c: {}
            },
            mutations: {
                onActionDispatch: function (state, _a) {
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
                        vue_1.default.set(state.b, actionType, false);
                        vue_1.default.set(state.c, actionType, 0);
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
                        return state.b[path] || false;
                    };
                },
                // count 形式
                stateC: function (state) {
                    return function (path) {
                        return state.c[path] || 0;
                    };
                }
            }
        });
        /**
         * 订阅 action
         */
        store.subscribeAction({
            before: function (action, state) {
                store.commit(_lowSubKey + "/onActionDispatch", {
                    actionType: action.type,
                    value: true
                });
                if (needLog) {
                    consoleLog('start', "before action:  " + action.type);
                }
            },
            after: function (action, state) {
                store.commit(_lowSubKey + "/onActionDispatch", {
                    actionType: action.type,
                    value: false
                });
                if (needLog) {
                    consoleLog('success', "after action:  " + action.type);
                }
            }
        });
        /**
         * 定义插件的 Key 到 store 实例上
         */
        Object.defineProperty(vue_1.default.prototype, "$loadingB", {
            value: function (path) {
                return store.getters[_lowSubKey + "/stateB"](path);
            }
        });
        Object.defineProperty(vue_1.default.prototype, "$loadingC", {
            value: function (path) {
                return store.getters[_lowSubKey + "/stateC"](path);
            }
        });
    };
    moduleResult.install = function (Vue) {
        Object.defineProperty(Vue.prototype, "$loadingB", {
            value: function (path) {
                return closerStore.getters[_lowSubKey + "/stateB"](path);
            }
        });
        Object.defineProperty(Vue.prototype, "$loadingC", {
            value: function (path) {
                return closerStore.getters[_lowSubKey + "/stateC"](path);
            }
        });
    };
    return moduleResult;
}
exports.default = actionSubscribe;
