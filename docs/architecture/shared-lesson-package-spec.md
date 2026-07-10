# Shared Lesson Package Spec

Status: planning spec  
Purpose: keep Classroom Command Center and OmniNote aligned.

## Goal

Both apps should eventually understand the same lesson/resource structure.

Classroom Command Center uses lesson packages for:
- Today Prep
- student board
- teacher launcher
- resource checklist
- media pages
- Open With menu
- missing-link warnings

OmniNote uses lesson packages for:
- opening teaching materials
- PDF/slides import
- Apple Pencil annotation
- presentation mode
- lesson handoff

## TypeScript Planning Types

```ts
type SubjectId =
  | "homeroom"
  | "math"
  | "shurley"
  | "reading"
  | "spelling"
  | "science"
  | "history"
  | "snackLunch"
  | "specials"
  | "cleanup"
  | "carpool"
  | "readyPosition";

type Visibility = "student" | "teacherOnly" | "hidden";

type OpenWithOption =
  | "commandCenter"
  | "newTab"
  | "pdfViewer"
  | "htmlViewer"
  | "googleSlides"
  | "googleDocs"
  | "youtubeEmbed"
  | "goodnotes"
  | "omninote"
  | "copyLink";

type ResourceKind =
  | "presentation"
  | "noteDocument"
  | "handout"
  | "textbook"
  | "weblink"
  | "youtube"
  | "teacherKey"
  | "studentNotes"
  | "reference"
  | "homework"
  | "exitTicket"
  | "omniNote";

type LessonResource = {
  id: string;
  subjectId: SubjectId;
  lessonId?: string;
  title: string;
  kind: ResourceKind;
  url?: string;
  localPath?: string;
  embedUrl?: string;
  required: boolean;
  visibleToStudents: boolean;
  openWith: OpenWithOption[];
  focusQuestions?: string[];
  notes?: string;
};

type TeacherNote = {
  id: string;
  subjectId: SubjectId;
  lessonId?: string;
  text: string;
  visibility: "teacherOnly";
};

type SubjectMode = {
  id: SubjectId;
  label: string;
  active: boolean;
  backgroundId: string;
  welcomeMessage: string;
  defaultWidgets: string[];
  resources: LessonResource[];
};

type LessonPackage = {
  id: string;
  date?: string;
  subjectId: SubjectId;
  lessonTitle: string;
  lessonNumber?: string;
  active: boolean;
  studentWidgets: string[];
  teacherNotes: TeacherNote[];
  resources: LessonResource[];
  focusQuestions?: string[];
  routines?: string[];
};

type DailyScheduleBlock = {
  id: string;
  label: string;
  subjectId: SubjectId;
  startTime?: string;
  endTime?: string;
  enabled: boolean;
  routinePresetId?: string;
};

type DailyPrepPackage = {
  id: string;
  date: string;
  templateName: string;
  activeScienceOrHistory?: "science" | "history";
  scheduleBlocks: DailyScheduleBlock[];
  lessonPackages: LessonPackage[];
};
```

## Required Resource Slots

Subject templates can define expected resources.

Example Math:
- presentation
- student notes
- reference
- homework
- exit ticket
- teacher key

Example Reading:
- passage
- vocabulary
- comprehension questions
- teacher guide
- audio/video link

Example Spelling:
- weekly word list
- dictation sentences
- practice sheet
- test sheet
- word study slides

Example Science:
- lesson slides
- investigation sheet
- textbook/reference
- video
- focus questions

Example History:
- lesson slides
- source document
- map/timeline
- video
- focus questions

## Missing Resource Warnings

Level 1:
- warn if required field is blank

Level 2:
- warn if local path is invalid
- warn if URL is malformed

Level 3:
- Chief of Staff checks Google Drive, Canvas, NAS, and local folders

## Handoff Levels

### Level 1: Manual but reliable

Command Center stores links/resources.
Teacher chooses:
- open in new tab
- open PDF
- open Google Slides
- open manually in OmniNote or GoodNotes

### Level 2: Shared lesson package

Command Center and OmniNote both read the same lesson package structure.

### Level 3: Deep link / sync

Command Center button:
- Open in OmniNote

OmniNote opens:
- correct subject
- correct lesson
- correct file/page
- teacher tools ready

Possible methods:
- custom URL scheme
- universal link
- local network sync
- QR code handoff
- CloudKit/shared folder
- NAS/local manifest

## Classroom Audio Resource Extension

Future resource kind addition:

```ts
type ExtendedResourceKind =
  | ResourceKind
  | "spotifyPlaylist"
  | "audioPlaylist"
  | "classroomAudio";
```

Playlist resource concept:

```ts
type ClassroomPlaylist = {
  id: string;
  title: string;
  mood:
    | "calm"
    | "focus"
    | "classical"
    | "modernClassical"
    | "acoustic"
    | "transition"
    | "cleanup"
    | "carpool";
  spotifyUrl: string;
  embedUrl?: string;
  schoolSafe: boolean;
  defaultScreens: string[];
  visibleToStudents: boolean;
  notes?: string;
};
```
