/* Simple SPA state and seed data (localStorage) */
const store = {
  get key(){ return 'career-skills-marketplace-v1' },
  load(){
    const raw = localStorage.getItem(this.key)
    if(!raw){
      const seed = seedData()
      localStorage.setItem(this.key, JSON.stringify(seed))
      return seed
    }
    try{ return JSON.parse(raw) }catch{ return seedData() }
  },
  save(data){ localStorage.setItem(this.key, JSON.stringify(data)) }
}

function seedData(){
  return {
    auth: null,
    students: [
      { id:'s1', name:'Jane Doe', dept:'Marketing', skills:['SEO','Canva'], verified:['SEO'], portfolio:['https://behance.net/janed'], email:'jane@uni.edu' },
      { id:'s2', name:'Alan T.', dept:'Computer Science', skills:['Python','SQL'], verified:['SQL'], portfolio:['https://github.com/alant'], email:'alan@uni.edu' }
    ],
    mentors: [
      { id:'m1', name:'David Li', skills:['Video Editing','SEO'], company:'MediaWorks', email:'david@alumni.co' },
      { id:'m2', name:'Priya K', skills:['SQL','Python'], company:'DataCo', email:'priya@dataco.io' },
      { id:'m3', name:'Amira S', skills:['Figma','UX'], company:'DesignHub', email:'amira@designhub.com' }
    ],
    employers: [
      { id:'e1', name:'Acme Corp' },
      { id:'e2', name:'FinPulse' }
    ],
    jobs: [
      { id:'j1', title:'Social Media Intern', company:'Acme Corp', departments:['Marketing'], skills:['SEO','Video Editing'] },
      { id:'j2', title:'Data Analyst Intern', company:'FinPulse', departments:['Finance','Computer Science'], skills:['SQL','Python'] },
      { id:'j3', title:'UX Intern', company:'DesignHub', departments:['Design'], skills:['Figma'] }
    ]
  }
}

let db = store.load()

/* DOM helpers */
const $ = (sel, el=document) => el.querySelector(sel)
const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel))

/* Navbar collapse for mobile */
const navToggle = $('#navToggle')
navToggle?.addEventListener('click', () => {
  const nav = $('.nav-links');
  if(!nav) return
  nav.classList.toggle('show')
})

// Close mobile nav when clicking a link
$$('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    const nav = $('.nav-links');
    if(nav && nav.classList.contains('show')){
      nav.classList.remove('show')
    }
  })
})

/* Smooth scroll for in-page links */
$$('a[data-nav]').forEach(a=>{
  a.addEventListener('click', (e)=>{
    const href = a.getAttribute('href')
    if(href && href.startsWith('#')){
      e.preventDefault()
      document.querySelector(href)?.scrollIntoView({ behavior:'smooth', block:'start' })
    }
  })
})

/* Footer year */
$('#year').textContent = new Date().getFullYear()

/* Stats */
function refreshStats(){
  $('#statStudents').textContent = db.students.length
  $('#statEmployers').textContent = db.employers.length
  $('#statMentors').textContent = db.mentors.length
}
refreshStats()

/* Auth modal */
const authBtn = $('#authBtn')
const authModal = $('#authModal')
const authClose = $('#authClose')

authBtn?.addEventListener('click', () => authModal.classList.add('show'))
authClose?.addEventListener('click', () => authModal.classList.remove('show'))

// Handle role change to show/hide student fields
const roleSelect = $('#authRole')
const studentFields = $('#studentFields')
const regularEmailField = $('#regularEmailField')

if(roleSelect){
  roleSelect.addEventListener('change', (e) => {
    const isStudent = e.target.value === 'Student'
    if(studentFields) studentFields.style.display = isStudent ? 'block' : 'none'
    if(regularEmailField) regularEmailField.style.display = isStudent ? 'none' : 'block'
    
    // Update required attributes
    const studentInputs = studentFields?.querySelectorAll('input, select') || []
    studentInputs.forEach(input => {
      if(input.id === 'authStudentId') return // This is optional
      input.required = isStudent
    })
    
    const regularEmail = $('#authEmailRegular')
    if(regularEmail) regularEmail.required = !isStudent
  })
}

