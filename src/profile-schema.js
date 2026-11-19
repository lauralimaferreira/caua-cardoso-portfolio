// Public content contract. The backend uses the identical validated schema.
export const fields = Object.freeze({
  name:60, fullName:120, school:100, schoolYear:9, location:100, intendedField:100,
  quote:180, intro:420, aboutLead:420, storyTitle:100, values:220, email:120
});
export const grades = Object.freeze(['High School Freshman','High School Sophomore','High School Junior','High School Senior','College Student','Graduate']);
export function shortGrade(grade){return grade.replace(/^High School /,'');}
function clean(v,max,key,required=true){
  if(typeof v!=='string')throw Error(`Invalid ${key}`);
  const s=v.trim();
  if((required&&!s)||s.length>max||/[\u0000-\u001f\u007f]/.test(s))throw Error(`Invalid ${key} (maximum ${max} characters, plain text).`);
  return s;
}
export function validateProfile(value){
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid profile');
  const keys=[...Object.keys(fields),'grade','interests','headlines','goals','story'];
  if(Object.keys(value).length!==keys.length||keys.some(k=>!Object.hasOwn(value,k)))throw Error('Unexpected or missing profile fields');
  const p={};for(const [k,max] of Object.entries(fields))p[k]=clean(value[k],max,k,k!=='email');
  if(!/^\d{4}[-–]\d{4}$/.test(p.schoolYear)||Number(p.schoolYear.slice(5))!==Number(p.schoolYear.slice(0,4))+1)throw Error('School year must be consecutive years, e.g. 2026–2027.');
  p.schoolYear=p.schoolYear.replace('-','–');
  if(p.email&&!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(p.email))throw Error('Enter an approved public email or leave it blank.');
  if(!grades.includes(value.grade))throw Error('Invalid school grade');p.grade=value.grade;
  for(const [key,min,max,len] of [['interests',1,6,48],['headlines',3,3,30],['goals',1,4,110],['story',1,6,850]]){
    const a=value[key];if(!Array.isArray(a)||a.length<min||a.length>max)throw Error(`${key}: enter ${min}–${max} items.`);
    p[key]=a.map(v=>clean(v,len,key));
  }
  return p;
}
