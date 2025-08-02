# CaseManageVue Documentation

This directory contains comprehensive documentation for the CaseManageVue application - a special education case management system.

## 🆕 **Enhanced Role System Documentation**
- **[Enhanced Role System Manual](ENHANCED_ROLE_SYSTEM_MANUAL.md)** - Complete guide to the new role structure with diagrams and implementation instructions
- **[Role Quick Reference](ROLE_QUICK_REFERENCE.md)** - Print-friendly reference card for administrators and staff  
- **[Middle School Role Migration Plan](MIDDLE_SCHOOL_ROLE_MIGRATION_PLAN.md)** - Detailed technical migration strategy

## 📁 **Folder Structure**

### 🏗️ **[`architecture/`](./architecture/)**
System architecture, design patterns, and technical implementation details
- [`TECHNICAL_OVERVIEW.md`](./architecture/TECHNICAL_OVERVIEW.md) - Complete technical overview and architecture
- [`ROLE_BASED_VIEW_ARCHITECTURE.md`](./architecture/ROLE_BASED_VIEW_ARCHITECTURE.md) - Role-based view system
- [`STUDENT_FORM_ARCHITECTURE.md`](./architecture/STUDENT_FORM_ARCHITECTURE.md) - Student form components and structure
- [`STUDENT_TABLE_ARCHITECTURE.md`](./architecture/STUDENT_TABLE_ARCHITECTURE.md) - Student table modular architecture
- [`COMPOSABLES_REFERENCE.md`](./architecture/COMPOSABLES_REFERENCE.md) - Vue composables documentation
- [`API_INTEGRATION_GUIDE.md`](./architecture/API_INTEGRATION_GUIDE.md) - External API integrations
- [`FILTER_AND_VIEW_ARCHITECTURE.md`](./architecture/FILTER_AND_VIEW_ARCHITECTURE.md) - Data filtering system

### 🔒 **[`security/`](./security/)**
Security implementation, FERPA compliance, and data protection
- [`SECURITY_DATABASE_FILTERING.md`](./security/SECURITY_DATABASE_FILTERING.md) - Database-level security implementation
- [`FIRESTORE_RULES_BACKUP.md`](./security/FIRESTORE_RULES_BACKUP.md) - Complete Firestore rules history and current backup
- [`FERPA_COMPLIANCE_SUMMARY.md`](./security/FERPA_COMPLIANCE_SUMMARY.md) - FERPA compliance status and features
- [`FERPA_COMPLIANCE_CHECKLIST.md`](./security/FERPA_COMPLIANCE_CHECKLIST.md) - Detailed compliance checklist
- [`SECURITY_IMPLEMENTATION.md`](./security/SECURITY_IMPLEMENTATION.md) - Security features implementation
- [`SECURITY_IMPROVEMENTS.md`](./security/SECURITY_IMPROVEMENTS.md) - Security enhancement tracking
- [`STORAGE_PERMISSIONS_MATRIX.md`](./security/STORAGE_PERMISSIONS_MATRIX.md) - File storage security matrix

### ⚙️ **[`setup/`](./setup/)**
Installation, configuration, and deployment guides
- [`DEPLOYMENT_GUIDE.md`](./setup/DEPLOYMENT_GUIDE.md) - Production deployment instructions
- [`DEVELOPMENT_PROJECT_SETUP.md`](./setup/DEVELOPMENT_PROJECT_SETUP.md) - Local development setup
- [`FIREBASE_PROJECTS_SETUP.md`](./setup/FIREBASE_PROJECTS_SETUP.md) - Firebase configuration
- [`ENVIRONMENT_CONFIGURATION.md`](./setup/ENVIRONMENT_CONFIGURATION.md) - Environment management
- [`ENVIRONMENT_SETUP_COMPLETE.md`](./setup/ENVIRONMENT_SETUP_COMPLETE.md) - Environment setup completion guide
- [`CLOUD_FUNCTIONS_SETUP.md`](./setup/CLOUD_FUNCTIONS_SETUP.md) - Firebase Functions configuration
- [`GOOGLE_SHEETS_SETUP_GUIDE.md`](./setup/GOOGLE_SHEETS_SETUP_GUIDE.md) - Google Sheets integration setup

