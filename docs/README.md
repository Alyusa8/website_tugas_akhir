# 📚 Documentation - Eye Exam YOLO System

Welcome to the documentation folder for the Eye Exam YOLO System. This folder contains all guides, setup instructions, troubleshooting, and reference materials.

## 📁 Folder Structure

```
docs/
├── README.md                          # This file - Documentation index
├── DEPLOYMENT.md                      # Production deployment guide
├── SETUP_DETECTION_API.md            # Setup guide for YOLO Detection API
├── GOOGLE_OAUTH_SETUP.md             # Google OAuth configuration
├── PROFILE_UPDATE_FIX.md             # Fix for profile update issues
├── SOLUSI_PROFILE_UPDATE.md          # Alternative profile update solution
├── TESTING_TAHAP1.md                 # Testing guidelines for phase 1
├── database-scripts/                 # SQL scripts for database setup
│   ├── detection-schema.sql
│   ├── detection-tables.sql
│   ├── supabase-triggers.sql
│   ├── fix-trigger.sql
│   ├── fix-trigger-v2.sql
│   ├── add-custom-name-column.sql
│   ├── check-detection-data.sql
│   ├── check-user-data.sql
│   ├── debug-images.sql
│   ├── disable-trigger.sql
│   ├── fix-storage-rls.sql
│   └── test-rls.sql
├── test-files/                       # Test and debug files
│   ├── test-get-history.ts
│   └── test-history-fetch.ts
└── scripts/                          # Utility scripts
    ├── start-dev.ps1                 # Development startup script
    └── start.ps1                     # Production startup script
```

## 🚀 Quick Start

### 1. **Setup Detection API**
   Start here if you're running the detection system for the first time.
   - File: [SETUP_DETECTION_API.md](SETUP_DETECTION_API.md)
   - Covers: Python API setup, model loading, port configuration

### 2. **Deployment**
   For deploying the application to production.
   - File: [DEPLOYMENT.md](DEPLOYMENT.md)
   - Covers: Docker setup, Linux services, cloud deployment

### 3. **Google OAuth Setup**
   Configure Google OAuth for authentication.
   - File: [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md)

### 4. **Database Setup**
   Initialize and configure the Supabase database.
   - Location: `database-scripts/`
   - See parent directory `database/` folder for schema files

## 🔧 Common Tasks

### Running the Application

**Development Mode:**
```powershell
# Terminal 1: Python Detection API
cd backend
python yolo/detection_api_v2.py

# Terminal 2: Node Backend Server
npm start

# Terminal 3: React Frontend
npm run dev
```

**Using Startup Scripts:**
```powershell
# One-command startup (if using provided scripts)
cd docs/scripts
.\start-dev.ps1
```

### Troubleshooting

**Bounding Box Issues:**
- Check [detection coordinate scaling](../frontend/app/routes/detection.tsx)
- Ensure frame dimensions are properly propagated from backend
- Review detection.tsx console logs for debugging info

**Profile Update Problems:**
- File: [PROFILE_UPDATE_FIX.md](PROFILE_UPDATE_FIX.md)
- Alternative approach: [SOLUSI_PROFILE_UPDATE.md](SOLUSI_PROFILE_UPDATE.md)

**Database Trigger Issues:**
- Execute relevant SQL scripts in `database-scripts/`
- Check Supabase dashboard for trigger status

## 📖 File Descriptions

| File | Purpose | When to Use |
|------|---------|-----------|
| SETUP_DETECTION_API.md | YOLO Detection API setup | First-time setup, server configuration |
| DEPLOYMENT.md | Production deployment | Deploying to server/cloud |
| GOOGLE_OAUTH_SETUP.md | OAuth authentication setup | Configuring user login |
| PROFILE_UPDATE_FIX.md | Database trigger fix | When user profiles revert changes |
| SOLUSI_PROFILE_UPDATE.md | Alternative profile solution | Testing different approaches |
| TESTING_TAHAP1.md | Phase 1 testing guidelines | Test planning and validation |

## 🐛 Debugging

### Detection API Logs
Monitor the Python API output for:
- Model loading status
- Device (CUDA/CPU) detection
- FPS and inference time
- Frame processing details

### Frontend Logs
Check browser console for:
- Canvas sizing debug info
- Frame dimension scaling
- Detection coordinate mapping
- Face count and bounding box positions

### Backend Logs
Monitor Node.js output for:
- Python API spawn status
- HTTP request/response logs
- API forwarding status

## 📝 Database Scripts

Located in `database-scripts/`:
- **Schema files**: Initial database structure
- **Trigger files**: Automated database operations
- **Fix files**: Corrections for specific issues
- **Debug files**: Data validation and inspection scripts
- **Test files**: RLS (Row Level Security) testing

## 🔗 Related Documentation

- **Main README**: [../README.md](../README.md)
- **Backend README**: [../backend/README.md](../backend/README.md)
- **Database README**: [../database/README.md](../database/README.md)
- **Frontend Config**: [../frontend/react-router.config.ts](../frontend/react-router.config.ts)

## 💡 Tips

1. **Always backup** your database before applying SQL scripts
2. **Check logs** from all three servers when debugging
3. **Verify ports**: Backend (5000), Python API (5001), Frontend (5174)
4. **Use browser DevTools** to inspect canvas and video elements
5. **Monitor GPU**: Check CUDA availability for fast inference

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| "Bounding box not showing" | Check canvas scaling in detection.tsx |
| "Model loading takes too long" | First load can be 30+ seconds, wait for API readiness |
| "Empty detections array" | Ensure camera/video input is valid |
| "Profile changes revert" | Apply PROFILE_UPDATE_FIX.md solution |
| "OAuth login fails" | Verify credentials in GOOGLE_OAUTH_SETUP.md |

## 📞 Support

For issues not covered in this documentation:
1. Check relevant markdown file above
2. Review database scripts for SQL-related issues
3. Check server logs for detailed error messages
4. Enable debug logging in detection.tsx and detection_api_v2.py

---

**Last Updated**: 2025-01-12  
**Project**: Eye Exam YOLO System  
**Status**: Production Ready
