require('dotenv').config();
const app = require('./classes/App');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

try {
    app.start(PORT);
    logger.info(`WhatsApp API Server started successfully`);
} catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
}
