interface actionSubOption<S> {
    log?: boolean;
    key?: string;
}
declare function actionSubscribe<S>(opt?: actionSubOption<S>): {
    (store: any): void;
    install(Vue: any): void;
};
export default actionSubscribe;
