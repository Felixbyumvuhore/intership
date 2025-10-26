/* Admin Dashboard JavaScript - Modern Version */

// Check if user is admin (simple check for demo)
if(!db.auth || db.auth.role !== 'University'){
  console.log('Admin dashboard - Demo mode')
}

// Sidebar Navigation
const sidebar = $('#adminSidebar')
const navItems = $$('.nav-item')
const sections = $$('.admin-section')
const pageTitle = $('#pageTitle')

// Section titles mapping
const sectionTitles = {
  'dashboard': 'Dashboard Overview',
  'users': 'User Management',
  'jobs': 'Job Postings Management',
  'verifications': 'Skill Verifications',
  'analytics': 'Analytics & Reports',
  'settings': 'System Settings'
}

// Navigate to section
function navigateToSection(sectionName){
  // Update nav items
  navItems.forEach(item => item.classList.remove('active'))
  const activeNav = $(`.nav-item[data-section="${sectionName}"]`)
  if(activeNav) activeNav.classList.add('active')
  
  // Update sections
  sections.forEach(section => section.classList.remove('active'))
  const activeSection = $(`#section-${sectionName}`)
  if(activeSection) activeSection.classList.add('active')
  
  // Update page title
  if(pageTitle && sectionTitles[sectionName]){
    pageTitle.textContent = sectionTitles[sectionName]
  }
  
  // Close mobile sidebar
  if(window.innerWidth <= 768){
    sidebar?.classList.remove('mobile-open')
  }
}

// Sidebar nav click handlers
navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault()
    const section = item.getAttribute('data-section')
    if(section) navigateToSection(section)
  })
})

// Sidebar toggle (desktop)
$('#sidebarToggle')?.addEventListener('click', () => {
  sidebar?.classList.toggle('collapsed')
})

// Mobile toggle
$('#mobileToggle')?.addEventListener('click', () => {
  sidebar?.classList.toggle('mobile-open')
})

// Close sidebar when clicking outside on mobile
if(window.innerWidth <= 768){
  document.addEventListener('click', (e) => {
    if(!sidebar?.contains(e.target) && !$('#mobileToggle')?.contains(e.target)){
      sidebar?.classList.remove('mobile-open')
    }
  })
}

// Populate stats
function updateAdminStats(){
  $('#adminStatStudents').textContent = db.students.length
  $('#adminStatEmployers').textContent = db.employers.length
  $('#adminStatMentors').textContent = db.mentors.length
  $('#adminStatJobs').textContent = db.jobs.length
}
updateAdminStats()

// Tab switching
$$('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const tab = btn.getAttribute('data-tab')
    $$('.tab-btn').forEach(b=>b.classList.remove('active'))
    $$('.tab-content').forEach(c=>c.classList.remove('active'))
    btn.classList.add('active')
    $(`.tab-content[data-content="${tab}"]`)?.classList.add('active')
  })
})

// Render Students Table
function renderStudentsTable(){
  const tbody = $('#studentsTable')
  if(!tbody) return
  tbody.innerHTML = ''
  db.students.forEach(s=>{
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td><strong>${s.name}</strong></td>
      <td>${s.email}</td>
      <td>${s.dept || 'N/A'}</td>
      <td><div class="tags">${(s.skills||[]).slice(0,3).map(sk=>`<span class="badge">${sk}</span>`).join('')}</div></td>
      <td><div class="tags">${(s.verified||[]).slice(0,3).map(sk=>`<span class="badge verify">${sk}</span>`).join('')}</div></td>
      <td>
        <button class="btn-sm-icon" onclick="viewStudent('${s.id}')" title="View"><i class="fa-solid fa-eye"></i></button>
        <button class="btn-sm-icon" onclick="deleteStudent('${s.id}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
      </td>
    `
    tbody.appendChild(tr)
  })
}

// Render Employers Table
function renderEmployersTable(){
  const tbody = $('#employersTable')
  if(!tbody) return
  tbody.innerHTML = ''
  db.employers.forEach(e=>{
    const jobCount = db.jobs.filter(j=>j.company===e.name).length
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td><strong>${e.name}</strong></td>
      <td>${jobCount}</td>
      <td>
        <button class="btn-sm-icon" onclick="viewEmployer('${e.id}')" title="View"><i class="fa-solid fa-eye"></i></button>
        <button class="btn-sm-icon" onclick="deleteEmployer('${e.id}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
      </td>
    `
    tbody.appendChild(tr)
  })
}

// Render Mentors Table
function renderMentorsTable(){
  const tbody = $('#mentorsTable')
  if(!tbody) return
  tbody.innerHTML = ''
  db.mentors.forEach(m=>{
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td><strong>${m.name}</strong></td>
      <td>${m.email}</td>
      <td>${m.company}</td>
      <td><div class="tags">${(m.skills||[]).slice(0,3).map(sk=>`<span class="badge">${sk}</span>`).join('')}</div></td>
      <td>
        <button class="btn-sm-icon" onclick="viewMentor('${m.id}')" title="View"><i class="fa-solid fa-eye"></i></button>
        <button class="btn-sm-icon" onclick="deleteMentor('${m.id}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
      </td>
    `
    tbody.appendChild(tr)
  })
}

// Render Jobs Table
function renderJobsTable(){
  const tbody = $('#jobsTable')
  if(!tbody) return
  tbody.innerHTML = ''
  db.jobs.forEach(j=>{
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td><strong>${j.title}</strong></td>
      <td>${j.company}</td>
      <td><div class="tags">${(j.departments||[]).map(d=>`<span class="badge">${d}</span>`).join('')}</div></td>
      <td><div class="tags">${(j.skills||[]).map(sk=>`<span class="badge">${sk}</span>`).join('')}</div></td>
      <td>
        <button class="btn-sm-icon" onclick="viewJob('${j.id}')" title="View"><i class="fa-solid fa-eye"></i></button>
        <button class="btn-sm-icon" onclick="deleteJob('${j.id}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
      </td>
    `
    tbody.appendChild(tr)
  })
}

