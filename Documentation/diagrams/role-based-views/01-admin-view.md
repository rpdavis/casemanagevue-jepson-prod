# Admin View - Full Administrative Access

This diagram shows how the admin role works after the common authentication flow, with unrestricted database access and full administrative capabilities.

```mermaid
graph TB
    subgraph "Admin Role Query"
        A[Admin Role Detected] --> B["getAdminStudents()"]
        B --> C["Query: collection(students)<br/>orderBy(lastName)"]
        C --> D["No role-based filters<br/>Full database access"]
    end
    
    subgraph "Admin Security Rules"
        D --> E["Security Rule Check"]
        E --> F["isAnyAdmin() = true"]
        F --> G["Allow unrestricted query"]
        G --> H["Return ALL students"]
    end
    
    subgraph "Admin View Processing"
        H --> I["useAdminView<br/>composable"]
        I --> J["visibleStudents =<br/>ALL filtered students"]
        J --> K["No role-based filtering<br/>Full access granted"]
    end
    
    subgraph "Admin Grouping Options"
        K --> L["Group by Case Manager"]
        K --> M["Group by Service Provider"]
        K --> N["Group by Accommodation"]
        K --> O["Group by Grade/Plan"]
        L --> P[Admin Dashboard]
        M --> P
        N --> P
        O --> P
    end
    
    subgraph "Admin Permissions"
        P --> Q["Can View: ALL data"]
        Q --> R["Can Edit: ALL students"]
        R --> S["Can Export: ALL data"]
        S --> T["Can Manage: Users & Roles"]
    end
    
    subgraph "Admin UI Features"
        T --> U["Show All Columns"]
        U --> V["Enable All Filters"]
        V --> W["Enable Bulk Actions"]
        W --> X["Display Full Table"]
    end
    
    classDef admin fill:#ff9999,stroke:#cc0000,stroke-width:2px
    classDef security fill:#ffcccc,stroke:#ff0000,stroke-width:2px
    classDef data fill:#ccffcc,stroke:#00aa00,stroke-width:2px
    classDef ui fill:#ccccff,stroke:#0000ff,stroke-width:2px
    
    class A,B,I,P,Q,R,S,T admin
    class E,F,G security
    class C,D,H,J,K data
    class L,M,N,O,U,V,W,X ui
```

## Admin Role Characteristics:

### **Database Access**
- **Query Type**: Unrestricted collection query
- **Filters**: None required (orderBy only)
- **Security**: Admin role bypass in Firestore rules
- **Data Scope**: All students in database

### **View Processing**
- **Composable**: `useAdminView`
- **Filtering**: Frontend search/grade filters only
- **Restrictions**: None - full access granted

### **Permissions**
- ✅ **View**: All student data including sensitive information
- ✅ **Edit**: All students, all fields
- ✅ **Export**: Complete data export capabilities
- ✅ **Manage**: User accounts, roles, system settings

### **UI Features**
- **Columns**: All available columns visible
- **Filters**: All filter options enabled
- **Actions**: Bulk operations, advanced management tools
- **Grouping**: Multiple grouping options available

### **Security Notes**
- Admins bypass most security restrictions
- Full audit logging for admin actions
- Highest level of system access
- Responsible for user management and system configuration 