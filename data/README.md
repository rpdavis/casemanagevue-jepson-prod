# Data Directory

This directory contains organized data files for the CaseManageVue application.

## Structure

### `/csv/`
Contains CSV files for bulk imports and seed data:
- `bulk_students.csv` - Student bulk import data
- `bulk_students_template.csv` - Template for student imports
- `bulk_users.csv` - User bulk import data
- `database_students_seed.csv` - Student seed data for development
- `database_users_seed.csv` - User seed data for development

### `/seed/`
Contains JSON seed data files:
- `database_seed_data.json` - Main seed data file for development database

### `/auth/`
Contains authentication user configuration files:
- `auth_users_dev.json` - Development environment user configurations
- `auth_users_prod.json` - Production environment user configurations

## Usage

### Bulk Import
Use the CSV files in `/csv/` with the admin panel's bulk import feature:
1. Navigate to Admin Panel → Import
2. Select the appropriate CSV file
3. Follow the import wizard

### Development Seeding
Use the files in `/seed/` to populate development databases:
```bash
# Example usage in scripts
node scripts/seed-database.js --file data/seed/database_seed_data.json
```

### Authentication Setup
The auth configuration files in `/auth/` are used during deployment:
- Development: Uses `auth_users_dev.json`
- Production: Uses `auth_users_prod.json`

## File Formats

All CSV files follow the application's expected format for bulk imports. Refer to the template files for the correct column structure.

JSON files contain structured data matching the Firestore document schema. 