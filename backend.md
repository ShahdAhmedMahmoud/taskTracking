Tender Dashboard — Backend Requirements (Phase 2)

Stack الحالي: ASP.NET Core 9 · EF Core 9 · SQL Server (+ SQLite للتطوير) · REST فقط. الواجهة: React (RTL عربي) بتتبني دلوقتي على mocks بنفس الـ contracts المكتوبة هنا — يعني أي اختلاف في الشكل لازم يتنسق مع الـ Frontend.

ملحوظة عامة: كل الأسماء بالـ camelCase في JSON، والتواريخ ISO-8601 UTC، والـ IDs نصوص (string) إلا لو اتذكر غير كده.

0) قواعد عامة تنطبق على كل الـ endpoints الجديدة
الصلاحيات: كل endpoint مكتوب جنبه dept = مدير القسم فقط. لازم يتحقق في السيرفر من الـ role الحقيقي (من JWT/cookie)، مش من headers زي X-User-Role لأن أي حد يقدر يزوّرها. لو التحقق الحقيقي لسه مش موجود → انظر القسم 6 (شرط أساسي).
شكل الخطأ الموحد:
json
   { "error": "رسالة عربية مفهومة للمستخدم", "code": "MACHINE_READABLE_CODE", "details": {} }

مع status codes: 400 validation · 401 · 403 · 404 · 409 conflict · 422 business rule. 3. Audit: كل عملية كتابة جديدة بتتسجل في AuditLogs (مين، إمتى، إيه، قبل/بعد باختصار). 4. Transactions: أي عملية بتغيّر أكتر من جدول (restore / delete / apply-template) تتنفذ في transaction واحدة. 5. Pagination: cursor-based. الـ response دايمًا { "items": [...], "nextCursor": "string|null" }. 6. الـ Header الحالي X-User-Name بيفضل شغال لحد ما الـ auth الحقيقي يتفعّل، وبعدها الاسم يتاخد من الـ token.

1) الأرشيف — Archive (dept فقط)
1.1 تعديلات على جدول ProjectArchives
العمود	النوع	ملاحظة
Id	string/guid	PK
ProjectId	string	الـ id الأصلي للمشروع (مهم للاسترجاع)
EngineerId	string	المهندس وقت الأرشفة
EngineerName	string	نسخة وقت الأرشفة (لو المهندس اتحذف بعدين)
TeamId, TeamName	string	نسخة وقت الأرشفة
ProjectName	string	
SnapshotJson	nvarchar(max)	Snapshot كامل للمشروع بنفس شكل الـ project في GET /api/dashboard/engineers/{id} (tasks map + customTasks + dates + finished + outcome + templateId + notes)
HasrSnapshotJson	nvarchar(max) null	سجل الحصر المتزامن sync_{projectId} وقت الأرشفة (hasWork, hasrDueDate, hasrDone, hasrNotes)
ArchivedAt, ArchivedBy	datetime / string	موجودين
Reason	string null	سبب اختياري

شرط مهم — الملفات: عند الأرشفة ممنوع يحصل cascade delete لـ ProjectAttachments / TFiles / TRounds / TVersions ولا يتمسح الملف من App_Data/Attachments. الملفات تفضل مربوطة بالـ ProjectId (أو تتعلّم ArchivedAt) وتتخفي من الـ API العادي، عشان الاسترجاع يرجّعها. ولو الحل الحالي بيمسحها وقت الأرشفة → لازم يتغير (وإلا الاسترجاع هيفقد المرفقات).

1.2 Endpoints
GET /api/dashboard/archives — dept

Query اختياري: q, teamId, engineerId, from, to, cursor, limit (default 50).

json
{
  "items": [{
    "id": "arc_123",
    "projectId": "p1712345678",
    "projectName": "مجمع الشروق السكني",
    "engineerId": "t1e_ab12",
    "engineerName": "أحمد علي",
    "teamId": "t1",
    "teamName": "فريق 1",
    "archivedAt": "2026-10-05T09:12:00Z",
    "archivedBy": "اسم مدير القسم",
    "reason": null,
    "summary": { "finished": true, "outcome": "won", "progressPct": 72.5, "tasksDone": 29, "tasksTotal": 40, "deliveryDate": "2026-09-30" },
    "filesCount": 6
  }],
  "nextCursor": null
}

(الشكل القديم — array مباشرة — يفضل مدعوم مؤقتًا للتوافق.)

GET /api/dashboard/archives/{id} — dept

