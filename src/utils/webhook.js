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
                isStatus: msg.isStatus,
                isForwarded: msg.isForwarded,
                isPtt: msg.isPtt,
                duration: msg.duration
            };

            if (msg.hasMedia) {
                logger.info(`Downloading media for message ${msg.id._serialized}...`);
                try {
                    // Sometimes a tiny delay helps the client fetch the media assets
                    const media = await msg.downloadMedia();
                    if (media) {
                        logger.info(`Media downloaded successfully (${media.mimetype})`);
                        payload.media = {
                            mimetype: media.mimetype,
                            data: media.data,
                            filename: media.filename
                        };
                    } else {
                        logger.warn(`Media download returned empty for ${msg.id._serialized}`);
                    }
                } catch (err) {
                    logger.error(err, `Failed to download media for ${msg.id._serialized}`);
                }
            }

            await axios.post(this.url, payload);
            logger.info(`Forwarded message ${msg.id._serialized} to webhook`);
        } catch (error) {
            logger.error('Failed to forward message to webhook:', error.message);
        }
    }
}

module.exports = new Webhook();