### 🧩 **[`components/`](./components/)**
Component documentation, data structures, and UI guidelines
- [`DATABASE_FIELDS.md`](./components/DATABASE_FIELDS.md) - Database schema and field reference
- [`STUDENT_FIELD_REFERENCE.md`](./components/STUDENT_FIELD_REFERENCE.md) - Student data structure reference
- [`STYLE_GUIDE.md`](./components/STYLE_GUIDE.md) - Code style and UI guidelines
- [`ARCINFO_DOCUMENTATION_INDEX.md`](./components/ARCINFO_DOCUMENTATION_INDEX.md) - Documentation index

### 🎯 **[`features/`](./features/)**
Feature-specific documentation and usage guides
- [`TEACHER_FEEDBACK_USAGE.md`](./features/TEACHER_FEEDBACK_USAGE.md) - Teacher feedback system
- [`STUDENT_BULK_IMPORT_GUIDE.md`](./features/STUDENT_BULK_IMPORT_GUIDE.md) - Bulk import functionality
- [`IMPORTER_FIELD_MAPPINGS.md`](./features/IMPORTER_FIELD_MAPPINGS.md) - Data import field mappings

### 🧪 **[`testing/`](./testing/)**
Testing strategies, debugging tools, and quality assurance
- [`TESTING_STRATEGY.md`](./testing/TESTING_STRATEGY.md) - Comprehensive testing guide
- [`USER_VIEW_TESTING_GUIDE.md`](./testing/USER_VIEW_TESTING_GUIDE.md) - User view testing procedures
- [`DEBUG_MENU_GUIDE.md`](./testing/DEBUG_MENU_GUIDE.md) - Debug tools and features
- [`DEBUG_ROLE_SWITCHER.md`](./testing/DEBUG_ROLE_SWITCHER.md) - Role switching for testing

### 👑 **[`admin/`](./admin/)**
Administrator guides and administrative interface documentation
- [`ADMIN_LANDING_PAGE.md`](./admin/ADMIN_LANDING_PAGE.md) - Admin interface overview
- [`ADMIN_ACTION_BUTTONS_GUIDE.md`](./admin/ADMIN_ACTION_BUTTONS_GUIDE.md) - Admin action buttons guide

### 📊 **[`diagrams/`](./diagrams/)**
Visual diagrams and flowcharts for system understanding
- [`role-based-views/`](./diagrams/role-based-views/) - Role-based view flow diagrams
  - Individual role flow diagrams for all 8 user roles
  - Generic flow patterns and view logic

## 🎯 **Quick Start Guides**

### **For New Developers**
1. **Architecture Overview**: [`architecture/TECHNICAL_OVERVIEW.md`](./architecture/TECHNICAL_OVERVIEW.md)
2. **Development Setup**: [`setup/DEVELOPMENT_PROJECT_SETUP.md`](./setup/DEVELOPMENT_PROJECT_SETUP.md)
3. **Security Understanding**: [`security/SECURITY_DATABASE_FILTERING.md`](./security/SECURITY_DATABASE_FILTERING.md)
4. **Component Reference**: [`architecture/COMPOSABLES_REFERENCE.md`](./architecture/COMPOSABLES_REFERENCE.md)

### **For System Administrators**
1. **Deployment**: [`setup/DEPLOYMENT_GUIDE.md`](./setup/DEPLOYMENT_GUIDE.md)
2. **Admin Interface**: [`admin/ADMIN_LANDING_PAGE.md`](./admin/ADMIN_LANDING_PAGE.md)
3. **FERPA Compliance**: [`security/FERPA_COMPLIANCE_SUMMARY.md`](./security/FERPA_COMPLIANCE_SUMMARY.md)
4. **Firebase Setup**: [`setup/FIREBASE_PROJECTS_SETUP.md`](./setup/FIREBASE_PROJECTS_SETUP.md)

### **For Testers & QA**
1. **Testing Strategy**: [`testing/TESTING_STRATEGY.md`](./testing/TESTING_STRATEGY.md)
2. **User View Testing**: [`testing/USER_VIEW_TESTING_GUIDE.md`](./testing/USER_VIEW_TESTING_GUIDE.md)
3. **Debug Tools**: [`testing/DEBUG_MENU_GUIDE.md`](./testing/DEBUG_MENU_GUIDE.md)
4. **Role Testing**: [`testing/DEBUG_ROLE_SWITCHER.md`](./testing/DEBUG_ROLE_SWITCHER.md)

