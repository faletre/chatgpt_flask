# Flask ChatGPT Web Application

A web-based chat application utilizing OpenAI's models, with a modular Python (Flask) backend and a modern, static frontend.  
Backend and frontend are fully decoupled and can be deployed independently.

---

## 📁 Project Structure

```
chatgpt_flask/
│
├── backend/                 # Flask backend (API, DB, business logic)
│   ├── app.py
│   └── chatgpt_api/
│       ├── api/
│       ├── db.py
│       ├── db_init/
│       ├── models.py
│       └── services/
│
├── frontend/                # Static frontend (HTML, JS, CSS, SCSS, images)
│   ├── web/
│   │   └── chattest.html
│   └── scss/
│
├── docs/                    # Documentation (Doxygen, etc.)
│
├── flaskchat.service        # Example systemd service file for backend
└── ...
```

---

## 🚀 Backend (Flask API)

### **Requirements**
- Python 3.8+
- Virtual environment with dependencies installed (see `requirements.txt`)
- OpenAI API Key

### **Setup**

1. **Clone the repository and enter the backend directory:**
   ```bash
   cd chatgpt_flask/backend
   ```

2. **Create and activate a Python virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Initialize the SQLite database:**
   - Inside `chatgpt_api/db_init/` you will find scripts to create or update the DB schema.
   - To initialize the DB:
     ```bash
     cd chatgpt_api/db_init
     python crear_db_con_modelo.py
     ```
   - To verify tables:
     ```bash
     python verificar_db.py
     ```
   - To add the `modelo` column if missing:
     ```bash
     python add_modelo_a_conversacion_SQL.py
     ```

5. **Set the OpenAI API Key:**
   - The backend expects the environment variable `OPENAI_API_KEY` to be set.
   - You can export it manually or use a process manager (see below).

### **Running as a Service (Recommended for Production)**

A sample `systemd` service file is provided ([flaskchat.service](flaskchat.service)).  
**Do not store your OpenAI API key in the repository for security!**

Example configuration (`/etc/systemd/system/flaskchat.service`):

```ini
[Unit]
Description=Flask ChatGPT API Service
After=network.target

[Service]
User=youruser
WorkingDirectory=/path/to/chatgpt_flask/backend
ExecStart=/path/to/chatgpt_flask/backend/venv/bin/python /path/to/chatgpt_flask/backend/app.py
Environment=OPENAI_API_KEY=your-openai-api-key
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable flaskchat
sudo systemctl start flaskchat
```

---

## 🖥️ Frontend (Static Web)

- All frontend files are under `frontend/web/` (HTML, JS, CSS, images).
- SCSS sources are in `frontend/scss/` and should be compiled to CSS as needed.
- The frontend can be served by **any web server** (e.g., Apache, Nginx, Caddy, etc).

### **Reverse Proxy Configuration**

The frontend communicates with the Flask API (backend) via HTTP requests.  
You **must** configure your web server as a reverse proxy to forward API calls.

#### **Example (Apache VirtualHost):**

```apache
# Proxy settings for Flask application
ProxyPass /api/ http://localhost:5000/api/
ProxyPassReverse /api/ http://localhost:5000/api/
```
Place this inside your relevant `<VirtualHost>` block.

- Adjust the URL and port (`localhost:5000`) to match your Flask backend.
- Make sure `mod_proxy` and `mod_proxy_http` are enabled in Apache.

---

## 🗄️ Database Initialization

- All scripts for initializing and updating the SQLite database are in `backend/chatgpt_api/db_init/`.
- See the **Backend Setup** section for usage.

---

## 📄 Documentation

- Doxygen-generated documentation and other docs are in the `docs/` directory.

---

## 🛡️ Security Notes

- **Never commit your OpenAI API key or other secrets to the repository.**
- Use environment variables or secure secret managers for sensitive information.

---

## ✨ Credits

Developed by Rafael Sanchez, 2025.
