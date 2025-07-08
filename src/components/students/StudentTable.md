# StudentTable Component Rules

## Flag Positioning Rules

**CRITICAL: Flags should ONLY appear in accommodation cells, NEVER in the student info section.**

### Correct Flag Usage:
- ✅ **Instruction Accommodations Cell**: Shows "Preferential Seating" flag (flag1)
- ✅ **Assessment Accommodations Cell**: Shows "Separate Setting" flag (flag2)

### Incorrect Flag Usage:
- ❌ **Student Info Cell**: Should NEVER have flags
- ❌ **Services Cell**: Should NEVER have flags  
- ❌ **Schedule Cell**: Should NEVER have flags
- ❌ **Documents Cell**: Should NEVER have flags
- ❌ **Actions Cell**: Should NEVER have flags

### Flag CSS Structure:
- Flags use `.flag-overlay` with `position: absolute`
- Accommodation cells use `.instruction-cell` with `position: relative` and `padding-top: 1.2rem`
- This ensures flags sit above the accommodation content without overlapping

### Why This Rule Exists:
- Flags are specifically for accommodation-related information
- Student info section is for basic student data only
- This maintains clear visual hierarchy and prevents confusion
- Matches the original vanilla JS implementation exactly 