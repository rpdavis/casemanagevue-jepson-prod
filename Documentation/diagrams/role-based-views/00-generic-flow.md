# Generic Flow - Common Authentication & Security (Before Role Check)

This diagram shows the common flow that all user roles go through before reaching their specific view logic.

```mermaid
graph TB
    subgraph "Authentication & Route Protection"
        A[User Login] --> B[Firebase Auth]
        B --> C["Custom Claims<br/>role assigned"]
        C --> D["Auth Store<br/>currentUser.role"]
        D --> E["Router Guards<br/>guards.js"]
        E --> F{"Role Check"}
        F -->|Valid Role| G[StudentsView.vue]
        F -->|Invalid Role| H[Redirect to Home]
    end
    
    subgraph "Common Component Flow"
        G --> I["useStudentData<br/>composable"]
        I --> J["useStudentQueries<br/>loadStudents()"]
        J --> K{"Route by Role"}
        K --> L["Role-Specific Query<br/>getXXXStudents()"]
    end
    
    subgraph "Database Security Layer"
        L --> M["Firestore Query<br/>with role-based filters"]
        M --> N[Firestore Security Rules]
        N --> O{"Validate Query"}
        O -->|Valid Filter| P[Allow Query]
        O -->|Invalid Filter| Q[Deny Query - Security Error]
        P --> R[Return Authorized Students]
    end
    
    subgraph "Security Rules Validation"
        N --> S["Check Query Structure"]
        S --> T{"Has Required Filter?"}
        T -->|staffIds filter| U[Staff Role Access]
        T -->|caseManagerId filter| V[Case Manager Access]
        T -->|Admin role| W[Admin Access]
        T -->|Testing flags| X[Testing Access]
        U --> P
        V --> P
        W --> P
        X --> P
        T -->|No valid filter| Q
    end
    
    subgraph "Data Processing Pipeline"
        R --> Y["Role-Specific View<br/>useXXXView composable"]
        Y --> Z["Apply Frontend Filtering<br/>visibleStudents computed"]
        Z --> AA["Apply Search/Grade Filters<br/>useStudentFilters"]
        AA --> BB["Group/Sort Students<br/>by role requirements"]
    end
    
    subgraph "UI Rendering & Security"
        BB --> CC[StudentTable.vue]
        CC --> DD["Role-based Permissions<br/>Column Visibility"]
        DD --> EE["Client Security Test<br/>quickSecurityTest()"]
        EE --> FF{"Access Valid?"}
        FF -->|Valid| GG[Display Students]
        FF -->|Invalid| HH["Log Violation<br/>Hide Data"]
    end
    
    classDef auth fill:#ffffcc,stroke:#ffaa00,stroke-width:2px
    classDef security fill:#ffcccc,stroke:#ff0000,stroke-width:2px
    classDef database fill:#ccffcc,stroke:#00aa00,stroke-width:2px
    classDef frontend fill:#ccccff,stroke:#0000ff,stroke-width:2px
    
    class A,B,C,D,E,F,H auth
    class N,O,P,Q,S,T,U,V,W,X,EE,FF,HH security
    class L,M,R database
    class G,I,J,K,Y,Z,AA,BB,CC,DD,GG frontend
```

## Key Security Layers:

1. **Authentication**: Firebase Auth with custom role claims
2. **Route Protection**: Router guards validate roles before component access
3. **Database Security**: Firestore rules enforce query-level filtering
4. **Application Logic**: Frontend role-based filtering and processing
5. **UI Security**: Component-level permissions and client-side validation
6. **Audit**: Security violation logging and monitoring

This common flow ensures that all roles go through the same security validation before reaching their specific view logic. 