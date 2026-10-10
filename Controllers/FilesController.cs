using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TenderDashboard.Api.Data;
using TenderDashboard.Api.Models;

namespace TenderDashboard.Api.Controllers;

[ApiController]
[Route("api/files")]
public class FilesController : ControllerBase
{
    private static readonly Dictionary<string, string> AllowedTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        [".xlsx"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        [".xls"] = "application/vnd.ms-excel",
        [".pdf"] = "application/pdf",
        [".png"] = "image/png"
    };
    private const long MaxFileSize = 25 * 1024 * 1024;
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    public FilesController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    [HttpGet("projects/{projectId}")]
    public async Task<IActionResult> GetProjectFiles(string projectId, CancellationToken ct)
    {
        var project = await _db.Projects.AsNoTracking().AsSplitQuery().Include(x => x.Attachments).Include(x => x.TFiles).ThenInclude(x => x.Rounds).ThenInclude(x => x.Versions).SingleOrDefaultAsync(x => x.Id == projectId, ct);
        if (project is null) return NotFound(new { error = "project not found" });
        return Ok(new
        {
            project = new { id = project.Id, name = project.Name, projectCode = project.ProjectCode, engineerId = project.EngineerId },
            attachments = project.Attachments.OrderByDescending(x => x.UploadedAt).Select(ToAttachment),
            tFiles = project.TFiles.OrderBy(x => x.Name).Select(t => new
            {
                id = t.Id, projectId = t.ProjectId, name = t.Name, description = t.Description, status = t.Status,
                createdBy = t.CreatedBy, createdAt = t.CreatedAt,
                rounds = t.Rounds.OrderBy(x => x.RoundNumber).Select(r => new
                {
                    id = r.Id, projectId = r.ProjectId, tFileId = r.TFileId, roundNumber = r.RoundNumber, name = r.Name,
                    description = r.Description, createdBy = r.CreatedBy, createdAt = r.CreatedAt, status = r.Status,
                    versions = r.Versions.OrderBy(x => x.VersionNumber).Select(ToVersion)
                })
            })
        });
    }

    [HttpPost("projects/{projectId}/attachments")]
    [RequestSizeLimit(MaxFileSize)]
    public async Task<IActionResult> AddAttachment(string projectId, IFormFile file, [FromForm] string? attachmentName, [FromForm] string? notes, CancellationToken ct)
    {
        var projectOwner = await _db.Projects.Where(x => x.Id == projectId).Select(x => new { x.EngineerId, x.Name }).SingleOrDefaultAsync(ct);
        if (projectOwner is null) return NotFound(new { error = "project not found" });
        var validation = Validate(file);
        if (validation is not null) return BadRequest(new { error = validation });
        var stored = await Store(file, projectId, "attachments", ct);
        var attachment = new ProjectAttachment
        {
            ProjectId = projectId, AttachmentName = string.IsNullOrWhiteSpace(attachmentName) ? Path.GetFileNameWithoutExtension(file.FileName) : attachmentName.Trim(),
            OriginalFileName = Path.GetFileName(file.FileName), StorageReference = stored, FileType = Path.GetExtension(file.FileName).ToLowerInvariant(), FileSize = file.Length,
            Version = 1, UploadedBy = Request.Headers["X-User-Name"].ToString(), Notes = notes?.Trim(), UploadedAt = DateTime.UtcNow
        };
        _db.ProjectAttachments.Add(attachment);
        await _db.SaveChangesAsync(ct);
        AddAudit("AttachmentUploaded", "ProjectAttachment", attachment.Id.ToString(), projectId);
        _db.Notifications.Add(new Notification { RecipientEngineerId = projectOwner.EngineerId, Type = "AttachmentAdded", Title = "تمت إضافة مرفق جديد", Message = $"تمت إضافة المرفق: {attachment.AttachmentName}", EntityType = "Attachment", EntityId = attachment.Id.ToString(), ProjectId = projectId, ProjectName = projectOwner.Name, AttachmentId = attachment.Id, CreatedBy = CurrentUser() });
        await _db.SaveChangesAsync(ct);
        return Ok(ToAttachment(attachment));
    }