بيرجّع نفس عناصر الـ list + :

json
{
  "...": "كل حقول الـ list",
  "snapshot": { "id": "p1712345678", "name": "...", "deliveryDate": "...", "inquiryDate": "...", "finished": true, "outcome": "won",
                "templateId": "temp1", "tasks": { "1": { "status": true, "review": false, "applicable": true, "dueDate": "", "department": "قسم أ،قسم ب", "notes": "" } },
                "customTasks": [] },
  "hasr": { "hasWork": true, "hasrDueDate": "2026-09-20", "hasrDone": true, "hasrNotes": "" },
  "files": { "attachments": [ { "id": 1, "attachmentName": "...", "originalFileName": "...", "fileType": ".pdf", "fileSize": 1234, "downloadUrl": "/api/files/download/attachment/1" } ], "tFiles": [] }
}

تحميل الملفات من الأرشيف: GET /api/files/download/{kind}/{id} يشتغل لـ dept حتى لو المشروع مؤرشف.

POST /api/dashboard/archives/{id}/restore — dept

Body (اختياري):

json
{ "targetEngineerId": "t2e_xx" }

القواعد:

يعيد إنشاء المشروع من SnapshotJson بنفس الـ ProjectId (لو الـ id مستخدم → يتولد id جديد ويتحدّث hasr sync على أساسه).
يرجّع المشروع "جاري": finished=false و outcome=null (زي منطق reopen الحالي).
المهندس: الأصلي (EngineerId) لو لسه موجود وغير محذوف. لو غير موجود:
لو targetEngineerId متبعت → يستخدمه.
غير كده → 409 بـ code: "ENGINEER_NOT_FOUND" (الواجهة بتعرض اختيار مهندس وتعيد الطلب).
يعيد سجل الحصر sync_{projectId} في HasrProjects من HasrSnapshotJson (أو سجل جديد hasWork=null لو مفيش snapshot) — داخل نفس الـ transaction.
يرجّع الملفات (شيل علامة الأرشفة).
يمسح سجل الأرشيف (أو يعلّمه RestoredAt ويخفيه من القائمة — يفضل حذف فعلي مع Audit).
يولّد ActivityEvent من نوع project.restored.
Response 200:
json
  { "projectId": "p1712345678", "engineerId": "t1e_ab12", "restored": true }
Idempotent: لو الأرشيف اتسترجع قبل كده → 404.
DELETE /api/dashboard/archives/{id} — dept

حذف نهائي (لا رجعة): سجل الأرشيف + الـ snapshot + كل الملفات (rows + ملفات القرص) + أي بقايا مرتبطة.

لو مسح ملف القرص فشل → لا يفشل الطلب كله، يتسجل في log ويتحط في queue تنضيف.
يولّد ActivityEvent من نوع project.deleted (بالاسم لأن المشروع هيختفي).
Response 204.
Audit إجباري.
تعديل DELETE /api/dashboard/engineers/{id}/projects/{projectId} (الأرشفة الحالية)

يملأ الأعمدة الجديدة (Snapshot / Team / Engineer names / Hasr snapshot) ويولّد project.archived event.

2) الإشعارات والنشاط لمدير القسم — Activity Feed
2.1 الجداول

ActivityEvents

العمود	النوع	ملاحظة
Id	bigint identity	
Type	varchar(40)	enum تحت
CreatedAt	datetime2	index (desc)
UpdatedAt	datetime2	للأحداث المجمّعة (coalesced)
ActorEngineerId	string null	مين عمل الحدث (null لو النظام)
ActorName	string	نسخة وقت الحدث
ActorRole	varchar(10)	engineer / team / dept / system
TeamId, TeamName	string null	
ProjectId, ProjectName	string null	
MetaJson	nvarchar(max)	تفاصيل حسب النوع (تحت)
Message	nvarchar(500)	جملة عربية جاهزة (fallback للواجهة)

Indexes: (CreatedAt desc), (TeamId, CreatedAt), (ActorEngineerId, CreatedAt), (Type, CreatedAt), (ProjectId, CreatedAt).

القراءة (لكل مستخدم dept لأن ممكن يكونوا أكتر من واحد):

ActivityEventReads(EventId, UserId, ReadAt) — PK مركب.
ActivityReadState(UserId, ReadAllBefore) — علامة "تحديد الكل كمقروء" عشان منعملش آلاف الـ rows.
الـ event يعتبر غير مقروء لو CreatedAt > ReadAllBefore و مفيش row في ActivityEventReads.

