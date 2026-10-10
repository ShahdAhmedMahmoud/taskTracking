/* ============ DATA MODEL ============ */
let DEPT_MANAGER = "";
const LOGO_SRC = "/assets/logo.png";

// Loaded from /api/roster; the database is the only source of teams and people.
let TEAMS = [];
function teamName(team){ return team.label ? `فريق ${team.label}` : `فريق ${team.id.slice(1)}`; }
function mainTeams(){ return TEAMS.filter(t=> (t.division||'main') === 'main'); }
function canChangePhoto(engId){ return SESSION?.role === 'engineer' && SESSION.id === engId; }
function safePhotoData(value){ return typeof value === 'string' && value.startsWith('data:image/') && value.length <= 2800000 ? value : ''; }
function employeePhotoHTML(engineer, editable){
  const photo = safePhotoData(engineer.photoData);
  const image = photo ? `<img src="${photo}" alt="${engineer.name}" class="employee-photo">` : '<span class="employee-photo-placeholder">👤</span>';
  const action = editable ? `<button class="photo-edit-btn" title="تغيير الصورة" aria-label="تغيير الصورة" onclick="event.stopPropagation(); chooseEngineerPhoto('${engineer.id}')">✎</button><input id="photo-input-${engineer.id}" type="file" accept="image/png,image/jpeg,image/webp" hidden onchange="uploadEngineerPhoto('${engineer.id}', this.files[0])">` : '';
  return `<div class="employee-photo-wrap">${image}${action}</div>`;
}



let TASKS = [];
let BOOTSTRAP = null;
let DASH_CONFIG = null;
let NOTIFICATIONS = { unread: 0, items: [] };
let NOTIFICATION_IDS = new Set();
let NOTIFICATIONS_READY = false;
const PROJECT_FILES = {};
const PROJECT_FILES_LOADING = {};

function findCachedProject(projectId){
  const candidateEngineerIds = [SESSION?.id, state?.engId].filter(Boolean);
  for(const engineerId of candidateEngineerIds){
    const project = cache[engineerId]?.projects?.find(item => item.id === projectId);
    if(project) return project;
  }
  return null;
}

async function loadBootstrap(){
  const response = await fetch('/api/bootstrap', { cache:'no-store' });
  if(!response.ok) throw new Error('Bootstrap load failed: ' + response.status);
  const result = await response.json();
  if(!result || !Array.isArray(result.teams) || !Array.isArray(result.tasks)){
    throw new Error('بيانات التهيئة القادمة من الخادم غير مكتملة');
  }
  BOOTSTRAP = result;
  TEAMS = result.teams;
  TASKS = result.tasks;
  DEPT_MANAGER = result.config?.deptManager || '';

  try{
    const cfg = await fetch('/api/dashboard/config', { cache:'no-store' });
    if(!cfg.ok) throw new Error('config');
    DASH_CONFIG = await cfg.json();
  } catch (e) {
    DASH_CONFIG = null;
  }

  try {
    const fieldRes = await fetch('/api/fields', { cache:'no-store' });
    if(fieldRes.ok) {
      const fieldData = await fieldRes.json();
      const normalized = fieldData?.fields || [];
      const byScope = {
        task: normalized.filter(x => x.scope === 'task' || x.Scope === 'task'),
        customTask: normalized.filter(x => x.scope === 'customTask' || x.Scope === 'customTask'),
        hasr: normalized.filter(x => x.scope === 'hasr' || x.Scope === 'hasr')
      };

      DASH_CONFIG = DASH_CONFIG || {};
      DASH_CONFIG.taskFields = (DASH_CONFIG.taskFields || []).length ? DASH_CONFIG.taskFields : byScope.task.map(x => ({ id: x.id || x.Id, label: x.label || x.Label, type: x.type || x.Type, required: x.required || x.IsRequired || false }));
      DASH_CONFIG.customTaskFields = (DASH_CONFIG.customTaskFields || []).length ? DASH_CONFIG.customTaskFields : byScope.customTask.map(x => ({ id: x.id || x.Id, label: x.label || x.Label, type: x.type || x.Type, required: x.required || x.IsRequired || false }));
      DASH_CONFIG.hasrFields = (DASH_CONFIG.hasrFields || []).length ? DASH_CONFIG.hasrFields : byScope.hasr.map(x => ({ id: x.id || x.Id, label: x.label || x.Label, type: x.type || x.Type, required: x.required || x.IsRequired || false }));
    }
  } catch (e) {
    console.warn('Field config fallback unavailable:', e);
  }

  if(!DEPT_MANAGER){
    console.warn('config:deptManager غير مضبوط في قاعدة البيانات');
  }
}

async function loadDashboardConfig(){
  return loadBootstrap();
}

async function loadNotifications(){
  if(!SESSION || SESSION.role !== 'engineer') return;
  const response = await fetch('/api/notifications/' + encodeURIComponent(SESSION.id), { cache:'no-store' });
  if(!response.ok) throw new Error('notifications load failed: ' + response.status);
  const next = await response.json();
  const newItems = (next.items || []).filter(item => !NOTIFICATION_IDS.has(item.id) && !item.readAt);
  NOTIFICATIONS = next;
  NOTIFICATION_IDS = new Set((next.items || []).map(item => item.id));
  if(NOTIFICATIONS_READY) newItems.forEach(showNotificationPopup);
  NOTIFICATIONS_READY = true;
}

function showNotificationPopup(notification){
  const container = document.getElementById('notification-popups') || (()=>{
    const element = document.createElement('div'); element.id = 'notification-popups'; document.body.appendChild(element); return element;
  })();
  const popup = document.createElement('article');
  popup.className = 'notification-popup';
  popup.innerHTML = `<button class="notification-popup-close" aria-label="إغلاق">×</button><div class="notification-popup-icon">🔔</div><div class="notification-popup-content"><strong>${escapeHtml(notification.title || 'إشعار جديد')}</strong><p>${escapeHtml(notification.message || '')}</p><time>${new Date(notification.createdAt).toLocaleString('ar-EG')}</time></div>`;
  popup.querySelector('.notification-popup-close').onclick = event => { event.stopPropagation(); popup.remove(); };
  popup.onclick = async () => {
    popup.remove();
    try { await markNotificationRead(notification.id); } catch(error) { console.error(error); }
    if(notification.projectId) {
      const engineerId = SESSION.id;
      const data = cache[engineerId];
      if(data?.projects?.some(project => project.id === notification.projectId)) switchProject(engineerId, notification.projectId);
    }
  };
  container.prepend(popup);
  setTimeout(() => popup.remove(), 9000);
}

async function loadProjectFiles(projectId, force){
  if(PROJECT_FILES[projectId] && !force) return PROJECT_FILES[projectId];
  const response = await fetch('/api/files/projects/' + encodeURIComponent(projectId), { cache:'no-store' });
  if(!response.ok) throw new Error('files load failed: ' + response.status);
  PROJECT_FILES[projectId] = await response.json();
  return PROJECT_FILES[projectId];
}

function projectFilesHTML(project){
  const files = PROJECT_FILES[project.id];
  const projectName = project.name || 'مشروع بدون اسم';
  const projectCode = project.projectCode || project.id;
  if(!files) return `<section class="files-panel"><div class="files-project-context"><span>الملفات الخاصة بالمشروع</span><strong>${escapeHtml(projectName)}</strong><small>الكود: ${escapeHtml(projectCode)}</small></div><p class="files-loading">جاري تحميل المرفقات وملفات T...</p></section>`;
  const attachments = files.attachments || [];
  const tFiles = files.tFiles || [];
  const attachmentRows = attachments.length ? attachments.map(item => `
     <div class="file-row"><div><strong>${escapeHtml(item.attachmentName || item.originalFileName)}</strong><span>تابع للمشروع: ${escapeHtml(projectName)} · ${escapeHtml(item.originalFileName)} · ${escapeHtml(item.fileType)} · ${formatFileSize(item.fileSize)} · الإصدار ${item.version}</span></div><div class="file-row-actions"><button class="btn ghost" onclick="previewFilePopup('${escapeHtml(item.originalFileName)}','${item.downloadUrl}','${item.fileType}')">عرض</button><a class="btn ghost" href="${item.downloadUrl}" download>تنزيل</a><button class="btn danger" onclick="deleteProjectAttachment(${item.id}, '${project.id}')">حذف</button></div></div>`).join('') : '<p class="files-empty">لا توجد مرفقات للمشروع.</p>';
  const tFileRows = tFiles.length ? tFiles.map(tFile => `
    <article class="tfile-card"><div class="tfile-heading"><div><strong>${escapeHtml(tFile.name)}</strong><span>تابع للمشروع: ${escapeHtml(projectName)} · ${tFile.rounds?.length || 0} جولة · ${escapeHtml(tFile.createdBy || '')}</span></div><div class="file-row-actions"><button class="btn ghost" onclick="openRoundPopup('${tFile.id}','${project.id}')">+ إضافة Round لهذا الـ T File</button><button class="btn danger" onclick="deleteTFile('${tFile.id}', '${project.id}')">حذف T File</button></div></div>
      ${(tFile.rounds || []).map(round => `<div class="round-block"><div class="round-heading"><strong>Round ${round.roundNumber}: ${escapeHtml(round.name)}</strong><div class="file-row-actions"><button class="btn ghost" onclick="uploadNewVersion('${round.id}','${project.id}')">رفع Version جديدة لهذا الـ Round</button><button class="btn danger" onclick="deleteRound('${round.id}', '${project.id}')">حذف Round</button></div></div>${(round.versions || []).length ? `<div class="version-list">${round.versions.map(version => `<div class="version-row ${version.isCurrentVersion ? 'current' : ''}"><span>Version ${version.versionNumber} · تابع للمشروع: ${escapeHtml(projectName)} · ${escapeHtml(version.originalFileName)} · ${formatFileSize(version.fileSize)} ${version.isCurrentVersion ? '· الحالية' : ''}</span><div class="file-row-actions"><button class="btn ghost" onclick="previewFilePopup('${escapeHtml(version.originalFileName)}','${version.downloadUrl}','${version.fileType}')">عرض</button><a href="${version.downloadUrl}" download>تنزيل</a><button class="btn danger" onclick="deleteVersion(${version.id}, '${project.id}')">حذف</button></div></div>`).join('')}</div>` : '<p class="files-empty">لا توجد نسخ مرفوعة لهذا الـ Round.</p>'}</div>`).join('')}
    </article>`).join('') : '<p class="files-empty">لا توجد T Files لهذا المشروع.</p>';
  return `<section class="files-panel"><div class="files-project-context"><span>الملفات الخاصة بالمشروع الحالي</span><strong>${escapeHtml(projectName)}</strong><small>Project Code: ${escapeHtml(projectCode)} · Project ID: ${escapeHtml(project.id)}</small></div><div class="files-title"><div><div class="section-title">مرفقات و T Files</div><p>كل ما يظهر هنا تابع لهذا المشروع فقط، ومحفوظ في قاعدة البيانات والتخزين.</p></div><div class="files-actions"><button class="btn primary" onclick="openAttachmentPopup('${project.id}')">+ Add Attachment لهذا المشروع</button><button class="btn ghost" onclick="openTFilePopup('${project.id}')">+ T File لهذا المشروع</button></div></div><div class="file-group"><h3>Attachments · مرفقات المشروع</h3>${attachmentRows}</div><div class="file-group"><h3>T Files · ملفات T الخاصة بالمشروع</h3>${tFileRows}</div></section>`;
}