    [HttpDelete("attachments/{id:long}")]
    public async Task<IActionResult> DeleteAttachment(long id, CancellationToken ct)
    {
        var attachment = await _db.ProjectAttachments.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (attachment is null) return NotFound(new { error = "attachment not found" });

        var storagePath = Path.Combine(_env.ContentRootPath, "App_Data", "Attachments", attachment.StorageReference.Replace('/', Path.DirectorySeparatorChar));
        var projectId = attachment.ProjectId;
        var attachmentName = attachment.AttachmentName;
        AddAudit("AttachmentDeleted", "ProjectAttachment", attachment.Id.ToString(), projectId);
        _db.ProjectAttachments.Remove(attachment);
        await _db.SaveChangesAsync(ct);

        if (System.IO.File.Exists(storagePath))
        {
            try { System.IO.File.Delete(storagePath); }
            catch (IOException) { }
        }

        return Ok(new { ok = true, id, projectId, attachmentName });
    }

    [HttpDelete("versions/{id:long}")]
    public async Task<IActionResult> DeleteVersion(long id, CancellationToken ct)
    {
        var version = await _db.TVersions.Include(x => x.Round).SingleOrDefaultAsync(x => x.Id == id, ct);
        if (version is null) return NotFound(new { error = "version not found" });
        var remaining = await _db.TVersions.Where(x => x.RoundId == version.RoundId && x.Id != id).OrderByDescending(x => x.VersionNumber).ToListAsync(ct);
        AddAudit("VersionDeleted", "TVersion", id.ToString(), version.Round.ProjectId);
        _db.TVersions.Remove(version);
        if (version.IsCurrentVersion && remaining.Count > 0) remaining[0].IsCurrentVersion = true;
        await _db.SaveChangesAsync(ct);
        DeleteStorageFile(version.StorageReference);
        return Ok(new { ok = true, id, roundId = version.RoundId });
    }

    [HttpDelete("rounds/{id}")]
    public async Task<IActionResult> DeleteRound(string id, CancellationToken ct)
    {
        var round = await _db.TRounds.Include(x => x.Versions).SingleOrDefaultAsync(x => x.Id == id, ct);
        if (round is null) return NotFound(new { error = "round not found" });
        var storageReferences = round.Versions.Select(x => x.StorageReference).ToList();
        AddAudit("RoundDeleted", "TRound", id, round.ProjectId);
        _db.TRounds.Remove(round);
        await _db.SaveChangesAsync(ct);
        foreach (var reference in storageReferences) DeleteStorageFile(reference);
        return Ok(new { ok = true, id, tFileId = round.TFileId });
    }

    [HttpDelete("t-files/{id}")]
    public async Task<IActionResult> DeleteTFile(string id, CancellationToken ct)
    {
        var tFile = await _db.TFiles.Include(x => x.Rounds).ThenInclude(x => x.Versions).SingleOrDefaultAsync(x => x.Id == id, ct);
        if (tFile is null) return NotFound(new { error = "T File not found" });
        var storageReferences = tFile.Rounds.SelectMany(x => x.Versions).Select(x => x.StorageReference).ToList();
        AddAudit("TFileDeleted", "TFile", id, tFile.ProjectId);
        _db.TFiles.Remove(tFile);
        await _db.SaveChangesAsync(ct);
        foreach (var reference in storageReferences) DeleteStorageFile(reference);
        return Ok(new { ok = true, id, projectId = tFile.ProjectId });
    }

    [HttpPost("projects/{projectId}/t-files")]
    public async Task<IActionResult> CreateTFile(string projectId, [FromBody] TFileRequest request, CancellationToken ct)
    {
        if (!await _db.Projects.AnyAsync(x => x.Id == projectId, ct)) return NotFound(new { error = "project not found" });
        if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest(new { error = "T File name is required" });
        var tFile = new TFile { ProjectId = projectId, Name = request.Name.Trim(), Description = request.Description?.Trim(), CreatedBy = CurrentUser() };
        _db.TFiles.Add(tFile);
        AddAudit("TFileCreated", "TFile", tFile.Id, projectId);
        await _db.SaveChangesAsync(ct);
        return Ok(new { id = tFile.Id, projectId, name = tFile.Name, description = tFile.Description, createdBy = tFile.CreatedBy, createdAt = tFile.CreatedAt });
    }

