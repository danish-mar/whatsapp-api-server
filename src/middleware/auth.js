const logger = require('../utils/logger');

const authMiddleware = (req, res, next) => {
    const password = process.env.API_PASSWORD;
    const providedPassword = req.headers['x-api-key'] || req.query.api_key;

    if (!password) {
        logger.error('API_PASSWORD is not set in .env');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    if ((providedPassword === password) || (req.session && req.session.authenticated)) {
        return next();
    }

    logger.warn(`Unauthorized access attempt from ${req.ip}`);
    res.status(401).json({ error: 'Unauthorized' });
};

module.exports = authMiddleware;