function formatFileSize(bytes){
  const value = Number(bytes) || 0;
  if(value < 1024) return `${value} B`;
  if(value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function previewFilePopup(fileName, url, fileType){
  document.getElementById('file-preview-popup')?.remove();
  const popup = document.createElement('div');
  popup.id = 'file-preview-popup';
  popup.className = 'modal-overlay';
  const type = (fileType || '').toLowerCase();
  const previewUrl = `${url}${url.includes('?') ? '&' : '?'}inline=true`;
  const isImage = ['.png', '.jpg', '.jpeg', '.webp'].includes(type);
  const isPdf = type === '.pdf';
  const content = isImage
    ? `<img class="file-preview-image" src="${previewUrl}" alt="${escapeHtml(fileName)}">`
    : isPdf
      ? `<iframe class="file-preview-frame" src="${previewUrl}" title="${escapeHtml(fileName)}"></iframe>`
      : `<div class="file-preview-unsupported"><div class="file-preview-icon">ملف</div><h4>المعاينة غير متاحة لهذا النوع</h4><p>يمكنك تنزيل ملف Excel وفتحه على جهازك.</p><a class="btn primary" href="${url}" download>تنزيل الملف</a></div>`;
  popup.innerHTML = `<div class="modal-box file-preview-modal"><button class="popup-close" type="button" aria-label="إغلاق" onclick="closeFilePreviewPopup()">×</button><div class="file-preview-header"><div><span>معاينة المرفق</span><strong>${escapeHtml(fileName)}</strong></div><a class="btn ghost" href="${url}" download>تنزيل</a></div><div class="file-preview-content">${content}</div></div>`;
  document.body.appendChild(popup);
}

function closeFilePreviewPopup(){ document.getElementById('file-preview-popup')?.remove(); }

function deleteProjectAttachment(attachmentId, projectId){
  const files = PROJECT_FILES[projectId];
  const attachment = files?.attachments?.find(item => item.id === attachmentId);
  if(!attachment) return;
  showConfirmDialog({
    title: 'حذف المرفق',
    message: `هل تريد حذف المرفق "${attachment.attachmentName || attachment.originalFileName}" نهائيًا؟`,
    confirmText: 'حذف المرفق',
    onConfirm: async () => {
      try{
        const response = await fetch(`/api/files/attachments/${attachmentId}`, { method:'DELETE', headers:{'X-User-Name':encodeURIComponent(SESSION?.name || 'system')} });
        if(!response.ok) throw new Error((await response.json().catch(()=>({}))).error || `delete failed: ${response.status}`);
        await loadProjectFiles(projectId, true);
        renderEngineer();
        flashSave(true, 'تم حذف المرفق وملف التخزين');
      }catch(error){ flashSave(false, 'تعذر حذف المرفق: ' + error.message, 5000); }
    }
  });
}

function deleteVersion(versionId, projectId){
  showConfirmDialog({ title:'حذف Version', message:'هل تريد حذف هذه النسخة نهائيًا من سجل الـ Round؟', confirmText:'حذف Version', onConfirm:async()=>{
    try{ const response=await fetch(`/api/files/versions/${versionId}`,{method:'DELETE',headers:{'X-User-Name':encodeURIComponent(SESSION?.name || 'system')}}); if(!response.ok) throw new Error('تعذر حذف Version'); await loadProjectFiles(projectId,true); renderEngineer(); flashSave(true,'تم حذف Version وملفها'); }catch(error){flashSave(false,error.message,5000);}
  }});
}
function deleteRound(roundId, projectId){
  showConfirmDialog({ title:'حذف Round', message:'سيتم حذف الـ Round وجميع الـ Versions التابعة له. هل تريد المتابعة؟', confirmText:'حذف Round', onConfirm:async()=>{
    try{ const response=await fetch(`/api/files/rounds/${encodeURIComponent(roundId)}`,{method:'DELETE',headers:{'X-User-Name':encodeURIComponent(SESSION?.name || 'system')}}); if(!response.ok) throw new Error('تعذر حذف Round'); await loadProjectFiles(projectId,true); renderEngineer(); flashSave(true,'تم حذف Round ونسخه'); }catch(error){flashSave(false,error.message,5000);}
  }});
}
function deleteTFile(tFileId, projectId){
  showConfirmDialog({ title:'حذف T File', message:'سيتم حذف ملف T وجميع الـ Rounds والـ Versions التابعة له. هل تريد المتابعة؟', confirmText:'حذف T File', onConfirm:async()=>{
    try{ const response=await fetch(`/api/files/t-files/${encodeURIComponent(tFileId)}`,{method:'DELETE',headers:{'X-User-Name':encodeURIComponent(SESSION?.name || 'system')}}); if(!response.ok) throw new Error('تعذر حذف T File'); await loadProjectFiles(projectId,true); renderEngineer(); flashSave(true,'تم حذف T File وملفاته'); }catch(error){flashSave(false,error.message,5000);}
  }});
}

function addProjectAttachment(projectId){ document.getElementById(`project-file-input-${projectId}`)?.click(); }
function openAttachmentPopup(projectId){
  const project = findCachedProject(projectId);
  if(!project) return;
  document.getElementById('attachment-popup')?.remove();
  const popup = document.createElement('div');
  popup.id = 'attachment-popup';
  popup.className = 'modal-overlay';
  popup.innerHTML = `<div class="modal-box attachment-modal"><button class="popup-close" type="button" aria-label="إغلاق" onclick="closeAttachmentPopup()">×</button><h3>إضافة مرفق للمشروع</h3><div class="popup-project-context"><span>سيتم الحفظ داخل المشروع</span><strong>${escapeHtml(project.name || 'مشروع بدون اسم')}</strong><small>Project ID: ${escapeHtml(project.id)}</small></div><div class="field"><label for="attachment-name">اسم المرفق</label><input id="attachment-name" type="text" placeholder="مثال: فاتورة شهادة الشروق"></div><div class="field"><label for="attachment-notes">ملاحظات</label><input id="attachment-notes" type="text" placeholder="ملاحظات اختيارية"></div><label class="attachment-dropzone" for="attachment-popup-file"><strong>اختر الملف أو اسحبه هنا</strong><span>Excel · PDF · PNG — الحد الأقصى 25 MB</span><input id="attachment-popup-file" type="file" accept=".xlsx,.xls,.pdf,.png" hidden></label><div id="attachment-selected-file" class="selected-file">لم يتم اختيار ملف</div><div class="modal-error" id="attachment-popup-error"></div><div class="modal-actions"><button class="btn ghost" type="button" onclick="closeAttachmentPopup()">إلغاء</button><button class="btn primary" type="button" onclick="submitAttachmentPopup('${projectId}')">رفع المرفق</button></div></div>`;
  document.body.appendChild(popup);
  const input = document.getElementById('attachment-popup-file');
  const dropzone = popup.querySelector('.attachment-dropzone');
  const showSelectedFile = () => { document.getElementById('attachment-selected-file').textContent = input.files[0]?.name || 'لم يتم اختيار ملف'; };
  input.addEventListener('change', showSelectedFile);
  dropzone.addEventListener('dragover', event => { event.preventDefault(); dropzone.classList.add('dragging'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragging'));
  dropzone.addEventListener('drop', event => { event.preventDefault(); dropzone.classList.remove('dragging'); if(event.dataTransfer.files.length){ input.files = event.dataTransfer.files; showSelectedFile(); } });
}
function closeAttachmentPopup(){ document.getElementById('attachment-popup')?.remove(); }
async function submitAttachmentPopup(projectId){
  const input = document.getElementById('attachment-popup-file');
  const file = input?.files?.[0];
  const error = document.getElementById('attachment-popup-error');
  if(!file){ error.textContent = 'اختر ملفًا أولاً'; return; }
  const body = new FormData();
  body.append('file', file);
  body.append('attachmentName', document.getElementById('attachment-name').value.trim() || file.name.replace(/\.[^.]+$/, ''));
  body.append('notes', document.getElementById('attachment-notes').value.trim());
  try{
    const response = await fetch(`/api/files/projects/${encodeURIComponent(projectId)}/attachments`, { method:'POST', body, headers:{'X-User-Name':encodeURIComponent(SESSION?.name || 'system')} });
    if(!response.ok) throw new Error((await response.json().catch(()=>({}))).error || `upload failed: ${response.status}`);
    closeAttachmentPopup();
    await loadProjectFiles(projectId, true);
    renderEngineer();
    flashSave(true, 'تم رفع المرفق داخل المشروع بنجاح');
  }catch(uploadError){ error.textContent = uploadError.message; }
}
async function submitProjectAttachment(projectId, file){
  if(!file) return;
  const body = new FormData(); body.append('file', file); body.append('attachmentName', file.name.replace(/\.[^.]+$/, ''));
  try{
    const response = await fetch(`/api/files/projects/${encodeURIComponent(projectId)}/attachments`, { method:'POST', body, headers:{'X-User-Name':encodeURIComponent(SESSION?.name || 'system')} });
    if(!response.ok) throw new Error((await response.json().catch(()=>({}))).error || `upload failed: ${response.status}`);
    await loadProjectFiles(projectId, true); renderEngineer(); flashSave(true, 'تم رفع المرفق بنجاح');
  }catch(error){ flashSave(false, error.message, 5000); }
}
function openTFilePopup(projectId){
  const project = findCachedProject(projectId);
  if(!project) return;
  document.getElementById('tfile-popup')?.remove();
  const popup = document.createElement('div');
  popup.id = 'tfile-popup';
  popup.className = 'modal-overlay';
  popup.innerHTML = `<div class="modal-box attachment-modal"><button class="popup-close" type="button" aria-label="إغلاق" onclick="closeTFilePopup()">×</button><h3>إضافة T File للمشروع</h3><div class="popup-project-context"><span>سيتم إنشاء الملف داخل المشروع</span><strong>${escapeHtml(project.name || 'مشروع بدون اسم')}</strong><small>Project ID: ${escapeHtml(project.id)}</small></div><div class="field"><label for="tfile-name">اسم T File</label><input id="tfile-name" type="text" placeholder="مثال: ملف العرض الفني"></div><div class="field"><label for="tfile-description">الوصف</label><input id="tfile-description" type="text" placeholder="وصف اختياري لملف T"></div><div class="modal-error" id="tfile-popup-error"></div><div class="modal-actions"><button class="btn ghost" type="button" onclick="closeTFilePopup()">إلغاء</button><button class="btn primary" type="button" onclick="submitTFilePopup('${projectId}')">إنشاء T File</button></div></div>`;
  document.body.appendChild(popup);
  document.getElementById('tfile-name').focus();
}
function closeTFilePopup(){ document.getElementById('tfile-popup')?.remove(); }
async function submitTFilePopup(projectId){
  const name = document.getElementById('tfile-name').value.trim();
  const description = document.getElementById('tfile-description').value.trim();
  const error = document.getElementById('tfile-popup-error');
  if(!name){ error.textContent = 'اكتب اسم T File أولاً'; return; }
  const response = await fetch(`/api/files/projects/${encodeURIComponent(projectId)}/t-files`, { method:'POST', headers:{'Content-Type':'application/json','X-User-Name':encodeURIComponent(SESSION?.name || 'system')}, body:JSON.stringify({name, description}) });
  if(!response.ok){ error.textContent = 'تعذر إنشاء T File'; return; }
  closeTFilePopup();
  await loadProjectFiles(projectId, true);
  renderEngineer();
  flashSave(true, 'تم إنشاء T File داخل المشروع');
}
function openRoundPopup(tFileId, projectId){
  const project = findCachedProject(projectId);
  const tFile = PROJECT_FILES[projectId]?.tFiles?.find(item => item.id === tFileId);
  if(!project || !tFile) return;
  document.getElementById('round-popup')?.remove();
  const popup = document.createElement('div');
  popup.id = 'round-popup';
  popup.className = 'modal-overlay';
  popup.innerHTML = `<div class="modal-box attachment-modal"><button class="popup-close" type="button" aria-label="إغلاق" onclick="closeRoundPopup()">×</button><h3>إضافة Round</h3><div class="popup-project-context"><span>سيتم إنشاء الجولة داخل T File</span><strong>${escapeHtml(tFile.name)}</strong><small>المشروع: ${escapeHtml(project.name || 'مشروع بدون اسم')} · Project ID: ${escapeHtml(project.id)}</small></div><div class="field"><label for="round-name">اسم Round</label><input id="round-name" type="text" placeholder="مثال: الجولة الأولى"></div><div class="field"><label for="round-description">الوصف</label><input id="round-description" type="text" placeholder="وصف اختياري للجولة"></div><div class="modal-error" id="round-popup-error"></div><div class="modal-actions"><button class="btn ghost" type="button" onclick="closeRoundPopup()">إلغاء</button><button class="btn primary" type="button" onclick="submitRoundPopup('${tFileId}','${projectId}')">إنشاء Round</button></div></div>`;
  document.body.appendChild(popup);
  document.getElementById('round-name').focus();
}
function closeRoundPopup(){ document.getElementById('round-popup')?.remove(); }
async function submitRoundPopup(tFileId, projectId){
  const name = document.getElementById('round-name').value.trim();
  const description = document.getElementById('round-description').value.trim();
  const error = document.getElementById('round-popup-error');
  if(!name){ error.textContent = 'اكتب اسم Round أولاً'; return; }
  const response = await fetch(`/api/files/t-files/${encodeURIComponent(tFileId)}/rounds`, { method:'POST', headers:{'Content-Type':'application/json','X-User-Name':encodeURIComponent(SESSION?.name || 'system')}, body:JSON.stringify({name, description}) });
  if(!response.ok){ error.textContent = 'تعذر إنشاء Round'; return; }
  closeRoundPopup();
  await loadProjectFiles(projectId, true);
  renderEngineer();
  flashSave(true, 'تم إنشاء Round داخل T File');
}
function uploadNewVersion(roundId, projectId){
  const input = document.createElement('input'); input.type='file'; input.accept='.xlsx,.xls,.pdf,.png'; input.onchange=async()=>{
    if(!input.files[0]) return; const body = new FormData(); body.append('file', input.files[0]);
    const response = await fetch(`/api/files/rounds/${encodeURIComponent(roundId)}/versions`, { method:'POST', body, headers:{'X-User-Name':encodeURIComponent(SESSION?.name || 'system')} });
    if(!response.ok) return flashSave(false, 'تعذر رفع النسخة الجديدة', 5000);
    await loadProjectFiles(projectId, true); renderEngineer();
  }; input.click();
}
async function markNotificationRead(id){
  if(!SESSION || SESSION.role !== 'engineer') return;
  const response = await fetch(`/api/notifications/${encodeURIComponent(SESSION.id)}/read/${id}`, { method:'POST' });
  if(!response.ok) throw new Error('notification read failed: ' + response.status);
  await loadNotifications();
  render();
}
async function markAllNotificationsRead(){
  if(!SESSION || SESSION.role !== 'engineer') return;
  const response = await fetch(`/api/notifications/${encodeURIComponent(SESSION.id)}/read`, { method:'POST' });
  if(!response.ok) throw new Error('notifications read failed: ' + response.status);
  await loadNotifications();
  render();
}

function fieldLabel(scope, id, fallback){
  const list = scope==='task' ? (DASH_CONFIG?.taskFields||[]) : scope==='customTask' ? (DASH_CONFIG?.customTaskFields||[]) : (DASH_CONFIG?.hasrFields||[]);
  return list.find(x=>x.id===id)?.label || fallback;
}
function outcomeLabel(id, fallback){
  return (DASH_CONFIG?.outcomes||[]).find(x=>x.id===id)?.label || fallback;
}
function newTaskState(defaultApplicable){
  return { status:false, review:false, applicable:!!defaultApplicable, dueDate:"", department:"", notes:"" };
}
function todayStr(){
  const d = new Date();
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function newProject(name){
  const tasks = {};
  TASKS.forEach(t=> tasks[t.id] = newTaskState(t.applicable));
  return { id:'p'+Date.now()+Math.floor(Math.random()*1000), name: name || DASH_CONFIG?.projectDefaults?.name || '', deliveryDate:DASH_CONFIG?.projectDefaults?.deliveryDate || '', inquiryDate:DASH_CONFIG?.projectDefaults?.inquiryDate || '', tasks, customTasks:[], hasrSynced:false, finished:false, outcome:null };
}
function blankEngineerData(){
  const proj = newProject('');
  return { lastSaved:null, activeProjectId: proj.id, projects:[proj] };
}
/* ============ IN-MEMORY UI CACHE (persistence is API/database only) ============ */
const cache = {};   // engId -> engineer data object
const dirty = {};   // engId -> bool
const autoSaveTimers = {}; // engId -> debounce timer
const HASR_CACHE = {}; // teamId -> array of {id, name, deliveryDate}  (for type:'hasr' teams — no tasks, just name+date)

async function loadHasrProjects(teamId){
  const res=await fetch('/api/dashboard/hasr/'+encodeURIComponent(teamId),{cache:'no-store'});
  if(!res.ok) throw new Error('Unable to load Hasr projects from the server (' + res.status + ')');
  HASR_CACHE[teamId]=await res.json();
  if(!Array.isArray(HASR_CACHE[teamId])) HASR_CACHE[teamId]=HASR_CACHE[teamId]?.items||[];
  const changed=normalizeHasrList(teamId); if(changed) await saveHasrProjects(teamId);
}
function normalizeHasrList(teamId){
  const list = HASR_CACHE[teamId] || [];
  let changed = false;
  list.forEach(item=>{ if(typeof item.hasrDone !== 'boolean'){ item.hasrDone = false; changed = true; } });
  list.forEach(item=>{ if(typeof item.hasrNotes !== 'string'){ item.hasrNotes = ''; changed = true; } });
  // de-duplicate rows that share the same id (can happen from an old race-condition bug) — keep the most informative one
  const seen = new Map();
  list.forEach(item=>{
    const prev = seen.get(item.id);
    if(!prev){ seen.set(item.id, item); return; }
    changed = true;
    let keep = prev;
    if(item.hasrDone && !prev.hasrDone) keep = item;
    else if(prev.hasWork===null && item.hasWork!==null) keep = item;
    seen.set(item.id, keep);
  });
  HASR_CACHE[teamId] = Array.from(seen.values());
  return changed;
}
function friendlyErrorMsg(e){
  const raw = (e && e.message) ? e.message : 'خطأ غير معروف';
  if(/rate limit/i.test(raw)) return 'الخادم مشغول مؤقتًا (تم تجاوز عدد المحاولات المسموح خلال فترة قصيرة). انتظر نصف دقيقة تقريبًا ثم اضغط الحفظ مرة أخرى.';
  return raw;
}
async function saveHasrProjects(teamId){
  try{ const res=await fetch('/api/dashboard/hasr/'+encodeURIComponent(teamId),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(HASR_CACHE[teamId]||[])}); if(!res.ok) throw new Error('hasr save failed: '+res.status); flashSave(true,'✓ تم الحفظ — أصبحت التحديثات مرئية للجميع'); return true; }
  catch(e){ console.error(e); flashSave(false,'فشل الحفظ: '+friendlyErrorMsg(e),6000); return false; }
}

async function loadEngineer(engId, force){
  if(cache[engId]&&!force) return cache[engId];
  const res=await fetch('/api/dashboard/engineers/'+encodeURIComponent(engId),{cache:'no-store'});
    if(!res.ok) throw new Error('Unable to load engineer data from the server (' + res.status + ')');
  cache[engId]=await res.json();
  normalizeEngineerData(cache[engId]);
  const savedProjectId = readActiveProjectId(engId);
  if(savedProjectId && cache[engId].projects.some(p=>p.id===savedProjectId)) cache[engId].activeProjectId = savedProjectId;
  return cache[engId];
}
function readActiveProjectId(engId){
  try{ return localStorage.getItem('tender-dashboard-active-project:' + engId) || ''; }catch(e){ return ''; }
}
function saveActiveProjectId(engId, projectId){
  try{ localStorage.setItem('tender-dashboard-active-project:' + engId, projectId); }catch(e){ /* storage may be unavailable */ }
}
function normalizeEngineerData(data){
  (data.projects||[]).forEach(p=>{
    if(!p.customTasks) p.customTasks = [];
    if(typeof p.hasrSynced !== 'boolean') p.hasrSynced = false;
    if(typeof p.finished !== 'boolean') p.finished = false;
    if(p.outcome !== 'won' && p.outcome !== 'lost') p.outcome = null;
    TASKS.forEach(t=>{
      const st = p.tasks ? p.tasks[t.id] : null;
      if(st && typeof st.notes !== 'string') st.notes = '';
    });
    p.customTasks.forEach(ct=>{ if(typeof ct.notes !== 'string') ct.notes = ''; });
  });
}
async function saveEngineer(engId){
  if(!cache[engId]) return false;
  const prev=cache[engId].lastSaved; cache[engId].lastSaved=new Date().toISOString();
  try{ await syncNewProjectsToHasr(engId); const res=await fetch('/api/dashboard/engineers/'+encodeURIComponent(engId),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(cache[engId])}); if(!res.ok) throw new Error('engineer save failed: '+res.status); dirty[engId]=false; flashSave(true,'✓ تم الحفظ — أصبحت التحديثات مرئية للجميع'); return true; }
  catch(e){ cache[engId].lastSaved=prev; console.error(e); flashSave(false,'فشل الحفظ: '+friendlyErrorMsg(e),6000); return false; }
}

/* ---- auto-sync every saved project into the "قسم الحصر" (Hasr) list for Milad ---- */
async function syncNewProjectsToHasr(engId){
  const data = cache[engId];
  const unsynced = (data.projects||[]).filter(p=>!p.hasrSynced);
  if(unsynced.length === 0) return;
  const hasrTeam = TEAMS.find(t=>t.type==='hasr');
  if(!hasrTeam){ unsynced.forEach(p=>p.hasrSynced=true); return; }
  const team = TEAMS.find(t=> t.engineers.some(e=>e.id===engId));
  const eng = team ? team.engineers.find(e=>e.id===engId) : null;

  let list = [];
  try{
    const res = await fetch('/api/dashboard/hasr/'+encodeURIComponent(hasrTeam.id), {cache:'no-store'});
    if(res.ok){ const value=await res.json(); list = Array.isArray(value) ? value : (value?.items || []); }
  }catch(e){ list = HASR_CACHE[hasrTeam.id] || []; }

  unsynced.forEach(p=>{
    const newId = 'sync_' + p.id;
    if(!list.some(x=>x.id===newId)){ // safeguard: never add the same project twice even under a race condition
      list.push({
        id: newId,
        name: p.name || 'مشروع بدون اسم',
        deliveryDate: p.deliveryDate || '',
        addedBy: eng ? eng.name : '',
        hasWork: null,      // لم يُحدد بعد — يقرر ميلاد
        hasrDueDate: '',
        hasrDone: false,    // تم الحصر والانتهاء من الأعمال أم لا — يحددها ميلاد
        hasrNotes: ''       // ملاحظات ميلاد على الحصر — تظهر للمهندس المسؤول عن المشروع
      });
    }
  });
  try{
    const saveResponse = await fetch('/api/dashboard/hasr/'+encodeURIComponent(hasrTeam.id), {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(list)});
    if(!saveResponse.ok) throw new Error('hasr auto-sync failed: ' + saveResponse.status);
    unsynced.forEach(p=>{ p.hasrSynced = true; });
    HASR_CACHE[hasrTeam.id] = list;
  }catch(e){ console.error('hasr auto-sync failed', e); }
}
function flashSave(success, message, duration){
  const el = document.getElementById('saveFlash');
  el.textContent = message || '✓ تم الحفظ — أصبحت التحديثات مرئية للجميع';
  el.style.borderColor = success===false ? 'var(--red)' : 'var(--green)';
  el.style.color = success===false ? 'var(--red)' : 'var(--green)';
  el.classList.add('show');
  clearTimeout(flashSave._t);
  flashSave._t = setTimeout(()=> el.classList.remove('show'), duration || (success===false ? 4000 : 1600));
}
function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }
// Load engineers ONE AT A TIME with a small gap between requests — a burst of many
// simultaneous storage.get calls (via Promise.all) is what was tripping the shared
// storage's short-window rate limit, even though the total call count seemed reasonable.
async function loadEngineersSequential(ids, force){
  for(const id of ids){
    try{ await loadEngineer(id, force); }catch(e){ /* keep going even if one fails */ }
    await sleep(150);
  }
}
async function loadAll(force){
  const all = [];
  TEAMS.forEach(t=> t.engineers.forEach(e=> all.push(e.id)));
  await loadEngineersSequential(all, force);
}
async function refreshAll(){
  await loadRoster();
  await loadAuth();
  if(SESSION) await loadScopedData(SESSION);
  render();
}

/* ============ TEAM ROSTER (add / rename engineers — shared across everyone) ============ */
async function loadRoster(){
  if(BOOTSTRAP && Array.isArray(BOOTSTRAP.teams)){
    TEAMS = BOOTSTRAP.teams;
    return;
  }
  try{
    const res = await fetch('/api/roster', { cache:'no-store' });
    if(!res.ok) throw new Error('Roster load failed: ' + res.status);
    const saved = await res.json();
    if(saved && Array.isArray(saved.teams) && saved.teams.length){
      TEAMS = saved.teams;
      return;
    }
    throw new Error('لم يتم العثور على الفرق في قاعدة البيانات');
  }catch(e){
    console.error('roster load failed', e);
    flashSave(false, 'تعذّر تحميل بيانات الفرق من قاعدة البيانات: ' + friendlyErrorMsg(e), 7000);
  }
}
async function saveRoster(){
  try{
    const res = await fetch('/api/roster', {
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ teams: TEAMS })
    });
    if(!res.ok) throw new Error('Roster save failed: ' + res.status);
    if(!res){ flashSave(false, 'فشل حفظ بيانات الفريق. حاول مرة أخرى.'); return false; }
    flashSave(true, '✓ تم حفظ تغييرات الفريق — أصبحت مرئية للجميع');
    return true;
  }catch(e){
    console.error('roster save failed', e);
    flashSave(false, 'فشل حفظ بيانات الفريق: ' + friendlyErrorMsg(e), 6000);
    return false;
  }
}
function toggleAddEngineer(teamId){
  state.addingEngineerTeam = (state.addingEngineerTeam === teamId) ? null : teamId;
  render();
}
async function createEngineer(teamId){
  const input = document.getElementById('ne-name-'+teamId);
  const name = input.value.trim();
  if(!name){ input.focus(); return; }
  const team = TEAMS.find(t=>t.id===teamId);
  const newId = teamId + 'e_' + Date.now().toString(36);
  team.engineers.push({id:newId, name, companyEmail:'', phoneNumber:'', employeeCode:'', photoData:null});
  state.addingEngineerTeam = null;
  await loadEngineer(newId); // seed blank data for the new engineer
  await saveRoster();
  render();
}
async function deleteEngineer(teamId, engId){
  const team = TEAMS.find(t=>t.id===teamId);
  const eng = team.engineers.find(e=>e.id===engId);
  if(!eng) return;
  showConfirmDialog({
    title: '🗑 حذف المهندس',
    message: `هل أنت متأكد من حذف "${eng.name}" من الفريق؟\nلن يظهر بعد الآن في اللوحة (بيانات مهامه المحفوظة سابقاً تبقى مخزنة ولا يمكنه الدخول بحسابه القديم).`,
    confirmText: 'حذف المهندس',
    onConfirm: async () => {
      team.engineers = team.engineers.filter(e=>e.id!==engId);
      delete cache[engId];
      delete dirty[engId];
      delete AUTH.engineers[engId];
      const ok = await saveRoster();
      await saveAuth();
      if(!ok){ flashSave(false, 'تعذّر حفظ التغيير، حاول مرة أخرى'); }
      render();
    }
  });
}

/* ---- department-manager team administration ---- */
const TEAM_PALETTE = () => (DASH_CONFIG?.teamPalette||[]).map(x=>x.value).filter(Boolean);

function requestMoveEngineer(engId, fromTeamId, toTeamId){
  if(!toTeamId || toTeamId===fromTeamId) return;
  const fromTeam = TEAMS.find(t=>t.id===fromTeamId);
  const toTeam = TEAMS.find(t=>t.id===toTeamId);
  const eng = fromTeam.engineers.find(e=>e.id===engId);
  if(!eng) return;
  showConfirmDialog({
    title: '↔ نقل المهندس',
    message: `هل تريد نقل "${eng.name}" من ${teamName(fromTeam)} إلى ${teamName(toTeam)}؟`,
    confirmText: 'نقل المهندس',
    onConfirm: async () => {
      fromTeam.engineers = fromTeam.engineers.filter(e=>e.id!==engId);
      toTeam.engineers.push(eng);
      const ok = await saveRoster();
      flashSave(ok, ok ? `✓ تم نقل "${eng.name}" إلى ${teamName(toTeam)}` : 'تعذّر حفظ النقل، حاول مرة أخرى');
      render();
    }
  });
}
async function moveEngineer(engId, fromTeamId, toTeamId){
  requestMoveEngineer(engId, fromTeamId, toTeamId);
}
async function promoteToManager(teamId, engId){
  const team = TEAMS.find(t=>t.id===teamId);
  const eng = team.engineers.find(e=>e.id===engId);
  if(!eng) return;
  showConfirmDialog({
    title: '⬆ تعيين مدير',
    message: `هل تريد تعيين "${eng.name}" مديراً ل${teamName(team)}؟ (سيظل أيضاً موجوداً كمهندس في الفريق)`,
    confirmText: 'تعيين مدير',
    onConfirm: async () => {
      team.manager = eng.name;
      const ok = await saveRoster();
      flashSave(ok, ok ? `✓ تم تعيين "${eng.name}" مديراً للفريق` : 'تعذّر الحفظ، حاول مرة أخرى');
      render();
    }
  });
}
function toggleEditManager(teamId){
  const team = TEAMS.find(t=>t.id===teamId);
  if(!team) return;
  showPromptDialog({
    title: '✎ تعديل مدير الفريق',
    label: 'اسم مدير الفريق',
    value: team.manager,
    inputId: 'modal-manager-name',
    confirmText: 'حفظ الاسم',
    validator: value => !!value.trim(),
    onConfirm: async (value) => {
      team.manager = value;
      const ok = await saveRoster();
      flashSave(ok, ok ? '✓ تم تحديث اسم مدير الفريق' : 'تعذّر الحفظ، حاول مرة أخرى');
      render();
    }
  });
}
async function confirmEditManager(teamId){
  toggleEditManager(teamId);
}
async function deleteTeam(teamId){
  const team = TEAMS.find(t=>t.id===teamId);
  if(!team) return;
  if(team.engineers.length > 0){
    flashSave(false, `لازم تنقل أو تحذف كل مهندسي ${teamName(team)} (${team.engineers.length}) قبل حذف الفريق نفسه.`, 5000);
    return;
  }
  showConfirmDialog({
    title: '🗑 حذف الفريق',
    message: `هل أنت متأكد من حذف ${teamName(team)} نهائياً؟`,
    confirmText: 'حذف الفريق',
    onConfirm: async () => {
      TEAMS = TEAMS.filter(t=>t.id!==teamId);
      delete AUTH.teams[teamId];
      const ok = await saveRoster();
      await saveAuth();
      flashSave(ok, ok ? '✓ تم حذف الفريق' : 'تعذّر الحفظ، حاول مرة أخرى');
      render();
    }
  });
}
function toggleCreateTeam(){
  state.creatingTeam = !state.creatingTeam;
  render();
}
async function createTeam(){
  const select = document.getElementById('nt-team-existing');
  const manualInput = document.getElementById('nt-team-manager');
  let managerName = manualInput.value.trim();
  if(!managerName && select.value) managerName = select.options[select.selectedIndex].text;
  if(!managerName){ manualInput.focus(); return; }
  const nums = TEAMS.map(t=>parseInt(t.id.slice(1))||0);
  const newNum = (nums.length ? Math.max(...nums) : 0) + 1;
  const newId = 't' + newNum;
  const palette=TEAM_PALETTE(); const color=palette.length?palette[(newNum-1)%palette.length]:null;
  TEAMS.push({ id:newId, color, manager: managerName, engineers: [] });
  state.creatingTeam = false;
  const ok = await saveRoster();
  flashSave(ok, ok ? `✓ تم إنشاء فريق ${newNum} — مدير الفريق: ${managerName}` : 'تعذّر الحفظ، حاول مرة أخرى');
  render();
}

function startRenameEngineer(engId){
  const team = TEAMS.find(t=> t.engineers.some(e=>e.id===engId));
  const eng = team ? team.engineers.find(e=>e.id===engId) : null;
  if(!eng) return;
  showPromptDialog({
    title: '✎ تعديل اسم المهندس',
    label: 'اسم المهندس',
    value: eng.name,
    inputId: 'modal-rename-engineer',
    confirmText: 'حفظ الاسم',
    validator: value => !!value.trim(),
    onConfirm: async (value) => {
      eng.name = value;
      state.renamingEngineer = null;
      await saveRoster();
      renderEngineer();
    }
  });
}
async function confirmRenameEngineer(engId){
  startRenameEngineer(engId);
}
function cancelRenameEngineer(){
  state.renamingEngineer = null;
  renderEngineer();
}

/* ============ AUTH (per-role passwords — engineer / team manager / department manager) ============ */
// NOTE: this is a soft access-gate suitable for keeping honest teammates in their own lane.
// It is NOT real security — anyone with browser dev-tools access to this page can bypass it
// and read the underlying shared storage directly. Don't rely on it for confidential data.
let AUTH = { engineers:{}, teams:{}, dept:null };
let SESSION = null; // {role:'engineer'|'team'|'dept', id, name}
const SESSION_STORAGE_KEY = 'tender-dashboard-session';

function saveSession(role, id){
  try{ localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ role, id })); }catch(e){ console.warn('Could not persist session:', e); }
}
function clearSavedSession(){
  try{ localStorage.removeItem(SESSION_STORAGE_KEY); }catch(e){ console.warn('Could not clear saved session:', e); }
}
function readSavedSession(){
  try{
    const value = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || 'null');
    if(!value || !['engineer','team','dept'].includes(value.role) || !value.id) return null;
    return value;
  }catch(e){
    clearSavedSession();
    return null;
  }
}

