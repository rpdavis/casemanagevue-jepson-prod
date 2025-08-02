# 🏫 Enhanced Role System - Quick Reference Card

> **Print-friendly reference for administrators and staff**

---

## 🎭 Role Overview

| Role | Icon | Purpose | Access Level |
|------|------|---------|--------------|
| `admin` | 👑 | System Administrator | Full System |
| `school_admin` | 🏫 | School Administrator | School Operations |
| `admin_504` | 📋 | 504 Plan Coordinator | 504/IEP + Aides |
| `sped_chair` | 🎓 | Special Ed Chair | Special Ed Leadership |
| `staff_view` | 👀 | Staff Viewer | IEP Access Only |
| `staff_edit` | ✏️ | Staff Editor | Edit Students Only |
| `case_manager` | 👨‍🏫 | Case Manager | Assigned Caseload |
| `teacher` | 📚 | Teacher | Class Students |
| `service_provider` | 🔧 | Service Provider | Served Students |
| `paraeducator` | 👥 | Paraeducator | Assigned Students |

---

## 🔑 Admin Panel Access

**Full Access**: `admin`  
**Limited Access**: `school_admin`, `admin_504`, `sped_chair`  
**No Access**: All other roles

> *System admin can customize panel visibility for limited access roles*

---

## 👥 Aide Management

**Can Manage Aides**: `admin`, `school_admin`, `admin_504`, `sped_chair`  
**Cannot Manage**: All other roles

---

## 📚 Student Access Levels

- **All Students (Edit)**: `admin`, `school_admin`, `admin_504`, `sped_chair`, `staff_edit`
- **All Students (View)**: `staff_view`
- **Assigned Only**: `case_manager`, `teacher`, `service_provider`, `paraeducator`

---

## 🔄 Migration Quick Guide

### Old → New Role Mapping
- `administrator` → `staff_view`
- `administrator_504_CM` → `admin_504`
- All others → No change needed

### Migration Command
```javascript
// Preview migration
migrateUserRoles({ dryRun: true })

// Execute migration
migrateUserRoles({ dryRun: false })
```

---

## 🆘 Common Issues & Solutions

### ❌ "Access Denied" to Admin Panel
**Check**: User has admin role (`admin`, `school_admin`, `admin_504`, `sped_chair`)

### ❌ Cannot See Students
**Check**: User's staffIds assignments on student records

### ❌ Login Issues After Migration
**Solution**: Clear browser cache, re-sync custom claims

---

## 📞 Support Contacts

- **Technical Issues**: IT Administrator
- **Role Questions**: School Administrator  
- **Access Problems**: System Administrator

---

*Version 1.0 - January 2025*