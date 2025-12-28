# Eye Exam Backend API

Backend server untuk aplikasi Eye Exam dengan teknologi deteksi YOLO.

## Features

- **Authentication**: Register, Login, JWT-based authentication
- **YOLO Detection**: Real-time object detection API
- **History Management**: Save and retrieve detection history
- **File Upload**: Handle video/image uploads
- **Security**: Rate limiting, CORS, input validation

## Tech Stack

- **Node.js** with **Express.js**
- **JWT** for authentication
- **Multer** for file uploads
- **bcryptjs** for password hashing
- **express-validator** for input validation
- **helmet** & **cors** for security

## Installation

```bash
cd backend
npm install
```

## Environment Setup

Copy `.env` file and configure your environment variables:

```bash
cp .env .env.local
```

## Development

```bash
npm run dev
```

## Production

```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Detection
- `POST /api/detection/start` - Start detection session
- `POST /api/detection/stop` - Stop detection and save results
- `POST /api/detection/process-frame` - Process single frame
- `GET /api/detection/stats` - Get detection statistics

### History
- `GET /api/history` - Get detection history
- `GET /api/history/:id` - Get specific record details
- `DELETE /api/history/:id` - Delete history record
- `GET /api/history/export/:format` - Export history data

## Security Features

- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet security headers
- Input validation
- JWT token authentication
- Secure file upload handling