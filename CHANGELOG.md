# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2024-12-19

### Fixed
- **StudentForm.vue**: Fixed undefined 'mode' variable by using 'props.mode' instead
- **Button Text Display**: Resolved button text display issue in student form
- **Build Assets**: Updated build assets with latest changes

## [1.1.0] - 2024-12-19

### Added
- **IEP Encryption Security**: Environment-based encryption for sensitive student data
- **FERPA Compliance Documentation**: Comprehensive compliance checklist and summary
- **Role-based View Architecture**: Detailed diagrams for all user roles
- **Session Timeout Management**: Automatic session expiration and user notifications
- **Debug Access Information**: Enhanced debugging tools for security monitoring
- **Audit Logging**: Comprehensive access logging for sensitive data
- **Data Retention Utilities**: Automated data cleanup and retention policies
- **Secure Storage Utilities**: Enhanced file storage security
- **Component Health Dashboard**: System health monitoring interface
- **Admin Permissions Matrix**: Visual permissions management interface

### Changed
- **Documentation Reorganization**: Restructured documentation into logical categories:
  - `/admin/` - Administrator guides and procedures
  - `/architecture/` - System architecture and technical documentation
  - `/components/` - Component-specific documentation
  - `/diagrams/` - Visual diagrams and flowcharts
  - `/features/` - Feature-specific guides
  - `/security/` - Security documentation and compliance
  - `/setup/` - Setup and configuration guides
  - `/testing/` - Testing strategies and procedures
- **Project Structure**: Improved file organization and cleanup
- **Student Table Components**: Enhanced table rendering and form handling
- **Firebase Security Rules**: Updated rules for enhanced security
- **Storage Permissions**: Improved file access controls

### Removed
- Legacy documentation files
- Deprecated components and utilities
- Old seed data files
- Vanilla JS implementation files
- Temporary and backup files

### Security
- Enhanced IEP data encryption with environment-based configuration
- Improved access control and permission management
- Session timeout and automatic logout functionality
- Comprehensive audit logging for sensitive data access
- FERPA compliance documentation and implementation

### Documentation
- Complete documentation reorganization and categorization
- Role-based view architecture diagrams
- Security implementation guides
- FERPA compliance documentation
- Enhanced setup and deployment guides

## [1.0.0] - 2024-12-01

### Added
- Initial release of CaseManageVue
- Student management system
- Role-based access control
- Firebase integration
- Vue 3 application framework
- Admin dashboard
- Teacher feedback system
- Aide assignment functionality 