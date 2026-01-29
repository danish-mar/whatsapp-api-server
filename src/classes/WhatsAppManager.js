const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const logger = require('../utils/logger');
const webhook = require('../utils/webhook');

class WhatsAppManager {
    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth({
                dataPath: './.wwebjs_auth'
            }),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                executablePath: process.env.CHROME_PATH || undefined
            }
        });

        this.isReady = false;
        this.init();
    }

    init() {
        this.client.on('qr', (qr) => {
            logger.info('QR RECEIVED. Please scan the following code:');
            qrcode.generate(qr, { small: true });
        });

        this.client.on('ready', () => {
            logger.info('WhatsApp Client is ready!');
            this.isReady = true;
        });

        this.client.on('authenticated', () => {
            logger.info('WhatsApp Client authenticated');
        });

        this.client.on('auth_failure', (msg) => {
            logger.error('WhatsApp Authentication failure:', msg);
        });

        this.client.on('message', async (msg) => {
            logger.info(`Received message from ${msg.from}: ${msg.body || '[Media]'}`);
            await webhook.forward(msg);
        });

        this.client.initialize();
    }

    async sendMessage(to, content, options = {}) {
        try {
            if (!this.isReady) {
                throw new Error('WhatsApp client is not ready yet');
            }

            // Ensure 'to' is in the correct format (e.g., 1234567890@c.us)
            const chatId = to.includes('@c.us') ? to : `${to}@c.us`;

            let message;
            if (options.media) {
                const media = await MessageMedia.fromUrl(options.media);
                message = await this.client.sendMessage(chatId, media, { caption: content });
            } else {
                message = await this.client.sendMessage(chatId, content);
            }

            logger.info(`Message sent to ${chatId}`);
            return message;
        } catch (error) {
            logger.error('Error sending message:', error.message);
            throw error;
        }
    }

    getStatus() {
        return {
            ready: this.isReady,
            info: this.client.info
        };
    }
}

module.exports = new WhatsAppManager();
