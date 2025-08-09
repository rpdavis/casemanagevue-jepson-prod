# CaseManageVue - Jepson Production

**Version 1.0.0** - Production deployment for Jepson School District

A comprehensive case management system for special education services, built with Vue.js and Firebase.

## 🏭 Production Environment

- **Live URL**: https://casemanagevue-jepson-prod.web.app
- **Firebase Project**: `casemanagevue-jepson-prod`
- **Version**: 1.0.0 (Jepson Production)

## 🚀 Features

### 👥 User Management
- **Role-based access control** (Admin, Case Manager, Teacher, etc.)
- **Google OAuth authentication**
- **User permissions matrix**
- **Session timeout management**

### 📊 Student Management
- **Comprehensive student profiles**
- **IEP document management**
- **Service provider assignments**
- **Schedule management**
- **Accommodation tracking**

### 🔒 Security & Compliance
- **FERPA-compliant data handling**
- **Encrypted document storage**
- **Comprehensive audit logging**
- **Role-based data filtering**
- **Secure PDF handling**

### 📈 Administrative Tools
- **Bulk student import (CSV/Aeries)**
- **Google Sheets integration**
- **Teacher feedback system**
- **Audit log viewing**
- **System settings management**

## 🛠️ Technology Stack

- **Frontend**: Vue.js 3, Pinia, Vue Router
- **Backend**: Firebase (Firestore, Cloud Functions, Storage, Auth)
- **APIs**: Google Sheets, Google Drive, Google Docs
- **Security**: Firebase Security Rules, Custom Claims
- **Build**: Vite

## 📋 System Requirements

### User Roles
- **Admin**: Full system access
- **Case Manager**: Student caseload management
- **Teacher**: View assigned students
- **Service Provider**: View students receiving services
- **Paraeducator**: Limited student access

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🔧 Deployment

This is a production deployment. For development setup, please contact the system administrator.

### Production Deployment Commands
```bash
# Build for production
npm run build

# Deploy to Firebase
firebase deploy --project casemanagevue-jepson-prod
```

## 📚 Documentation

Comprehensive documentation is available in the `/Documentation` directory:

- **[User Manual](User%20Support/USER_MANUAL.md)** - End-user guide
- **[Admin Guide](Documentation/admin/)** - Administrative features
- **[Security Documentation](Documentation/security/)** - Security implementation
- **[API Documentation](Documentation/FUNCTION_DOCUMENTATION.md)** - Cloud Functions reference

## 🆘 Support

For technical support or questions:

1. Check the [FAQ](User%20Support/FAQ.md)
2. Review the [User Manual](User%20Support/USER_MANUAL.md)
3. Contact your system administrator

## 📄 License

Proprietary software for Jepson School District. All rights reserved.

## 🔄 Version History

### v1.0.0 (January 2025)
- Initial Jepson production release
- Full feature set implementation
- Security audit completion
- FERPA compliance verification

---

**⚠️ Important**: This is a production system containing sensitive student data. All access is logged and monitored for compliance purposes.