async function hashPassword(pw){
  const res = await fetch('/api/dashboard/auth/hash', {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({password:pw})
  });
  if(!res.ok) throw new Error('تعذّر التحقق من كلمة المرور عبر الخادم');
  const result = await res.json();
  if(!result.hash) throw new Error('لم يُرجع الخادم رمز التحقق');
  return result.hash;
}
async function loadAuth(){
  const res=await fetch('/api/dashboard/auth',{cache:'no-store'});
  if(!res.ok) throw new Error('Unable to load sign-in data from the server (' + res.status + ')');
  AUTH=await res.json();
}
async function saveAuth(){
  try{ const res=await fetch('/api/dashboard/auth',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(AUTH)}); if(!res.ok) throw new Error('auth save failed'); return true; }catch(e){ console.error(e); flashSave(false,'فشل حفظ كلمة المرور: '+friendlyErrorMsg(e),6000); return false; }
}
function authHashFor(role, id){
  if(role==='dept') return AUTH.dept;
  if(role==='team') return AUTH.teams[id];
  return AUTH.engineers[id];
}
function setAuthHash(role, id, hash){
  if(role==='dept') AUTH.dept = hash;
  else if(role==='team') AUTH.teams[id] = hash;
  else AUTH.engineers[id] = hash;
}

async function loadScopedData(session){
  Object.keys(cache).forEach(k=>delete cache[k]);
  // hasr (قسم الحصر) data is loaded for everyone, so any engineer/team can see the live hasr status
  await Promise.all(TEAMS.filter(t=>t.type==='hasr').map(t=>loadHasrProjects(t.id)));
  if(session.role === 'dept'){
    await loadAll();
  } else if(session.role === 'team'){
    const team = TEAMS.find(t=>t.id===session.id);
    if(team.type==='hasr'){
      // already loaded above
    } else {
      await loadEngineersSequential(team.engineers.map(e=>e.id));
    }
  } else if(session.role === 'engineer'){
    await loadEngineer(session.id);
  }
}

function openPwModal(){
  if(!SESSION) return;
  document.getElementById('pw-old').value = '';
  document.getElementById('pw-new1').value = '';
  document.getElementById('pw-new2').value = '';
  document.getElementById('pw-error').textContent = '';
  document.getElementById('pwModal').classList.remove('hidden');
}
function closePwModal(){
  document.getElementById('pwModal').classList.add('hidden');
}
async function submitChangePassword(){
  const errEl = document.getElementById('pw-error');
  errEl.textContent = '';
  const oldPass = document.getElementById('pw-old').value;
  const new1 = document.getElementById('pw-new1').value;
  const new2 = document.getElementById('pw-new2').value;

  const currentHash = authHashFor(SESSION.role, SESSION.id);
  if(currentHash){
    const oldHash = await hashPassword(oldPass);
    if(oldHash !== currentHash){ errEl.textContent = 'كلمة المرور الحالية غير صحيحة'; return; }
  }
  if(!new1 || new1.length < 4){ errEl.textContent = 'كلمة المرور الجديدة لازم تكون 4 حروف/أرقام على الأقل'; return; }
  if(new1 !== new2){ errEl.textContent = 'كلمتا المرور الجديدتان غير متطابقتين'; return; }

  const newHash = await hashPassword(new1);
  setAuthHash(SESSION.role, SESSION.id, newHash);
  const ok = await saveAuth();
  if(!ok){ errEl.textContent = 'تعذّر الحفظ، حاول مرة أخرى'; return; }
  closePwModal();
  flashSave(true, '✓ تم تغيير كلمة المرور بنجاح');
}

function startLogin(){
  state.screen = 'login';
  state.loginRole = 'engineer';
  state.loginId = null;
  state.loginError = '';
  state.loginMode = null;
  state.forgotFlow = false;
  render();
}
function pickLoginRole(role){
  state.loginRole = role;
  state.loginId = (role==='dept') ? 'dept' : null;
  state.loginError = '';
  state.forgotFlow = false;
  render();
}
function pickLoginId(id){
  state.loginId = id;
  state.loginError = '';
  state.forgotFlow = false;
  render();
}
function closeLoginPassword(){
  state.loginId = null;
  state.loginError = '';
  state.forgotFlow = false;
  render();
}
async function submitLogin(){
  try{
  const role = state.loginRole;
  const id = state.loginId;
  if(!id){ state.loginError = 'من فضلك اختر الاسم أولاً'; render(); return; }
  const existingHash = authHashFor(role, id);
  if(!existingHash){
    // first time — set a new password
    const p1 = document.getElementById('lg-pass1').value;
    const p2 = document.getElementById('lg-pass2').value;
    if(!p1 || p1.length < 4){ state.loginError = 'كلمة المرور لازم تكون 4 حروف/أرقام على الأقل'; render(); return; }
    if(p1 !== p2){ state.loginError = 'كلمتا المرور غير متطابقتين'; render(); return; }
    const hash = await hashPassword(p1);
    setAuthHash(role, id, hash);
    const ok = await saveAuth();
    if(!ok){ state.loginError = 'تعذّر حفظ كلمة المرور، حاول مرة أخرى'; render(); return; }
    await completeLogin(role, id);
  } else {
    const p = document.getElementById('lg-pass1').value;
    const hash = await hashPassword(p);
    if(hash !== existingHash){ state.loginError = 'كلمة المرور غير صحيحة'; render(); return; }
    await completeLogin(role, id);
  }
  }catch(e){
    console.error('sign-in failed', e);
    state.loginError = 'تعذّر تنفيذ تسجيل الدخول. تأكد من اتصال الخادم ثم حاول مرة أخرى.';
    render();
  }
}
async function completeLogin(role, id){
  let name = DEPT_MANAGER;
  if(role==='team'){ name = TEAMS.find(t=>t.id===id).manager; }
  if(role==='engineer'){
    const team = TEAMS.find(t=> t.engineers.some(e=>e.id===id));
    name = team.engineers.find(e=>e.id===id).name;
  }
  SESSION = { role, id, name };
  saveSession(role, id);
  await loadScopedData(SESSION);
  await loadNotifications();
  startAutoRefresh();
  if(role==='dept'){ go('home'); }
  else if(role==='team'){
    const team = TEAMS.find(t=>t.id===id);
    if(team.type==='hasr'){ go('hasrHome', {teamId:id}); }
    else { go('teamHome', {teamId:id}); }
  }
  else { openEngineer(id, null); }
}

let autoRefreshTimer = null;
let autoRefreshTick = 0;
let sessionGeneration = 0;
function startAutoRefresh(){
  stopAutoRefresh();
  autoRefreshTick = 0;
  autoRefreshTimer = setInterval(async ()=>{
    if(!SESSION) return;
    const generation = sessionGeneration;
    const hasUnsavedEdits = Object.values(dirty).some(v=>v);
    if(hasUnsavedEdits) return; // never clobber someone's in-progress, unsaved edits
    // never blow away an open "add project / add task / rename" form, or whatever the user is actively typing in right now
    if(state.addingProject || state.addingTask || state.addingEngineerTeam || state.renamingEngineer) return;
    const active = document.activeElement;
    const appEl = document.getElementById('app');
    const userIsTyping = active && ['INPUT','TEXTAREA'].includes(active.tagName) && appEl && appEl.contains(active);
    if(userIsTyping) return;
    autoRefreshTick++;
    try{
      // roster/auth barely change — refresh them only every 3rd tick instead of every tick
      if(autoRefreshTick % 3 === 0){ await loadRoster(); await sleep(150); await loadAuth(); await sleep(150); }
      await refreshRelevantDataOnly();
      if(!SESSION || generation !== sessionGeneration) return;
      render();
    }catch(e){ /* silent — next tick will retry, and if it's a rate limit it will clear itself */ }
  }, 30000); // spaced out well beyond the shared storage's short-window rate limit
}
// Only re-fetch the slice of data the current screen actually needs, instead of reloading every
// engineer in the company on every tick — that was firing far too many storage calls and tripping
// the "Message rate limit exceeded" error. Loads happen ONE AT A TIME (never Promise.all-bursted).
async function refreshRelevantDataOnly(){
  await loadNotifications();
  await Promise.all(TEAMS.filter(t=>t.type==='hasr').map(t=>loadHasrProjects(t.id))); // small & shared — always keep fresh

  if(SESSION.role === 'engineer'){
    await loadEngineer(SESSION.id, true);
    return;
  }
  if(SESSION.role === 'team'){
    const team = TEAMS.find(t=>t.id===SESSION.id);
    if(team.type==='hasr') return; // already refreshed above
    if(state.screen==='engineer' && state.engId){
      await loadEngineer(state.engId, true);
    } else {
      await loadEngineersSequential(team.engineers.map(e=>e.id), true);
    }
    return;
  }
  // dept role
  if(state.screen==='engineer' && state.engId){
    await loadEngineer(state.engId, true);
  } else if((state.screen==='teamDetail' || state.screen==='teamHome') && state.teamId){
    const team = TEAMS.find(t=>t.id===state.teamId);
    if(team) await loadEngineersSequential(team.engineers.map(e=>e.id), true);
  } else if(['teams','engineerPicker','projects','diagrams','home'].includes(state.screen)){
    await loadAll(true); // these screens genuinely need the full company picture
  }
  // other screens (login, manageTeams, hasrHome, etc.) need no extra engineer reload here
}
function stopAutoRefresh(){
  if(autoRefreshTimer){ clearInterval(autoRefreshTimer); autoRefreshTimer = null; }
}
function logout(){
  stopAutoRefresh();
  sessionGeneration++;
  clearSavedSession();
  SESSION = null;
  NOTIFICATION_IDS = new Set();
  NOTIFICATIONS_READY = false;
  NOTIFICATIONS = { unread: 0, items: [] };
  Object.keys(cache).forEach(k=>delete cache[k]);
  state.screen = 'login';
  state.loginRole = 'engineer';
  state.loginId = null;
  state.loginError = '';
  state.forgotFlow = false;
  render();
}
function forgotPassword(){
  state.forgotFlow = true;
  state.loginError = '';
  render();
}
async function resetViaDeptPassword(){
  const deptPass = document.getElementById('fp-dept-pass').value;
  const hash = await hashPassword(deptPass);
  if(!AUTH.dept || hash !== AUTH.dept){ state.loginError = 'كلمة مرور مدير القسم غير صحيحة'; render(); return; }
  setAuthHash(state.loginRole, state.loginId, null);
  delete (state.loginRole==='team' ? AUTH.teams : AUTH.engineers)[state.loginId];
  await saveAuth();
  state.forgotFlow = false;
  state.loginError = '';
  flashSave(true, '✓ تم إلغاء كلمة المرور القديمة — أدخل كلمة مرور جديدة الآن');
  render();
}

/* ============ STATS ============ */
function projectStats(project){
  let done=0,total=0;
  TASKS.forEach(t=>{
    const st = project.tasks[t.id];
    if(st && st.applicable){ total++; if(st.status) done++; }
  });
  (project.customTasks||[]).forEach(ct=>{
    if(ct.applicable){ total++; if(ct.status) done++; }
  });
  const pct = total ? Math.round((done/total)*1000)/10 : 0;
  return { done, total, remaining: total-done, pct };
}
function engineerStats(engId){
  const data = cache[engId];
  if(!data) return {done:0,total:0,remaining:0,pct:0};
  let done=0, total=0;
  data.projects.forEach(p=>{ const s = projectStats(p); done+=s.done; total+=s.total; });
  const pct = total ? Math.round((done/total)*1000)/10 : 0;
  return { done, total, remaining: total-done, pct };
}
/* ---- project count / finished / won / lost summary for an engineer ---- */
function engineerProjectSummary(engId){
  const data = cache[engId];
  if(!data) return { totalProjects:0, finished:0, ongoing:0, won:0, lost:0 };
  const projects = data.projects || [];
  const finished = projects.filter(p=>p.finished);
  const won = finished.filter(p=>p.outcome==='won').length;
  const lost = finished.filter(p=>p.outcome==='lost').length;
  return { totalProjects: projects.length, finished: finished.length, ongoing: projects.length-finished.length, won, lost };
}
function teamProjectSummary(team){
  const acc = { totalProjects:0, finished:0, ongoing:0, won:0, lost:0 };
  team.engineers.forEach(e=>{
    const s = engineerProjectSummary(e.id);
    acc.totalProjects += s.totalProjects; acc.finished += s.finished; acc.ongoing += s.ongoing;
    acc.won += s.won; acc.lost += s.lost;
  });
  return acc;
}
function companyProjectSummary(){
  const acc = { totalProjects:0, finished:0, ongoing:0, won:0, lost:0 };
  mainTeams().forEach(t=>{
    const s = teamProjectSummary(t);
    acc.totalProjects += s.totalProjects; acc.finished += s.finished; acc.ongoing += s.ongoing;
    acc.won += s.won; acc.lost += s.lost;
  });
  return acc;
}
function teamStats(team){
  let done=0, total=0;
  team.engineers.forEach(e=>{ const s = engineerStats(e.id); done+=s.done; total+=s.total; });
  const pct = total ? Math.round((done/total)*1000)/10 : 0;
  return { done, total, remaining: total-done, pct };
}
function companyStats(){
  let done=0,total=0;
  mainTeams().forEach(t=>{ const s = teamStats(t); done+=s.done; total+=s.total; });
  const pct = total ? Math.round((done/total)*1000)/10 : 0;
  return { done, total, remaining: total-done, pct };
}
function pctClass(pct){ return pct>=70?'high':(pct>=35?'mid':''); }

/* ---- hasr status for a given project (shown to the engineer) ---- */
function hasrStatusForProject(projectId){
  const hasrTeam = TEAMS.find(t=>t.type==='hasr');
  if(!hasrTeam) return null;
  const list = HASR_CACHE[hasrTeam.id] || [];
  const item = list.find(x=>x.id === 'sync_'+projectId);
  if(!item) return { cls:'st-undecided', icon:'⏳', label:'حالة الحصر', text:'لسه المشروع مبيتزامنش مع قسم الحصر — احفظ التغييرات أولاً' };
  if(item.hasWork === null || item.hasWork === undefined){
    return { cls:'st-undecided', icon:'⏳', label:'حالة الحصر', text:'لم يُحدد بعد — في انتظار قسم الحصر (ميلاد)', notes: item.hasrNotes||'' };
  }
  if(item.hasWork === false){
    return { cls:'st-nowork', icon:'✗', label:'حالة الحصر', text:'لا يوجد عمل حصر لهذا المشروع', notes: item.hasrNotes||'' };
  }
  if(item.hasrDone){
    return { cls:'st-done', icon:'✅', label:'حالة الحصر', text:'تم الحصر والانتهاء من الأعمال', notes: item.hasrNotes||'' };
  }
  let progressText = 'جاري العمل على الحصر';
  if(item.hasrDueDate){
    const d = new Date(item.hasrDueDate);
    const formatted = d.toLocaleDateString('ar-EG', {day:'numeric', month:'long', year:'numeric'});
    progressText += ` — ميعاد تسليم الحصر: ${formatted}`;
  }
  return { cls:'st-inprogress', icon:'🔧', label:'حالة الحصر', text: progressText, notes: item.hasrNotes||'' };
}