// Enhanced signup form handler
$('#authForm')?.addEventListener('submit', (e)=>{
  e.preventDefault()
  
  const name = $('#authName')?.value?.trim() || ''
  const role = $('#authRole')?.value || ''
  const password = $('#authPassword')?.value || ''
  const passwordConfirm = $('#authPasswordConfirm')?.value || ''
  const termsAccepted = $('#authTerms')?.checked
  
  // Validate passwords match
  if(password !== passwordConfirm){
    alert('Passwords do not match! Please try again.')
    return
  }
  
  // Validate terms
  if(!termsAccepted){
    alert('Please accept the Terms of Service to continue.')
    return
  }
  
  let email, university, studentId
  
  if(role === 'Student'){
    email = $('#authEmail')?.value?.trim() || ''
    university = $('#authUniversity')?.value || ''
    studentId = $('#authStudentId')?.value?.trim() || ''
    
    // Validate university email format
    if(!email.includes('.ac.') && !email.includes('.edu')){
      const confirmNonUni = confirm('This doesn\'t look like a university email. Continue anyway?')
      if(!confirmNonUni) return
    }
    
    if(!university){
      alert('Please select your university.')
      return
    }
    
    // Store student info
    db.auth = { 
      email, 
      role, 
      name,
      university,
      studentId
    }
  } else {
    email = $('#authEmailRegular')?.value?.trim() || ''
    db.auth = { email, role, name }
  }
  
  store.save(db)
  
  // Show success message
  let successMsg = `✅ Account created successfully!\n\n`
  successMsg += `Name: ${name}\n`
  successMsg += `Role: ${role}\n`
  successMsg += `Email: ${email}\n`
  if(role === 'Student' && university){
    successMsg += `University: ${university}\n`
    if(studentId) successMsg += `Student ID: ${studentId}\n`
  }
  successMsg += `\n🚀 Redirecting to your profile...`
  
  alert(successMsg)
  window.location.href = role === 'Student' ? 'students.html' : 'profile.html'
})

if(db.auth){ authBtn.textContent = db.auth.role + ' • ' + db.auth.email.split('@')[0] }

// Sign In Form Handler
$('#signinForm')?.addEventListener('submit', (e)=>{
  e.preventDefault()
  
  const email = $('#signinEmail')?.value?.trim() || ''
  const password = $('#signinPassword')?.value || ''
  const rememberMe = $('#rememberMe')?.checked || false
  
  // Demo authentication - accepts any email with password 'demo1234'
  if(password === 'demo1234'){
    // Determine role based on email
    let role = 'Student'
    if(email.includes('employer') || email.includes('company')){
      role = 'Employer'
    } else if(email.includes('mentor')){
      role = 'Mentor'
    } else if(email.includes('admin') || email.includes('university')){
      role = 'University'
    }
    
    // Get name from email
    const name = email.split('@')[0].replace(/[0-9]/g, '').replace(/[._-]/g, ' ')
    
    // Store authentication
    db.auth = { 
      email, 
      role, 
      name: name.charAt(0).toUpperCase() + name.slice(1),
      rememberMe
    }
    store.save(db)
    
    // Success message
    alert(`✅ Sign in successful!\n\nWelcome back, ${db.auth.name}!\nRole: ${role}\n\n🚀 Redirecting to your dashboard...`)
    
    // Redirect based on role
    if(role === 'University'){
      window.location.href = 'admin.html'
    } else if(role === 'Student'){
      window.location.href = 'students.html'
    } else if(role === 'Employer'){
      window.location.href = 'employers.html'
    } else if(role === 'Mentor'){
      window.location.href = 'mentors.html'
    } else {
      window.location.href = 'profile.html'
    }
  } else {
    alert('❌ Sign in failed!\n\nIncorrect password. \n\nDemo Password: demo1234')
  }
})