Retention: حذف أو أرشفة الأحداث الأقدم من 12 شهر (job يومي، قابل للضبط من DashboardSettings).

2.2 أنواع الأحداث (Type) و MetaJson
Type	متى	MetaJson
task.completed	status false→true	{ "taskId": "5", "taskTitle": "...", "isCustom": false, "count": 1, "taskIds": ["5"] }
task.reopened	status true→false	نفس الشكل
task.reviewed	review تغيّر	{ taskId, taskTitle, value: true }
task.applicability	applicable تغيّر (بما فيها تطبيق template)	{ count, included: n, excluded: n }
task.updated	dueDate / department / notes	{ taskId, taskTitle, field, from, to } (مجمّع)
task.custom_added / task.custom_removed	مهمة مخصصة اتضافت / اتحذفت	{ taskId, taskTitle }
project.created	مشروع جديد	{ deliveryDate, inquiryDate, templateId }
project.updated	name / deliveryDate / inquiryDate / note	{ changes: [{ field, from, to }] }
project.finished	finished false→true	{ tasksDone, tasksTotal, remaining }
project.reopened	finished true→false	{}
project.outcome	outcome تغيّر	{ from, to } (won / lost / null)
project.template_applied	تغيير template	{ templateId, templateName, selected, total }
project.archived	أرشفة	{ archiveId, reason }
project.restored	استرجاع	{ archiveId, engineerId }
project.deleted	حذف نهائي من الأرشيف	{ archiveId }
file.uploaded / file.deleted	مرفق / T-File / Round / Version	`{ kind: "attachment
hasr.updated	تحديث من قسم الحصر (hasWork / hasrDone / ملاحظات)	{ hasWork, hasrDone, hasrNotes }
profile.updated	تعديل بروفايل مهندس	{ fields: ["companyEmail", "phoneNumber"] }
engineer.added / engineer.removed / engineer.moved	Roster	{ fromTeamId, toTeamId }
team.created / team.deleted / team.manager_changed	Roster	{}
auth.password_changed / auth.password_reset	أمان	{} (بدون أي أسرار)
2.3 توليد الأحداث من PUT /api/dashboard/engineers/{id} (الأهم)

الـ PUT الحالي بيستقبل بيانات المهندس كلها، فالسيرفر لازم يعمل Diff بين الحالة المخزّنة والـ payload داخل نفس الـ transaction ويولّد الأحداث:

قارن كل مشروع بالـ id: غير موجود في DB = project.created.
للمشروع الموجود: قارن (name, deliveryDate, inquiryDate, note) → project.updated (حدث واحد بـ changes[]).
قارن finished و outcome → project.finished / reopened / outcome.
لكل مهمة قياسية ومخصصة قارن status, review, applicable, dueDate, department(s), notes.
المهام المخصصة: id جديد = task.custom_added، id اختفى = task.custom_removed.
templateId تغيّر → project.template_applied.
لو مفيش أي فرق → لا يتولد أي حدث (الـ auto-save بيبعت PUT كل ~1 ثانية).

التجميع (Coalescing) — إجباري: الـ auto-save يولّد ضوضاء. قاعدة التجميع: لو في حدث من نفس (Type, ActorEngineerId, ProjectId) عمره أقل من 3 دقايق → حدّث نفس الصف (UpdatedAt, Meta.count, Meta.taskIds) بدل ما تعمل صف جديد. يعني "أنهى 3 مهام" بدل 3 أحداث. وعمليات الـ toggle المتعاكسة (تم ثم ألغى) في نفس النافذة تلغي بعض.

Actor: من الـ token (أو X-User-Name مؤقتًا). لو مدير القسم/الفريق هو اللي عدّل على مشروع مهندس → ActorRole = dept/team و ActorName اسمه.

الأحداث الباقية بتتولّد من: FilesController · RosterController · SecurityController · أرشفة/استرجاع/حذف · PUT /api/dashboard/hasr/{teamId} (Diff برضو).

2.4 Endpoints
GET /api/dashboard/activity — dept

Query: types (comma list: task.completed,project.created) · teamId · engineerId · projectId · q (بحث في Message/ProjectName/ActorName) · from · to (ISO) · unreadOnly=true|false · excludeMine=true|false · cursor · limit (default 30، max 100). الترتيب: UpdatedAt desc.

json
{
  "items": [{
    "id": "9812",
    "type": "task.completed",
    "createdAt": "2026-10-11T08:10:00Z",
    "updatedAt": "2026-10-11T08:14:00Z",
    "actor": { "engineerId": "t1e_ab12", "name": "أحمد علي", "role": "engineer" },
    "team": { "id": "t1", "name": "فريق 1" },
    "project": { "id": "p1712345678", "name": "مجمع الشروق السكني" },
    "meta": { "count": 3, "taskTitle": "دراسة كراسة الشروط", "taskIds": ["1","2","5"] },
    "message": "أنهى أحمد علي 3 مهام في مشروع مجمع الشروق السكني",
    "readAt": null
  }],
  "nextCursor": "opaque-string-or-null",
  "unread": 14
}
GET /api/dashboard/activity/unread-count — dept
json
{ "unread": 14 }

خفيف جدًا (الواجهة بتناديه كل 30–45 ثانية للـ badge). يفضل cache قصير.

POST /api/dashboard/activity/read — dept
json
{ "ids": ["9812", "9811"] }        // أو
{ "all": true }                      // يحدّث ReadAllBefore = now

Response { "unread": 0 }.

(اختياري، مرحلة لاحقة) تدفق لحظي

SignalR hub /hubs/activity أو SSE GET /api/dashboard/activity/stream بدل الـ polling.

2.5 إشعارات المهندس نفسه (تعديل صغير على الموجود)

GET /api/notifications/{engineerId}: يتأكد إن المهندس يقرا إشعاراته هو فقط (أو dept/team manager الخاص بفريقه). ولما المهندس يُنهي مهمة يظهر له "أنجزت مهمة X" في إشعاراته كمان (نوع own.task_completed) بنفس قاعدة التجميع.

3) القوالب (Templates) — لكل قسم في الشركة

الفكرة: النظام هيخدم أقسام الشركة كلها (مقاولات + عقارات)، مش قسم الدراسات بس. لكل قسم قوالب (temp1, temp2...)، والقالب هو قايمة المهام القياسية اللي بتتطبق على مشروع. المهندس يختار قالب ثم يحدد أنهي مهام تنطبق على المشروع ويقدر يعدّل الاختيار بعدين.

الـ applicable الموجود حاليًا في ProjectTaskStates هو "المهمة مختارة للمشروع" — مفيش تغيير في معناه. وStats (done/total) بتعتمد عليه كما هي.

3.1 الجداول

CompanyDepartments (أقسام الشركة — غير "القسم المسؤول" في القسم 4) | Id (string, مثلاً studies) · Name · SortOrder · IsActive |

TaskTemplates

العمود	ملاحظة
Id	string (مثلاً temp1)
Code	عرض: Temp 1
Name	مثلاً "قالب قسم الدراسات"
Description	نص
CompanyDepartmentId	FK
IsDefault	قالب افتراضي للقسم
IsActive, SortOrder, CreatedBy, CreatedAt, UpdatedAt	

TaskTemplateItems | TemplateId · StandardTaskId · DefaultApplicable (bool) · SortOrder | PK مركب (TemplateId, StandardTaskId) |

تعديل StandardTasks: إضافة CompanyDepartmentId (nullable = مهمة عامة لكل الأقسام). حاليًا الـ 40 مهمة تتعلّم على studies.

تعديل Projects: إضافة TemplateId (nullable FK) + CompanyDepartmentId (nullable).

3.2 Seed / Migration
إنشاء CompanyDepartments: studies ("قسم الدراسات").
إنشاء temp1 (Code Temp 1, department studies, IsDefault = true) وربط كل الـ 40 مهمة القياسية به، و DefaultApplicable = قيمة StandardTasks.Applicable الحالية.
تحديث كل المشاريع الموجودة: TemplateId = 'temp1'. ممنوع يتغيّر applicable لأي مشروع موجود.
مشروع جديد: لو اتحدد templateId يتطبق (يتولّد ProjectTaskStates بـ applicable = DefaultApplicable)، ولو لا → القالب الافتراضي للقسم، ولو لا → temp1.
3.3 Endpoints
Method	Endpoint	الوصف	الصلاحية
GET	/api/company-departments	أقسام الشركة	الكل (مسجّل)
GET	/api/templates?departmentId=&q=	قايمة القوالب (بدون مهام)	الكل
GET	/api/templates/{id}	القالب + عناصره	الكل
POST	/api/templates	إنشاء قالب	dept
PUT	/api/templates/{id}	تعديل الاسم/الوصف/العناصر (استبدال كامل لـ items)	dept
DELETE	/api/templates/{id}	حذف — 409 TEMPLATE_IN_USE لو مرتبط بمشاريع (يقدر يعمل IsActive=false)	dept
POST	/api/templates/{id}/duplicate	نسخ قالب	dept
PUT	/api/projects/{projectId}/template	تطبيق قالب + اختيار المهام (ذري)	صاحب المشروع / مدير فريقه / dept

GET /api/templates →

json
[{ "id": "temp1", "code": "Temp 1", "name": "قالب قسم الدراسات", "description": "...",
   "department": { "id": "studies", "name": "قسم الدراسات" }, "taskCount": 40, "isDefault": true }]

GET /api/templates/{id} → نفس الشكل + :

json
{ "items": [{ "taskId": "1", "defaultApplicable": true, "sortOrder": 1 }] }

(بيرجّع كمان بيانات المهمة نفسها title, desc لو الـ /api/tasks مش متاح بنفس الـ scope.)

PUT /api/projects/{projectId}/template

json
{ "templateId": "temp1", "selectedTaskIds": ["1","2","5"] }
يضبط Project.TemplateId، ويضبط applicable = (taskId ∈ selectedTaskIds) لكل مهام القالب.
المهام اللي كانت منجزة (status = true) وخرجت من الاختيار: تحتفظ بقيمة status (ما تتمسحش)، وبس بتتشال من الحسبة.
لو الـ templateId اتغيّر لقالب تاني: المهام اللي مش في القالب الجديد تتحذف من ProjectTaskStates فقط لو status=false وبدون notes/dueDate؛ وإلا تفضل (وترجع warnings[] في الـ response).
يولّد project.template_applied و task.applicability.
Response: المشروع بعد التحديث (نفس شكل project في الـ engineer endpoint) + warnings: [].

تعديل في الـ engineer endpoints:

GET/PUT /api/dashboard/engineers/{id}: كل project فيه templateId (قراءة وكتابة). لو الـ PUT اتبعت من غير templateId ما يتمسحش (الواجهة الحالية ممكن تبعته قبل ما تتحدّث).
GET /api/bootstrap: يضيف companyDepartments و templates (الملخص).
GET /api/tasks?templateId=temp1 (اختياري) — فلترة المهام حسب القالب.
4) "القسم المسؤول" — اختيار متعدد + بحث

حاليًا الحقل department نص واحد على كل مهمة (قياسية ProjectTaskStates ومخصصة CustomTasks). المطلوب: أكتر من قسم لنفس المهمة، مع قايمة موحدة قابلة للبحث، وإمكانية إضافة قسم جديد من الواجهة.

4.1 الجداول

ResponsibleDepartments: Id (int identity) · Name (unique، case/diacritics-insensitive) · NormalizedName · IsActive · CreatedBy · CreatedAt. TaskStateDepartments: ProjectTaskStateId · DepartmentId — PK مركب. CustomTaskDepartments: CustomTaskId · DepartmentId — PK مركب.

NormalizedName: شيل التشكيل، وحّد (أ إ آ → ا) و (ى → ي) و (ة → ه)، trim، lowercase للإنجليزي — عشان "الإدارة المالية" و "الاداره الماليه" ما يتكرروش.

4.2 Migration

قسّم القيم الحالية في department على الفواصل (، , ; | /) + trim، ضيف كل اسم فريد في ResponsibleDepartments، واربط بالـ join tables. اتركي عمود department النصي كما هو لإصدار واحد على الأقل (للتوافق).

4.3 عقد الـ JSON (توافق للخلف إجباري)

في الـ task state (قياسي ومخصص) بيرجع الاتنين:

json
{ "department": "قسم المشتريات،القسم المالي", "departments": ["قسم المشتريات", "القسم المالي"] }
القراءة: departments من الـ join tables، و department = الأسماء مفصولة بـ ،.
الكتابة (PUT): لو جاء departments (array) → هو المرجع. لو جاء department نص فقط → يتقسّم بنفس القاعدة. لو الاتنين → departments يكسب.
أي اسم غير موجود في القايمة الموحدة يتضاف تلقائيًا (بحد أقصى مثلاً 60 حرف، وبدون HTML) — الواجهة بتسمح بكتابة قسم جديد.
حد أقصى منطقي: 10 أقسام للمهمة الواحدة.
4.4 Endpoints
Method	Endpoint	الوصف	الصلاحية
GET	/api/responsible-departments?q=	القايمة (مرتبة بالأكثر استخدامًا ثم أبجديًا) + بحث normalized	الكل
POST	/api/responsible-departments { "name": "..." }	إنشاء (يرجّع الموجود لو متطابق normalized)	الكل المسجّل
PUT	/api/responsible-departments/{id}	إعادة تسمية (يتحدث في كل المهام)	dept
DELETE	/api/responsible-departments/{id}	409 IN_USE لو مستخدم، أو ?merge=targetId للدمج	dept
json
[{ "id": 12, "name": "قسم المشتريات", "usage": 37 }]
ضمّه كمان في GET /api/bootstrap كـ responsibleDepartments.
FieldDefinitions: حقل department يفضل نوعه الجديد multiselect (الواجهة بتتعامل معاه كده).
5) تحسينات مرتبطة بالأرشيف / الاسترجاع
Hasr Sync من السيرفر: إنشاء سجل sync_{projectId} يحصل في السيرفر وقت إنشاء المشروع داخل نفس الـ transaction (بدل ما الـ client يعمله). الاسترجاع بيعتمد على نفس المنطق. (الحل الحالي من الـ client سبب duplicate rows قبل كده.)
Soft delete للمهندس: حذف مهندس = IsActive=false / DeletedAt عشان الأرشيف والأحداث القديمة تفضل ليها مرجع (الاسترجاع بيحتاج يعرف المهندس).
Concurrency: RowVersion على Projects (أو على كيان بيانات المهندس) → 409 CONCURRENT_UPDATE لو اتنين عدّلوا في نفس الوقت، بدل ما الـ PUT الكامل يمسح شغل بعض.
6) شروط أساسية للأمان (لازم قبل الإنتاج، ومطلوبة عشان صلاحيات dept تبقى حقيقية)
POST /api/auth/login → JWT أو HttpOnly cookie، مع rate limiting وقفل مؤقت بعد محاولات فاشلة، وتشفير الباسورد بـ Argon2/bcrypt (أو ASP.NET Identity hasher).
Authorization حقيقي على كل Controller بالـ role + ownership: المهندس بياناته فقط، مدير الفريق فريقه فقط، dept الكل.
إيقاف GET/PUT /api/dashboard/auth بشكله الحالي (بيرجّع كل الـ hashes للمتصفح ويسمح بالكتابة عليها) واستبداله بـ change-password / reset.
تنزيل الملفات GET /api/files/download/... يتأكد من الملكية/الصلاحية ويتحقق من النوع والحجم (Excel / PDF / PNG · 25MB) في السيرفر.
كلمة مرور SMTP في /api/dashboard/config ما تتبعتش للمتصفح (تتخزن مشفّرة وتتعرض مخفية).
7) ترتيب التنفيذ المقترح + Acceptance Criteria
#	المرحلة	تكتمل لما
1	الأرشيف (1.1–1.2)	الأرشفة بتحفظ snapshot + الملفات باقية، GET {id} بيرجّع التفاصيل، restore بيرجّع مشروع جاري بنفس مهامه ومرفقاته وسجل الحصر، delete بيمسح كل حاجة فعليًا
2	Templates + Departments (3, 4)	temp1 متسجل بالـ 40 مهمة ومشاريع الحالية تفضل زي ما هي، تطبيق قالب بيغيّر applicable فقط، وحفظ أكتر من قسم لمهمة واحدة بيرجع نفس القيم
3	Activity Feed (2)	تعليم مهمة منجزة بيظهر في GET /activity خلال ثانية، 5 مهام متتالية = حدث واحد count: 5، PUT بدون تغييرات ما يولّدش أي حدث
4	الأمان (6) + Concurrency (5)	مهندس ما يقدرش يقرا/يعدّل بيانات غيره، وأي endpoint dept بيرجّع 403 لغيره

اختبارات لازم تتعمل:

Restore لمهندس محذوف → 409 ENGINEER_NOT_FOUND ثم نجاح مع targetEngineerId.
Restore مرتين لنفس الأرشيف → التانية 404.
Delete بيمسح ملفات القرص (ويكمل لو واحد فشل).
Diff: تغيير notes فقط → حدث task.updated واحد؛ نفس الـ PUT مرتين → صفر أحداث.
أول PUT من واجهة قديمة (من غير templateId ولا departments) ما يمسحش القيم الجديدة.
unreadOnly + "تحديد الكل كمقروء" + مستخدمين dept اتنين