# IYA Spring 2027 Enrollment Dashboard

USC term 20271. Open index.html to preview. Netlify publish directory: `.`; no build command.

The existing GitHub Actions workflow runs `node scripts/refresh-data.js` around 6 a.m. Pacific and commits data.js. It supports manual runs. API failures preserve the previous snapshot.

Scope: each unique section scheduled under ACAD, IDSN, or PRIN; external-school cross-listings excluded. Cancelled and zero-capacity sections remain visible but are excluded from capacity metrics. SCH includes only fixed-unit sections. Waitlist values are section entries, not unique students.

Room data and CA recommendations await spring verification. Trend history begins with this spring baseline; section additions and removals are stored in history separately from continuing-section seat changes.

Calendar: https://www.usc.edu/academic-calendar/
API: https://classes.usc.edu/api/Courses/CoursesByTermSchoolProgram?termCode=20271&school=ACAD&program=ACAD