    [HttpPost("t-files/{tFileId}/rounds")]
    public async Task<IActionResult> CreateRound(string tFileId, [FromBody] RoundRequest request, CancellationToken ct)
    {
        var tFile = await _db.TFiles.SingleOrDefaultAsync(x => x.Id == tFileId, ct);
        if (tFile is null) return NotFound(new { error = "T File not found" });
        var number = request.RoundNumber > 0 ? request.RoundNumber : (await _db.TRounds.Where(x => x.TFileId == tFileId).Select(x => (int?)x.RoundNumber).MaxAsync(ct) ?? 0) + 1;
        if (await _db.TRounds.AnyAsync(x => x.TFileId == tFileId && x.RoundNumber == number, ct)) return Conflict(new { error = "round number already exists" });
        var round = new TRound { ProjectId = tFile.ProjectId, TFileId = tFileId, RoundNumber = number, Name = string.IsNullOrWhiteSpace(request.Name) ? $"Round {number}" : request.Name.Trim(), Description = request.Description?.Trim(), CreatedBy = CurrentUser() };
        _db.TRounds.Add(round);
        AddAudit("RoundCreated", "TRound", round.Id, tFile.ProjectId);
        await _db.SaveChangesAsync(ct);
        return Ok(new { id = round.Id, projectId = round.ProjectId, tFileId, roundNumber = round.RoundNumber, name = round.Name, createdAt = round.CreatedAt });
    }

    [HttpPost("rounds/{roundId}/versions")]
    [RequestSizeLimit(MaxFileSize)]
    public async Task<IActionResult> UploadVersion(string roundId, IFormFile file, [FromForm] string? notes, CancellationToken ct)
    {
        var round = await _db.TRounds.SingleOrDefaultAsync(x => x.Id == roundId, ct);
        if (round is null) return NotFound(new { error = "round not found" });
        var validation = Validate(file);
        if (validation is not null) return BadRequest(new { error = validation });
        var current = await _db.TVersions.Where(x => x.RoundId == roundId).ToListAsync(ct);
        foreach (var version in current) version.IsCurrentVersion = false;
        var number = current.Count == 0 ? 1 : current.Max(x => x.VersionNumber) + 1;
        var stored = await Store(file, round.ProjectId, $"t-files/{round.TFileId}/{roundId}", ct);
        var versionRow = new TVersion
        {
            RoundId = roundId, VersionNumber = number, FileName = Path.GetFileName(stored), OriginalFileName = Path.GetFileName(file.FileName),
            FileType = Path.GetExtension(file.FileName).ToLowerInvariant(), FileSize = file.Length, StorageReference = stored,
            UploadedBy = CurrentUser(), Notes = notes?.Trim(), IsCurrentVersion = true
        };
        _db.TVersions.Add(versionRow);
        await _db.SaveChangesAsync(ct);
        AddAudit("VersionUploaded", "TVersion", versionRow.Id.ToString(), round.ProjectId);
        await _db.SaveChangesAsync(ct);
        return Ok(ToVersion(versionRow));
    }

    [HttpGet("download/{kind}/{id:long}")]
    public async Task<IActionResult> DownloadAttachment(string kind, long id, [FromQuery] bool inline, CancellationToken ct)
    {
        var reference = kind.Equals("attachment", StringComparison.OrdinalIgnoreCase)
            ? await _db.ProjectAttachments.Where(x => x.Id == id).Select(x => new { x.StorageReference, x.OriginalFileName, x.FileType }).SingleOrDefaultAsync(ct)
            : await _db.TVersions.Where(x => x.Id == id).Select(x => new { x.StorageReference, x.OriginalFileName, x.FileType }).SingleOrDefaultAsync(ct);
        if (reference is null) return NotFound();
        var path = Path.Combine(_env.ContentRootPath, "App_Data", "Attachments", reference.StorageReference.Replace('/', Path.DirectorySeparatorChar));
        if (!System.IO.File.Exists(path)) return NotFound(new { error = "stored file not found" });
        var contentType = AllowedTypes.GetValueOrDefault(reference.FileType, "application/octet-stream");
        return inline && (reference.FileType.Equals(".pdf", StringComparison.OrdinalIgnoreCase) || reference.FileType.Equals(".png", StringComparison.OrdinalIgnoreCase))
            ? PhysicalFile(path, contentType)
            : PhysicalFile(path, contentType, reference.OriginalFileName);
    }

