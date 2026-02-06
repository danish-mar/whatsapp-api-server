const express = require('express');
const multer = require('multer');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const auth = require('../middleware/auth');
const whatsapp = require('./WhatsAppManager');
const logger = require('../utils/logger');

class App {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = new Server(this.server);
        this.upload = multer({ dest: 'uploads/' });
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocket();
        this.setupWhatsAppEvents();
    }

    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(cookieParser());
        this.app.use(session({
            secret: process.env.API_PASSWORD || 'secret-key',
            resave: false,
            saveUninitialized: true,
            cookie: { secure: false } // Set true if using HTTPS
        }));

        // Serve static files
        this.app.use(express.static(path.join(__dirname, '../../public')));

        // Basic logging for requests
        this.app.use((req, res, next) => {
            logger.info(`${req.method} ${req.url}`);
            next();
        });
    }

    setupRoutes() {
        // Auth for Web UI
        this.app.post('/api/login', (req, res) => {
            const { password } = req.body;
            if (password === process.env.API_PASSWORD) {
                req.session.authenticated = true;
                return res.json({ success: true });
            }
            res.status(401).json({ success: false, error: 'Unauthorized' });
        });

        this.app.get('/api/logout', (req, res) => {
            req.session.destroy();
            res.json({ success: true });
        });

        this.app.get('/api/session', (req, res) => {
            res.json({ authenticated: !!req.session.authenticated });
        });

        // QR Code Endpoint
        this.app.get('/api/qr', async (req, res) => {
            const status = whatsapp.getStatus();
            if (status.qrCode) {
                try {
                    const QRCode = require('qrcode');
                    const qrImage = await QRCode.toDataURL(status.qrCode);
                    return res.json({ qr: qrImage });
                } catch (err) {
                    res.status(500).json({ error: 'Failed to generate QR code image' });
                }
            } else {
                res.json({ qr: null, ready: status.ready });
            }
        });

        // Web UI Middleware
        const webAuth = (req, res, next) => {
            if (req.session.authenticated) {
                return next();
            }
            res.status(401).json({ error: 'Unauthorized' });
        };

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
                const response = await whatsapp.sendMessage(to, message || '', { 
                    media: mediaUrl,
                    isPtt: req.body.isPtt 
                });
                res.json({ success: true, messageId: response.id._serialized });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Error handling
        this.app.use((err, req, res, next) => {
            logger.error(err, `Unhandled error on ${req.method} ${req.url}`);
            res.status(500).json({ error: 'Internal Server Error' });
        });
    }

    setupSocket() {
        this.io.use((socket, next) => {
            // Simple check or skip for now if too complex to link session
            next();
        });

        this.io.on('connection', (socket) => {
            logger.info(`Socket connected: ${socket.id}`);
            
            socket.on('disconnect', () => {
                logger.info(`Socket disconnected: ${socket.id}`);
            });
        });
    }

    setupWhatsAppEvents() {
        whatsapp.onMessage((msg) => {
            this.io.emit('new_message', {
                id: msg.id._serialized,
                from: msg.from,
                body: msg.body,
                timestamp: msg.timestamp
            });
        });

        whatsapp.onStatusChange((status) => {
            this.io.emit('status_change', status);
        });
    }

    start(port) {
        this.server.listen(port, () => {
            logger.info(`API Server running on port ${port}`);
        });
    }
}

module.exports = new App();
