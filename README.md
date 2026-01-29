# WhatsApp API Server

A powerful, class-based WhatsApp API server built with **Express.js** and **whatsapp-web.js**. This project allows you to send and receive WhatsApp messages (text and media) through a secure RESTful API.

## 🚀 Features

- **Class-Based Architecture**: Clean, modular, and maintainable codebase.
- **Secure API**: Protected by password authentication via `x-api-key` header.
- **Message Receiving**: Automated webhook forwarding for incoming WhatsApp messages.
- **Media Support**: Easily send images and files using remote URLs or local uploads.
- **Structured Logging**: Beautiful and informative console logs powered by `Pino`.
- **Easy Setup**: QR Code terminal generation for quick WhatsApp authentication.

## 🛠️ Prerequisites

- **Node.js**: v16+
- **Chrome/Chromium**: Installed on the system (puppeteer dependency).
- **Phone**: For scanning the WhatsApp Web QR code.

## 📦 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/danish-mar/whatsapp-api-server.git
   cd whatsapp-api-server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   API_PASSWORD=your_secure_password
   WEBHOOK_URL=http://your-receiving-api.com/webhook
   ```

## 🚦 Usage

### Start the Server
```bash
npm start
```
Upon starting, scan the generated **QR Code** in your terminal using your WhatsApp mobile app (Linked Devices).

### API Documentation

#### Authentication
All requests to protected endpoints must include the following header:
`x-api-key: <your_API_PASSWORD>`

#### 1. Check Status
`GET /status`
Check if the WhatsApp client is ready and connected.

#### 2. Send Text Message
`POST /send-text`
```json
{
  "to": "1234567890",
  "message": "Hello from the API!"
}
```

#### 3. Send Media Message
`POST /send-media`
```json
{
  "to": "1234567890",
  "message": "Check out this image!",
  "mediaUrl": "https://example.com/image.jpg"
}
```

## 🔄 Webhook Support

When a message is received on the connected WhatsApp account, the server will forward it to the `WEBHOOK_URL` defined in your `.env`.

**Payload Format:**
```json
{
  "id": "true_1234567890@c.us_ABCDE",
  "from": "1234567890@c.us",
  "to": "your_number@c.us",
  "body": "Hello there!",
  "timestamp": 1675000000,
  "type": "chat",
  "hasMedia": false
}
```

## 📂 Project Structure

```text
src/
├── classes/          # Core logic (App, WhatsAppManager)
├── middleware/       # API Authentication
├── utils/            # Logging and Webhook utilities
└── index.js          # Entry point
```

## ⚖️ License

MIT License. Feel free to use and modify!
