import { Plugin } from "vuex/types";
declare module 'vue/types/vue' {
    interface Vue {
        $loadingB: (path: string | string[]) => boolean;
        $loadingC: (path: string) => number;
    }
}
interface actionSubOption<S> {
    log?: boolean;
    key?: string;
}
declare function actionSubscribe<S>(opt?: actionSubOption<S>): Plugin<S>;
export default actionSubscribe;
