const axios = require('axios');
const logger = require('./logger');

class Webhook {
    constructor() {
        this.url = process.env.WEBHOOK_URL;
    }

    async forward(msg) {
        if (!this.url) {
            logger.warn('WEBHOOK_URL not defined in .env. Skipping message forwarding.');
            return;
        }

        try {
            const payload = {
                id: msg.id._serialized,
                from: msg.from,
                to: msg.to,
                body: msg.body,
                timestamp: msg.timestamp,
                type: msg.type,
                hasMedia: msg.hasMedia,
                isStatus: msg.isStatus
            };

            // If it's media, the user might want more info, 
            // but for now we send the basic message data.
            // Downloading media can be resource-intensive.

            await axios.post(this.url, payload);
            logger.info(`Forwarded message ${msg.id._serialized} to webhook`);
        } catch (error) {
            logger.error('Failed to forward message to webhook:', error.message);
        }
    }
}

module.exports = new Webhook();
