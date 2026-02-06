# WhatsApp API Server PRO 🚀

A professional, class-based WhatsApp API server built with **Express.js**, **Socket.IO**, and **whatsapp-web.js**. This project features a premium web dashboard for real-time monitoring and a secure RESTful API.

## ✨ Key Features

- **Premium Web Dashboard**: Real-time interface to monitor status, send messages, and view incoming chats.
- **Web-Based QR Linking**: Scan QR codes directly in your browser with auto-refresh (just like WhatsApp Web).
- **Real-Time Updates**: Instant message and status notifications via Socket.IO.
- **Full Media Support**: Send/Receive images, files, and **Voice Messages (PTT)** with automatic base64 conversion.
- **Robust Syncing**: Enhanced logic to handle WhatsApp loading states and automatic reconnections.
- **Secure API**: Protected by session-based auth and `x-api-key` header security.
- **Webhook Test Utility**: Built-in server to test your message forwarding instantly.

## 🛠️ Prerequisites

- **Node.js**: v18+ (Recommended)
- **Chrome/Chromium**: Installed on the system.
- **Phone**: For initial account linking.

## 📦 Installation & Setup

1.  **Clone & Install:**

    ```bash
    git clone https://github.com/danish-mar/whatsapp-api-server.git
    cd whatsapp-api-server
    npm install
    ```

2.  **Environment Configuration:**
    Create a `.env` file:

    ```env
    PORT=3029
    API_PASSWORD=your_secure_password
    WEBHOOK_URL=http://localhost:8900/webhook
    CHROME_PATH=/usr/bin/google-chrome # Optional
    ```

3.  **Start the Server:**
    ```bash
    npm start
    ```

## 🖥️ Web Interface

Once the server is running, open your browser and go to:
`http://localhost:3029`

1.  **Login**: Use the `API_PASSWORD` from your `.env`.
2.  **Link Account**: If not linked, a QR code will appear. Scan it with your WhatsApp mobile app.
3.  **Monitor**: View live messages and system status in the dashboard.

## 🔌 API Usage

All API requests require the header: `x-api-key: your_API_PASSWORD`

### 1. Send Text

`POST /send-text`

```json
{
  "to": "919503458883",
  "message": "Hello from the API!"
}
```

### 2. Send Media / Voice Message

`POST /send-media`

```json
{
  "to": "919503458883",
  "mediaUrl": "https://example.com/audio.ogg",
  "isPtt": true,
  "message": "Check out this voice note!"
}
```

_Set `isPtt: true` to send audio as a voice message._

## 🧪 Webhook Testing

Test your incoming message flow without building a full backend:

1.  Open a new terminal.
2.  Run: `npm run webhook-test`
3.  Send a message/image/voice note to your linked WhatsApp number.
4.  The terminal will display the full JSON payload, including base64 media data.

## 📂 Project Structure

```text
src/
├── classes/          # Core Logic (App.js, WhatsAppManager.js)
├── middleware/       # Auth & Security
├── utils/            # Logger, Webhook Forwarder
public/               # Dashboard & Login UI
webhook-test.js       # Webhook testing utility
```

## ⚖️ License

MIT License. Developed with ❤️ for the community.