function getAllProjects(teamFilterFn){
  const filterFn = teamFilterFn || (t => (t.division||'main') === 'main');
  const list = [];
  TEAMS.filter(filterFn).forEach(t=>{
    t.engineers.forEach(e=>{
      const data = cache[e.id];
      if(!data) return;
      data.projects.forEach(p=>{
        list.push({ team:t, eng:e, project:p, stats: projectStats(p) });
      });
    });
  });
  list.sort((a,b)=>{
    const da = a.project.deliveryDate, db = b.project.deliveryDate;
    if(!da && !db) return 0;
    if(!da) return 1;
    if(!db) return -1;
    return new Date(da) - new Date(db);
  });
  return list;
}
function daysLeftInfo(dateStr){
  if(!dateStr) return { text:'بدون موعد', cls:'' };
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(dateStr); target.setHours(0,0,0,0);
  const diff = Math.round((target-today)/86400000);
  if(diff < 0) return { text:`متأخر ${Math.abs(diff)} يوم`, cls:'remain' };
  if(diff === 0) return { text:'اليوم', cls:'remain' };
  if(diff <= 3) return { text:`باقي ${diff} يوم`, cls:'pct' };
  return { text:`باقي ${diff} يوم`, cls:'done' };
}
function projectRowHTML(rank, project, stats, subLabel, onClickJs){
  const di = daysLeftInfo(project.deliveryDate);
  const hasDate = !!project.deliveryDate;
  const d = hasDate ? new Date(project.deliveryDate) : null;
  const dayNum = hasDate ? d.toLocaleDateString('ar-EG', {day:'numeric'}) : '—';
  const monLabel = hasDate ? d.toLocaleDateString('ar-EG', {month:'short', year:'numeric'}) : 'بدون موعد';
  const badgeColor = di.cls==='remain' ? 'var(--red)' : (di.cls==='pct' ? 'var(--amber)' : 'var(--green)');
  const outcomeBadge = project.finished
    ? (project.outcome==='won'
        ? `<div class="p-badge" style="color:var(--green); border-color:var(--green);">🏆 فوز</div>`
        : project.outcome==='lost'
          ? `<div class="p-badge" style="color:var(--red); border-color:var(--red);">✗ خسارة</div>`
          : `<div class="p-badge" style="color:var(--ink-dim); border-color:var(--line-strong);">☑ منتهي</div>`)
    : '';
  return `
    <div class="project-row" onclick="${onClickJs}">
      <div class="p-rank">${rank}</div>
      <div class="date-block">
        <div class="day">${dayNum}</div>
        <div class="mon">${monLabel}</div>
      </div>
      <div class="p-info">
        <h4>${project.name || 'مشروع بدون اسم'}</h4>
        ${subLabel ? `<div class="sub">${subLabel}</div>` : ''}
      </div>
      <div class="p-progress">
        <div class="bar-track"><div class="bar-fill" style="width:${stats.pct}%"></div></div>
        <div class="p-pct">${stats.done}/${stats.total} مهمة · ${stats.pct}%</div>
      </div>
      ${outcomeBadge}
      <div class="p-badge" style="color:${badgeColor}; border-color:${badgeColor};">${di.text}</div>
    </div>`;
}
function engFromLabel(from, team){
  if(from==='teamDetail') return 'أداء الفريق / ' + teamName(team);
  if(from==='projects') return 'المشاريع الجارية';
  if(from==='teamHome') return 'لوحة الفريق';
  return 'اختيار مهندس';
}

function timeAgo(iso){
  if(!iso) return 'لم يُحفظ بعد';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs/60000);
  if(mins < 1) return 'الآن';
  if(mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.floor(mins/60);
  if(hrs < 24) return `منذ ${hrs} ساعة`;
  const days = Math.floor(hrs/24);
  return `منذ ${days} يوم`;
}

