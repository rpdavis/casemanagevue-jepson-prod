# Case Manager View - Dual Role Access with Provider Views

This diagram shows how case managers access students through both their caseload assignments and teaching responsibilities, with a provider view toggle system.

```mermaid
graph TB
    subgraph "Case Manager Role Query"
        A[Case Manager Role] --> B["getCaseManagerStudents(userId)"]
        B --> C["Query: where(app.staffIds,<br/>array-contains, userId)"]
        C --> D["Database-level filtering<br/>by staffIds array"]
    end
    
    subgraph "Case Manager Security"
        D --> E["Security Rule Check"]
        E --> F["hasStaffIdsFilter() = true"]
        F --> G["Allow staffIds query"]
        G --> H["Return assigned students<br/>+ teaching assignments"]
    end
    
    subgraph "Case Manager View Processing"
        H --> I["useCaseManagerView<br/>composable"]
        I --> J["Provider View Filter<br/>case_manager/service_provider/all"]
        J --> K{"Filter Mode"}
        K -->|case_manager| L["Show only CM caseload"]
        K -->|service_provider| M["Show only teaching assignments"]
        K -->|all| N["Show CM + teaching combined"]
    end
    
    subgraph "Case Manager Grouping"
        L --> O["Managed Students<br/>Primary caseload"]
        M --> P["Service Students<br/>Teaching/co-teaching"]
        N --> Q["Combined View<br/>All accessible students"]
        O --> R[Case Manager Dashboard]
        P --> R
        Q --> R
    end
    
    subgraph "Case Manager Permissions"
        R --> S["Can View: Full student data<br/>for assigned students"]
        S --> T["Can Edit: Own caseload only"]
        T --> U["Can View: Teaching students<br/>limited data"]
        U --> V["Can Export: Assigned data"]
    end
    
    subgraph "Case Manager UI"
        V --> W["Show Provider View Toggle"]
        W --> X["Enable Class View in SP mode"]
        X --> Y["Show Upcoming Dates"]
        Y --> Z["Enable Service Grouping"]
    end
    
    classDef cm fill:#99ff99,stroke:#00cc00,stroke-width:2px
    classDef security fill:#ffcccc,stroke:#ff0000,stroke-width:2px
    classDef data fill:#ccffcc,stroke:#00aa00,stroke-width:2px
    classDef ui fill:#ccccff,stroke:#0000ff,stroke-width:2px
    
    class A,B,I,R,S,T,U,V cm
    class E,F,G security
    class C,D,H,J,K,L,M,N data
    class O,P,Q,W,X,Y,Z ui
```

## Case Manager Role Characteristics:

### **Database Access**
- **Query Type**: `where('app.staffIds', 'array-contains', userId)`
- **Security**: Required staffIds filter enforced by Firestore rules
- **Data Scope**: Students on caseload + students in classes taught
- **Dual Access**: Both case management and teaching assignments

### **Provider View System**
The case manager has three distinct view modes:

#### **Case Manager Mode** (`case_manager`)
- **Shows**: Only students where user is the primary case manager
- **Access Level**: Full edit permissions for caseload students
- **Data**: Complete student records, IEP details, dates

#### **Service Provider Mode** (`service_provider`)
- **Shows**: Only students where user teaches or co-teaches
- **Access Level**: Read-only for teaching assignments
- **Data**: Limited to classroom-relevant information

#### **All Mode** (`all`)
- **Shows**: Combined view of both caseload and teaching students
- **Access Level**: Mixed permissions based on relationship type
- **Data**: Full data for caseload, limited data for teaching

### **Permissions by Mode**
- **Caseload Students**: ✅ View all, ✅ Edit all, ✅ Export all
- **Teaching Students**: ✅ View limited, ❌ Cannot edit, ✅ Export limited
- **Dates & IEP Data**: ✅ Full access for caseload, ❌ Restricted for teaching

### **UI Features**
- **Provider View Toggle**: Switch between CM/SP/All modes
- **Class View**: Available in SP mode for period-based grouping  
- **Upcoming Dates**: Shows review/reevaluation dates for caseload
- **Service Grouping**: Group students by accommodation and service types

### **Security Features**
- **Database-Level**: staffIds array includes both CM and teaching assignments
- **Role Validation**: Continuous verification of dual role access
- **Permission Enforcement**: Different permissions based on relationship type
- **Audit Logging**: Tracks access mode switches and data access patterns

### **Workflow Benefits**
- **Unified Access**: Single login for both case management and teaching duties
- **Context Switching**: Easy toggle between different professional responsibilities
- **Appropriate Permissions**: Full access for caseload, appropriate limits for teaching
- **Efficient Navigation**: Quick access to relevant student groups based on current task

This dual-role system allows case managers to efficiently manage both their assigned caseload and their teaching responsibilities within a single, secure interface. 