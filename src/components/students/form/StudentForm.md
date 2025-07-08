# StudentForm Refactor Documentation

## Structure

- **StudentForm.vue**: Main orchestrator, manages state and submit.
- **StudentBasicInfo.vue**: Handles name, SSID, grade, plan, dates, case manager.
- **StudentSchedule.vue**: Handles period/teacher dropdowns.
- **StudentClassServices.vue**: Handles class service checkboxes.
- **StudentProviders.vue**: Handles provider dropdowns.
- **StudentDocuments.vue**: Handles file uploads for BIP/At-a-Glance.
- **StudentAccommodations.vue**: Handles instruction/assessment textareas.
- **StudentFlags.vue**: Handles flags checkboxes.
- **useStudentForm.js**: Composable for all form state, validation, and submit logic.

## Data Flow

- All state is managed in the main form and passed to subcomponents via props/v-model.
- Subcomponents are stateless and only emit events or update the passed-in form object.
- The composable handles initialization, watchers, and submit logic.

## Functions

- **handleSubmit**: Validates and saves the form.
- **onFileChange**: Handles file input changes.
- **removeBipFile/removeAtaglanceFile**: Handles file removal logic.

## How to Extend

- Add new fields by creating a new subcomponent or extending an existing one.
- Business logic should go in the composable, not in the UI components.

## Benefits

- Easier to maintain and test.
- Each section can be worked on independently.
- Clear separation of concerns. 