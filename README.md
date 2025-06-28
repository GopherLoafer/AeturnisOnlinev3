# Aeturnis Online - Text-Based MMORPG

A comprehensive text-based MMORPG built on Replit following a progressive development approach.

## 🎮 Current Status

**Phase 1A: Replit Setup - COMPLETE**

✅ Express server with security middleware  
✅ Frontend with responsive design  
✅ Database system with JSON file storage  
✅ API client with error handling  
✅ Project structure and configuration  
✅ Health monitoring and status endpoints  

## 🚀 Quick Start

### Running the Server

```bash
npm start
# or for development with auto-reload
npm run dev
```

The server will start on port 3000 and serve both the API and frontend.

### Accessing the Application

- **Frontend**: Visit the root URL in your browser
- **Health Check**: `GET /api/health`
- **Server Status**: `GET /api/status`

## 📁 Project Structure

```
/
├── backend/
│   ├── src/
│   │   ├── server.js          # Main server file
│   │   ├── routes/
│   │   │   └── index.js       # API routes
│   │   ├── middleware/        # Custom middleware (Phase 2+)
│   │   ├── models/           # Data models (Phase 2+)
│   │   └── utils/
│   │       ├── database.js   # Database wrapper
│   │       └── config.js     # Configuration manager
│   └── data/                 # JSON data files
├── frontend/
│   └── public/
│       ├── index.html        # Main HTML file
│       ├── styles.css        # Responsive CSS
│       └── js/
│           ├── api.js        # API client
│           ├── ui.js         # UI manager
│           └── main.js       # Application controller
├── shared/                   # Shared utilities (future)
└── package.json
```

## 🔧 Configuration

The application uses environment variables for configuration:

### Required for Production
- `JWT_SECRET` - Secret for JWT token signing
- `SESSION_SECRET` - Secret for session management

### Optional Settings
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `DATABASE_PATH` - Path to data files
- `FRONTEND_URL` - Frontend URL for CORS

## 🌐 API Endpoints

### Phase 1A Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |
| GET | `/api/status` | Detailed server status |
| GET | `/api/config` | Safe configuration |
| POST | `/api/init` | Initialize database |

### Future Endpoints (Placeholders)

- `/api/auth/*` - Authentication (Phase 2)
- `/api/characters/*` - Character management (Phase 3)
- `/api/game/*` - Game features (Phase 4+)

## 🗄️ Database System

The application uses a custom JSON file-based database system:

- **Collections**: users, characters, game_state, config
- **Backup System**: Automatic timestamped backups
- **Operations**: CRUD operations with search capabilities
- **Statistics**: Collection size and item count tracking

## 🎨 Frontend Features

- **Responsive Design**: Works on desktop and mobile
- **Loading States**: Loading screens and indicators
- **Error Handling**: User-friendly error messages
- **Connection Monitoring**: Real-time server connection status
- **Authentication UI**: Login and registration forms (Phase 2 ready)

## 🔒 Security Features

- **Helmet.js**: Security headers
- **CORS**: Configurable cross-origin requests
- **Input Validation**: Server-side validation
- **Rate Limiting**: Prepared for implementation
- **Secrets Management**: Environment-based configuration

## 🧪 Development Tools

### Browser Console Commands (Development)
```javascript
// Get application status
window.dev.status()

// Test API connectivity
window.dev.testAPI()

// Force refresh data
window.dev.refresh()

// Reset application state
window.dev.reset()

// Show demo messages
window.dev.showError('Test error')
window.dev.showSuccess('Test success')
```

## 📈 Next Steps

### Phase 2A: JWT Authentication
- User registration and login
- JWT token management
- Role-based access control
- Admin panel foundation

### Phase 2B: User Management
- User profiles and sessions
- Password reset functionality
- Basic admin user controls

See `PHASES.md` for the complete development roadmap.

## 🤝 Contributing

This project follows a progressive development approach. Each phase builds upon the previous one with comprehensive testing and documentation.

## 📄 License

MIT License - See LICENSE file for details

---

**Built with ❤️ on Replit**