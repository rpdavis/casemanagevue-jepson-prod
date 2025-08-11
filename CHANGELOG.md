# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-01-31

### Added
- **Teacher/Staff Contact Tooltips**: Added hover tooltips to display room number and phone extension for all teacher and case manager names in the student table
  - Shows format "Rm: A23 | Ext: 665432" when hovering over any teacher/case manager name
  - Works for both full names (case managers) and abbreviated names (schedule teachers)
  - Includes co-teaching case managers and all schedule period teachers
  - Professional dark tooltip styling with arrows
  - Automatically hides when no room/extension data is available

### Enhanced
- **User Experience**: Improved accessibility by providing quick access to teacher contact information without leaving the student table
- **Tooltip System**: Extended existing tooltip architecture to support multiple tooltip types (flags, dates, and now user contact info)

## [1.1.2] - 2025-01-31

### Fixed
- **Co-teaching Services Duplication**: Fixed co-teaching classes appearing twice in student table by implementing deduplication logic
- **Flag-prep-reeval Scope**: Refined urgency flag system so `flag-prep-reeval` only applies to reevaluation dates (35-60 days), not all date types
- **CSS Architecture**: Moved student table-specific styles (badges, flags, tooltips) from global CSS to component-specific files for better encapsulation

### Changed
- **CSS Organization**: Consolidated and reorganized flag classes and badge styles into `StudentTable.css` for proper component scoping
- **Date Urgency Functions**: Created separate urgency calculation functions for different date types (meeting, review, reevaluation)
- **Hover Tooltips**: Enhanced date badge tooltips to show full descriptive names ("Plan Review Due", "Reevaluation Due", "Meeting Date")
- **Component Encapsulation**: Improved CSS architecture following proper component scope principles

### Removed
- **Unused Cloud Functions**: Cleaned up deprecated teacher feedback functions and related frontend code
- **Duplicate CSS Styles**: Eliminated duplicate flag and badge styles across multiple CSS files
- **Service Account Credentials**: Removed accidentally committed service account file and added to .gitignore

### Security
- **Credential Protection**: Added `functions/service-account.json` to .gitignore to prevent accidental commits of sensitive credentials
- **GitHub Push Protection**: Resolved security violations by removing service account credentials from repository

### Technical Improvements
- **useStudentTable.js**: Enhanced composable with separate date urgency functions for better maintainability
- **StudentTable.css**: Consolidated all student table-specific styles in one location
- **Code Cleanup**: Removed unused imports, functions, and components from teacher feedback system refactoring

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