// Social Sign In Buttons (Demo)
$$('.btn-social').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault()
    const provider = btn.classList.contains('btn-google') ? 'Google' : 'Microsoft'
    alert(`🔐 ${provider} Sign In\n\nThis is a demo. Social authentication would be integrated here.\n\nFor now, use the email/password form with:\nPassword: demo1234`)
  })
})

/* Helpers: current student */
function currentStudent(){
  if(db.auth?.role === 'Student' && db.auth?.email){
    return db.students.find(s=>s.email===db.auth.email) || db.students[0]
  }
  return db.students[0]
}

/* Profile form */
$('#profileForm')?.addEventListener('submit', (e)=>{
  e.preventDefault()
  const name = $('#studentName').value.trim()
  const dept = $('#studentDept').value
  const skills = $('#studentSkills').value.split(',').map(s=>s.trim()).filter(Boolean)
  const portfolio = $('#studentPortfolio').value ? [$('#studentPortfolio').value.trim()] : []
  const email = db.auth?.email || `${name.replace(/\s+/g,'').toLowerCase()}@uni.edu`

  const existing = db.students.find(s=>s.email===email)
  if(existing){
    existing.name = name
    existing.dept = dept
    existing.skills = skills
    existing.portfolio = portfolio
    alert(`Profile updated successfully!\n\nName: ${name}\nDepartment: ${dept}\nSkills: ${skills.join(', ')}`)
  } else {
    db.students.push({ id:'s'+(db.students.length+1), name, dept, skills, verified:[], portfolio, email })
    alert(`Profile created successfully!\n\nName: ${name}\nDepartment: ${dept}\nSkills: ${skills.join(', ')}\n\nYou can now view your profile.`)
  }
  store.save(db)
  refreshStats()
  renderVerified()
  renderJobs()
  
  // Offer to view profile
  if(confirm('Profile saved! Would you like to view your profile page?')){
    window.location.href = 'profile.html'
  }
})

/* Verified skills render */
function renderVerified(){
  const student = currentStudent()
  const el = $('#verifiedSkills')
  if(!el || !student) return
  el.innerHTML = ''
  ;(student.verified || []).forEach(sk=>{
    const b = document.createElement('span'); b.className='badge verify'; b.textContent = 'Verified: '+sk; el.appendChild(b)
  })
}
renderVerified()

/* Assessment (mock with 3 quick questions) */
const questions = (skill)=>[
  { q:`What is a core concept of ${skill}?`, a:['Relevance','Ambiguity','Entropy'], c:0 },
  { q:`Beginner task in ${skill}?`, a:['Optimize pipeline','Hello world / simple edit','Distributed systems'], c:1 },
  { q:`Tool commonly used with ${skill}?`, a:['Random tool','Common tool','Unrelated'], c:1 }
]
$('#startAssessment')?.addEventListener('click', ()=>{
  const skill = $('#assessmentSkill').value
  const qs = questions(skill)
  const area = $('#assessmentArea')
  area.innerHTML = ''
  qs.forEach((it, idx)=>{
    const div = document.createElement('div'); div.className='q'
    div.innerHTML = `<strong>Q${idx+1}.</strong> ${it.q}<div class="inline" style="margin-top:.5rem">`+
      it.a.map((ans,i)=>`<label><input type="radio" name="q${idx}" value="${i}"/> ${ans}</label>`).join(' ') + `</div>`
    area.appendChild(div)
  })
  const submit = document.createElement('button'); submit.className='btn btn-primary mt'; submit.textContent='Submit Assessment'
  submit.addEventListener('click', ()=>{
    let score=0
    qs.forEach((it, idx)=>{
      const picked = $(`input[name=q${idx}]:checked`, area)
      if(picked && Number(picked.value)===it.c) score++
    })
    const pct = Math.round((score/qs.length)*100)
    if(pct>=67){
      const student = currentStudent()
      if(!student.verified.includes(skill)) student.verified.push(skill)
      store.save(db)
      renderVerified()
      alert(`Passed! ${pct}% — ${skill} verified.`)
      renderJobs()
    } else {
      alert(`Score ${pct}%. Not passed. Find a mentor to bridge the gap.`)
      $('#mentorSearch').value = skill
      searchMentors()
      location.hash = '#students'
    }
  })
  area.appendChild(submit)
})

