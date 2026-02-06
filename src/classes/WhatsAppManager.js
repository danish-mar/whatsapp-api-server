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
            // Remove webVersion to auto-detect latest, or use updated version
            // webVersion: '2.3000.1032900857-alpha',
            // webVersionCache: {
            //     type: 'remote',
            //     remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1032900857-alpha.html',
            // },
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ],
                executablePath: process.env.CHROME_PATH || undefined
            }
        });

        this.isReady = false;
        this.isAuthenticated = false;
        this.authFailure = null;
        this.loadingScreen = { percent: 0, message: '' };
        this.qrCode = null;
        this.messageCallbacks = [];
        this.statusCallbacks = [];
        this.statusInterval = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.init();
    }

    init() {
        this.client.on('qr', (qr) => {
            logger.info('QR RECEIVED. Please scan the following code:');
            this.qrCode = qr;
            qrcode.generate(qr, { small: true });
            this.notifyStatusChange({ qr: true });
        });

        this.client.on('ready', () => {
            logger.info('WhatsApp Client is ready!');
            this.isReady = true;
            this.qrCode = null;
            this.reconnectAttempts = 0; // Reset reconnect counter on success
            this.notifyStatusChange({ ready: true, authenticated: true });
            
            // Clear status interval once ready
            if (this.statusInterval) {
                clearInterval(this.statusInterval);
                this.statusInterval = null;
            }
        });

        this.client.on('authenticated', () => {
            logger.info('WhatsApp Client authenticated - waiting for sync...');
            this.isAuthenticated = true;
            this.authFailure = null;
            this.notifyStatusChange({ authenticated: true });
        });

        this.client.on('auth_failure', (msg) => {
            logger.error({ msg }, 'WhatsApp Authentication failure');
            this.isAuthenticated = false;
            this.authFailure = msg;
            this.notifyStatusChange({ authenticated: false, error: msg });
            
            // Clear corrupted session on auth failure
            logger.warn('Clearing corrupted session data...');
            setTimeout(() => {
                this.client.initialize();
            }, 3000);
        });

        this.client.on('change_state', (state) => {
            logger.info(`WhatsApp State Changed: ${state}`);
            this.notifyStatusChange({ state });
        });

        this.client.on('loading_screen', (percent, message) => {
            const p = percent || 0;
            const m = message || 'Loading...';
            logger.info(`Loading: ${p}% - ${m}`);
            this.loadingScreen = { percent: p, message: m };
            this.notifyStatusChange({ loading: true, percent: p, message: m });
        });

        this.client.on('disconnected', (reason) => {
            logger.warn(`WhatsApp Client disconnected: ${reason}`);
            this.isReady = false;
            this.isAuthenticated = false;
            this.notifyStatusChange({ 
                ready: false, 
                authenticated: false, 
                disconnected: true, 
                reason 
            });
            
            // Only reconnect if not logged out and under max attempts
            if (reason !== 'LOGOUT' && this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                const delay = Math.min(5000 * this.reconnectAttempts, 30000); // Exponential backoff
                logger.info(`Re-initializing WhatsApp client in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
                
                setTimeout(() => {
                    this.client.initialize().catch(err => {
                        logger.error(err, 'Failed to reinitialize WhatsApp client');
                    });
                }, delay);
            } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                logger.error('Max reconnection attempts reached. Please restart manually.');
            }
        });

        this.client.on('remote_session_saved', () => {
            logger.info('Remote session saved successfully');
        });

        this.client.on('message', async (msg) => {
            try {
                logger.info(`Received message from ${msg.from}: ${msg.body || '[Media]'}`);
                
                // Call all registered message callbacks
                this.messageCallbacks.forEach(cb => {
                    try {
                        cb(msg);
                    } catch (err) {
                        logger.error(err, 'Error in message callback');
                    }
                });
                
                // Forward to webhook
                await webhook.forward(msg);
            } catch (error) {
                logger.error(error, 'Error processing incoming message');
            }
        });

        // Periodic status update to terminal
        this.statusInterval = setInterval(() => {
            if (!this.isReady) {
                const status = this.getStatus();
                const stateText = status.ready 
                    ? 'READY' 
                    : (status.authenticated ? 'AUTHENTICATED (SYNCING...)' : 'WAITING FOR AUTH');
                
                logger.info(`[STATUS] Ready: ${status.ready} | Auth: ${status.authenticated} | State: ${stateText}`);
                
                if (status.loading && status.loading.percent > 0) {
                    logger.info(`[STATUS] Sync Progress: ${status.loading.percent}% - ${status.loading.message}`);
                }
            }
        }, 10000);

        // Initialize the client
        this.client.initialize().catch(err => {
            logger.error(err, 'Failed to initialize WhatsApp client');
        });
    }

    async sendMessage(to, content, options = {}) {
        try {
            if (!this.isReady) {
                throw new Error('WhatsApp client is not ready yet');
            }

            // Ensure 'to' is in the correct format (e.g., 1234567890@c.us)
            const chatId = to.includes('@') ? to : `${to}@c.us`;

            let message;
            if (options.media) {
                const media = await MessageMedia.fromUrl(options.media);
                message = await this.client.sendMessage(chatId, media, { 
                    caption: content || '',
                    sendAudioAsVoice: options.isPtt || false
                });
            } else {
                message = await this.client.sendMessage(chatId, content);
            }

            logger.info(`Message sent to ${chatId}`);
            return message;
        } catch (error) {
            logger.error(error, `Error sending message to ${to}`);
            throw error;
        }
    }

    async getChat(chatId) {
        try {
            if (!this.isReady) {
                throw new Error('WhatsApp client is not ready yet');
            }
            
            const formattedChatId = chatId.includes('@') ? chatId : `${chatId}@c.us`;
            return await this.client.getChatById(formattedChatId);
        } catch (error) {
            logger.error(error, `Error getting chat ${chatId}`);
            throw error;
        }
    }

    async logout() {
        try {
            logger.info('Logging out from WhatsApp...');
            await this.client.logout();
            this.isReady = false;
            this.isAuthenticated = false;
            logger.info('Successfully logged out');
        } catch (error) {
            logger.error(error, 'Error during logout');
            throw error;
        }
    }

    async destroy() {
        try {
            logger.info('Destroying WhatsApp client...');
            
            if (this.statusInterval) {
                clearInterval(this.statusInterval);
                this.statusInterval = null;
            }
            
            await this.client.destroy();
            this.isReady = false;
            this.isAuthenticated = false;
            logger.info('Client destroyed successfully');
        } catch (error) {
            logger.error(error, 'Error destroying client');
            throw error;
        }
    }

    getStatus() {
        return {
            ready: this.isReady,
            authenticated: this.isAuthenticated,
            loading: this.loadingScreen,
            authFailure: this.authFailure,
            qr: !!this.qrCode,
            qrCode: this.qrCode,
            reconnectAttempts: this.reconnectAttempts,
            info: this.client.info
        };
    }

    onMessage(callback) {
        if (typeof callback === 'function') {
            this.messageCallbacks.push(callback);
        }
    }

    onStatusChange(callback) {
        if (typeof callback === 'function') {
            this.statusCallbacks.push(callback);
        }
    }

    notifyStatusChange(status) {
        this.statusCallbacks.forEach(cb => {
            try {
                cb(status);
            } catch (err) {
                logger.error(err, 'Error in status callback');
            }
        });
    }
}

module.exports = new WhatsAppManager();
