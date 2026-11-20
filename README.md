# Academic Year 2024–25 Enrollment Overview

Covers Fall 2024 (20243), Spring 2025 (20251), Summer 2025 (20252). Historical USC Schedule of Classes snapshots, not certified census counts or unique student headcounts.

## Publish in GitHub and Netlify

1. Create a NEW blank GitHub repository named iya-academic-year-2024-25-overview.
2. Extract Academic_Year_2024_25_Dashboard.zip. Upload the contents INSIDE academic-year-2024-25-overview to the repository main level. index.html must appear directly in the main file list.
3. Preserve scripts/refresh-data.js and .github/workflows/refresh-data.yml in those exact paths. If folder upload is difficult, use Add file → Create new file, enter each full path, and paste the local file's text using Notepad. Do not double-click JavaScript files to open them.
4. Actions → Refresh 2024-25 historical snapshots → Run workflow → main. Wait for a green check. Inspect semester status cards for source errors too.
5. In Netlify choose Add new project → Import an existing project → GitHub → the NEW 2024–25 repository. Add the repository to the Netlify GitHub app's access list if it is missing.
6. Project name: iya-academic-year-2024-25. Branch: main. Base directory: blank. Build command: node scripts/refresh-data.js. Publish directory: one period (.). Node 22. No dependencies or environment variables needed.
7. Deploy and inspect the new website. Your existing annual dashboards remain separate.

## Data policy

Direct USC API: https://classes.usc.edu/api/Courses/CoursesByTermSchoolProgram with school=ACAD, each of ACAD/IDSN/PRIN and each of 20243/20251/20252. Count a section once by semester+section number, allocated to its scheduled prefix. Courses scheduled by other schools, cancelled sections, missing or invalid counts, and nonpositive capacities are excluded. Empty program lists are valid; an empty entire term preserves the prior snapshot and reports an error.

Students Enrolled counts course registrations, not distinct people. A student attending more than one course or semester is counted more than once. SCH/units = enrolled × published fixed units only. Variable and unknown units stay in enrollment counts but contribute no SCH. Known zero-unit courses contribute zero SCH. Currently 40 sections representing 73 enrollments have no fixed-unit value and are omitted from SCH.

Available Seats = sum of max(capacity-enrolled,0); annual utilization = total enrollment / total seat capacity. Annual section count adds semester offerings, including reused section numbers in different terms. Course numbers preserve letter suffixes.

Snapshot retrieved: 2026-11-20T19:05:02.901Z. Retrieval dates do not establish when USC last changed historical counts. API data is not certified final or census-date data.

## Initial verified totals

| Metric | Fall 2024 | Spring 2025 | Summer 2025 | Annual |
|---|---:|---:|---:|---:|
| Students Enrolled (course registrations) | 1082 | 1059 | 92 | 2233 |
| Credit Hours / Units | 3442 | 3590 | 136 | 7168 |
| Sections | 56 | 63 | 19 | 138 |
| Available Seats | 409 | 660 | 92 | 1161 |
| Seat Capacity | 1491 | 1719 | 184 | 3394 |

## Updates and checks

Daily workflow at 15:25 UTC, plus manual dispatch and Netlify build refresh. Failures retain a labeled last successful snapshot; missing terms block annual totals. Retrievals over 48 hours old are flagged. GitHub may disable schedules after prolonged public-repository inactivity.

Node 22: run node tests.js. Source/course sums, term-section uniqueness, summer inclusion, missing-term handling, credit omissions, stale status, failure retention and all four program filters passed during preparation. A separate double-clickable Academic_Year_2024_25_Preview.html contains the initial snapshot and does not update automatically.
