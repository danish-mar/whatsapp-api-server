const express = require('express');
const app = express();
const port = 8900;

app.use(express.json());

app.post('/webhook', (req, res) => {
    console.log('\n--- NEW WEBHOOK EVENT ---');
    console.log(`Time: ${new Date().toISOString()}`);
    const logData = { ...req.body };
    if (logData.media && logData.media.data) {
        logData.media.data = `[BASE64 DATA - ${logData.media.data.length} chars]`;
    }
    
    console.log('Payload:', JSON.stringify(logData, null, 2));
    console.log('--------------------------\n');
    
    res.status(200).send('OK');
});

app.get('/', (req, res) => {
    res.send('Webhook Test Server is Running!');
});

app.listen(port, () => {
    console.log(`Webhook test server listening at http://localhost:${port}/webhook`);
    console.log('Waiting for WhatsApp messages...');
});
