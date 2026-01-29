const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const whatsapp = require('./WhatsAppManager');
const logger = require('../utils/logger');

class App {
    constructor() {
        this.app = express();
        this.upload = multer({ dest: 'uploads/' });
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));

        // Basic logging for requests
        this.app.use((req, res, next) => {
            logger.info(`${req.method} ${req.url}`);
            next();
        });
    }

    setupRoutes() {
        // Health check / Status
        this.app.get('/status', (req, res) => {
            res.json(whatsapp.getStatus());
        });

        // Protected routes
        this.app.post('/send-text', auth, async (req, res) => {
            const { to, message } = req.body;
            if (!to || !message) {
                return res.status(400).json({ error: 'Missing "to" or "message" parameter' });
            }

            try {
                const response = await whatsapp.sendMessage(to, message);
                res.json({ success: true, messageId: response.id._serialized });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/send-media', auth, async (req, res) => {
            const { to, message, mediaUrl } = req.body;
            if (!to || !mediaUrl) {
                return res.status(400).json({ error: 'Missing "to" or "mediaUrl" parameter' });
            }

            try {
                const response = await whatsapp.sendMessage(to, message || '', { media: mediaUrl });
                res.json({ success: true, messageId: response.id._serialized });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Error handling
        this.app.use((err, req, res, next) => {
            logger.error('Unhandled error:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        });
    }

    start(port) {
        this.app.listen(port, () => {
            logger.info(`API Server running on port ${port}`);
        });
    }
}

module.exports = new App();