/* ============ NAV STATE ============ */
const state = { screen:'login', teamId:null, engId:null, engFrom:null, teamDetailFrom:null, addingProject:false, addingEngineerTeam:null, renamingEngineer:null, addingTask:false, loginRole:'engineer', loginId:null, loginError:'', forgotFlow:false, editingManagerTeam:null, creatingTeam:false, modal:null };
const FIELD_EDITOR = { task: [], customTask: [], hasr: [] };
function go(screen, extra={}){
  Object.assign(state, {screen}, extra);
  render();
  window.scrollTo({top:0, behavior:'smooth'});
}
function closeModal(){
  state.modal = null;
  render();
}
function showConfirmDialog({ title, message, confirmText='تأكيد', confirmClass='danger', onConfirm }){
  state.modal = { type:'confirm', title, message, confirmText, confirmClass, onConfirm };
  render();
}
function showPromptDialog({ title, label, value='', confirmText='حفظ', inputId='modalPromptInput', onConfirm, validator }){
  state.modal = { type:'prompt', title, label, value, confirmText, inputId, onConfirm, validator };
  render();
}
function submitModalAction(){
  if(!state.modal) return;
  if(state.modal.type === 'prompt'){
    const input = document.getElementById(state.modal.inputId);
    const value = input ? input.value.trim() : '';
    if(state.modal.validator && !state.modal.validator(value)){
      input && input.focus();
      return;
    }
    if(typeof state.modal.onConfirm === 'function') state.modal.onConfirm(value);
  } else if(typeof state.modal.onConfirm === 'function'){
    state.modal.onConfirm();
  }
  state.modal = null;
  render();
}
function renderModalOverlay(){
  if(!app) return;

  const existing = document.querySelector('.runtime-modal-overlay');
  if(existing) existing.remove();

  if(!state.modal) return;

  const modal = state.modal;
  const promptMarkup = modal.type === 'prompt' ? `
    <div class="field">
      <label>${modal.label}</label>
      <input type="text" id="${modal.inputId}" value="${(modal.value || '').replace(/"/g,'&quot;')}" placeholder="اكتب القيمة هنا">
    </div>` : '';
  const confirmClass = modal.confirmClass === 'primary' ? 'btn primary' : 'btn ghost';
  const dialogMessage = modal.detailsMessage || modal.message;
  const bodyMarkup = dialogMessage ? `<p style="margin:0; color:var(--ink-dim); text-align:center; line-height:1.8;">${dialogMessage}</p>` : '';
  app.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay runtime-modal-overlay" style="display:flex; position:fixed; inset:0; z-index:50; background:rgba(8,20,30,.72);">
      <div class="modal-box" style="max-width:${modal.type === 'prompt' ? '480px' : '420px'}; width:min(92vw,${modal.type === 'prompt' ? '480px' : '420px'});">
        <h3>${modal.title}</h3>
        ${bodyMarkup}
        ${promptMarkup}
        <div class="modal-actions">
          <button class="btn ghost" onclick="closeModal()">إلغاء</button>
          <button class="${confirmClass}" onclick="submitModalAction()">${modal.confirmText}</button>
        </div>
      </div>
    </div>
  `);
}
function back(){
  if(SESSION && SESSION.role==='engineer'){ return; }
  if(state.screen==='engineer'){
    if(SESSION && SESSION.role==='team'){ go('teamHome'); return; }
    go(state.engFrom || 'teams'); return;
  }
  if(state.screen==='teamHome'){ return; }
  if(state.screen==='hasrHome'){
    if(SESSION && SESSION.role==='team'){ return; }
    go('home'); return;
  }
  if(state.screen==='teamDetail'){ go(state.teamDetailFrom || 'teams'); return; }
  if(state.screen==='engineerPicker'){ go('home'); return; }
  if(state.screen==='teams'){ go('home'); return; }
  if(state.screen==='manageTeams'){ go('teams'); return; }
  if(state.screen==='diagrams'){ go('home'); return; }
  if(state.screen==='projects'){ go('home'); return; }
  if(state.screen==='profile'){ go('engineer'); return; }
  if(state.screen==='archives'){ go('home'); return; }
  if(state.screen==='emailSettings'){ go('home'); return; }
  go('home');
}

/* ============ RENDER ============ */
const app = document.getElementById('app');

function renderCompanyStrip(){
  const roleLabelEl = document.getElementById('deptRoleLabel');
  const nameEl = document.getElementById('deptManagerName');
  const userBox = document.querySelector('.tb-dept');
  const stripEl = document.getElementById('companyStrip');
  if(!SESSION){
    if(userBox) userBox.innerHTML = '<span id="deptRoleLabel">تسجيل الدخول</span><b id="deptManagerName">—</b>';
    else {
      if(roleLabelEl) roleLabelEl.textContent = 'تسجيل الدخول';
      if(nameEl) nameEl.textContent = '—';
    }
    if(stripEl) stripEl.innerHTML = '';
    return;
  }
  const roleLabel = SESSION.role==='dept' ? 'مدير القسم' : (SESSION.role==='team' ? 'مدير الفريق' : 'المهندس');
  const userEngineer = SESSION.role === 'engineer' ? TEAMS.flatMap(team => team.engineers).find(engineer => engineer.id === SESSION.id) : null;
  const photo = safePhotoData(userEngineer?.photoData);
  const avatar = photo ? `<img src="${photo}" alt="${escapeHtml(SESSION.name)}">` : '<span>👤</span>';
  if(userBox) userBox.innerHTML = `<button class="header-profile" type="button" onclick="go('profile')" title="فتح البروفايل"><span class="header-profile-avatar">${avatar}</span><span class="header-profile-copy"><small>${roleLabel}</small><strong>${escapeHtml(SESSION.name || 'المستخدم')}</strong></span><span class="header-profile-arrow">‹</span></button>`;

  if(SESSION.role==='dept'){
    const s = companyStats();
    const projCount = getAllProjects().length;
    stripEl.innerHTML = `
      <div class="tb-cell"><div class="k">إجمالي الفرق</div><div class="v">${mainTeams().length}</div></div>
      <div class="tb-cell"><div class="k">إجمالي المهندسين</div><div class="v">${mainTeams().reduce((a,t)=>a+t.engineers.length,0)}</div></div>
      <div class="tb-cell pct"><div class="k">مشاريع تحت الدراسة</div><div class="v">${projCount}</div></div>
      <div class="tb-cell done"><div class="k">مهام منجزة (كل الشركة)</div><div class="v">${s.done}</div></div>
      <div class="tb-cell remain"><div class="k">مهام متبقية</div><div class="v">${s.remaining}</div></div>
      <div class="tb-cell pct"><div class="k">نسبة الإنجاز العامة</div><div class="v">${s.pct}%</div></div>
    `;
  } else if(SESSION.role==='team'){
    const team = TEAMS.find(t=>t.id===SESSION.id);
    const s = teamStats(team);
    const projCount = getAllProjects(t=>t.id===team.id).length;
    stripEl.innerHTML = `
      <div class="tb-cell"><div class="k">الفريق</div><div class="v">${teamName(team)}</div></div>
      <div class="tb-cell"><div class="k">عدد المهندسين</div><div class="v">${team.engineers.length}</div></div>
      <div class="tb-cell pct"><div class="k">مشاريع الفريق</div><div class="v">${projCount}</div></div>
      <div class="tb-cell done"><div class="k">مهام منجزة</div><div class="v">${s.done}</div></div>
      <div class="tb-cell remain"><div class="k">مهام متبقية</div><div class="v">${s.remaining}</div></div>
      <div class="tb-cell pct"><div class="k">نسبة إنجاز الفريق</div><div class="v">${s.pct}%</div></div>
    `;
  } else {
    const s = engineerStats(SESSION.id);
    const projCount = (cache[SESSION.id] && cache[SESSION.id].projects) ? cache[SESSION.id].projects.length : 0;
    stripEl.innerHTML = `
      <div class="tb-cell"><div class="k">مرحباً بك</div><div class="v">${SESSION.name}</div></div>
      <div class="tb-cell pct"><div class="k">مشاريعي</div><div class="v">${projCount}</div></div>
      <div class="tb-cell done"><div class="k">مهام منجزة</div><div class="v">${s.done}</div></div>
      <div class="tb-cell remain"><div class="k">مهام متبقية</div><div class="v">${s.remaining}</div></div>
      <div class="tb-cell pct"><div class="k">نسبة إنجازك</div><div class="v">${s.pct}%</div></div>
    `;
  }
}

function crumbHTML(pathHTML, showRefresh){
  const showBack = !(SESSION && (SESSION.role==='engineer' || (SESSION.role==='team' && ['teamHome','hasrHome'].includes(state.screen))));
  const myTasksBtn = SESSION && SESSION.role === 'engineer'
    ? `<button onclick="renderMyTasks()">${state.screen === 'myTasks' ? '👤 مهامي الحالية' : '👤 مهامي'}</button>`
    : '';
  return `<div class="crumb">
    <div class="left">
      ${showBack ? `<button onclick="back()">→ رجوع</button>` : ''}
      <div class="path">${pathHTML}</div>
    </div>
    <div style="display:flex; gap:8px; flex-wrap:wrap;">
      ${showRefresh ? `<button onclick="refreshAll()">🔄 تحديث البيانات</button>` : ''}
      ${myTasksBtn}
      ${SESSION ? `<button onclick="go('profile')">👤 البروفايل</button>` : ''}
      ${SESSION ? `<button onclick="openPwModal()">🔑 تغيير كلمة المرور</button>` : ''}
      ${SESSION && SESSION.role==='engineer' ? `<button onclick="go('notifications')">🔔 الإشعارات${NOTIFICATIONS.unread ? ` (${NOTIFICATIONS.unread})` : ''}</button>` : ''}
      ${SESSION ? `<button onclick="logout()">🚪 تسجيل خروج</button>` : ''}
    </div>
  </div>`;
}

function enforceAccess(){
  if(!SESSION){ state.screen = 'login'; return; }
  if(SESSION.role === 'engineer'){
    if(!['engineer','profile','notifications'].includes(state.screen) || state.engId !== SESSION.id){
      state.screen = 'engineer'; state.engId = SESSION.id; state.engFrom = null;
    }
  } else if(SESSION.role === 'team'){
    const team = TEAMS.find(t=>t.id===SESSION.id);
    if(team.type==='hasr'){
      if(state.screen !== 'hasrHome'){ state.screen = 'hasrHome'; state.teamId = SESSION.id; }
    } else {
      const allowed = state.screen==='teamHome' || (state.screen==='engineer' && team.engineers.some(e=>e.id===state.engId));
      if(!allowed){ state.screen = 'teamHome'; state.teamId = SESSION.id; }
    }
  }
  // dept role: unrestricted
}

function renderLogin(){
  const roleTabs = `
    <div class="login-tabs">
      <button class="login-tab ${state.loginRole==='engineer'?'active':''}" onclick="pickLoginRole('engineer')">🧑‍💻 مهندس</button>
      <button class="login-tab ${state.loginRole==='team'?'active':''}" onclick="pickLoginRole('team')">🏆 مدير فريق</button>
      <button class="login-tab ${state.loginRole==='dept'?'active':''}" onclick="pickLoginRole('dept')">🗂 مدير القسم</button>
    </div>`;

  let idPicker = '';
  if(state.loginRole==='engineer'){
    idPicker = TEAMS.filter(t=>t.engineers.length>0).map(t=>`
      <div class="login-group">
        <div class="login-group-title">${teamName(t)} — ${t.manager}</div>
        <div class="login-id-grid">
          ${t.engineers.map(e=>`<button class="login-id-btn ${state.loginId===e.id?'active':''}" onclick="pickLoginId('${e.id}')"><span class="login-engineer-option">${employeePhotoHTML(e, false)}<span>${e.name}</span></span></button>`).join('')}
        </div>
      </div>`).join('');
  } else if(state.loginRole==='team'){
    idPicker = `<div class="login-id-grid">
      ${TEAMS.map(t=>`<button class="login-id-btn ${state.loginId===t.id?'active':''}" onclick="pickLoginId('${t.id}')">${teamName(t)} — ${t.manager}</button>`).join('')}
    </div>`;
  } else {
    idPicker = `<div class="login-id-grid"><button class="login-id-btn ${state.loginId==='dept'?'active':''}" onclick="pickLoginId('dept')">مدير القسم — ${DEPT_MANAGER}</button></div>`;
  }

  let passPanel = '';
  if(state.loginId){
    const hasHash = !!authHashFor(state.loginRole, state.loginId);
    const selectedName = state.loginRole === 'dept'
      ? DEPT_MANAGER
      : state.loginRole === 'team'
        ? TEAMS.find(t=>t.id===state.loginId)?.manager
        : TEAMS.flatMap(t=>t.engineers).find(e=>e.id===state.loginId)?.name;
    const loginError = state.loginError ? `<p style="color:var(--red); text-align:center; margin:0; font-size:.85rem;">⚠ ${state.loginError}</p>` : '';
    if(state.forgotFlow){
      passPanel = `
        <div class="modal-overlay login-password-overlay">
          <div class="modal-box login-password-modal">
          <h3>استرجاع كلمة المرور</h3>
          <p class="login-selected-user">${selectedName || ''}</p>
          <p style="color:var(--ink-dim); font-size:.82rem; margin:0;">استرجاع كلمة المرور يحتاج تأكيد كلمة مرور مدير القسم.</p>
          <div class="field"><label>كلمة مرور مدير القسم</label><input type="password" id="fp-dept-pass"></div>
          <button class="btn primary" onclick="resetViaDeptPassword()">تأكيد وإعادة التعيين</button>
          ${loginError}
          <button class="btn ghost" onclick="closeLoginPassword()">إلغاء</button>
          </div>
        </div>`;
    } else if(!hasHash){
      passPanel = `
        <div class="modal-overlay login-password-overlay">
          <div class="modal-box login-password-modal">
          <h3>إنشاء كلمة المرور</h3>
          <p class="login-selected-user">${selectedName || ''}</p>
          <p style="color:var(--teal); font-size:.82rem; margin:0;">أول دخول لهذا الحساب — اختر كلمة مرور جديدة (4 حروف/أرقام على الأقل).</p>
          <div class="field"><label>كلمة المرور الجديدة</label><input type="password" id="lg-pass1"></div>
          <div class="field"><label>تأكيد كلمة المرور</label><input type="password" id="lg-pass2"></div>
          <button class="btn primary" onclick="submitLogin()">إنشاء الحساب والدخول</button>
          ${loginError}
          <button class="btn ghost" onclick="closeLoginPassword()">إلغاء</button>
          </div>
        </div>`;
    } else {
      passPanel = `
        <div class="modal-overlay login-password-overlay">
          <div class="modal-box login-password-modal">
          <h3>تسجيل الدخول</h3>
          <p class="login-selected-user">${selectedName || ''}</p>
          <div class="field"><label>كلمة المرور</label><input type="password" id="lg-pass1" onkeydown="if(event.key==='Enter') submitLogin();"></div>
          <button class="btn primary" onclick="submitLogin()">دخول</button>
          ${state.loginRole!=='dept' ? `<button class="btn ghost" onclick="forgotPassword()">نسيت كلمة المرور؟</button>` : ''}
          ${loginError}
          <button class="btn ghost" onclick="closeLoginPassword()">إلغاء</button>
          </div>
        </div>`;
    }
  }

  app.innerHTML = `
    <div class="login-screen" id="loginModal">
      <div class="modal-box login-box">
        <h3 style="margin-bottom:8px;">🔐 تسجيل الدخول</h3>
        <div class="hero" style="padding:0; margin:0 0 12px; text-align:center;">
          <p style="margin:0; font-size:.9rem;">اختر صفتك، ثم اسمك، ثم أدخل كلمة المرور الخاصة بك.</p>
        </div>
        ${roleTabs}
        ${idPicker}
        ${passPanel}
      </div>
    </div>
  `;
}

function renderHasrHome(){
  const team = TEAMS.find(t=>t.id===state.teamId);
  const list = (HASR_CACHE[team.id]||[]).slice().sort((a,b)=>{
    if(!a.deliveryDate && !b.deliveryDate) return 0;
    if(!a.deliveryDate) return 1;
    if(!b.deliveryDate) return -1;
    return new Date(a.deliveryDate) - new Date(b.deliveryDate);
  });

  const rows = list.map((item, idx)=>{
    const di = daysLeftInfo(item.deliveryDate);
    const hasDate = !!item.deliveryDate;
    const d = hasDate ? new Date(item.deliveryDate) : null;
    const dayNum = hasDate ? d.toLocaleDateString('ar-EG', {day:'numeric'}) : '—';
    const monLabel = hasDate ? d.toLocaleDateString('ar-EG', {month:'short', year:'numeric'}) : 'بدون موعد';
    const badgeColor = di.cls==='remain' ? 'var(--red)' : (di.cls==='pct' ? 'var(--amber)' : 'var(--green)');
    const workState = item.hasWork===true ? 'yes' : (item.hasWork===false ? 'no' : 'undecided');
    return `
      <div class="hasr-row">
        <div class="hasr-row-top">
          <div class="p-rank">${idx+1}</div>
          <div class="date-block"><div class="day">${dayNum}</div><div class="mon">${monLabel}</div></div>
          <div class="p-info">
            <h4>${item.name}</h4>
            <div class="sub">${item.addedBy ? `أضافه: ${item.addedBy}` : ''}</div>
          </div>
          <div class="p-badge" style="color:${badgeColor}; border-color:${badgeColor};">${di.text}</div>
          <button class="card-del-btn" title="حذف من القائمة" onclick="deleteHasrProject('${team.id}','${item.id}')">🗑</button>
        </div>
        <div class="hasr-row-bottom">
          <div class="ctrl">
            <label>هل يوجد عمل حصر لهذا المشروع؟</label>
            <div style="display:flex; gap:8px;">
              <button class="toggle-btn ${workState==='yes'?'done':''}" onclick="setHasrWork('${team.id}','${item.id}',true)">✓ نعم، يوجد عمل</button>
              <button class="toggle-btn ${workState==='no'?'review-done':''}" onclick="setHasrWork('${team.id}','${item.id}',false)">✗ لا يوجد عمل</button>
            </div>
          </div>
          ${workState==='yes' ? `
            <div class="ctrl">
              <label>ميعاد تسليم الحصر</label>
              <input type="date" value="${item.hasrDueDate||''}" onchange="setHasrDueDate('${team.id}','${item.id}',this.value)">
            </div>
            <div class="ctrl">
              <label>حالة تنفيذ الحصر</label>
              <button class="toggle-btn ${item.hasrDone?'done':''}" onclick="setHasrDone('${team.id}','${item.id}',${!item.hasrDone})">${item.hasrDone? '✅ تم الحصر — الغاء' : '✓ تم الحصر'}</button>
            </div>
          ` : ''}
          ${workState==='undecided' ? `<span style="color:var(--ink-faint); font-size:.78rem;">⏳ لم يُحدد بعد</span>` : ''}
          <div class="ctrl" style="flex:1 1 240px; min-width:240px;">
            <label>ملاحظات (تظهر للمهندس المسؤول عن المشروع)</label>
            <input type="text" value="${(item.hasrNotes||'').replace(/"/g,'&quot;')}" placeholder="اكتب ملاحظتك هنا" onchange="setHasrNotes('${team.id}','${item.id}',this.value)">
          </div>
        </div>
      </div>`;
  }).join('');

  app.innerHTML = `
    ${crumbHTML(`<b>${teamName(team)} — قسم الحصر</b>`, true)}
    <div class="section-title">مشاريع قسم ${team.label || teamName(team)} — مرتبة بالأقرب لموعد التسليم (${list.length} مشروع)</div>
    <p style="color:var(--ink-faint); font-size:.8rem; margin:-6px 0 14px;">المشاريع بتتضاف هنا تلقائيًا من أي مهندس أو مدير فريق أو مدير القسم بمجرد إضافته مشروع جديد وحفظه — مفيش إضافة يدوية هنا.</p>
    ${list.length ? `<div class="hasr-list">${rows}</div>` : `<p style="color:var(--ink-dim); text-align:center; padding:30px 0;">لسه مفيش مشاريع وصلت هنا. أي مشروع جديد يُضاف ويُحفظ في أي فريق هيظهر هنا تلقائيًا.</p>`}
  `;
}
async function setHasrWork(teamId, id, value){
  const item = (HASR_CACHE[teamId]||[]).find(x=>x.id===id);
  if(!item) return;
  item.hasWork = value;
  if(!value) item.hasrDueDate = '';
  await saveHasrProjects(teamId);
  render();
}
async function setHasrDueDate(teamId, id, value){
  const item = (HASR_CACHE[teamId]||[]).find(x=>x.id===id);
  if(!item) return;
  item.hasrDueDate = value;
  await saveHasrProjects(teamId);
  render();
}
async function setHasrNotes(teamId, id, value){
  const item = (HASR_CACHE[teamId]||[]).find(x=>x.id===id);
  if(!item) return;
  item.hasrNotes = value;
  await saveHasrProjects(teamId);
  render();
}
async function setHasrDone(teamId, id, value){
  const item = (HASR_CACHE[teamId]||[]).find(x=>x.id===id);
  if(!item) return;
  item.hasrDone = value;
  await saveHasrProjects(teamId);
  render();
}
async function deleteHasrProject(teamId, id){
  const item = (HASR_CACHE[teamId]||[]).find(x=>x.id===id);
  if(!item) return;
  showConfirmDialog({
    title: '🗑 حذف من الحصر',
    message: `هل تريد حذف المشروع "${item.name}" من قائمة الحصر؟`,
    confirmText: 'حذف المشروع',
    onConfirm: async () => {
      HASR_CACHE[teamId] = (HASR_CACHE[teamId]||[]).filter(x=>x.id!==id);
      await saveHasrProjects(teamId);
      render();
    }
  });
}

function renderTeamHome(){
  const team = TEAMS.find(t=>t.id===SESSION.id);
  const s = teamStats(team);
  const myProjects = getAllProjects(t=>t.id===team.id);
  const projRows = myProjects.map((item, idx)=>
    projectRowHTML(idx+1, item.project, item.stats, item.eng.name, `openEngineerProject('${item.eng.id}','${item.project.id}','teamHome')`)
  ).join('');

  app.innerHTML = `
    ${crumbHTML(`<b>${teamName(team)} — لوحة مدير الفريق</b>`, true)}
    <div class="stat-row">
      <div class="stat-chip total"><div class="v">${s.total}</div><div class="l">إجمالي المهام</div></div>
      <div class="stat-chip done"><div class="v">${s.done}</div><div class="l">منجزة</div></div>
      <div class="stat-chip remain"><div class="v">${s.remaining}</div><div class="l">متبقية</div></div>
      <div class="stat-chip pct"><div class="v">${s.pct}%</div><div class="l">نسبة إنجاز الفريق</div></div>
    </div>
    <div class="section-title">مهندسو الفريق</div>
    ${engineerCardsHTML(team, 'teamHome')}
    <div class="section-title">مشاريع الفريق — مرتبة بالأقرب لموعد التسليم (${myProjects.length} مشروع)</div>
    ${myProjects.length ? `<div class="project-list">${projRows}</div>` : `<p style="color:var(--ink-dim); text-align:center; padding:30px 0;">لا توجد مشاريع مضافة بعد لهذا الفريق.</p>`}
  `;
}

function renderMyTasks(){
  if(!SESSION || SESSION.role !== 'engineer') {
    go('home');
    return;
  }
  state.screen = 'myTasks';
  state.engId = SESSION.id;
  renderEngineer();
}

function renderHome(){
  const allProjects = getAllProjects();
  const saudiTeam = TEAMS.find(t=>t.division==='saudi');
  const hasrTeams = TEAMS.filter(t=>t.type==='hasr');
  const saudiStats = saudiTeam ? teamStats(saudiTeam) : null;

  const extraCards = [];
  if(saudiTeam){
    extraCards.push(`
      <div class="choice-card" onclick="go('teamDetail', {teamId:'${saudiTeam.id}', teamDetailFrom:'home'})">
        <div class="num">🇸🇦</div>
        <h3>قسم السعودية</h3>
        <p>${teamName(saudiTeam)} — مدير الفريق ${saudiTeam.manager}. أداء وتفاصيل مهام منفصلة تماماً عن القسم الرئيسي، بنفس كل خصائص اللوحة.</p>
        <div class="go">عرض قسم السعودية ← ${saudiStats.pct}% إنجاز</div>
      </div>`);
  }
  hasrTeams.forEach(t=>{
    const cnt = (HASR_CACHE[t.id]||[]).length;
    extraCards.push(`
      <div class="choice-card" onclick="go('hasrHome', {teamId:'${t.id}'})">
        <div class="num">📐</div>
        <h3>قسم ${t.label}</h3>
        <p>قائمة مواعيد تسليم المشاريع فقط (بدون مهام)، يديرها ${t.manager}، مرتبة بالأقرب لموعد التسليم.</p>
        <div class="go">عرض قسم ${t.label} ← ${cnt} مشروع</div>
      </div>`);
  });

  app.innerHTML = `
    <div class="hero">
      <h1>مرحباً، ${DEPT_MANAGER}</h1>
      <p>اختر طريقة المتابعة: أداء كل الفرق والأقسام الستة إجمالاً، الدخول مباشرة على مهندس معيّن، متابعة المشاريع الجارية، عرض التقارير، أو إدارة البيانات الأساسية.</p>
    </div>
    <div class="choice-grid">
      <div class="choice-card" onclick="go('teams')">
        <div class="num">01</div>
        <h3>🏆 أداء الفريق</h3>
        <p>نظرة عامة على كل الفرق والأقسام الستة، نسبة إنجاز كل فريق، ثم الدخول على أي فريق أو قسم لعرض التفاصيل.</p>
        <div class="go">عرض لوحة الفرق ←</div>
      </div>
      <div class="choice-card" onclick="go('engineerPicker')">
        <div class="num">02</div>
        <h3>🧑‍💻 اختيار مهندس</h3>
        <p>اختر مهندساً مباشرة من قائمة المهندسين الـ13 لمتابعة وتحديث تفاصيل مهام مشاريعه.</p>
        <div class="go">عرض قائمة المهندسين ←</div>
      </div>
      <div class="choice-card" onclick="go('projects')">
        <div class="num">03</div>
        <h3>📁 المشاريع الجارية</h3>
        <p>${allProjects.length} مشروع تحت الدراسة الآن (القسم الرئيسي فقط)، مرتبة حسب أقرب موعد تسليم.</p>
        <div class="go">عرض المشاريع ←</div>
      </div>
      <div class="choice-card" onclick="go('diagrams')">
        <div class="num">04</div>
        <h3>📊 التقارير والرسوم البيانية</h3>
        <p>رسوم بيانية لأداء القسم الرئيسي ككل، وأداء كل فريق، وأداء كل مهندس على حدة.</p>
        <div class="go">عرض الرسوم البيانية ←</div>
      </div>
      <div class="choice-card" onclick="renderMyTasks()">
        <div class="num">05</div>
        <h3>👤 مهامي</h3>
        <p>عرض المهام الخاصة بالموظف الحالي فقط، مع المشاريع والبيانات والحفظ داخل شاشة مستقلة وواضحة.</p>
        <div class="go">فتح شاشة مهامي ←</div>
      </div>
      <div class="choice-card" onclick="go('addEmployee')">
        <div class="num">06</div>
        <h3>👤 إضافة موظف</h3>
        <p>إضافة موظف جديد إلى فريق محدد، مع تهيئة الحساب والمشاهدة مباشرة في النظام.</p>
        <div class="go">فتح شاشة الموظفين ←</div>
      </div>
      <div class="choice-card" onclick="go('fieldConfig')">
        <div class="num">07</div>
        <h3>⚙️ الماستر داتا</h3>
        <p>إدارة أسماء الحقول، الأنواع، الاعتماد، والتفعيل لكل من المهام والمشاريع وقسم الحصر مباشرة من قاعدة البيانات.</p>
        <div class="go">فتح شاشة الماستر داتا ←</div>
      </div>
      ${SESSION && SESSION.role==='dept' ? `<div class="choice-card" onclick="go('emailSettings')"><div class="num">08</div><h3>📧 إعدادات البريد</h3><p>تفعيل البريد عند إنشاء المشاريع، وتحديد خادم SMTP، وعناوين البريد المنقول إليها.</p><div class="go">فتح إعدادات البريد ←</div></div>` : ''}
      ${SESSION && SESSION.role==='dept' ? `<div class="choice-card" onclick="go('archives')"><div class="num">09</div><h3>🗄️ الأرشيف</h3><p>المشاريع المؤرشفة والمحذوفة، متاحة لمدير القسم فقط.</p><div class="go">فتح الأرشيف ←</div></div>` : ''}
      ${extraCards.join('')}
    </div>
  `;
}

function renderTeams(){
  let cards = TEAMS.map(t=>{
    if(t.type==='hasr'){
      const cnt = (HASR_CACHE[t.id]||[]).length;
      const done = (HASR_CACHE[t.id]||[]).filter(x=>x.hasWork===false || x.hasrDone).length;
      return `
      <div class="card" onclick="go('hasrHome', {teamId:'${t.id}'})">
        <div class="top-row">
          <h4>📐 قسم ${t.label}</h4>
          <span class="tag">${cnt} مشروع</span>
        </div>
        <div class="manager">مدير القسم: ${t.manager}</div>
        <div class="pctline"><span>محسومة: ${done}/${cnt}</span></div>
      </div>`;
    }
    const s = teamStats(t);
    const dots = t.engineers.map(e=>{
      const es = engineerStats(e.id);
      return `<span class="dot ${pctClass(es.pct)}" title="${e.name}: ${es.pct}%"></span>`;
    }).join('');
    const label = t.division==='saudi' ? `🇸🇦 ${teamName(t)}` : teamName(t);
    return `
      <div class="card" onclick="go('teamDetail', {teamId:'${t.id}', teamDetailFrom:'teams'})">
        <div class="top-row">
          <h4>${label}</h4>
          <span class="tag">${t.engineers.length} مهندسين</span>
        </div>
        <div class="manager">مدير الفريق: ${t.manager}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${s.pct}%"></div></div>
        <div class="pctline"><span>${s.done}/${s.total} مهمة</span><b>${s.pct}%</b></div>
        <div class="mini-people">${dots}</div>
      </div>`;
  }).join('');

  app.innerHTML = `
    ${crumbHTML(`<span>الرئيسية</span> / <b>أداء الفريق</b>`, true)}
    <div class="section-title">
      نظرة عامة على كل الفرق والأقسام (${TEAMS.length})
      ${SESSION && SESSION.role==='dept' ? `<button class="btn primary" onclick="go('manageTeams')">⚙️ إدارة الفرق</button>` : ''}
    </div>
    <div class="grid">${cards}</div>
  `;
}

function engineerCardsHTML(team, fromScreen){
  const canManage = SESSION && SESSION.role !== 'engineer';
  const cards = team.engineers.map(e=>{
    const es = engineerStats(e.id);
    return `
      <div class="card" onclick="openEngineer('${e.id}','${fromScreen}')">
        <div class="top-row engineer-card-heading">
          <div class="engineer-name-with-photo">${employeePhotoHTML(e, canChangePhoto(e.id))}<h4>${e.name}</h4></div>
          <div style="display:flex; align-items:center; gap:6px;">
            ${fromScreen==='engineerPicker'?`<span class="tag">${teamName(team)}</span>`:''}
            ${canManage ? `<button class="card-del-btn" title="حذف المهندس" onclick="event.stopPropagation(); deleteEngineer('${team.id}','${e.id}')">🗑</button>` : ''}
          </div>
        </div>
        <div class="manager">${fromScreen==='engineerPicker'?`مدير الفريق: ${team.manager}`:`${teamName(team)} · مدير: ${team.manager}`}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${es.pct}%"></div></div>
        <div class="pctline"><span>${es.done}/${es.total} مهمة</span><b>${es.pct}%</b></div>
        <div class="pctline"><span>📁 ${cache[e.id] ? cache[e.id].projects.length : 0} مشروع</span></div>
        <div class="lastsaved">آخر تحديث: ${timeAgo(cache[e.id] && cache[e.id].lastSaved)}</div>
      </div>`;
  }).join('');
  const addCard = `<div class="card add-card" onclick="toggleAddEngineer('${team.id}')">+ إضافة مهندس جديد</div>`;
  const form = state.addingEngineerTeam === team.id ? `
    <div class="modal-overlay" style="display:flex; position:fixed; inset:0; z-index:50; background:rgba(8,20,30,.72);">
      <div class="modal-box" style="max-width:420px; width:min(90vw,420px);">
        <h3>➕ إضافة مهندس جديد</h3>
        <div class="field"><label>اسم المهندس الجديد</label><input type="text" id="ne-name-${team.id}" placeholder="اكتب الاسم بالكامل"></div>
        <div class="modal-actions">
          <button class="btn ghost" onclick="toggleAddEngineer('${team.id}')">إلغاء</button>
          <button class="btn primary" onclick="createEngineer('${team.id}')">إضافة المهندس</button>
        </div>
      </div>
    </div>` : '';
  return `<div class="grid">${cards}${addCard}</div>${form}`;
}

function renderManageTeams(){
  const allEngineersOptions = TEAMS.flatMap(t=>t.engineers.map(e=>
    `<option value="${e.id}">${e.name} (${teamName(t)})</option>`
  )).join('');

  const teamPanels = TEAMS.map(team=>{
    const engRows = team.engineers.map(e=>{
      const otherTeams = TEAMS.filter(t=>t.id!==team.id)
        .map(t=>`<option value="${t.id}">${teamName(t)} — ${t.manager}</option>`).join('');
      return `
        <div class="admin-eng-row">
          <div class="admin-eng-name">${e.name}</div>
          <select onchange="if(this.value){requestMoveEngineer('${e.id}','${team.id}',this.value); this.value='';}">
            <option value="">↔ نقل إلى فريق آخر...</option>
            ${otherTeams}
          </select>
          <button class="btn ghost" onclick="promoteToManager('${team.id}','${e.id}')">⬆ تعيين كمدير</button>
          <button class="card-del-btn" title="حذف المهندس" onclick="deleteEngineer('${team.id}','${e.id}')">🗑</button>
        </div>`;
    }).join('') || `<p style="color:var(--ink-faint); font-size:.82rem; padding:6px 0;">لا يوجد مهندسون في هذا الفريق.</p>`;

    const managerBlock = `
      <span>مدير الفريق: <b style="color:var(--amber);">${team.manager}</b></span>
      <button class="expand" onclick="toggleEditManager('${team.id}')">✎ تعديل</button>
    `;

    return `
      <div class="chart-panel">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:10px;">
          <h3 style="margin:0;">${teamName(team)} <span style="color:var(--ink-faint); font-size:.78rem; font-family:'JetBrains Mono',monospace;">(${team.engineers.length} مهندس)</span></h3>
          <button class="btn ghost" onclick="deleteTeam('${team.id}')">🗑 حذف الفريق</button>
        </div>
        <div style="margin-bottom:14px; font-size:.88rem;">${managerBlock}</div>
        <div class="admin-eng-list">${engRows}</div>
      </div>`;
  }).join('');

  const createForm = state.creatingTeam ? `
    <div class="modal-overlay" style="display:flex; position:fixed; inset:0; z-index:50; background:rgba(8,20,30,.72);">
      <div class="modal-box" style="max-width:500px; width:min(92vw,500px);">
        <h3>🏆 إنشاء فريق جديد</h3>
        <div class="field">
          <label>اختر مديراً من المهندسين الحاليين (اختياري)</label>
          <select id="nt-team-existing">
            <option value="">— بدون اختيار، اكتب اسم جديد بالأسفل —</option>
            ${allEngineersOptions}
          </select>
        </div>
        <div class="field"><label>أو اكتب اسم مدير جديد</label><input type="text" id="nt-team-manager" placeholder="اسم مدير الفريق"></div>
        <div class="modal-actions">
          <button class="btn ghost" onclick="toggleCreateTeam()">إلغاء</button>
          <button class="btn primary" onclick="createTeam()">إنشاء الفريق</button>
        </div>
      </div>
    </div>` : `<button class="btn primary" onclick="toggleCreateTeam()">+ إنشاء فريق جديد</button>`;

  app.innerHTML = `
    ${crumbHTML(`<span>الرئيسية</span> / <span>أداء الفريق</span> / <b>إدارة الفرق</b>`, true)}
    <div class="section-title">إدارة الفرق (${TEAMS.length} فريق)</div>
    ${teamPanels}
    <div class="section-title">فريق جديد</div>
    ${createForm}
  `;
}

function renderTeamDetail(){
  const team = TEAMS.find(t=>t.id===state.teamId);
  const s = teamStats(team);
  const isMain = (team.division||'main') === 'main';
  const sectionLabel = isMain ? 'أداء الفريق' : `قسم ${team.label}`;
  const myProjects = getAllProjects(t=>t.id===team.id);
  const projRows = myProjects.map((item, idx)=>
    projectRowHTML(idx+1, item.project, item.stats, item.eng.name, `openEngineerProject('${item.eng.id}','${item.project.id}','teamDetail')`)
  ).join('');

  app.innerHTML = `
    ${crumbHTML(`<span>الرئيسية</span> / <span>${sectionLabel}</span> / <b>${teamName(team)}</b>`, true)}
    <div class="section-title">${teamName(team)} — مدير الفريق: ${team.manager}</div>
    <div class="stat-row">
      <div class="stat-chip total"><div class="v">${s.total}</div><div class="l">إجمالي المهام (لكل المهندسين)</div></div>
      <div class="stat-chip done"><div class="v">${s.done}</div><div class="l">منجزة</div></div>
      <div class="stat-chip remain"><div class="v">${s.remaining}</div><div class="l">متبقية</div></div>
      <div class="stat-chip pct"><div class="v">${s.pct}%</div><div class="l">نسبة إنجاز الفريق</div></div>
    </div>
    ${engineerCardsHTML(team, 'teamDetail')}
    <div class="section-title">مشاريع ${teamName(team)} — مرتبة بالأقرب لموعد التسليم (${myProjects.length} مشروع)</div>
    ${myProjects.length ? `<div class="project-list">${projRows}</div>` : `<p style="color:var(--ink-dim); text-align:center; padding:30px 0;">لا توجد مشاريع مضافة بعد.</p>`}
  `;
}

function renderEngineerPicker(){
  let blocks = TEAMS.map(t=>{
    return `<div class="section-title">${teamName(t)} · ${t.manager}</div>${engineerCardsHTML(t, 'engineerPicker')}`;
  }).join('');

  app.innerHTML = `
    ${crumbHTML(`<span>الرئيسية</span> / <b>اختيار مهندس</b>`, true)}
    ${blocks}
  `;
}

function openEngineer(engId, fromScreen){
  state.engFrom = fromScreen;
  state.addingProject = false;
  state.renamingEngineer = null;
  state.addingTask = false;
  go('engineer', {engId});
}
function openEngineerProject(engId, projId, fromScreen){
  cache[engId].activeProjectId = projId;
  saveActiveProjectId(engId, projId);
  openEngineer(engId, fromScreen);
}

/* ---- projects overview (all engineers, sorted by delivery date) ---- */
function renderProjects(){
  const all = getAllProjects();
  const rows = all.map((item, idx)=>
    projectRowHTML(idx+1, item.project, item.stats, `${item.eng.name} · ${teamName(item.team)} — ${item.team.manager}`, `openEngineerProject('${item.eng.id}','${item.project.id}','projects')`)
  ).join('');

  app.innerHTML = `
    ${crumbHTML(`<span>الرئيسية</span> / <b>المشاريع الجارية</b>`, true)}
    <div class="section-title">كل المشاريع تحت الدراسة — مرتبة بالأقرب لموعد التسليم (${all.length} مشروع)</div>
    ${all.length ? `<div class="project-list">${rows}</div>` : `<p style="color:var(--ink-dim); text-align:center; padding:40px 0;">لا توجد مشاريع مضافة بعد.</p>`}
  `;
}

/* ---- engineer sheet ---- */
function renderEngineer(){
  const engId = state.engId;
  const data = cache[engId];
  const team = TEAMS.find(t=> t.engineers.some(e=>e.id===engId));
  const eng = team?.engineers.find(e=>e.id===engId);

  if(!data || !team || !eng){
    app.innerHTML = `<div class="data-error"><h2>تعذّر تحميل صفحة المهندس</h2><p>بيانات المهندس أو فريقه غير متاحة من الخادم. حدّث الصفحة ثم حاول مرة أخرى.</p><button class="btn primary" onclick="refreshAll()">تحديث البيانات</button></div>`;
    return;
  }

  // A newly added engineer can legitimately have no projects in the database.
  // Show an empty state and let the user create the first persisted project instead
  // of trying to read projects[0].id and breaking the sign-in flow.
  if(!Array.isArray(data.projects) || data.projects.length === 0){
    const createModal = state.addingProject ? `
      <div class="modal-overlay" style="display:flex; position:fixed; inset:0; z-index:50; background:rgba(8,20,30,.72);">
        <div class="modal-box" style="max-width:500px; width:min(92vw,500px);">
          <h3>إنشاء أول مشروع</h3>
          <div class="field"><label>اسم المشروع</label><input type="text" id="np-name" placeholder="اكتب اسم المشروع"></div>
          <div class="field"><label>تاريخ التسليم</label><input type="date" id="np-delivery" value="${DASH_CONFIG?.projectDefaults?.deliveryDate || ''}"></div>
          <div class="field"><label>تاريخ الاستفسارات</label><input type="date" id="np-inquiry" value="${DASH_CONFIG?.projectDefaults?.inquiryDate || ''}"></div>
          <div class="modal-actions"><button class="btn ghost" onclick="toggleAddProject()">إلغاء</button><button class="btn primary" onclick="createProject('${engId}')">إنشاء المشروع</button></div>
        </div>
      </div>` : '';
    app.innerHTML = `
      ${crumbHTML(`<b>مهامي — ${eng.name}</b>`, true)}
      <div class="sheet-header"><div class="tb-logo-box"><img src="${LOGO_SRC}" alt="Alshorouk"></div><div class="who"><h2 class="engineer-title-with-photo">${employeePhotoHTML(eng, canChangePhoto(engId))}<span>${eng.name}</span></h2><div class="sub">${teamName(team)} — مدير الفريق: ${team.manager}</div></div></div>
      <div class="data-error" style="border-color:var(--line-strong); margin:28px auto;"><h2 style="color:var(--amber);">لا يوجد مشروع مسجل بعد</h2><p>لا توجد مشاريع لهذا المهندس في قاعدة البيانات. أضف أول مشروع لبدء متابعة المهام.</p><button class="btn primary" onclick="toggleAddProject()">+ إضافة مشروع</button></div>
      ${createModal}`;
    return;
  }

  if(!data.activeProjectId || !data.projects.some(p=>p.id===data.activeProjectId)){
    data.activeProjectId = data.projects[0].id;
  }
  const project = data.projects.find(p=>p.id===data.activeProjectId);
  if(!PROJECT_FILES[project.id] && !PROJECT_FILES_LOADING[project.id]){
    const generation = sessionGeneration;
    PROJECT_FILES_LOADING[project.id] = loadProjectFiles(project.id).then(()=>{ delete PROJECT_FILES_LOADING[project.id]; if(SESSION && generation === sessionGeneration && state.engId===engId) renderEngineer(); }).catch(error=>{ delete PROJECT_FILES_LOADING[project.id]; console.error(error); });
  }
  const s = projectStats(project);
  const isDirty = !!dirty[engId];

  const sortedProjects = data.projects.slice().sort((a,b)=>{
    if(!a.deliveryDate && !b.deliveryDate) return 0;
    if(!a.deliveryDate) return 1;
    if(!b.deliveryDate) return -1;
    return new Date(a.deliveryDate) - new Date(b.deliveryDate);
  });
  const myProjectRows = sortedProjects.map((p, idx)=>
    projectRowHTML(idx+1, p, projectStats(p), p.id===project.id ? '📌 المشروع المفتوح حالياً' : '', `switchProject('${engId}','${p.id}')`)
  ).join('');

  const tabs = data.projects.map(p=>`
    <div class="proj-tab ${p.id===project.id?'active':''}" onclick="switchProject('${engId}','${p.id}')">${p.name || 'مشروع بدون اسم'}</div>
  `).join('') + `<div class="proj-tab add" onclick="toggleAddProject()">+ إضافة مشروع</div>`;

  const addForm = state.addingProject ? `
    <div class="modal-overlay" style="display:flex; position:fixed; inset:0; z-index:50; background:rgba(8,20,30,.72);">
      <div class="modal-box" style="max-width:500px; width:min(92vw,500px);">
        <h3>📁 إنشاء مشروع جديد</h3>
        <div class="field"><label>اسم المشروع الجديد</label><input type="text" id="np-name" placeholder="اكتب اسم المشروع"></div>
        <div class="field"><label>تاريخ التسليم</label><input type="date" id="np-delivery" value="${DASH_CONFIG?.projectDefaults?.deliveryDate || ""}"></div>
        <div class="field"><label>تاريخ الاستفسارات</label><input type="date" id="np-inquiry" value="${DASH_CONFIG?.projectDefaults?.inquiryDate || ""}"></div>
        <div class="modal-actions">
          <button class="btn ghost" onclick="toggleAddProject()">إلغاء</button>
          <button class="btn primary" onclick="createProject('${engId}')">إنشاء المشروع</button>
        </div>
      </div>
    </div>` : '';

  const deleteBtn = data.projects.length > 0
    ? `<button class="btn ghost" onclick="deleteProject('${engId}','${project.id}')" style="margin-inline-start:auto;">حذف هذا المشروع</button>`
    : '';

  const rows = TASKS.map(t=>{
    const st = project.tasks[t.id];
    return `
      <div class="task-block ${st.applicable ? '' : 'not-essential'}">
        <div class="task-head">
          <div class="t-num">${String(t.id).padStart(2,'0')}</div>
          <div class="t-title">${t.title}
            <button class="expand" onclick="toggleDesc(this)">التفاصيل</button>
            <div class="t-desc">${t.desc}</div>
          </div>
        </div>
        <div class="task-controls">
          <div class="ctrl">
            <label>الحالة</label>
            <button class="toggle-btn ${st.status?'done':''}" onclick="toggleField('${engId}','${project.id}',${t.id},'status')">${st.status?'☑ تم':'☐ لم يتم'}</button>
          </div>
          <div class="ctrl">
            <label>المراجعة</label>
            <button class="toggle-btn ${st.review?'review-done':''}" onclick="toggleField('${engId}','${project.id}',${t.id},'review')">${st.review?'☑ روجعت':'☐ لم تراجع'}</button>
          </div>
          <div class="ctrl">
            <label>ينطبق؟</label>
            <button class="toggle-btn ${st.applicable?'essential':'not-essential-btn'}" onclick="toggleField('${engId}','${project.id}',${t.id},'applicable')">${st.applicable?'✓ أساسي':'غير أساسي'}</button>
          </div>
          <div class="ctrl">
            <label>${fieldLabel('task','dueDate','ميعاد الانتهاء')}</label>
            <input type="date" value="${st.dueDate||''}" onchange="setField('${engId}','${project.id}',${t.id},'dueDate',this.value)">
          </div>
          <div class="ctrl">
            <label>${fieldLabel('task','department','القسم المسؤول')}</label>
            <input type="text" value="${st.department||''}" placeholder="اسم القسم" onchange="setField('${engId}','${project.id}',${t.id},'department',this.value)">
          </div>
          <div class="ctrl" style="flex:1 1 220px; min-width:220px;">
            <label>${fieldLabel('task','notes','ملاحظات')}</label>
            <input type="text" value="${(st.notes||'').replace(/"/g,'&quot;')}" placeholder="اكتب ملاحظتك هنا" onchange="setField('${engId}','${project.id}',${t.id},'notes',this.value)">
          </div>
        </div>
      </div>`;
  }).join('');

  const customRows = (project.customTasks||[]).map((ct, idx)=>`
      <div class="task-block ${ct.applicable ? '' : 'not-essential'}">
        <div class="task-head">
          <div class="t-num">${String(TASKS.length + idx + 1).padStart(2,'0')}</div>
          <div class="t-title">${ct.title} <span style="color:var(--teal); font-size:.7rem; font-family:'JetBrains Mono',monospace;">(مهمة مضافة)</span>
            ${ct.desc ? `<button class="expand" onclick="toggleDesc(this)">التفاصيل</button><div class="t-desc">${ct.desc}</div>` : ''}
          </div>
        </div>
        <div class="task-controls">
          <div class="ctrl">
            <label>الحالة</label>
            <button class="toggle-btn ${ct.status?'done':''}" onclick="toggleCustomField('${engId}','${project.id}','${ct.id}','status')">${ct.status?'☑ تم':'☐ لم يتم'}</button>
          </div>
          <div class="ctrl">
            <label>المراجعة</label>
            <button class="toggle-btn ${ct.review?'review-done':''}" onclick="toggleCustomField('${engId}','${project.id}','${ct.id}','review')">${ct.review?'☑ روجعت':'☐ لم تراجع'}</button>
          </div>
          <div class="ctrl">
            <label>ينطبق؟</label>
            <button class="toggle-btn ${ct.applicable?'essential':'not-essential-btn'}" onclick="toggleCustomField('${engId}','${project.id}','${ct.id}','applicable')">${ct.applicable?'✓ أساسي':'غير أساسي'}</button>
          </div>
          <div class="ctrl">
            <label>${fieldLabel('customTask','dueDate','ميعاد الانتهاء')}</label>
            <input type="date" value="${ct.dueDate||''}" onchange="setCustomField('${engId}','${project.id}','${ct.id}','dueDate',this.value)">
          </div>
          <div class="ctrl">
            <label>${fieldLabel('customTask','department','القسم المسؤول')}</label>
            <input type="text" value="${ct.department||''}" placeholder="اسم القسم" onchange="setCustomField('${engId}','${project.id}','${ct.id}','department',this.value)">
          </div>
          <div class="ctrl" style="flex:1 1 220px; min-width:220px;">
            <label>${fieldLabel('customTask','notes','ملاحظات')}</label>
            <input type="text" value="${(ct.notes||'').replace(/"/g,'&quot;')}" placeholder="اكتب ملاحظتك هنا" onchange="setCustomField('${engId}','${project.id}','${ct.id}','notes',this.value)">
          </div>
          <div class="ctrl">
            <label>&nbsp;</label>
            <button class="btn ghost" onclick="deleteCustomTask('${engId}','${project.id}','${ct.id}')">🗑 حذف</button>
          </div>
        </div>
      </div>`).join('');

  const addTaskForm = state.addingTask ? `
    <div class="modal-overlay" style="display:flex; position:fixed; inset:0; z-index:50; background:rgba(8,20,30,.72);">
      <div class="modal-box" style="max-width:480px; width:min(90vw,480px);">
        <h3>📝 إضافة مهمة جديدة</h3>
        <div class="field"><label>عنوان المهمة الجديدة</label><input type="text" id="nt-title" placeholder="اكتب اسم المهمة"></div>
        <div class="field"><label>وصف مختصر (اختياري)</label><input type="text" id="nt-desc" placeholder="تفاصيل إضافية"></div>
        <div class="modal-actions">
          <button class="btn ghost" onclick="toggleAddTask()">إلغاء</button>
          <button class="btn primary" onclick="addCustomTask('${engId}','${project.id}')">إضافة المهمة</button>
        </div>
      </div>
    </div>` : '';

  const isMyTasksScreen = state.screen === 'myTasks';
  const employeeTitle = isMyTasksScreen ? `${eng.name} — مهامي` : eng.name;
  const employeeSub = isMyTasksScreen
    ? `${teamName(team)} — مدير الفريق: ${team.manager} · آخر حفظ: ${timeAgo(data.lastSaved)} · شاشة مهامك الشخصية`
    : `${teamName(team)} — مدير الفريق: ${team.manager} · آخر حفظ: ${timeAgo(data.lastSaved)}`;
  const activeProjectSummary = projectStats(project);
  const saveBar = `
    <div class="savebar savebar-top">
      <div class="status ${isDirty?'dirty':''}">
        <span class="dot2"></span>
        ${statusText(isDirty, data.lastSaved)}
      </div>
      <button class="save-btn" onclick="doSave('${engId}')">💾 حفظ الآن</button>
    </div>`;

  app.innerHTML = `
    ${SESSION && SESSION.role==='engineer'
      ? crumbHTML(isMyTasksScreen ? '<b>مهامي</b>' : `<b>مهامي — ${eng.name}</b>`, true)
      : crumbHTML(`<span>الرئيسية</span> / <span>${engFromLabel(state.engFrom, team)}</span> / <b>${eng.name}</b>`, false)}

    ${saveBar}

    <div class="sheet-header">
      <div class="tb-logo-box"><img src="${LOGO_SRC}" alt="Alshorouk"></div>
      <div class="who" style="flex:1;">
        ${state.renamingEngineer === engId ? `
          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <input type="text" id="rename-input" value="${eng.name}" style="background:var(--bg-2); border:1px solid var(--amber); border-radius:7px; padding:7px 10px; color:var(--ink); font-family:'Cairo',sans-serif; font-size:1.05rem; min-width:220px;">
            <button class="btn primary" onclick="confirmRenameEngineer('${engId}')">حفظ الاسم</button>
            <button class="btn ghost" onclick="cancelRenameEngineer()">إلغاء</button>
          </div>
        ` : `
          <h2 class="engineer-title-with-photo">${employeePhotoHTML(eng, canChangePhoto(engId))}<span>${employeeTitle}</span> <button class="expand" style="font-size:.75rem;" onclick="startRenameEngineer('${engId}')">✎ تعديل الاسم</button></h2>
        `}
        <div class="sub">${employeeSub}</div>
      </div>
    </div>

    ${isMyTasksScreen ? `
      <div class="mytasks-summary">
        <div class="mytasks-main">
          <div class="mini-label">مشروع نشط الآن</div>
          <div class="mini-title">${project.name || 'مشروع بدون اسم'}</div>
          <div class="mini-sub">${data.projects.length} مشروع في ملفك · ${(project.customTasks || []).length} مهمة مخصصة</div>
        </div>
        <div class="mytasks-actions">
          <button class="btn primary" onclick="toggleAddTask()">+ إضافة مهمة جديدة</button>
          <button class="btn ghost" onclick="toggleAddProject()">+ إضافة مشروع جديد</button>
          <button class="btn ghost" onclick="go('home')">العودة للرئيسية</button>
        </div>
      </div>
      <div class="stat-row" style="margin-bottom:14px;">
        <div class="stat-chip total"><div class="v">${data.projects.length}</div><div class="l">مشاريع</div></div>
        <div class="stat-chip done"><div class="v">${activeProjectSummary.done}</div><div class="l">تم إنجازها في المشروع الحالي</div></div>
        <div class="stat-chip remain"><div class="v">${activeProjectSummary.remaining}</div><div class="l">متبقية</div></div>
        <div class="stat-chip pct"><div class="v">${activeProjectSummary.pct}%</div><div class="l">نسبة إنجاز المشروع الحالي</div></div>
      </div>
    ` : ''}

    <div class="proj-tabs">${tabs}</div>
    ${addForm}

    ${(()=>{ const hs = hasrStatusForProject(project.id); return hs ? `
    <div class="hasr-status-box ${hs.cls}">
      <div class="icon">${hs.icon}</div>
      <div class="txt">
        <div class="label">${hs.label} — ${project.name || 'هذا المشروع'}</div>
        <div class="val">${hs.text}</div>
        ${hs.notes ? `<div class="val" style="font-weight:400; font-size:.85rem; color:var(--ink-dim); margin-top:6px;">📝 ملاحظة من قسم الحصر: ${hs.notes}</div>` : ''}
      </div>
    </div>` : ''; })()}

    <div class="meta-panel">
      <div class="meta-grid">
        <div class="field"><label>اسم المشروع</label><input type="text" id="f-project" value="${project.name||''}" placeholder="اكتب اسم المشروع"></div>
        <div class="field"><label>تاريخ التسليم</label><input type="date" id="f-delivery" value="${project.deliveryDate||''}"></div>
        <div class="field"><label>تاريخ الاستفسارات</label><input type="date" id="f-inquiry" value="${project.inquiryDate||''}"></div>
      </div>
      <div style="display:flex; margin-top:10px;">${deleteBtn}</div>
    </div>

    <div class="outcome-box">
      <div class="ctrl">
        <label>هل تم الانتهاء من هذا المشروع؟</label>
        <button class="toggle-btn ${project.finished?'done':''}" onclick="setProjectFinished('${engId}','${project.id}',${!project.finished})">${project.finished?'☑ تم الانتهاء':'☐ لسه جاري العمل عليه'}</button>
      </div>
      ${project.finished ? `
      <div class="ctrl">
        <label>نتيجة العطاء</label>
        <div style="display:flex; gap:8px;">
          <button class="toggle-btn ${project.outcome==='won'?'done':''}" onclick="setProjectOutcome('${engId}','${project.id}','won')">${outcomeLabel('won','🏆 فوز')}</button>
          <button class="toggle-btn ${project.outcome==='lost'?'lost':''}" onclick="setProjectOutcome('${engId}','${project.id}','lost')">${outcomeLabel('lost','✗ خسارة')}</button>
        </div>
      </div>` : ''}
    </div>

    <div class="stat-row">
      <div class="stat-chip total"><div class="v">${s.total}</div><div class="l">مهام أساسية بهذا المشروع</div></div>
      <div class="stat-chip done"><div class="v">${s.done}</div><div class="l">تم إنجازها</div></div>
      <div class="stat-chip remain"><div class="v">${s.remaining}</div><div class="l">متبقية</div></div>
      <div class="stat-chip pct"><div class="v">${s.pct}%</div><div class="l">نسبة الإنجاز</div></div>
    </div>

    ${isMyTasksScreen ? `
      <div class="chart-panel" style="margin:10px 0 18px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div>
            <div style="color:var(--ink-faint); font-size:.74rem; margin-bottom:4px;">ملخص مهامي</div>
            <div style="font-size:1rem; font-weight:700;">${data.projects.length} مشروع · ${project.customTasks?.length || 0} مهمة مخصصة · ${TASKS.length + (project.customTasks?.length || 0)} بند إجمالي</div>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button class="btn primary" onclick="toggleAddTask()">+ إضافة مهمة جديدة</button>
            <button class="btn ghost" onclick="toggleAddProject()">+ إضافة مشروع جديد</button>
          </div>
        </div>
      </div>
    ` : ''}

    <div class="section-title">مشاريعي — مرتبة بالأقرب لموعد التسليم (${data.projects.length} مشروع)</div>
    <div class="project-list">${myProjectRows}</div>

    ${projectFilesHTML(project)}

    <div class="section-title">قائمة المهام (${TASKS.length + (project.customTasks||[]).length} بند)</div>
    <div class="tasks-panel">${rows}${customRows}</div>
    <div style="margin-top:12px;">
      ${state.addingTask ? '' : `<button class="btn primary" onclick="toggleAddTask()">+ إضافة مهمة جديدة</button>`}
      ${addTaskForm}
    </div>

  `;

  document.getElementById('f-project').addEventListener('change', e=>{ project.name = e.target.value; markDirty(engId); });
  document.getElementById('f-delivery').addEventListener('change', e=>{ project.deliveryDate = e.target.value; markDirty(engId); });
  document.getElementById('f-inquiry').addEventListener('change', e=>{ project.inquiryDate = e.target.value; markDirty(engId); });
}

function chooseEngineerPhoto(engId){
  if(!canChangePhoto(engId)){
    flashSave(false, 'تغيير الصورة متاح للموظف نفسه فقط', 3500);
    return;
  }
  document.getElementById(`photo-input-${engId}`)?.click();
}

async function uploadEngineerPhoto(engId, file){
  if(!file) return;
  if(!canChangePhoto(engId)) return flashSave(false, 'ليس لديك صلاحية تغيير هذه الصورة', 3500);
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)) return flashSave(false, 'اختر صورة PNG أو JPG أو WEBP', 3500);
  if(file.size > 2 * 1024 * 1024) return flashSave(false, 'حجم الصورة يجب ألا يتجاوز 2 ميجابايت', 3500);

  const photoData = await new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  try{
    const response = await fetch(`/api/roster/engineers/${encodeURIComponent(engId)}/photo`, {
      method:'PUT',
      headers:{'Content-Type':'application/json','X-User-Role':'engineer','X-Engineer-Id':engId},
      body:JSON.stringify({photoData})
    });
    if(!response.ok) throw new Error('photo upload failed: ' + response.status);
    const team = TEAMS.find(t=>t.engineers.some(e=>e.id===engId));
    const engineer = team?.engineers.find(e=>e.id===engId);
    if(engineer) engineer.photoData = photoData;
    flashSave(true, '✓ تم تغيير الصورة وحفظها');
    render();
  }catch(error){
    console.error(error);
    flashSave(false, 'تعذر حفظ الصورة: ' + friendlyErrorMsg(error), 5000);
  }
}

function renderProfile(){
  if(SESSION?.role === 'dept'){
    app.innerHTML = `
      ${crumbHTML('<span>الرئيسية</span> / <b>البروفايل</b>', false)}
      <div class="profile-panel">
        <div><h2>بروفايل مدير القسم</h2><p>مدير القسم: ${DEPT_MANAGER || '—'}</p></div>
        <div class="modal-actions"><button class="btn primary" onclick="logout()">🚪 تسجيل خروج</button></div>
      </div>`;
    return;
  }
  const team = TEAMS.find(t=>t.engineers.some(e=>e.id===SESSION.id));
  const engineer = team?.engineers.find(e=>e.id===SESSION.id);
  if(!engineer){ app.innerHTML = '<div class="data-error"><h2>تعذر تحميل البروفايل</h2></div>'; return; }
  app.innerHTML = `
    ${crumbHTML('<span>الرئيسية</span> / <b>البروفايل</b>', false)}
    <div class="profile-panel">
      <div class="profile-photo-area">
        ${employeePhotoHTML(engineer, true)}
        <div><h2>${engineer.name}</h2><p>تعديل بياناتك الشخصية وصورة الحساب</p></div>
      </div>
      <div class="profile-fields">
        <div class="field"><label>إيميل الشركة</label><input type="email" id="profile-email" value="${(engineer.companyEmail||'').replace(/"/g,'&quot;')}" placeholder="name@company.com"></div>
        <div class="field"><label>رقم التليفون</label><input type="tel" id="profile-phone" value="${(engineer.phoneNumber||'').replace(/"/g,'&quot;')}"></div>
        <div class="field"><label>الكود الوظيفي</label><input type="text" id="profile-code" value="${(engineer.employeeCode||'').replace(/"/g,'&quot;')}"></div>
      </div>
      <div class="modal-actions"><button class="btn primary" onclick="saveProfile()">💾 حفظ البروفايل</button></div>
    </div>`;
}

async function renderArchives(){
  if(!SESSION || SESSION.role !== 'dept') return go('home');
  let rows = [];
  try{
    const response = await fetch('/api/dashboard/archives', {headers:{'X-User-Role':'dept'}, cache:'no-store'});
    if(!response.ok) throw new Error('archive load failed: ' + response.status);
    rows = await response.json();
  }catch(error){
    app.innerHTML = `<div class="data-error"><h2>تعذر تحميل الأرشيف</h2><p>${friendlyErrorMsg(error)}</p></div>`;
    return;
  }
  app.innerHTML = `
    ${crumbHTML('<span>الرئيسية</span> / <b>الأرشيف</b>', false)}
    <div class="section-title">🗄️ المشاريع المؤرشفة والمحذوفة (${rows.length})</div>
    <div class="archive-list">
      ${rows.length ? rows.map((row,index)=>`<div class="archive-row"><div class="archive-index">${index+1}</div><div class="archive-main"><h3>${row.projectName || 'مشروع بدون اسم'}</h3><div>الموظف: ${row.engineerName || row.engineerId}</div><div class="archive-meta">تاريخ الأرشفة: ${new Date(row.archivedAt).toLocaleString('ar-EG')} · بواسطة: ${row.archivedBy || '—'}</div></div><span class="tag">مؤرشف</span></div>`).join('') : '<div class="data-error"><h2>الأرشيف فارغ</h2><p>لا توجد مشاريع مؤرشفة حاليًا.</p></div>'}
    </div>`;
}

async function saveProfile(){
  if(!SESSION || SESSION.role !== 'engineer') return;
  const team = TEAMS.find(t=>t.engineers.some(e=>e.id===SESSION.id));
  const engineer = team?.engineers.find(e=>e.id===SESSION.id);
  if(!engineer) return;
  const payload = {
    companyEmail: document.getElementById('profile-email').value.trim(),
    phoneNumber: document.getElementById('profile-phone').value.trim(),
    employeeCode: document.getElementById('profile-code').value.trim(),
    photoData: engineer.photoData || null
  };
  try{
    const response = await fetch(`/api/roster/engineers/${encodeURIComponent(SESSION.id)}/profile`, { method:'PUT', headers:{'Content-Type':'application/json','X-User-Role':'engineer','X-Engineer-Id':SESSION.id}, body:JSON.stringify(payload) });
    if(!response.ok){ const error = await response.json().catch(()=>({})); throw new Error(error.error || `profile save failed: ${response.status}`); }
    engineer.companyEmail = payload.companyEmail;
    engineer.phoneNumber = payload.phoneNumber;
    engineer.employeeCode = payload.employeeCode;
    flashSave(true, '✓ تم حفظ البروفايل');
    render();
  }catch(error){ flashSave(false, 'تعذر حفظ البروفايل: ' + friendlyErrorMsg(error), 5000); }
}

function toggleDesc(btn){
  const d = btn.parentElement.querySelector('.t-desc');
  d.classList.toggle('open');
}
function toggleField(engId, projId, taskId, field){
  const data = cache[engId];
  const project = data.projects.find(p=>p.id===projId);
  project.tasks[taskId][field] = !project.tasks[taskId][field];
  markDirty(engId);
}
function setField(engId, projId, taskId, field, value){
  const data = cache[engId];
  const project = data.projects.find(p=>p.id===projId);
  project.tasks[taskId][field] = value;
  markDirty(engId, true);
}
function toggleCustomField(engId, projId, taskId, field){
  const data = cache[engId];
  const project = data.projects.find(p=>p.id===projId);
  const ct = project.customTasks.find(c=>c.id===taskId);
  ct[field] = !ct[field];
  markDirty(engId);
}
function setCustomField(engId, projId, taskId, field, value){
  const data = cache[engId];
  const project = data.projects.find(p=>p.id===projId);
  const ct = project.customTasks.find(c=>c.id===taskId);
  ct[field] = value;
  markDirty(engId, true);
}
function toggleAddTask(){
  state.addingTask = !state.addingTask;
  renderEngineer();
}
function addCustomTask(engId, projId){
  const titleInput = document.getElementById('nt-title');
  const title = titleInput.value.trim();
  if(!title){ titleInput.focus(); return; }
  const desc = document.getElementById('nt-desc').value.trim();
  const data = cache[engId];
  const project = data.projects.find(p=>p.id===projId);
  if(!project.customTasks) project.customTasks = [];
  project.customTasks.push({
    id:'c'+Date.now().toString(36),
    title, desc,
    status:false, review:false, applicable:true, dueDate:'', department:'', notes:''
  });
  state.addingTask = false;
  markDirty(engId);
}
function deleteCustomTask(engId, projId, taskId){
  const data = cache[engId];
  const project = data.projects.find(p=>p.id===projId);
  const task = project?.customTasks?.find(c=>c.id===taskId);
  if(!task) return;
  showConfirmDialog({
    title: '🗑 حذف المهمة المخصصة',
    message: `هل تريد حذف المهمة "${task.title}" نهائياً من هذا المشروع؟`,
    confirmText: 'حذف المهمة',
    onConfirm: () => {
      project.customTasks = project.customTasks.filter(c=>c.id!==taskId);
      markDirty(engId);
    }
  });
}
function statusText(isDirty, lastSaved){
  if(isDirty) return '<b>⚠ يوجد تغيرات لم يتم الحفظ</b>';
  if(!lastSaved) return '<b>⚠ يوجد تغيرات لم يتم الحفظ</b>';
  return `<b>✓ تم الحفظ</b> — آخر حفظ ${timeAgo(lastSaved)}`;
}
function markDirty(engId, lightweight){
  dirty[engId] = true;
  scheduleAutoSave(engId);
  if(lightweight){
    const bar = document.querySelector('.savebar .status');
    if(bar){ bar.classList.add('dirty'); bar.innerHTML = `<span class="dot2"></span>${statusText(true, null)}`; }
    return;
  }
  renderEngineer();
}
function scheduleAutoSave(engId){
  clearTimeout(autoSaveTimers[engId]);
  autoSaveTimers[engId] = setTimeout(async ()=>{
    delete autoSaveTimers[engId];
    if(!dirty[engId]) return;
    await saveEngineer(engId);
    if(state.engId === engId) renderEngineer();
  }, 900);
}
function doSave(engId){
  clearTimeout(autoSaveTimers[engId]);
  delete autoSaveTimers[engId];
  saveEngineer(engId).finally(()=> renderEngineer());
}
function switchProject(engId, projId){
  cache[engId].activeProjectId = projId;
  saveActiveProjectId(engId, projId);
  renderEngineer();
}
function setProjectFinished(engId, projId, value){
  const data = cache[engId];
  const project = data.projects.find(p=>p.id===projId);
  project.finished = value;
  if(!value) project.outcome = null; // reopening a project clears its win/loss result
  markDirty(engId);
}
function setProjectOutcome(engId, projId, value){
  const data = cache[engId];
  const project = data.projects.find(p=>p.id===projId);
  project.outcome = (project.outcome === value) ? null : value; // click again to clear
  markDirty(engId);
}
function toggleAddProject(){
  state.addingProject = !state.addingProject;
  renderEngineer();
}
function createProject(engId){
  const name = document.getElementById('np-name').value.trim() || DASH_CONFIG?.projectDefaults?.name || '';
  const delivery = document.getElementById('np-delivery').value;
  const inquiry = document.getElementById('np-inquiry').value;
  const proj = newProject(name);
  proj.deliveryDate = delivery;
  proj.inquiryDate = inquiry;
  cache[engId].projects.push(proj);
  cache[engId].activeProjectId = proj.id;
  saveActiveProjectId(engId, proj.id);
  state.addingProject = false;
  markDirty(engId);
}
function deleteProject(engId, projId){
  const data = cache[engId];
  const project = data.projects.find(p=>p.id===projId);
  if(!project) return;
  const taskStates = Object.keys(project.tasks || {}).length;
  const customTasks = (project.customTasks || []).length;
  const hasrTeam = TEAMS.find(t=>t.type==='hasr');
  const hasrItem = hasrTeam && (HASR_CACHE[hasrTeam.id] || []).some(x=>x.id==='sync_'+projId);
  showConfirmDialog({
    detailsMessage: `سيُحذف المشروع «${project.name || 'بدون اسم'}» من قاعدة البيانات ولا يمكن التراجع عن العملية.<br><br>يشمل الحذف: بيانات المشروع، ${taskStates} حالة مهمة أساسية، ${customTasks} مهمة مضافة${hasrItem ? '، وسجل المشروع المتزامن مع قسم الحصر' : ''}.<br><br>لن تتأثر مشاريع المهندس الأخرى أو بيانات بقية المهندسين.`,
    title: '🗄️ أرشفة المشروع',
    message: `هل تريد نقل المشروع "${project.name || 'بدون اسم'}" إلى الأرشيف وإخفاءه من قوائم الموظفين؟`,
    confirmText: 'أرشفة المشروع',
    onConfirm: async () => {
      try{
        const archivedBy = encodeURIComponent(SESSION?.name || '');
        const res = await fetch('/api/dashboard/engineers/'+encodeURIComponent(engId)+'/projects/'+encodeURIComponent(projId), { method:'DELETE', headers:{'X-User-Name':archivedBy} });
        if(!res.ok) throw new Error('Unable to archive the project in the database (' + res.status + ')');
        const result = await res.json();
        data.projects = data.projects.filter(p=>p.id!==projId);
        data.activeProjectId = data.projects[0]?.id || null;
        if(hasrTeam) HASR_CACHE[hasrTeam.id] = (HASR_CACHE[hasrTeam.id] || []).filter(x=>x.id!=='sync_'+projId);
        flashSave(true, `تمت أرشفة «${project.name || 'المشروع'}» وإخفاؤه من القوائم.`);
        renderEngineer();
      }catch(e){
        console.error('project deletion failed', e);
        flashSave(false, 'فشل حذف المشروع: '+friendlyErrorMsg(e), 6000);
      }
    }
  });
}

/* ---- diagrams page ---- */
function pctBarMini(pct, color){
  return `<span class="pct-mini"><span class="mini-track"><span class="mini-fill" style="width:${pct}%;background:${color}"></span></span><b>${pct}%</b></span>`;
}
function engineerReportRow(e, team){
  const es = engineerStats(e.id);
  const ps = engineerProjectSummary(e.id);
  return `
    <tr>
      <td class="name">${e.name}</td>
      <td>${pctBarMini(es.pct, team.color)}</td>
      <td>${ps.totalProjects}</td>
      <td class="num-ongoing">${ps.ongoing}</td>
      <td>${ps.finished}</td>
      <td class="num-won">${ps.won}</td>
      <td class="num-lost">${ps.lost}</td>
    </tr>`;
}
function reportTableHead(){
  return `<thead><tr>
    <th>المهندس</th><th>نسبة إنجاز المهام</th><th>عدد المشاريع</th><th>جارية</th><th>منتهية</th><th>${outcomeLabel('won','فوز 🏆')}</th><th>${outcomeLabel('lost','خسارة ✗')}</th>
  </tr></thead>`;
}
async function loadFieldEditor(){
  try {
    const res = await fetch('/api/fields', { cache:'no-store' });
    if(!res.ok) throw new Error('field load failed');
    const json = await res.json();
    const normalized = json?.fields || [];
    FIELD_EDITOR.task = (normalized.filter(x => (x.scope || x.Scope) === 'task')).map(x => ({
      id: x.id || x.Id || '',
      label: x.label || x.Label || '',
      type: x.type || x.Type || 'text',
      required: !!(x.required ?? x.IsRequired ?? false),
      isActive: x.isActive ?? x.IsActive ?? true,
      sortOrder: x.sortOrder ?? x.SortOrder ?? 0
    }));
    FIELD_EDITOR.customTask = (normalized.filter(x => (x.scope || x.Scope) === 'customTask')).map(x => ({
      id: x.id || x.Id || '',
      label: x.label || x.Label || '',
      type: x.type || x.Type || 'text',
      required: !!(x.required ?? x.IsRequired ?? false),
      isActive: x.isActive ?? x.IsActive ?? true,
      sortOrder: x.sortOrder ?? x.SortOrder ?? 0
    }));
    FIELD_EDITOR.hasr = (normalized.filter(x => (x.scope || x.Scope) === 'hasr')).map(x => ({
      id: x.id || x.Id || '',
      label: x.label || x.Label || '',
      type: x.type || x.Type || 'text',
      required: !!(x.required ?? x.IsRequired ?? false),
      isActive: x.isActive ?? x.IsActive ?? true,
      sortOrder: x.sortOrder ?? x.SortOrder ?? 0
    }));
  } catch (e) {
    console.warn('Unable to load field editor data', e);
    FIELD_EDITOR.task = (DASH_CONFIG?.taskFields || []).map(x => ({ ...x, id: x.id || '', label: x.label || '', type: x.type || 'text', required: !!x.required, isActive: true, sortOrder: 0 }));
    FIELD_EDITOR.customTask = (DASH_CONFIG?.customTaskFields || []).map(x => ({ ...x, id: x.id || '', label: x.label || '', type: x.type || 'text', required: !!x.required, isActive: true, sortOrder: 0 }));
    FIELD_EDITOR.hasr = (DASH_CONFIG?.hasrFields || []).map(x => ({ ...x, id: x.id || '', label: x.label || '', type: x.type || 'text', required: !!x.required, isActive: true, sortOrder: 0 }));
  }
}

function renderMasterData(){
  const scopes = [
    { key: 'task', label: 'حقول المهام القياسية', values: FIELD_EDITOR.task },
    { key: 'customTask', label: 'حقول المهام المخصصة', values: FIELD_EDITOR.customTask },
    { key: 'hasr', label: 'حقول قسم الحصر', values: FIELD_EDITOR.hasr }
  ];

  const scopeHtml = scopes.map(scope => {
    const rows = (scope.values || []).map((item, index) => `
      <div class="task-block">
        <div class="task-controls">
          <div class="ctrl">
            <label>معرف الحقل</label>
            <input type="text" value="${(item.id || '').replace(/"/g, '&quot;')}" onchange="updateFieldEditor('${scope.key}', ${index}, 'id', this.value)">
          </div>
          <div class="ctrl">
            <label>التسمية</label>
            <input type="text" value="${(item.label || '').replace(/"/g, '&quot;')}" onchange="updateFieldEditor('${scope.key}', ${index}, 'label', this.value)">
          </div>
          <div class="ctrl">
            <label>النوع</label>
            <select onchange="updateFieldEditor('${scope.key}', ${index}, 'type', this.value)">
              ${['text','date','number','checkbox','select'].map(type => `<option value="${type}" ${item.type === type ? 'selected' : ''}>${type}</option>`).join('')}
            </select>
          </div>
          <div class="ctrl">
            <label>ترتيب</label>
            <input type="number" value="${item.sortOrder ?? 0}" onchange="updateFieldEditor('${scope.key}', ${index}, 'sortOrder', Number(this.value))">
          </div>
          <div class="ctrl">
            <label>إجباري</label>
            <input type="checkbox" ${item.required ? 'checked' : ''} onchange="updateFieldEditor('${scope.key}', ${index}, 'required', this.checked)">
          </div>
          <div class="ctrl">
            <label>مفعل</label>
            <input type="checkbox" ${item.isActive !== false ? 'checked' : ''} onchange="updateFieldEditor('${scope.key}', ${index}, 'isActive', this.checked)">
          </div>
          <div class="ctrl">
            <label>&nbsp;</label>
            <button class="btn ghost" onclick="removeFieldEditor('${scope.key}', ${index})">🗑 حذف</button>
          </div>
        </div>
      </div>
    `).join('') || '<p style="color:var(--ink-dim); padding:8px 0;">لا توجد حقول في هذا النطاق بعد.</p>';

    return `
      <div class="chart-panel">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:12px;">
          <h3 style="margin:0;">${scope.label}</h3>
          <button class="btn primary" onclick="addFieldEditor('${scope.key}')">+ إضافة حقل جديد</button>
        </div>
        ${rows}
      </div>
    `;
  }).join('');

  app.innerHTML = `
    ${crumbHTML(`<span>الرئيسية</span> / <b>الماستر داتا</b>`, true)}
    <div class="section-title">الماستر داتا</div>
    <div style="margin-bottom:16px;">
      <button class="btn primary" onclick="saveFieldEditor()">💾 حفظ كل الحقول</button>
      <button class="btn ghost" onclick="go('home')">رجوع للرئيسية</button>
    </div>
    ${scopeHtml}
  `;
}

function renderFieldManagement(){
  renderMasterData();
}

function renderAddEmployee(){
  const options = TEAMS.filter(t => (t.type || 'main') !== 'hasr').map(team => `
    <option value="${team.id}">${teamName(team)} — ${team.manager}</option>
  `).join('');

  app.innerHTML = `
    ${crumbHTML(`<span>الرئيسية</span> / <b>إضافة موظف</b>`, true)}
    <div class="section-title">إضافة موظف جديد</div>
    <div class="chart-panel">
      <div class="field">
        <label>اختر الفريق</label>
        <select id="newEmployeeTeam">
          <option value="">— اختر الفريق —</option>
          ${options}
        </select>
      </div>
      <div class="field">
        <label>اسم الموظف</label>
        <input type="text" id="newEmployeeName" placeholder="اكتب اسم الموظف بالكامل">
      </div>
      <div class="field">
        <label>إيميل الشركة</label>
        <input type="email" id="newEmployeeEmail" placeholder="name@company.com">
      </div>
      <div class="field">
        <label>رقم التليفون</label>
        <input type="tel" id="newEmployeePhone" placeholder="رقم التليفون">
      </div>
      <div class="field">
        <label>الكود الوظيفي</label>
        <input type="text" id="newEmployeeCode" placeholder="الكود الوظيفي">
      </div>
      <div class="modal-actions">
        <button class="btn ghost" onclick="go('home')">إلغاء</button>
        <button class="btn primary" onclick="saveNewEmployeeFromScreen()">إضافة الموظف</button>
      </div>
    </div>
  `;
}

async function saveNewEmployeeFromScreen(){
  const teamId = document.getElementById('newEmployeeTeam').value;
  const nameInput = document.getElementById('newEmployeeName');
  const name = (nameInput.value || '').trim();
  const companyEmail = (document.getElementById('newEmployeeEmail').value || '').trim();
  const phoneNumber = (document.getElementById('newEmployeePhone').value || '').trim();
  const employeeCode = (document.getElementById('newEmployeeCode').value || '').trim();

  if(!teamId){
    flashSave(false, 'اختر فريقاً أولاً', 2500);
    return;
  }
  if(!name){
    nameInput.focus();
    flashSave(false, 'اكتب اسم الموظف', 2500);
    return;
  }

  const team = TEAMS.find(t => t.id === teamId);
  if(!team){
    flashSave(false, 'الفريق غير موجود', 2500);
    return;
  }

  const newId = teamId + 'e_' + Date.now().toString(36);
  team.engineers.push({ id: newId, name, companyEmail, phoneNumber, employeeCode, photoData:null });
  state.addingEngineerTeam = null;
  await loadEngineer(newId);
  await saveRoster();
  flashSave(true, '✓ تم إضافة الموظف بنجاح');
  go('home');
}

function addFieldEditor(scopeKey){
  const current = FIELD_EDITOR[scopeKey] || [];
  current.push({
    id: `new_${scopeKey}_${Date.now()}`,
    label: 'حقل جديد',
    type: 'text',
    required: false,
    isActive: true,
    sortOrder: current.length
  });
  FIELD_EDITOR[scopeKey] = current;
  renderFieldManagement();
}

function updateFieldEditor(scopeKey, index, field, value){
  const item = FIELD_EDITOR[scopeKey][index];
  if(!item) return;
  if (field === 'sortOrder' && typeof value !== 'number') value = Number(value) || 0;
  item[field] = value;
  renderFieldManagement();
}

function removeFieldEditor(scopeKey, index){
  FIELD_EDITOR[scopeKey] = (FIELD_EDITOR[scopeKey] || []).filter((_, i) => i !== index);
  renderFieldManagement();
}

async function saveFieldEditor(){
  const payload = [];
  for (const [scopeKey, items] of Object.entries(FIELD_EDITOR)) {
    for (const item of items || []) {
      if (!item || !item.id || !item.label || !item.type) continue;
      payload.push({
        scope: scopeKey,
        id: String(item.id).trim(),
        label: String(item.label).trim(),
        type: String(item.type).trim(),
        sortOrder: Number(item.sortOrder || 0),
        isRequired: !!item.required,
        isActive: item.isActive !== false
      });
    }
  }

  try {
    const res = await fetch('/api/fields', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if(!res.ok) throw new Error('save failed');
    await loadBootstrap();
    await loadFieldEditor();
    flashSave(true, '✓ تم حفظ الحقول الديناميكية');
    go('home');
  } catch (e) {
    console.error(e);
    flashSave(false, 'تعذّر حفظ الحقول الديناميكية');
  }
}

function renderDiagrams(){
  const cs = companyStats();
  const cps = companyProjectSummary();
  const donutStyle = `background:conic-gradient(var(--amber) ${cs.pct*3.6}deg, rgba(255,255,255,.08) 0deg)`;

  // --- team comparison table (القسم الرئيسي) ---
  const sortedTeams = mainTeams().slice().sort((a,b)=> teamStats(b).pct - teamStats(a).pct);
  const teamTableRows = sortedTeams.map(t=>{
    const s = teamStats(t);
    const ps = teamProjectSummary(t);
    return `
      <tr>
        <td class="name">${teamName(t)}</td>
        <td>${t.manager}</td>
        <td>${t.engineers.length}</td>
        <td>${pctBarMini(s.pct, t.color)}</td>
        <td>${ps.totalProjects}</td>
        <td class="num-ongoing">${ps.ongoing}</td>
        <td>${ps.finished}</td>
        <td class="num-won">${ps.won}</td>
        <td class="num-lost">${ps.lost}</td>
      </tr>`;
  }).join('');

  // --- per-engineer table, grouped by team, across the whole main division ---
  const engTableRows = sortedTeams.map(t=>{
    const groupRow = `<tr class="group-row"><td colspan="7">${teamName(t)} — مدير الفريق: ${t.manager}</td></tr>`;
    const rows = t.engineers.map(e=> engineerReportRow(e, t)).join('');
    return groupRow + rows;
  }).join('');

  // --- قسم السعودية ---
  const saudiTeam = TEAMS.find(t=>t.division==='saudi');
  let saudiPanel = '';
  if(saudiTeam){
    const ss = teamStats(saudiTeam);
    const sps = teamProjectSummary(saudiTeam);
    const saudiEngRows = saudiTeam.engineers.map(e=> engineerReportRow(e, saudiTeam)).join('');
    saudiPanel = `
    <div class="chart-panel">
      <h3>🇸🇦 قسم السعودية — ${teamName(saudiTeam)} (مدير: ${saudiTeam.manager})</h3>
      <div class="report-summary-row" style="margin-bottom:16px;">
        <div class="stat-chip total"><div class="v">${ss.pct}%</div><div class="l">نسبة إنجاز المهام</div></div>
        <div class="stat-chip total"><div class="v">${sps.totalProjects}</div><div class="l">إجمالي المشاريع</div></div>
        <div class="stat-chip pct"><div class="v">${sps.ongoing}</div><div class="l">جارية</div></div>
        <div class="stat-chip done"><div class="v">${sps.won}</div><div class="l">${outcomeLabel('won','فوز')}</div></div>
        <div class="stat-chip remain"><div class="v">${sps.lost}</div><div class="l">${outcomeLabel('lost','خسارة')}</div></div>
      </div>
      <div class="report-table-wrap"><table class="report-table">${reportTableHead()}<tbody>${saudiEngRows}</tbody></table></div>
    </div>`;
  }

  // --- قسم الحصر ---
  const hasrTeam = TEAMS.find(t=>t.type==='hasr');
  let hasrPanel = '';
  if(hasrTeam){
    const list = HASR_CACHE[hasrTeam.id] || [];
    const total = list.length;
    const withWork = list.filter(x=>x.hasWork===true).length;
    const noWork = list.filter(x=>x.hasWork===false).length;
    const undecided = total - withWork - noWork;
    const doneCount = list.filter(x=>x.hasWork===true && x.hasrDone).length;
    const inProgressCount = withWork - doneCount;
    hasrPanel = `
    <div class="chart-panel">
      <h3>📐 قسم الحصر — ${teamName(hasrTeam)} (مدير: ${hasrTeam.manager})</h3>
      <div class="report-summary-row">
        <div class="stat-chip total"><div class="v">${total}</div><div class="l">إجمالي المشاريع الواردة</div></div>
        <div class="stat-chip pct"><div class="v">${undecided}</div><div class="l">لم يُحدد بعد</div></div>
        <div class="stat-chip remain"><div class="v">${noWork}</div><div class="l">لا يوجد عمل</div></div>
        <div class="stat-chip pct"><div class="v">${inProgressCount}</div><div class="l">جاري العمل عليها</div></div>
        <div class="stat-chip done"><div class="v">${doneCount}</div><div class="l">تم الحصر بالكامل</div></div>
      </div>
    </div>`;
  }

  app.innerHTML = `
    ${crumbHTML(`<span>الرئيسية</span> / <b>التقارير والرسوم البيانية</b>`, true)}

    <div class="chart-panel">
      <h3>نظرة عامة على القسم الرئيسي</h3>
      <div class="donut-wrap">
        <div class="donut" style="${donutStyle}"><div class="val"><b>${cs.pct}%</b><span>نسبة الإنجاز العامة</span></div></div>
        <div class="report-summary-row" style="flex:1; min-width:260px;">
          <div class="stat-chip total"><div class="v">${cs.total}</div><div class="l">مهام إجمالية</div></div>
          <div class="stat-chip done"><div class="v">${cs.done}</div><div class="l">منجزة</div></div>
          <div class="stat-chip remain"><div class="v">${cs.remaining}</div><div class="l">متبقية</div></div>
          <div class="stat-chip total"><div class="v">${cps.totalProjects}</div><div class="l">إجمالي المشاريع</div></div>
          <div class="stat-chip pct"><div class="v">${cps.ongoing}</div><div class="l">جارية</div></div>
          <div class="stat-chip done"><div class="v">${cps.won}</div><div class="l">${outcomeLabel('won','فوز 🏆')}</div></div>
          <div class="stat-chip remain"><div class="v">${cps.lost}</div><div class="l">${outcomeLabel('lost','خسارة ✗')}</div></div>
        </div>
      </div>
    </div>

    <div class="chart-panel">
      <h3>مقارنة أداء الفرق الأربعة (القسم الرئيسي)</h3>
      <div class="report-table-wrap">
        <table class="report-table">
          <thead><tr>
            <th>الفريق</th><th>المدير</th><th>مهندسين</th><th>نسبة إنجاز المهام</th>
            <th>مشاريع</th><th>جارية</th><th>منتهية</th><th>${outcomeLabel('won','فوز 🏆')}</th><th>${outcomeLabel('lost','خسارة ✗')}</th>
          </tr></thead>
          <tbody>${teamTableRows}</tbody>
        </table>
      </div>
    </div>

    <div class="chart-panel">
      <h3>أداء كل مهندس — عدد المشاريع، الجارية، المنتهية، الفوز والخسارة</h3>
      <div class="report-table-wrap">
        <table class="report-table">${reportTableHead()}<tbody>${engTableRows}</tbody></table>
      </div>
    </div>

    ${saudiPanel}
    ${hasrPanel}
  `;
}

function renderNotifications(){
  if(!SESSION || SESSION.role !== 'engineer') return go('home');
  const items = NOTIFICATIONS.items || [];
  app.innerHTML = `${crumbHTML('الإشعارات', true)}
    <section class="panel">
      <div class="panel-head"><h2>مركز الإشعارات</h2><button class="btn ghost" onclick="markAllNotificationsRead()">تحديد الكل كمقروء</button></div>
      ${items.length ? `<div class="notification-list">${items.map(item => `<article class="notification-item ${item.readAt ? '' : 'unread'}" onclick="markNotificationRead(${item.id})"><div><strong>${escapeHtml(item.title || '')}</strong><p>${escapeHtml(item.message || '')}</p></div><time>${new Date(item.createdAt).toLocaleString('ar-EG')}</time></article>`).join('')}</div>` : '<p class="empty-state">لا توجد إشعارات حالياً.</p>'}
    </section>`;
}

function escapeHtml(value){
  return String(value).replace(/[&<>'"]/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character]));
}

function render(){
  enforceAccess();
  renderCompanyStrip();
  if(state.screen==='login') renderLogin();
  else if(state.screen==='home') renderHome();
  else if(state.screen==='teams') renderTeams();
  else if(state.screen==='manageTeams') renderManageTeams();
  else if(state.screen==='addEmployee') renderAddEmployee();
  else if(state.screen==='myTasks') renderEngineer();
  else if(state.screen==='teamDetail') renderTeamDetail();
  else if(state.screen==='teamHome') renderTeamHome();
  else if(state.screen==='hasrHome') renderHasrHome();
  else if(state.screen==='engineerPicker') renderEngineerPicker();
  else if(state.screen==='projects') renderProjects();
  else if(state.screen==='engineer') renderEngineer();
  else if(state.screen==='profile') renderProfile();
  else if(state.screen==='notifications') renderNotifications();
  else if(state.screen==='archives') renderArchives();
  else if(state.screen==='emailSettings') renderEmailSettings();
  else if(state.screen==='diagrams') renderDiagrams();
  else if(state.screen==='fieldConfig') renderFieldManagement();
  renderModalOverlay();
}

function renderEmailSettings(){
  if(!SESSION || SESSION.role !== 'dept') return go('home');

  const emailCfg = (DASH_CONFIG && DASH_CONFIG.emailSettings) || {
    enabled: false,
    host: '',
    port: 587,
    enableSsl: true,
    from: '',
    userName: '',
    password: '',
    includeProjectOwner: true,
    includeTeamMembers: true,
    defaultRecipients: []
  };

  const recipients = (emailCfg.defaultRecipients || []).join(', ');

  app.innerHTML = `
    ${crumbHTML(`<span>الرئيسية</span> / <b>إعدادات البريد</b>`, true)}
    <div class="section-title">إعدادات البريد الإلكتروني</div>
    <div class="chart-panel">
      <div class="field" style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
        <input type="checkbox" id="email-enabled" ${emailCfg.enabled ? 'checked' : ''}>
        <label for="email-enabled" style="margin:0; cursor:pointer;">تفعيل إرسال البريد عند إضافة مشروع جديد</label>
      </div>

      <div class="field"><label>خادم SMTP</label><input type="text" id="email-host" value="${escapeHtml(emailCfg.host || '')}" placeholder="smtp.gmail.com"></div>
      <div class="field"><label>منفذ SMTP</label><input type="number" id="email-port" value="${emailCfg.port || 587}"></div>
      <div class="field" style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
        <input type="checkbox" id="email-ssl" ${emailCfg.enableSsl !== false ? 'checked' : ''}>
        <label for="email-ssl" style="margin:0; cursor:pointer;">استخدام SSL/TLS</label>
      </div>
      <div class="field"><label>عنوان البريد المرسل</label><input type="email" id="email-from" value="${escapeHtml(emailCfg.from || '')}" placeholder="noreply@company.com"></div>
      <div class="field"><label>اسم المستخدم SMTP</label><input type="text" id="email-user" value="${escapeHtml(emailCfg.userName || '')}" placeholder="your-account@gmail.com"></div>
      <div class="field"><label>كلمة مرور SMTP</label><input type="password" id="email-password" value="${escapeHtml(emailCfg.password || '')}" placeholder="App Password"></div>

      <div class="field" style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
        <input type="checkbox" id="email-include-owner" ${emailCfg.includeProjectOwner !== false ? 'checked' : ''}>
        <label for="email-include-owner" style="margin:0; cursor:pointer;">إرسال إلى صاحب المشروع</label>
      </div>
      <div class="field" style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
        <input type="checkbox" id="email-include-team" ${emailCfg.includeTeamMembers !== false ? 'checked' : ''}>
        <label for="email-include-team" style="margin:0; cursor:pointer;">إرسال إلى أعضاء الفريق</label>
      </div>

      <div class="field"><label>بريد إضافي (افصل بين العناوين بفواصل)</label><textarea id="email-recipients" rows="4" placeholder="admin@company.com, manager@company.com">${escapeHtml(recipients)}</textarea></div>

      <div class="modal-actions">
        <button class="btn ghost" onclick="go('home')">إلغاء</button>
        <button class="btn primary" onclick="saveEmailSettings()">💾 حفظ إعدادات البريد</button>
      </div>
    </div>
  `;
}

async function saveEmailSettings(){
  if(!SESSION || SESSION.role !== 'dept') return;
  const payload = {
    deptManager: DEPT_MANAGER,
    projectDefaults: {
      name: DASH_CONFIG?.projectDefaults?.name || '',
      deliveryDate: DASH_CONFIG?.projectDefaults?.deliveryDate || '',
      inquiryDate: DASH_CONFIG?.projectDefaults?.inquiryDate || ''
    },
    emailSettings: {
      enabled: document.getElementById('email-enabled').checked,
      host: (document.getElementById('email-host').value || '').trim(),
      port: Number(document.getElementById('email-port').value || 587),
      enableSsl: document.getElementById('email-ssl').checked,
      from: (document.getElementById('email-from').value || '').trim(),
      userName: (document.getElementById('email-user').value || '').trim(),
      password: (document.getElementById('email-password').value || '').trim(),
      includeProjectOwner: document.getElementById('email-include-owner').checked,
      includeTeamMembers: document.getElementById('email-include-team').checked,
      defaultRecipients: (document.getElementById('email-recipients').value || '')
        .split(',')
        .map(x => x.trim())
        .filter(Boolean)
    }
  };

  try {
    const res = await fetch('/api/dashboard/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if(!res.ok) throw new Error('save failed');
    DASH_CONFIG = await fetch('/api/dashboard/config', { cache: 'no-store' }).then(r => r.json());
    flashSave(true, '✓ تم حفظ إعدادات البريد');
    go('home');
  } catch (e) {
    console.error(e);
    flashSave(false, 'تعذر حفظ إعدادات البريد');
  }
}

/* ============ INIT ============ */
(async function init(){
  try{
    await loadBootstrap();
    await loadFieldEditor();
  }catch(e){
    console.error('bootstrap load failed', e);
    app.innerHTML = `<div class="data-error"><h2>تعذّر الاتصال ببيانات النظام</h2><p>لم يتم عرض بيانات بديلة. تأكد من تشغيل الخادم واتصال SQL Server ثم أعد المحاولة.</p><button class="btn primary" onclick="location.reload()">إعادة المحاولة</button></div>`;
    flashSave(false, 'تعذّر تحميل بيانات النظام من الخادم: ' + friendlyErrorMsg(e), 9000);
    return;
  }
  await loadRoster();
  await loadAuth();
  const savedSession = readSavedSession();
  if(savedSession){
    try{
      const valid = savedSession.role === 'dept'
        || (savedSession.role === 'team' && TEAMS.some(t=>t.id===savedSession.id))
        || (savedSession.role === 'engineer' && TEAMS.some(t=>t.engineers.some(e=>e.id===savedSession.id)));
      if(valid) await completeLogin(savedSession.role, savedSession.id);
      else clearSavedSession();
    }catch(e){
      console.error('session restore failed', e);
      clearSavedSession();
      SESSION = null;
    }
  }
  if(!SESSION) render();
})();
