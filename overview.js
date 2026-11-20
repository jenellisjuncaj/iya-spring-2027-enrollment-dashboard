(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Overview=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const finite=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
function sourceTotals(globals){const rows=globals.dashboardData.sections.filter(s=>s.metrics!==false&&Number.isFinite(s.enrolled)&&Number.isFinite(s.capacity));return totals(rows.map(s=>({...s,credits:finite(globals.sectionCredits?.[s.section])?globals.sectionCredits[s.section]:null})));}
function totals(rows){return rows.reduce((a,s)=>{a.enrollment+=s.enrolled;a.capacity+=s.capacity;a.available+=Math.max(0,s.capacity-s.enrolled);a.sections++;if(s.credits===null){a.omittedSections++;a.omittedEnrollment+=s.enrolled;}else a.sch+=s.enrolled*s.credits;return a;},{enrollment:0,capacity:0,available:0,sections:0,sch:0,omittedSections:0,omittedEnrollment:0});}
function normalize(globals,term){
 const data=globals.dashboardData;if(!data||!Array.isArray(data.sections)||!data.sections.length)throw Error('Missing or empty section dataset');
 if(data.termCode&&Number(data.termCode)!==term.code)throw Error('Unexpected semester code');
 if(!globals.sectionCredits||typeof globals.sectionCredits!=='object')throw Error('Missing credit-hour map');
 const kept=new Map(),excluded=[];
 for(const s of data.sections){
  let reason=s.metrics===false?'Source marks section excluded':/cancelled/i.test(s.note||'')?'Cancelled':!finite(s.enrolled)||!finite(s.capacity)?'Missing or invalid seat counts':s.capacity===0?'No published seat capacity':null;
  const parsed=String(s.course||'').match(/^([A-Z]+)\s+(\d+[A-Za-z]*)\s+(.*)$/);
  if(!parsed||!['ACAD','IDSN','PRIN'].includes(parsed[1]))reason=reason||'Outside ACAD, IDSN, PRIN scope';
  if(!s.section)throw Error('Section number missing');
  if(reason){excluded.push({section:String(s.section),reason});continue;}
  const row={id:term.code+':'+s.section,section:String(s.section),prefix:parsed[1],number:parsed[2],title:parsed[3].replace(/^\/\s*IDSN\s+547\s+/,''),enrolled:s.enrolled,capacity:s.capacity,credits:finite(globals.sectionCredits[s.section])?globals.sectionCredits[s.section]:null};
  const old=kept.get(row.id);if(old){if(old.enrolled!==row.enrolled||old.capacity!==row.capacity||old.prefix!==row.prefix||old.number!==row.number)throw Error('Conflicting duplicate section '+row.id);excluded.push({section:row.section,reason:'Duplicate semester-section identifier'});}else kept.set(row.id,row);
 }
 const rows=[...kept.values()];const normalized=totals(rows),reference=sourceTotals(globals);
 const mismatches=['enrollment','capacity','available','sections','sch'].filter(k=>Math.abs(normalized[k]-reference[k])>0.000001);
 return {rows,totals:normalized,reference,excluded,mismatches,snapshot:data.currentSnapshot||null};
}
function combine(terms){const keys=['fall','spring','summer'];if(keys.some(k=>!terms[k]?.rows))return null;return totals(keys.flatMap(k=>terms[k].rows));}
function courses(terms){const map=new Map();for(const key of ['fall','spring','summer'])for(const r of terms[key]?.rows||[]){const id=r.prefix+' '+r.number;if(!map.has(id))map.set(id,{prefix:r.prefix,number:r.number,title:r.title,titles:[],fall:null,spring:null,summer:null});const c=map.get(id);if(!c.titles.includes(r.title))c.titles.push(r.title);if(!c[key])c[key]={enrollment:0,available:0,sections:0};c[key].enrollment+=r.enrolled;c[key].available+=Math.max(0,r.capacity-r.enrolled);c[key].sections++;}return [...map.values()].sort((a,b)=>a.prefix.localeCompare(b.prefix)||a.number.localeCompare(b.number,undefined,{numeric:true}));}
function freshness(term,now=Date.now()){if(!term?.rows)return {label:'Unavailable',state:'error'};if(term.error)return {label:'Refresh failed · saved snapshot',state:'error'};if(!term.snapshotAt||!Number.isFinite(Date.parse(term.snapshotAt)))return {label:'Refresh date unverified',state:'warning'};const age=now-Date.parse(term.snapshotAt);if(age< -3600000)return {label:'Refresh date is in the future',state:'warning'};return age>48*3600000?{label:'Outdated · over 48 hours old',state:'warning'}:{label:'Current · within 48 hours',state:'ok'};}
return {normalize,totals,sourceTotals,combine,courses,freshness};
});