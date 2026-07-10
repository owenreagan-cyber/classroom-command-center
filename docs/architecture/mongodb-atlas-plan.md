# MongoDB Atlas Plan

Status: future Level 3 planning document  
Apps:
- Classroom Command Center
- OmniNote

## Core Decision

MongoDB Atlas may be useful later as a metadata backend.

Do not use MongoDB Atlas as the initial storage foundation for either app.

Do not store huge curriculum files, videos, PDFs, or raw Apple Pencil ink blobs in MongoDB at first.

## Best Use Cases

MongoDB is best for:
- lesson package records
- resource metadata
- Today Prep history
- subject mode metadata
- teacher settings
- playlist catalog
- sync logs
- import logs
- cross-device settings
- future teacher/admin dashboard data

Large files should remain in:
- Google Drive
- iCloud Drive
- NAS
- local files
- OmniNote local document storage

## Storage Division

Command Center stores and syncs:
- lesson metadata
- links
- resource manifests
- teacher notes
- playlist metadata
- Today Prep state
- subject/screen settings

OmniNote stores:
- local documents
- PDF references/imports
- PencilKit/ink data
- page state
- presentation state
- tab/workspace state

MongoDB may later store shared metadata for both apps.

## Level 1

No MongoDB.

Command Center:
- Zustand/localStorage
- static files
- manual URLs
- local docs

OmniNote:
- local iPad documents
- Files app import
- PencilKit/PDFKit local state

## Level 2

Still no required MongoDB.

Command Center:
- Dexie/IndexedDB
- Zod validation
- React Hook Form

OmniNote:
- local document database
- Files/iCloud/Drive/NAS via iPadOS Files provider
- persistent tabs/workspaces

## Level 3

MongoDB Atlas may be introduced for:
- cross-device metadata sync
- lesson package library
- Today Prep history
- resource indexes
- playlist library
- synced teacher settings
- import/audit logs
- future web dashboard

Recommended pattern:
- app talks to a small backend/API
- backend reads/writes MongoDB
- clients do not expose database secrets
- MongoDB stores metadata and references, not giant files

## What Not To Do Yet

Do not build yet:
- direct MongoDB client from public frontend with secrets
- Atlas Device Sync as the foundation
- Firebase + MongoDB duplicate backends
- storing large PDFs/videos in MongoDB
- storing raw classroom audio in MongoDB
- syncing every pen stroke through MongoDB in real time

## Device Sync Caution

Do not base the architecture on MongoDB Atlas Device Sync / Realm Sync without a fresh review.

The preferred future use is MongoDB Atlas as a normal metadata database behind a small API/service, not a deprecated mobile sync foundation.

## Possible Collections Later

```text
lesson_packages
resources
subject_modes
daily_prep_runs
teacher_notes
classroom_playlists
device_settings
sync_events
import_jobs
omninote_workspaces
```

## Example Lesson Package Document

```json
{
  "id": "math-lesson-004",
  "date": "2026-07-09",
  "subjectId": "math",
  "lessonTitle": "Math Lesson 4",
  "lessonNumber": "4",
  "resources": [
    {
      "id": "math-004-slides",
      "title": "Math Lesson 4 Slides",
      "kind": "presentation",
      "provider": "googleDrive",
      "url": "https://drive.google.com/...",
      "required": true,
      "visibleToStudents": false,
      "openWith": ["newTab", "googleSlides", "omninote"]
    }
  ],
  "teacherNotes": [
    {
      "id": "note-1",
      "text": "Check homework before switching.",
      "visibility": "teacherOnly"
    }
  ]
}
```

## Cost Control

MongoDB should not be introduced until there is a real need for:
- multiple devices
- cloud metadata sync
- dashboard/history
- shared package library

Keep local-first until then.
