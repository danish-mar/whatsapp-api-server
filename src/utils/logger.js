const pino = require('pino');

class Logger {
    constructor() {
        this.logger = pino({
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'HH:MM:ss Z',
                    ignore: 'pid,hostname',
                },
            },
        });
    }

    info(obj, ...args) {
        this.logger.info(obj, ...args);
    }

    error(obj, ...args) {
        this.logger.error(obj, ...args);
    }

    warn(obj, ...args) {
        this.logger.warn(obj, ...args);
    }

    debug(obj, ...args) {
        this.logger.debug(obj, ...args);
    }
}

module.exports = new Logger();