/* Mentor search */
$('#findMentor')?.addEventListener('click', searchMentors)
function searchMentors(){
  const term = ($('#mentorSearch')?.value || '').toLowerCase()
  const res = db.mentors.filter(m=>
    m.name.toLowerCase().includes(term) ||
    m.company.toLowerCase().includes(term) ||
    m.skills.some(s=>s.toLowerCase().includes(term))
  )
  const wrap = $('#mentorResults'); if(!wrap) return; wrap.innerHTML=''
  res.forEach(m=>{
    const card = document.createElement('div'); card.className='card'
    card.innerHTML = `<div class="meta"><strong>${m.name}</strong><span class="kicker">${m.company}</span></div>
      <div class="tags">${m.skills.map(s=>`<span class=badge>${s}</span>`).join('')}</div>
      <div class="inline mt"><button class="btn">Connect</button><button class="btn btn-outline">Request Endorsement</button></div>`
    wrap.appendChild(card)
  })
}

/* Mentor directory (public) - enhanced */
let currentMentorFilter = 'all'

function renderMentorDirectory(searchTerm = '', skillFilter = 'all'){
  const el = $('#mentorDirectory'); if(!el) return; el.innerHTML=''
  
  let filtered = db.mentors.filter(m=>{
    const matchesSearch = !searchTerm || 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.skills.some(s=>s.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesSkill = skillFilter === 'all' || m.skills.includes(skillFilter)
    
    return matchesSearch && matchesSkill
  })
  
  if(filtered.length === 0){
    el.innerHTML = '<p class="muted" style="text-align:center; padding:2rem">No mentors found. Try adjusting your search.</p>'
    return
  }
  
  filtered.forEach(m=>{
    const c = document.createElement('div'); c.className='mentor-card'
    const initials = m.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()
    c.innerHTML = `
      <div class="mentor-header">
        <div class="mentor-avatar">${initials}</div>
        <div class="mentor-info">
          <h3>${m.name}</h3>
          <div class="mentor-company"><i class="fa-solid fa-building"></i> ${m.company}</div>
        </div>
      </div>
      <div class="mentor-skills">${m.skills.map(s=>`<span class="badge">${s}</span>`).join('')}</div>
      <div class="inline mt">
        <button class="btn btn-primary"><i class="fa-solid fa-user-plus"></i> Connect</button>
        <button class="btn"><i class="fa-solid fa-envelope"></i> Message</button>
      </div>
    `
    el.appendChild(c)
  })
}
renderMentorDirectory()

// Search functionality
$('#searchMentorBtn')?.addEventListener('click', ()=>{
  const term = $('#mentorSearchMain')?.value || ''
  renderMentorDirectory(term, currentMentorFilter)
})

$('#mentorSearchMain')?.addEventListener('keypress', (e)=>{
  if(e.key === 'Enter'){
    const term = $('#mentorSearchMain')?.value || ''
    renderMentorDirectory(term, currentMentorFilter)
  }
})

// Filter chips
$$('.chip').forEach(chip=>{
  chip.addEventListener('click', ()=>{
    $$('.chip').forEach(c=>c.classList.remove('active'))
    chip.classList.add('active')
    const skill = chip.getAttribute('data-skill')
    currentMentorFilter = skill
    const term = $('#mentorSearchMain')?.value || ''
    renderMentorDirectory(term, skill)
  })
})

/* Job posting */
$('#jobForm')?.addEventListener('submit', (e)=>{
  e.preventDefault()
  const title = $('#jobTitle').value.trim()
  const company = $('#jobCompany').value.trim()
  const departments = $('#jobDepartments').value.split(',').map(s=>s.trim()).filter(Boolean)
  const skills = $('#jobSkills').value.split(',').map(s=>s.trim()).filter(Boolean)
  const job = { id:'j'+(db.jobs.length+1), title, company, departments, skills }
  db.jobs.unshift(job)
  if(!db.employers.find(x=>x.name===company)) db.employers.push({ id:'e'+(db.employers.length+1), name:company })
  store.save(db)
  refreshStats()
  renderJobs()
  e.target.reset()
  alert('Internship published')
})

/* Matching score */
function matchScore(job, student){
  if(!student) return 0
  const deptWeight = 0.35
  const skillWeight = 0.65
  // Department overlap
  const deptMatch = job.departments?.length ? (job.departments.includes(student.dept) ? 1 : 0) : 1
  // Verified skills overlap
  const needed = job.skills || []
  const have = student.verified || []
  const skillMatches = needed.filter(s=>have.includes(s)).length
  const skillPct = needed.length ? (skillMatches/needed.length) : 1
  const score = Math.round((deptMatch*deptWeight + skillPct*skillWeight)*100)
  return score
}

/* Render jobs + filters */
function renderJobs(){
  const list = $('#jobsList'); if(!list) return
  const deptFilter = $('#filterDept')?.value || ''
  const text = ($('#filterText')?.value || '').toLowerCase()
  const student = currentStudent()

  list.innerHTML = ''
  const filteredJobs = db.jobs
    .filter(j => !deptFilter || j.departments.includes(deptFilter))
    .filter(j => !text || j.title.toLowerCase().includes(text) || j.company.toLowerCase().includes(text))
  
  // Update job count
  const countEl = $('#jobsCount')
  if(countEl) countEl.textContent = filteredJobs.length
  
  filteredJobs.forEach(job=>{
    const score = matchScore(job, student)
    const card = document.createElement('div'); card.className='job-card'
    card.innerHTML = `
      <div class="meta">
        <strong>${job.title}</strong>
        <span class="kicker">${job.company}</span>
        <span class="score">${score}% match</span>
      </div>
      <div class="tags">${(job.departments||[]).map(d=>`<span class=badge>${d}</span>`).join('')}</div>
      <div class="tags">${(job.skills||[]).map(s=>`<span class=badge>${s}</span>`).join('')}</div>
      <div class="inline">
        <button class="btn btn-outline">View Details</button>
        <button class="btn btn-primary">Apply Now</button>
      </div>
    `
    list.appendChild(card)
  })
  
  if(filteredJobs.length === 0){
    list.innerHTML = '<p style="text-align:center; color:#9ca3af; padding:3rem;">No jobs found matching your criteria. Try adjusting your filters.</p>'
  }
}

// Apply Filters button
const applyFiltersBtn = $('#applyFilters')
if(applyFiltersBtn){
  applyFiltersBtn.addEventListener('click', ()=>{
    console.log('Filter button clicked')
    renderJobs()
  })
}

// Real-time filter on input change
const filterDept = $('#filterDept')
const filterText = $('#filterText')

if(filterDept){
  filterDept.addEventListener('change', renderJobs)
}

if(filterText){
  filterText.addEventListener('input', renderJobs)
  filterText.addEventListener('keyup', (e)=>{
    if(e.key === 'Enter') renderJobs()
  })
}

// initial render
renderJobs()

/* Scroll reveal animation using IntersectionObserver */
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if(entry.isIntersecting){
      setTimeout(() => {
        entry.target.classList.add('visible')
      }, index * 100)
      observer.unobserve(entry.target)
    }
  })
}, observerOptions)

// Observe all cards on page load
function observeCards(){
  $$('.card, .list-cards > *').forEach(card => {
    card.classList.add('fade-in')
    observer.observe(card)
  })
}

// Run on load and after dynamic content
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', observeCards)
} else {
  observeCards()
}

// Re-observe after rendering jobs/mentors
const originalRenderJobs = renderJobs
renderJobs = function(){
  originalRenderJobs()
  setTimeout(observeCards, 50)
}

const originalRenderMentorDirectory = renderMentorDirectory
renderMentorDirectory = function(){
  originalRenderMentorDirectory()
  setTimeout(observeCards, 50)
}

const originalSearchMentors = searchMentors
searchMentors = function(){
  originalSearchMentors()
  setTimeout(observeCards, 50)
}
