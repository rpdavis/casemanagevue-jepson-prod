#!/usr/bin/env python3
"""
Script to map teacher IDs from CLASSES_student_schedule_teacherIDs.csv 
to Student_2025 data.csv based on student names.
"""

import csv
from typing import Dict, List, Tuple, Optional

def normalize_name(name: str) -> str:
    """Normalize name for matching by removing extra spaces and handling case"""
    # Remove common suffixes and prefixes, normalize case
    name = name.strip().lower()
    
    # Extract only the first word as the first name
    first_word = name.split(' ')[0]
    
    # Remove any trailing punctuation from the first word
    first_word = first_word.rstrip('.,')
    
    # Remove common name variations
    name = name.replace(' gender', '').replace(' a. gender', '').replace(' d. gender', '')
    name = name.replace(' r. gender', '').replace(' b. gender', '').replace(' h. gender', '')
    name = name.replace(' f. gender', '').replace(' j. gender', '').replace(' i. gender', '')
    name = name.replace(' c. gender', '').replace(' e. gender', '').replace(' k. gender', '')
    name = name.replace(' l gender', '').replace(' m. gender', '').replace(' p. gender', '')
    name = name.replace(' s. gender', '').replace(' v. gender', '').replace(' t. gender', '')
    name = name.replace(' gender. male grade', '')
    
    # Remove middle initials and common variations
    name = name.replace(' m.', '').replace(' m ', ' ').replace(' a.', '').replace(' a ', ' ')
    name = name.replace(' d.', '').replace(' d ', ' ').replace(' r.', '').replace(' r ', ' ')
    name = name.replace(' b.', '').replace(' b ', ' ').replace(' h.', '').replace(' h ', ' ')
    name = name.replace(' f.', '').replace(' f ', ' ').replace(' j.', '').replace(' j ', ' ')
    name = name.replace(' i.', '').replace(' i ', ' ').replace(' c.', '').replace(' c ', ' ')
    name = name.replace(' e.', '').replace(' e ', ' ').replace(' k.', '').replace(' k ', ' ')
    name = name.replace(' l.', '').replace(' l ', ' ').replace(' m.', '').replace(' m ', ' ')
    name = name.replace(' p.', '').replace(' p ', ' ').replace(' s.', '').replace(' s ', ' ')
    name = name.replace(' v.', '').replace(' v ', ' ').replace(' t.', '').replace(' t ', ' ')
    name = name.replace(' marie nouvel', '').replace('marie nouvel ', '')
    name = name.replace(' aliece', '').replace('aliece ', '')
    name = name.replace(' harlow', '').replace('harlow ', '')
    name = name.replace(' ray', '').replace('ray ', '')
    
    # Clean up extra spaces
    name = ' '.join(name.split())
    
    return name

def find_best_match(target_first: str, target_last: str, schedule_map: Dict[Tuple[str, str], List[str]]) -> Optional[Tuple[str, str]]:
    """Find the best match for a student name in the schedule map"""
    target_first = normalize_name(target_first)
    target_last = normalize_name(target_last)
    
    # First try exact match
    if (target_first, target_last) in schedule_map:
        return (target_first, target_last)
    
    # Try partial matches
    for (sched_first, sched_last) in schedule_map.keys():
        # Check if first names match and last names are similar
        if target_first == sched_first:
            # Handle hyphenated or compound last names
            if target_last in sched_last or sched_last in target_last:
                return (sched_first, sched_last)
            # Handle cases like "mccommon-boyd" vs "mccommon boyd"
            if target_last.replace('-', ' ') == sched_last.replace('-', ' '):
                return (sched_first, sched_last)
        
        # Check if last names match and first names are similar
        if target_last == sched_last:
            if target_first in sched_first or sched_first in target_first:
                return (sched_first, sched_last)
    
    return None

def main():
    # Read the schedule file and build a mapping
    schedule_map: Dict[Tuple[str, str], List[str]] = {}
    
    print("Reading CLASSES_student_schedule_teacherIDs.csv...")
    with open('CLASSES_student_schedule_teacherIDs.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            first_name = normalize_name(row['First Name'])
            last_name = normalize_name(row['Last Name'])
            
            # Store teacher IDs for each period
            teacher_ids = [
                row['Period 1'], row['Period 2'], row['Period 3'], 
                row['Period 4'], row['Period 5'], row['Period 6'], row['Period 7']
            ]
            
            schedule_map[(first_name, last_name)] = teacher_ids
    
    print(f"Loaded {len(schedule_map)} student schedules")
    
    # Read the student data file
    students = []
    print("Reading Student_2025 data.csv...")
    with open('Student_2025 data.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        students = list(reader)
    
    print(f"Loaded {len(students)} student records")
    
    # Process each student and try to match with schedule
    matched_count = 0
    unmatched_students = []
    
    for student in students:
        # Skip empty rows
        if not student.get('FirstName') or not student.get('LastName'):
            continue
            
        first_name = student['FirstName']
        last_name = student['LastName']
        
        # Try to find a match
        match = find_best_match(first_name, last_name, schedule_map)
        
        if match:
            matched_first, matched_last = match
            teacher_ids = schedule_map[match]
            
            # Update the student record with teacher IDs
            student['Period1Teacher'] = teacher_ids[0] if teacher_ids[0] else ''
            student['Period2Teacher'] = teacher_ids[1] if teacher_ids[1] else ''
            student['Period3Teacher'] = teacher_ids[2] if teacher_ids[2] else ''
            student['Period4Teacher'] = teacher_ids[3] if teacher_ids[3] else ''
            student['Period5Teacher'] = teacher_ids[4] if teacher_ids[4] else ''
            student['Period6Teacher'] = teacher_ids[5] if teacher_ids[5] else ''
            student['SHTeacher'] = teacher_ids[6] if teacher_ids[6] else ''
            
            matched_count += 1
            print(f"✓ Matched: {first_name} {last_name} -> {matched_first} {matched_last}")
        else:
            unmatched_students.append(f"{first_name} {last_name}")
            print(f"✗ No match found for: {first_name} {last_name}")
    
    # Write the updated data to a new file
    output_filename = 'Student_2025_data_with_teachers_v3.csv'
    print(f"\nWriting updated data to {output_filename}...")
    
    with open(output_filename, 'w', newline='', encoding='utf-8') as f:
        if students:
            writer = csv.DictWriter(f, fieldnames=students[0].keys())
            writer.writeheader()
            writer.writerows(students)
    
    # Print summary
    print(f"\n=== SUMMARY ===")
    print(f"Total students processed: {len([s for s in students if s.get('FirstName')])}")
    print(f"Successfully matched: {matched_count}")
    print(f"Unmatched: {len(unmatched_students)}")
    
    if unmatched_students:
        print(f"\nUnmatched students:")
        for student in sorted(unmatched_students):
            print(f"  - {student}")
    
    print(f"\nUpdated file saved as: {output_filename}")

if __name__ == '__main__':
    main()