### **For Feature Implementation**
1. **Student Form**: [`architecture/STUDENT_FORM_ARCHITECTURE.md`](./architecture/STUDENT_FORM_ARCHITECTURE.md)
2. **Student Table**: [`architecture/STUDENT_TABLE_ARCHITECTURE.md`](./architecture/STUDENT_TABLE_ARCHITECTURE.md)
3. **Role Views**: [`architecture/ROLE_BASED_VIEW_ARCHITECTURE.md`](./architecture/ROLE_BASED_VIEW_ARCHITECTURE.md)
4. **API Integration**: [`architecture/API_INTEGRATION_GUIDE.md`](./architecture/API_INTEGRATION_GUIDE.md)

## 🔒 **Security & Compliance Focus**

This application handles sensitive student IEP data and implements comprehensive security:
- **Database-level filtering** ensures users only access authorized data
- **Role-based access control** with 8 distinct user roles
- **FERPA compliance** with audit logging and encryption
- **Multi-layer validation** prevents unauthorized access

**Key Security Documents:**
- [`security/FERPA_COMPLIANCE_SUMMARY.md`](./security/FERPA_COMPLIANCE_SUMMARY.md) - Executive summary
- [`security/SECURITY_DATABASE_FILTERING.md`](./security/SECURITY_DATABASE_FILTERING.md) - Technical implementation
- [`security/FIRESTORE_RULES_BACKUP.md`](./security/FIRESTORE_RULES_BACKUP.md) - Complete rules backup

## 📊 **Data & Integration**

**Key Integration Documents:**
- [`architecture/API_INTEGRATION_GUIDE.md`](./architecture/API_INTEGRATION_GUIDE.md) - All API integrations
- [`setup/GOOGLE_SHEETS_SETUP_GUIDE.md`](./setup/GOOGLE_SHEETS_SETUP_GUIDE.md) - Sheets integration
- [`features/STUDENT_BULK_IMPORT_GUIDE.md`](./features/STUDENT_BULK_IMPORT_GUIDE.md) - Data import
- [`components/DATABASE_FIELDS.md`](./components/DATABASE_FIELDS.md) - Data structure

## 📅 **Document Status**

- **Last Updated**: July 2025
- **Total Documents**: 28 comprehensive guides
- **Coverage**: Complete system documentation
- **Status**: Production-ready and actively maintained

---

**Production URL**: https://casemangervue.web.app  
**Firebase Console**: https://console.firebase.google.com/project/casemangervue/overview

## 📋 **Document Index by Category**

<details>
<summary><strong>📁 All Documents by Folder (28 total)</strong></summary>

### Architecture (7 documents)
- API_INTEGRATION_GUIDE.md
- COMPOSABLES_REFERENCE.md
- FILTER_AND_VIEW_ARCHITECTURE.md
- ROLE_BASED_VIEW_ARCHITECTURE.md
- STUDENT_FORM_ARCHITECTURE.md
- STUDENT_TABLE_ARCHITECTURE.md
- TECHNICAL_OVERVIEW.md

### Security (7 documents)
- FERPA_COMPLIANCE_CHECKLIST.md
- FERPA_COMPLIANCE_SUMMARY.md
- FIRESTORE_RULES_BACKUP.md
- SECURITY_DATABASE_FILTERING.md
- SECURITY_IMPLEMENTATION.md
- SECURITY_IMPROVEMENTS.md
- STORAGE_PERMISSIONS_MATRIX.md

### Setup (7 documents)
- CLOUD_FUNCTIONS_SETUP.md
- DEPLOYMENT_GUIDE.md
- DEVELOPMENT_PROJECT_SETUP.md
- ENVIRONMENT_CONFIGURATION.md
- ENVIRONMENT_SETUP_COMPLETE.md
- FIREBASE_PROJECTS_SETUP.md
- GOOGLE_SHEETS_SETUP_GUIDE.md

### Components (4 documents)
- ARCINFO_DOCUMENTATION_INDEX.md
- DATABASE_FIELDS.md
- STUDENT_FIELD_REFERENCE.md
- STYLE_GUIDE.md

### Testing (4 documents)
- DEBUG_MENU_GUIDE.md
- DEBUG_ROLE_SWITCHER.md
- TESTING_STRATEGY.md
- USER_VIEW_TESTING_GUIDE.md

### Features (3 documents)
- IMPORTER_FIELD_MAPPINGS.md
- STUDENT_BULK_IMPORT_GUIDE.md
- TEACHER_FEEDBACK_USAGE.md

### Admin (2 documents)
- ADMIN_ACTION_BUTTONS_GUIDE.md
- ADMIN_LANDING_PAGE.md

</details> 