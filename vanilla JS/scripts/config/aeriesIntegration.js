//NOT ACTIVE CODE// /config/aeriesIntegration
{
  "mode": "api", // or "csv"
  "apiConfig": {
    "baseUrl": "https://district.aeries.net/api/v3",
    "key": "encrypted_key_placeholder", // Will be overwritten
    "studentIdField": "aeriesId" // Field in users collection storing Aeries IDs
  },
  "csvConfig": {
    "bucketPath": "aeries/schedules/latest.csv",
    "csvMapping": {
      "studentId": "PermID",
      "period": "Period",
      "courseCode": "CourseCode",
      "teacher": "TeacherName"
    }
  },
  "lastRun": null,
  "nextRun": "2023-11-01T02:00:00Z",
  "status": "inactive"
}