let namespace = null;
export const setPlatformNamespace = (ns) => {
    namespace = ns;
};
export const emitSocketEvent = (event, payload) => {
    if (!namespace)
        return;
    namespace.emit(event, payload);
};
//# sourceMappingURL=emitter.js.map