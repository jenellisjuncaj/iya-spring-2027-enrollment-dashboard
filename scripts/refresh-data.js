const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const TERM_CODE = 20271;
const PROGRAMS = ['ACAD','IDSN','PRIN'];
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname,'..','data.js');
const API = 'https://classes.usc.edu/api/Courses/CoursesByTermSchoolProgram';
const labels = {ACAD:'Undergraduate ACAD',IDSN:'Graduate IDSN',PRIN:'Product Innovation (PRIN)'};
async function main() {
 const context={window:{}}; vm.runInNewContext(fs.readFileSync(DATA_FILE,'utf8'),context);
 const old=context.window.dashboardData;
 if(old.termCode!==TERM_CODE) throw Error('Refusing to mix semesters: install the spring data.js first.');
 const lists=await Promise.all(PROGRAMS.map(async program=>{
  const response=await fetch(API+'?termCode='+TERM_CODE+'&school=ACAD&program='+program,{signal:AbortSignal.timeout(60000)});
  if(!response.ok)throw Error(program+' request failed: '+response.status);
  const data=await response.json();
  if(data.termCode!==TERM_CODE || !Array.isArray(data.courses) || !data.courses.length)throw Error('Invalid or empty '+program+' response');
  return {program,courses:data.courses};
 }));
 const records=new Map();
 for(const list of lists)for(const course of list.courses){
  const prefix=course.scheduledCourseCode?.prefix;
  if(!PROGRAMS.includes(prefix))continue;
  for(const section of course.sections||[]){
   if(section.termCode!==TERM_CODE)throw Error('Unexpected section term');
   const id=String(section.sisSectionId);
   if(!records.has(id)||list.program===prefix)records.set(id,{course,section,prefix});
  }
 }
 const credits={};
 const sections=[...records.values()].map(({course,section,prefix})=>{
  const id=String(section.sisSectionId);
  const units=(section.units||[]).map(Number);
  if(units.length===1 && Number.isFinite(units[0]))credits[id]=units[0];
  const cancelled=section.isCancelled===true;
  const capacity=Number(section.totalSeats);
  const enrolled=Number(section.registeredSeats);
  if(!Number.isFinite(capacity)||!Number.isFinite(enrolled)||capacity<0||enrolled<0)throw Error('Invalid seat counts: '+id);
  return {program:labels[prefix],course:course.scheduledCourseCode.courseSpace+' '+course.name,section:id,
   instructor:(section.instructors||[]).map(i=>[i.firstName,i.lastName].filter(Boolean).join(' ')).join(', ')||'TBD',
   enrolled,capacity,waitlisted:Number(section.waitlistedSeats||0),
   metrics:!cancelled && capacity>0,note:cancelled?'Cancelled':capacity===0?'No seat capacity published':'',
   ...(section.name?{note:cancelled?'Cancelled':section.name}:{}),
   meetings:section.schedule||[]};
 }).sort((a,b)=>a.program.localeCompare(b.program)||a.course.localeCompare(b.course)||a.section.localeCompare(b.section));
 if(!sections.length)throw Error('No sections returned; preserving previous data.');
 const now=new Date();
 const stamp=now.toLocaleString('en-US',{timeZone:'America/Los_Angeles',timeZoneName:'short'});
 const date=now.toLocaleDateString('en-US',{timeZone:'America/Los_Angeles'});
 const period=Number(new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',hour:'numeric',hourCycle:'h23'}).format(now))<12?'AM':'PM';
 const before=new Map(old.sections.filter(s=>s.metrics!==false).map(s=>[s.section,s]));
 const changes=sections.filter(s=>s.metrics!==false && before.has(s.section)&&before.get(s.section).enrolled!==s.enrolled).map(s=>({date:date+' '+period,course:s.course,section:s.section,previous:before.get(s.section).enrolled,current:s.enrolled}));
 const totals=Object.fromEntries(Object.values(labels).map(p=>[p,sections.filter(s=>s.program===p&&s.metrics!==false).reduce((n,s)=>n+s.enrolled,0)]));
 const added=changes.reduce((n,s)=>n+Math.max(0,s.current-s.previous),0);
 const dropped=changes.reduce((n,s)=>n+Math.max(0,s.previous-s.current),0);
 const previousIds=new Set(old.sections.map(s=>s.section));
 const newIds=new Set(sections.map(s=>s.section));
 const historyEntry={date:now.toLocaleDateString('en-US',{timeZone:'America/Los_Angeles',month:'long',day:'numeric',year:'numeric'}),snapshot:stamp,added,dropped,totals,fullSections:sections.filter(s=>s.metrics!==false&&s.enrolled>=s.capacity).length,notes:old.sections.length?'USC spring refresh. Section additions/removals are recorded separately from seat changes.':'Initial spring baseline.',sectionsAdded:sections.filter(s=>!previousIds.has(s.section)).map(s=>s.section),sectionsRemoved:old.sections.filter(s=>!newIds.has(s.section)).map(s=>s.section)};
 const data={...old,currentSnapshot:stamp,baselineSnapshot:old.baselineSnapshot||stamp,sections,latestChanges:changes,trendLog:[...changes,...old.trendLog],history:[...old.history,historyEntry],netChangeLabel:old.sections.length?'Latest refresh vs. previous snapshot':'Initial spring baseline'};
 const output='window.dashboardData = '+JSON.stringify(data,null,2)+';\nwindow.sectionCredits = '+JSON.stringify(credits,null,2)+';\nwindow.roomCapacity = {};\nwindow.facilityMeetingData = {};\nwindow.facilityScheduleData = {};\nwindow.excelFacilityMeetingData = [];\n';
 fs.writeFileSync(DATA_FILE+'.tmp',output);fs.renameSync(DATA_FILE+'.tmp',DATA_FILE);
 console.log('Refreshed '+sections.length+' unique spring sections.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
