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

    info(message, ...args) {
        this.logger.info(message, ...args);
    }

    error(message, ...args) {
        this.logger.error(message, ...args);
    }

    warn(message, ...args) {
        this.logger.warn(message, ...args);
    }

    debug(message, ...args) {
        this.logger.debug(message, ...args);
    }
}

module.exports = new Logger();