// Initial render
setTimeout(() => {
  renderStudentsTable()
  renderEmployersTable()
  renderMentorsTable()
  renderJobsTable()
}, 100)

// View functions
function viewStudent(id){
  const student = db.students.find(s=>s.id===id)
  if(student){
    alert(`Student: ${student.name}\nEmail: ${student.email}\nDepartment: ${student.dept}\nSkills: ${student.skills.join(', ')}\nVerified: ${student.verified.join(', ')}`)
  }
}

function viewEmployer(id){
  const employer = db.employers.find(e=>e.id===id)
  if(employer){
    const jobs = db.jobs.filter(j=>j.company===employer.name)
    alert(`Employer: ${employer.name}\nJobs Posted: ${jobs.length}\nJob Titles: ${jobs.map(j=>j.title).join(', ')}`)
  }
}

function viewMentor(id){
  const mentor = db.mentors.find(m=>m.id===id)
  if(mentor){
    alert(`Mentor: ${mentor.name}\nEmail: ${mentor.email}\nCompany: ${mentor.company}\nSkills: ${mentor.skills.join(', ')}`)
  }
}

function viewJob(id){
  const job = db.jobs.find(j=>j.id===id)
  if(job){
    alert(`Job: ${job.title}\nCompany: ${job.company}\nDepartments: ${job.departments.join(', ')}\nRequired Skills: ${job.skills.join(', ')}`)
  }
}

// Delete functions
function deleteStudent(id){
  if(confirm('Are you sure you want to delete this student?')){
    db.students = db.students.filter(s=>s.id!==id)
    store.save(db)
    renderStudentsTable()
    updateAdminStats()
    alert('Student deleted')
  }
}

function deleteEmployer(id){
  if(confirm('Are you sure you want to delete this employer?')){
    db.employers = db.employers.filter(e=>e.id!==id)
    store.save(db)
    renderEmployersTable()
    updateAdminStats()
    alert('Employer deleted')
  }
}

function deleteMentor(id){
  if(confirm('Are you sure you want to delete this mentor?')){
    db.mentors = db.mentors.filter(m=>m.id!==id)
    store.save(db)
    renderMentorsTable()
    updateAdminStats()
    alert('Mentor deleted')
  }
}

function deleteJob(id){
  if(confirm('Are you sure you want to delete this job?')){
    db.jobs = db.jobs.filter(j=>j.id!==id)
    store.save(db)
    renderJobsTable()
    updateAdminStats()
    alert('Job deleted')
  }
}

// Quick Actions
function clearAllData(){
  if(confirm('WARNING: This will delete all data and reset to demo seed data. Continue?')){
    localStorage.removeItem(store.key)
    location.reload()
  }
}

function exportData(){
  const dataStr = JSON.stringify(db, null, 2)
  const dataBlob = new Blob([dataStr], {type: 'application/json'})
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'career-skills-data.json'
  link.click()
  URL.revokeObjectURL(url)
  alert('Data exported successfully')
}

function generateReport(){
  const report = `
=== Career & Skills Marketplace Report ===

Total Users: ${db.students.length + db.mentors.length + db.employers.length}
- Students: ${db.students.length}
- Mentors: ${db.mentors.length}
- Employers: ${db.employers.length}

Active Job Postings: ${db.jobs.length}

Top Skills (Students):
${getTopSkills(db.students)}

Verified Skills Count: ${db.students.reduce((acc,s)=>(acc+(s.verified||[]).length),0)}

Generated: ${new Date().toLocaleString()}
  `
  alert(report)
}

function getTopSkills(students){
  const skillCounts = {}
  students.forEach(s=>{
    (s.skills||[]).forEach(sk=>{
      skillCounts[sk] = (skillCounts[sk]||0) + 1
    })
  })
  return Object.entries(skillCounts)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,5)
    .map(([skill, count])=>`- ${skill}: ${count}`)
    .join('\n')
}

// Logout
$('#adminLogout')?.addEventListener('click', (e)=>{
  e.preventDefault()
  if(confirm('Logout from admin dashboard?')){
    window.location.href = 'index.html'
  }
})

// Refresh data function
function refreshData(){
  updateAdminStats()
  renderStudentsTable()
  renderEmployersTable()
  renderMentorsTable()
  renderJobsTable()
  alert('Data refreshed successfully!')
}

// Add new user placeholder
function addNewUser(){
  alert('Add User feature\n\nThis would open a modal to add:\n- Students\n- Employers\n- Mentors\n\nComing soon!')
}

// Add new job placeholder
function addNewJob(){
  alert('Add Job feature\n\nThis would open a modal to post a new job opportunity.\n\nComing soon!')
}

// Admin search functionality
$('#adminSearch')?.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase()
  // Simple search implementation - would filter tables/cards
  console.log('Searching for:', query)
})

// Handle hash navigation
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.substring(1)
  if(hash && sectionTitles[hash]){
    navigateToSection(hash)
  }
})

// Initialize from hash
if(window.location.hash){
  const hash = window.location.hash.substring(1)
  if(sectionTitles[hash]){
    navigateToSection(hash)
  }
}
