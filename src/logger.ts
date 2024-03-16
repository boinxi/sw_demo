export const logger = {
    info: (...args: unknown[]) => {
        console.log('INFO:', ...args);
    },
    error: (...args: unknown[]) => {
        console.error('ERROR:', ...args);
    },
    debug: (...args: unknown[]) => {
        console.debug('DEBUG:', ...args);
    },
};
