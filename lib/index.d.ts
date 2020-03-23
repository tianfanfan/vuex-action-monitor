interface actionSubOption {
    log?: boolean;
    key?: string;
    logIgnore?: string[];
}
declare function actionSubscribe(opt?: actionSubOption): {
    (store: any): void;
    install(Vue: any): void;
};
export default actionSubscribe;
