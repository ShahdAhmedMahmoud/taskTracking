using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using TenderDashboard.Api.Data;
using TenderDashboard.Api.Models;
using TenderDashboard.Api.Services;

namespace TenderDashboard.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IEmailNotificationService _emailNotificationService;

    public DashboardController(AppDbContext db, IEmailNotificationService emailNotificationService)
    {
        _db = db;
        _emailNotificationService = emailNotificationService;
    }

    [HttpGet("engineers/{engineerId}")]
    public async Task<IActionResult> GetEngineer(string engineerId, CancellationToken ct)
    {
        if (!await _db.Engineers.AnyAsync(x => x.Id == engineerId, ct)) return NotFound(new { error = "engineer not found" });
        var projects = await _db.Projects.AsNoTracking()
            .Where(x => x.EngineerId == engineerId)
            .Include(x => x.TaskStates)
            .Include(x => x.CustomTasks)
            .OrderBy(x => x.DeliveryDate == null).ThenBy(x => x.DeliveryDate).ThenBy(x => x.Id)
            .ToListAsync(ct);

        var tasks = await _db.StandardTasks.AsNoTracking().OrderBy(x => x.Id).ToListAsync(ct);
        var result = new EngineerDataDto
        {
            LastSaved = projects.Count == 0 ? null : projects.Max(x => x.LastSaved),
            ActiveProjectId = projects.FirstOrDefault()?.Id,
            Projects = projects.Select(p => ToProjectDto(p, tasks)).ToList()
        };
        return Ok(result);
    }

    [HttpPut("engineers/{engineerId}")]
    public async Task<IActionResult> PutEngineer(string engineerId, [FromBody] EngineerDataDto payload, CancellationToken ct)
    {
        if (!await _db.Engineers.AnyAsync(x => x.Id == engineerId, ct)) return NotFound(new { error = "engineer not found" });
        var now = DateTime.UtcNow;
        await using var tx = await _db.Database.BeginTransactionAsync(ct);

        var existing = await _db.Projects.Where(x => x.EngineerId == engineerId).ToListAsync(ct);
        if (existing.Count > 0 && payload.Projects.Count == 0)
            return Conflict(new { error = "An empty project payload cannot delete existing projects. Reload the engineer data and try again." });

        var incomingIds = payload.Projects.Select(x => x.Id).Where(x => !string.IsNullOrWhiteSpace(x)).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var removed = existing.Where(x => !incomingIds.Contains(x.Id)).ToList();
        if (removed.Count > 0) _db.Projects.RemoveRange(removed);

        var tasks = await _db.StandardTasks.AsNoTracking().ToListAsync(ct);
        var projectRecipientsByEngineer = new Dictionary<string, List<UserAccount>>(StringComparer.OrdinalIgnoreCase);

        foreach (var dto in payload.Projects)
        {
            if (string.IsNullOrWhiteSpace(dto.Id)) continue;
            var project = existing.SingleOrDefault(x => x.Id == dto.Id);
            var isNewProject = project == null;
            var oldTaskStates = isNewProject ? new List<ProjectTaskState>() : await _db.ProjectTaskStates.Where(x => x.ProjectId == dto.Id).AsNoTracking().ToListAsync(ct);
            if (project == null)
            {
                project = new Project { Id = dto.Id, EngineerId = engineerId, CreatedAt = now };
                _db.Projects.Add(project);
            }
            project.Name = dto.Name ?? string.Empty;
            project.ProjectCode = dto.ProjectCode;
            project.Description = dto.Description;
            project.Department = dto.Department;
            project.Status = dto.Status;
            project.Priority = dto.Priority;
            project.ProjectType = dto.ProjectType;
            project.DeliveryDate = ParseDate(dto.DeliveryDate);
            project.InquiryDate = ParseDate(dto.InquiryDate);
            project.Finished = dto.Finished;
            project.Outcome = dto.Outcome;
            project.HasrSynced = dto.HasrSynced;
            project.LastSaved = now;

            var oldStates = await _db.ProjectTaskStates.Where(x => x.ProjectId == project.Id).ToListAsync(ct);
            _db.ProjectTaskStates.RemoveRange(oldStates);
            foreach (var task in tasks)
            {
                if (dto.Tasks == null || !dto.Tasks.TryGetValue(task.Id.ToString(), out var state) || state == null) continue;
                if (state.Status && !oldTaskStates.Any(x => x.TaskId == task.Id && x.Status))
                {
                    _db.Notifications.Add(new Notification
                    {
                        RecipientEngineerId = engineerId, Type = "TaskCompleted", Title = "تم الانتهاء من المهمة",
                        Message = $"تم الانتهاء من المهمة: {task.Title}", EntityType = "Task", EntityId = task.Id.ToString(),
                        ProjectId = project.Id, ProjectName = project.Name, CreatedBy = Request.Headers["X-User-Name"].ToString(), CreatedAt = now
                    });
                }
                _db.ProjectTaskStates.Add(new ProjectTaskState
                {
                    ProjectId = project.Id,
                    TaskId = task.Id,
                    Status = state.Status,
                    Review = state.Review,
                    Applicable = state.Applicable,
                    DueDate = ParseDate(state.DueDate),
                    Department = state.Department,
                    Notes = state.Notes
                });
            }

            if (isNewProject)
            {
                _db.Notifications.Add(new Notification
                {
                    RecipientEngineerId = engineerId, Type = "ProjectCreated", Title = "تمت إضافة مشروع جديد إليك",
                    Message = $"تمت إضافة مشروع جديد إليك: {project.Name} ({project.ProjectCode ?? project.Id})",
                    EntityType = "Project", EntityId = project.Id, ProjectId = project.Id, ProjectName = project.Name,
                    CreatedBy = Request.Headers["X-User-Name"].ToString(), CreatedAt = now
                });
            }

            var oldCustom = await _db.CustomTasks.Where(x => x.ProjectId == project.Id).ToListAsync(ct);
            _db.CustomTasks.RemoveRange(oldCustom);
            foreach (var ctDto in dto.CustomTasks ?? [])
            {
                if (string.IsNullOrWhiteSpace(ctDto.Id) || string.IsNullOrWhiteSpace(ctDto.Title)) continue;
                _db.CustomTasks.Add(new CustomTask
                {
                    Id = ctDto.Id,
                    ProjectId = project.Id,
                    Title = ctDto.Title,
                    Description = ctDto.Desc,
                    Status = ctDto.Status,
                    Review = ctDto.Review,
                    Applicable = ctDto.Applicable,
                    DueDate = ParseDate(ctDto.DueDate),
                    Department = ctDto.Department,
                    Notes = ctDto.Notes
                });
            }
        }

        await _db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        var newProjectIds = payload.Projects
            .Where(x => !string.IsNullOrWhiteSpace(x.Id) && !existing.Any(p => p.Id == x.Id))
            .Select(x => x.Id)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var projectId in newProjectIds)
        {
            var createdProject = await _db.Projects.AsNoTracking()
                .Include(x => x.Engineer)
                .SingleOrDefaultAsync(x => x.Id == projectId, ct);

            if (createdProject == null || createdProject.Engineer == null)
                continue;

            var teamEngineerIds = await _db.Engineers.AsNoTracking()
                .Where(x => x.TeamId == createdProject.Engineer.TeamId)
                .Select(x => x.Id)
                .ToListAsync(ct);

            var teamRecipients = await _db.Users.AsNoTracking()
                .Where(x => x.IsActive && x.EngineerId != null && teamEngineerIds.Contains(x.EngineerId))
                .Select(x => new UserAccount { Email = x.Email })
                .ToListAsync(ct);

            await _emailNotificationService.SendProjectCreatedAsync(
                createdProject,
                createdProject.Engineer,
                Request.Headers["X-User-Name"].ToString(),
                teamRecipients,
                cancellationToken: ct);
        }

        return Ok(new { ok = true, lastSaved = now });
    }

    [HttpDelete("engineers/{engineerId}/projects/{projectId}")]
    public async Task<IActionResult> DeleteProject(string engineerId, string projectId, CancellationToken ct)
    {
        var project = await _db.Projects
            .Include(x => x.TaskStates)
            .Include(x => x.CustomTasks)
            .SingleOrDefaultAsync(x => x.Id == projectId && x.EngineerId == engineerId, ct);
        if (project == null) return NotFound(new { error = "project not found for this engineer" });

        var syncedHasrItems = await _db.HasrProjects
            .Where(x => x.Id == "sync_" + projectId)
            .ToListAsync(ct);
        var impact = new
        {
            project = project.Name,
            standardTaskStates = project.TaskStates.Count,
            customTasks = project.CustomTasks.Count,
            hasrItems = syncedHasrItems.Count
        };

        var engineer = await _db.Engineers.AsNoTracking().SingleAsync(x => x.Id == engineerId, ct);
        var snapshot = System.Text.Json.JsonSerializer.Serialize(new
        {
            project.Id, project.EngineerId, project.Name, project.DeliveryDate, project.InquiryDate,
            project.Finished, project.Outcome, project.HasrSynced,
            Tasks = project.TaskStates.Select(x => new { x.TaskId, x.Status, x.Review, x.Applicable, x.DueDate, x.Department, x.Notes }),
            CustomTasks = project.CustomTasks.Select(x => new { x.Id, x.Title, x.Description, x.Status, x.Review, x.Applicable, x.DueDate, x.Department, x.Notes })
        });

        await using var transaction = await _db.Database.BeginTransactionAsync(ct);
        var archivedByHeader = Request.Headers["X-User-Name"].ToString();
        var archivedBy = string.IsNullOrWhiteSpace(archivedByHeader) ? engineer.Name : archivedByHeader;
        try
        {
            if (!string.IsNullOrWhiteSpace(archivedByHeader))
                archivedBy = Uri.UnescapeDataString(archivedByHeader);
        }
        catch (UriFormatException)
        {
            archivedBy = engineer.Name;
        }
        _db.ProjectArchives.Add(new ProjectArchive
        {
            ProjectId = project.Id,
            EngineerId = project.EngineerId,
            EngineerName = engineer.Name,
            ProjectName = project.Name,
            DeliveryDate = project.DeliveryDate,
            InquiryDate = project.InquiryDate,
            Finished = project.Finished,
            Outcome = project.Outcome,
            SnapshotJson = snapshot,
            ArchivedBy = archivedBy,
            ArchivedAt = DateTime.UtcNow,
            Reason = "Project deleted from the employee sheet"
        });
        _db.HasrProjects.RemoveRange(syncedHasrItems);
        _db.Projects.Remove(project); // FK cascade removes task states and custom tasks.
        await _db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);

        return Ok(new { ok = true, archived = true, impact });
    }

    [HttpGet("archives")]
    public async Task<IActionResult> GetArchives(CancellationToken ct)
    {
        if (!string.Equals(Request.Headers["X-User-Role"].ToString(), "dept", StringComparison.OrdinalIgnoreCase))
            return Forbid();

        var rows = await _db.ProjectArchives.AsNoTracking().OrderByDescending(x => x.ArchivedAt).ToListAsync(ct);
        return Ok(rows.Select(x => new
        {
            id = x.Id, projectId = x.ProjectId, engineerId = x.EngineerId, engineerName = x.EngineerName,
            projectName = x.ProjectName, deliveryDate = x.DeliveryDate?.ToString("yyyy-MM-dd"),
            archivedBy = x.ArchivedBy, archivedAt = x.ArchivedAt, reason = x.Reason
        }));
    }

    [HttpGet("hasr/{teamId}")]
    public async Task<IActionResult> GetHasr(string teamId, CancellationToken ct)
    {
        if (!await _db.Teams.AnyAsync(x => x.Id == teamId, ct)) return NotFound(new { error = "team not found" });
        var rows = await _db.HasrProjects.AsNoTracking().Where(x => x.TeamId == teamId)
            .OrderBy(x => x.DeliveryDate == null).ThenBy(x => x.DeliveryDate).ThenBy(x => x.Id)
            .ToListAsync(ct);
        return Ok(rows.Select(ToHasrDto).ToList());
    }

    [HttpPut("hasr/{teamId}")]
    public async Task<IActionResult> PutHasr(string teamId, [FromBody] List<HasrDto> payload, CancellationToken ct)
    {
        if (!await _db.Teams.AnyAsync(x => x.Id == teamId, ct)) return NotFound(new { error = "team not found" });
        var existing = await _db.HasrProjects.Where(x => x.TeamId == teamId).ToListAsync(ct);
        var incomingIds = payload.Select(x => x.Id).Where(x => !string.IsNullOrWhiteSpace(x)).ToHashSet(StringComparer.OrdinalIgnoreCase);
        _db.HasrProjects.RemoveRange(existing.Where(x => !incomingIds.Contains(x.Id)));
        foreach (var dto in payload)
        {
            if (string.IsNullOrWhiteSpace(dto.Id) || string.IsNullOrWhiteSpace(dto.Name)) continue;
            var item = existing.SingleOrDefault(x => x.Id == dto.Id);
            if (item == null) { item = new HasrProject { Id = dto.Id, TeamId = teamId }; _db.HasrProjects.Add(item); }
            item.Name = dto.Name;
            item.DeliveryDate = ParseDate(dto.DeliveryDate);
            item.HasWork = dto.HasWork;
            item.HasrDueDate = ParseDate(dto.HasrDueDate);
            item.HasrDone = dto.HasrDone;
            item.HasrNotes = dto.HasrNotes;
            item.AddedBy = dto.AddedBy;
        }
        await _db.SaveChangesAsync(ct);
        return Ok(new { ok = true });
    }

    // Hashing on the server also works when the dashboard is opened via HTTP, where
    // browsers intentionally disable window.crypto.subtle.
    [HttpPost("auth/hash")]
    public IActionResult HashPassword([FromBody] PasswordHashRequest payload)
    {
        if (string.IsNullOrEmpty(payload.Password))
            return BadRequest(new { error = "password is required" });

        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes("tender-dash::" + payload.Password));
        return Ok(new { hash = Convert.ToHexString(bytes).ToLowerInvariant() });
    }

    [HttpGet("auth")]
    public async Task<IActionResult> GetAuth(CancellationToken ct)
    {
        var rows = await _db.AuthHashes.AsNoTracking().ToListAsync(ct);
        var dto = new AuthDto { Engineers = new(), Teams = new() };
        foreach (var row in rows)
        {
            if (row.Role == "dept") dto.Dept = row.PasswordHash;
            else if (row.Role == "team") dto.Teams[row.EntityId] = row.PasswordHash;
            else if (row.Role == "engineer") dto.Engineers[row.EntityId] = row.PasswordHash;
        }
        return Ok(dto);
    }

    [HttpPut("auth")]
    public async Task<IActionResult> PutAuth([FromBody] AuthDto payload, CancellationToken ct)
    {
        var rows = await _db.AuthHashes.ToListAsync(ct);
        _db.AuthHashes.RemoveRange(rows);
        if (!string.IsNullOrWhiteSpace(payload.Dept)) _db.AuthHashes.Add(new AuthHash { Role = "dept", EntityId = "dept", PasswordHash = payload.Dept });
        foreach (var kv in payload.Teams ?? new()) if (!string.IsNullOrWhiteSpace(kv.Key) && !string.IsNullOrWhiteSpace(kv.Value)) _db.AuthHashes.Add(new AuthHash { Role = "team", EntityId = kv.Key, PasswordHash = kv.Value });
        foreach (var kv in payload.Engineers ?? new()) if (!string.IsNullOrWhiteSpace(kv.Key) && !string.IsNullOrWhiteSpace(kv.Value)) _db.AuthHashes.Add(new AuthHash { Role = "engineer", EntityId = kv.Key, PasswordHash = kv.Value });
        await _db.SaveChangesAsync(ct);
        return Ok(new { ok = true });
    }

    [HttpGet("config")]
    public async Task<IActionResult> GetConfig(CancellationToken ct)
    {
        var setting = await _db.DashboardSettings.AsNoTracking().FirstOrDefaultAsync(x => x.Id == 1, ct);
        var outcomes = await _db.ProjectOutcomeOptions.AsNoTracking().Where(x => x.IsActive).OrderBy(x => x.SortOrder).ToListAsync(ct);
        var palette = await _db.TeamPaletteOptions.AsNoTracking().Where(x => x.IsActive).OrderBy(x => x.SortOrder).ToListAsync(ct);
        var fields = await _db.FieldDefinitions.AsNoTracking().Where(x => x.IsActive).OrderBy(x => x.Scope).ThenBy(x => x.SortOrder).ToListAsync(ct);
        return Ok(new
        {
            deptManager = setting?.DeptManager ?? "",
            projectDefaults = new { name = setting?.DefaultProjectName ?? "", deliveryDate = setting?.DefaultDeliveryDate?.ToString("yyyy-MM-dd"), inquiryDate = setting?.DefaultInquiryDate?.ToString("yyyy-MM-dd") },
            emailSettings = new
            {
                enabled = setting?.EmailEnabled ?? false,
                host = setting?.SmtpHost ?? "",
                port = setting?.SmtpPort ?? 587,
                enableSsl = setting?.SmtpEnableSsl ?? true,
                from = setting?.SmtpFrom ?? "",
                userName = setting?.SmtpUserName ?? "",
                password = setting?.SmtpPassword ?? "",
                includeProjectOwner = setting?.IncludeProjectOwner ?? true,
                includeTeamMembers = setting?.IncludeTeamMembers ?? true,
                defaultRecipients = string.IsNullOrWhiteSpace(setting?.DefaultRecipients) ? [] : setting.DefaultRecipients.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            },
            outcomes = outcomes.Select(x => new { id = x.Id, label = x.Label }),
            teamPalette = palette.Select(x => new { id = x.Id, value = x.Value }),
            taskFields = fields.Where(x => x.Scope == "task").Select(x => new { id = x.FieldKey, label = x.Label, type = x.Type }),
            customTaskFields = fields.Where(x => x.Scope == "customTask").Select(x => new { id = x.FieldKey, label = x.Label, type = x.Type }),
            hasrFields = fields.Where(x => x.Scope == "hasr").Select(x => new { id = x.FieldKey, label = x.Label, type = x.Type })
        });
    }

    [HttpPut("config")]
    public async Task<IActionResult> PutConfig([FromBody] ConfigDto payload, CancellationToken ct)
    {
        var setting = await _db.DashboardSettings.FirstOrDefaultAsync(x => x.Id == 1, ct);
        if (setting == null) { setting = new DashboardSetting { Id = 1 }; _db.DashboardSettings.Add(setting); }
        setting.DeptManager = payload.DeptManager ?? string.Empty;
        setting.DefaultProjectName = payload.ProjectDefaults?.Name ?? string.Empty;
        setting.DefaultDeliveryDate = ParseDate(payload.ProjectDefaults?.DeliveryDate);
        setting.DefaultInquiryDate = ParseDate(payload.ProjectDefaults?.InquiryDate);
        setting.EmailEnabled = payload.EmailSettings?.Enabled ?? false;
        setting.SmtpHost = payload.EmailSettings?.Host ?? string.Empty;
        setting.SmtpPort = payload.EmailSettings?.Port ?? 587;
        setting.SmtpEnableSsl = payload.EmailSettings?.EnableSsl ?? true;
        setting.SmtpFrom = payload.EmailSettings?.From ?? string.Empty;
        setting.SmtpUserName = payload.EmailSettings?.UserName ?? string.Empty;
        setting.SmtpPassword = payload.EmailSettings?.Password ?? string.Empty;
        setting.IncludeProjectOwner = payload.EmailSettings?.IncludeProjectOwner ?? true;
        setting.IncludeTeamMembers = payload.EmailSettings?.IncludeTeamMembers ?? true;
        setting.DefaultRecipients = payload.EmailSettings?.DefaultRecipients != null
            ? string.Join(",", payload.EmailSettings.DefaultRecipients.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()))
            : string.Empty;
        await _db.SaveChangesAsync(ct);
        return Ok(new { ok = true });
    }

    private static DateTime? ParseDate(string? value) => DateTime.TryParse(value, out var d) ? d.Date : null;

    private static object ToHasrDto(HasrProject x) => new { id = x.Id, name = x.Name, deliveryDate = Fmt(x.DeliveryDate), hasWork = x.HasWork, hasrDueDate = Fmt(x.HasrDueDate), hasrDone = x.HasrDone, hasrNotes = x.HasrNotes ?? "", addedBy = x.AddedBy ?? "" };
    private static string? Fmt(DateTime? d) => d?.ToString("yyyy-MM-dd");

    private static ProjectDto ToProjectDto(Project p, IReadOnlyCollection<StandardTask> tasks)
    {
        var states = p.TaskStates.ToDictionary(x => x.TaskId.ToString(), x => new TaskStateDto { Status = x.Status, Review = x.Review, Applicable = x.Applicable, DueDate = Fmt(x.DueDate), Department = x.Department ?? "", Notes = x.Notes ?? "" });
        foreach (var task in tasks)
            if (!states.ContainsKey(task.Id.ToString())) states[task.Id.ToString()] = new TaskStateDto { Applicable = task.DefaultApplicable };
        return new ProjectDto { Id = p.Id, Name = p.Name, ProjectCode = p.ProjectCode, Description = p.Description, Department = p.Department, Status = p.Status, Priority = p.Priority, ProjectType = p.ProjectType, DeliveryDate = Fmt(p.DeliveryDate), InquiryDate = Fmt(p.InquiryDate), Finished = p.Finished, Outcome = p.Outcome, HasrSynced = p.HasrSynced, Tasks = states, CustomTasks = p.CustomTasks.Select(x => new CustomTaskDto { Id = x.Id, Title = x.Title, Desc = x.Description, Status = x.Status, Review = x.Review, Applicable = x.Applicable, DueDate = Fmt(x.DueDate), Department = x.Department ?? "", Notes = x.Notes ?? "" }).ToList() };
    }

    public sealed class EngineerDataDto { public DateTime? LastSaved { get; set; } public string? ActiveProjectId { get; set; } public List<ProjectDto> Projects { get; set; } = []; }
    public sealed class ProjectDto { public string Id { get; set; } = ""; public string? Name { get; set; } public string? ProjectCode { get; set; } public string? Description { get; set; } public string? Department { get; set; } public string? Status { get; set; } public string? Priority { get; set; } public string? ProjectType { get; set; } public string? DeliveryDate { get; set; } public string? InquiryDate { get; set; } public bool Finished { get; set; } public string? Outcome { get; set; } public bool HasrSynced { get; set; } public Dictionary<string, TaskStateDto>? Tasks { get; set; } public List<CustomTaskDto>? CustomTasks { get; set; } }
    public sealed class TaskStateDto { public bool Status { get; set; } public bool Review { get; set; } public bool Applicable { get; set; } public string? DueDate { get; set; } public string? Department { get; set; } public string? Notes { get; set; } }
    public sealed class CustomTaskDto { public string Id { get; set; } = ""; public string Title { get; set; } = ""; public string? Desc { get; set; } public bool Status { get; set; } public bool Review { get; set; } public bool Applicable { get; set; } = true; public string? DueDate { get; set; } public string? Department { get; set; } public string? Notes { get; set; } }
    public sealed class HasrDto { public string Id { get; set; } = ""; public string Name { get; set; } = ""; public string? DeliveryDate { get; set; } public bool? HasWork { get; set; } public string? HasrDueDate { get; set; } public bool HasrDone { get; set; } public string? HasrNotes { get; set; } public string? AddedBy { get; set; } }
    public sealed class PasswordHashRequest { public string? Password { get; set; } }
    public sealed class AuthDto { public Dictionary<string,string> Engineers { get; set; } = new(); public Dictionary<string,string> Teams { get; set; } = new(); public string? Dept { get; set; } }
    public sealed class ConfigDto { public string? DeptManager { get; set; } public ProjectDefaultsDto? ProjectDefaults { get; set; } public EmailSettingsDto? EmailSettings { get; set; } }
    public sealed class ProjectDefaultsDto { public string? Name { get; set; } public string? DeliveryDate { get; set; } public string? InquiryDate { get; set; } }
    public sealed class EmailSettingsDto { public bool Enabled { get; set; } public string? Host { get; set; } public int Port { get; set; } = 587; public bool EnableSsl { get; set; } = true; public string? From { get; set; } public string? UserName { get; set; } public string? Password { get; set; } public bool IncludeProjectOwner { get; set; } = true; public bool IncludeTeamMembers { get; set; } = true; public List<string>? DefaultRecipients { get; set; } = []; }
}
