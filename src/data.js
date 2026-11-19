// Facts from the "Caua Cardoso" planning document (reviewed 2026-11-16).
// Future opportunities remain separate from completed activities. Do not silently
// promote planned competitions, draft articles, or research milestones to awards.
import { defaultProfile } from './profile-default.js';
export const profile = {...defaultProfile, subtitle:'Pre-Med Portfolio'};

export const research = {
  title: 'Teenagers’ Public Health Knowledge After COVID-19',
  question: 'How has the COVID-19 pandemic changed teenagers’ understanding of hygiene, vaccines, and disease prevention?',
  status: 'Research in progress',
  summary: 'A developing literature review of how adolescents learned about personal hygiene, vaccination, and disease prevention during and after the pandemic.',
  hypothesis: 'Teenagers who experienced the pandemic may have developed a stronger understanding of hygiene, vaccination, and disease prevention as those topics became part of daily life.',
  areas: [
    {title: 'Hygiene', desc: 'Changes in adolescents’ handwashing knowledge and habits.'},
    {title: 'Vaccination', desc: 'How teenagers understand vaccines and what shapes acceptance.'},
    {title: 'Disease prevention', desc: 'Understanding of transmission, distancing, and protective measures.'},
  ],
  sources: [
    {title: 'Adolescents’ health literacy and protective measures during COVID-19', year: '2020', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7454983/'},
    {title: 'Digital health literacy and hand hygiene in adolescents', year: '2024', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11368072/'},
    {title: 'Adolescent vaccination perspectives', year: '2022', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8903754/'},
  ],
};

export const completedActivities = [
  {title: 'Give Kids the World', category: 'Community service', detail: '36 hours of volunteer service recorded in the planning document.', metric: '36 hours', icon: 'heart'},
  {title: 'Varsity Tennis', category: 'Athletics', detail: 'Two years on the high school varsity tennis team.', metric: '2 years', icon: 'activity'},
  {title: 'French Cultural Exchange', category: 'Cultural exchange', detail: 'Hosted a student from Strasbourg for two weeks and accompanied the student at school during part of the visit.', metric: '2 weeks', icon: 'globe'},
];

export const opportunities = [
  {title: 'HOSA — Future Health Professionals', type: 'Health sciences', levels: 'Regional → state → international', description: 'Competitive health-science events. First confirm an active chapter, advisor, eligibility, and event registration.', url: 'https://www.flhosa.org/', status:'Exploring'},
  {title: 'USA Biolympiad (USABO)', type:'Biology', levels:'National exam → semifinal', description:'Biology knowledge examination. School registration and later-round eligibility must be confirmed.', url:'https://www.usabo-trc.org/', status:'Exploring'},
  {title: 'U.S. National Chemistry Olympiad', type:'Chemistry', levels:'Local → national (if eligible)', description:'Chemistry exams coordinated by ACS local sections. Advancement has specific eligibility rules.', url:'https://www.acs.org/education/olympiad.html', status:'Exploring'},
  {title: 'JSHS / Science Fair', type:'Original research', levels:'Regional → state or national, by program', description:'Present an original research project. A literature review alone is not a completed competition entry.', url:'https://ssefflorida.com/', status:'Exploring'},
  {title: 'National Science Bee', type:'General science', levels:'Regional → national, by qualification', description:'Individual science quiz-bowl competition with a regional event in Orlando.', url:'https://www.iacompetitions.com/registration/', status:'Exploring'},
  {title: 'Genes in Space', type:'Molecular biology', levels:'National proposal contest', description:'Design a proposed space biology experiment. Follow the contest’s rules on outside and AI assistance.', url:'https://www.genesinspace.org/us-contest/', status:'Exploring'},
  {title: 'The Congressional Award', type:'Service & personal goals', levels:'National recognition by completing goals', description:'A noncompetitive recognition program with defined goals and activity tracking. Requires advance registration.', url:'https://www.congressionalaward.org/the-program/', status:'Exploring'},
  {title: 'InnerView Service Awards', type:'Community service', levels:'National service recognition', description:'Recognition based on eligible verified service activities and hours during the annual cycle.', url:'https://innerview.org/pages/awards', status:'Exploring'},
  {title: 'Florida 4-H', type:'Healthy living & presentations', levels:'County → district / state', description:'Explore local demonstrations, presentations, and youth development programs.', url:'https://sfyl.ifas.ufl.edu/lake/4-h-youth-development/members/', status:'Exploring'},
  {title: 'National History Day', type:'History of medicine', levels:'Local → state → national', description:'Research the history of medical innovation in an approved annual contest category.', url:'https://floridahistoryday.com/', status:'Exploring'},
  {title: 'ExploraVision', type:'STEM innovation', levels:'National team competition', description:'Propose a future technology with a student team and teacher coach. Check all eligibility criteria.', url:'https://www.exploravision.org/', status:'Exploring'},
];

export const blogIdeas = [
  {slug:'from-the-lab-coat-to-medicine',title:'From the Lab Coat to Medicine',tag:'Personal Reflection', description:'A childhood lab coat, a love of building, and the determination that stayed with me.', image:'/assets/lab-original.svg', state:'In preparation'},
  {slug:'what-makes-a-great-physician',title:'What Makes a Great Physician?',tag:'Medicine',description:'Why ethics, care for others, and continued learning matter to the kind of physician I hope to become.',image:'/assets/stethoscope-original.svg',state:'In preparation'},
  {slug:'teenagers-and-public-health',title:'Teenagers and Public Health After COVID-19',tag:'Research Notes',description:'Questions I’m exploring about adolescent health knowledge, hygiene, and vaccination.',image:'/assets/lab-original.svg',state:'In preparation'},
];