    private string? Validate(IFormFile? file)
    {
        if (file is null || file.Length == 0) return "file is required";
        if (file.Length > MaxFileSize) return "file size exceeds 25 MB";
        if (string.IsNullOrWhiteSpace(file.FileName) || file.FileName.Length > 255) return "file name is invalid";
        var extension = Path.GetExtension(file.FileName);
        if (!AllowedTypes.ContainsKey(extension)) return "only .xlsx, .xls, .pdf and .png files are allowed";
        if (!string.IsNullOrWhiteSpace(file.ContentType) && !file.ContentType.Equals(AllowedTypes[extension], StringComparison.OrdinalIgnoreCase)) return "file content type does not match its extension";
        return null;
    }

    private async Task<string> Store(IFormFile file, string projectId, string category, CancellationToken ct)
    {
        var safeProject = string.Concat(projectId.Select(c => char.IsLetterOrDigit(c) || c is '-' or '_' ? c : '_'));
        var relativeDirectory = Path.Combine(safeProject, category, DateTime.UtcNow.ToString("yyyy"), DateTime.UtcNow.ToString("MM"));
        var directory = Path.Combine(_env.ContentRootPath, "App_Data", "Attachments", relativeDirectory);
        Directory.CreateDirectory(directory);
        var storedName = $"{Guid.NewGuid():N}{Path.GetExtension(file.FileName).ToLowerInvariant()}";
        await using var stream = System.IO.File.Create(Path.Combine(directory, storedName));
        await file.CopyToAsync(stream, ct);
        return Path.Combine(relativeDirectory, storedName).Replace(Path.DirectorySeparatorChar, '/');
    }

    private void DeleteStorageFile(string reference)
    {
        var path = Path.Combine(_env.ContentRootPath, "App_Data", "Attachments", reference.Replace('/', Path.DirectorySeparatorChar));
        if (!System.IO.File.Exists(path)) return;
        try { System.IO.File.Delete(path); } catch (IOException) { }
    }

    private string CurrentUser()
    {
        var value = Request.Headers["X-User-Name"].ToString();
        if (string.IsNullOrWhiteSpace(value)) return "system";
        try
        {
            for (var attempt = 0; attempt < 3; attempt++)
            {
                var decoded = Uri.UnescapeDataString(value);
                if (decoded == value) break;
                value = decoded;
            }
            return value;
        }
        catch (UriFormatException) { return "system"; }
    }
    private void AddAudit(string action, string entityType, string entityId, string projectId) => _db.AuditLogs.Add(new AuditLogEntry { UserId = Request.Headers["X-User-Id"].ToString(), Action = action, EntityType = entityType, EntityId = entityId, Details = $"Project:{projectId}", CreatedAt = DateTime.UtcNow, IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(), UserAgent = Request.Headers.UserAgent.ToString() });
    private static object ToAttachment(ProjectAttachment x) => new { id = x.Id, projectId = x.ProjectId, attachmentName = x.AttachmentName, originalFileName = x.OriginalFileName, fileType = x.FileType, fileSize = x.FileSize, version = x.Version, uploadedBy = x.UploadedBy, uploadedAt = x.UploadedAt, notes = x.Notes, status = x.Status, downloadUrl = $"/api/files/download/attachment/{x.Id}" };
    private static object ToVersion(TVersion x) => new { id = x.Id, roundId = x.RoundId, versionNumber = x.VersionNumber, fileName = x.FileName, originalFileName = x.OriginalFileName, fileType = x.FileType, fileSize = x.FileSize, uploadedBy = x.UploadedBy, uploadedAt = x.UploadedAt, notes = x.Notes, isCurrentVersion = x.IsCurrentVersion, status = x.Status, downloadUrl = $"/api/files/download/version/{x.Id}" };

    public sealed class TFileRequest { public string? Name { get; set; } public string? Description { get; set; } }
    public sealed class RoundRequest { public int RoundNumber { get; set; } public string? Name { get; set; } public string? Description { get; set; } }
}
