interface actionSubOption {
    log?: boolean;
    key?: string;
}
declare function actionSubscribe(opt?: actionSubOption): {
    (store: any): void;
    install(Vue: any): void;
};
export default actionSubscribe;
