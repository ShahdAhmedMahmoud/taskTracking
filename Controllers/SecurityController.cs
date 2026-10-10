using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TenderDashboard.Api.Data;
using TenderDashboard.Api.Models;

namespace TenderDashboard.Api.Controllers;

[ApiController]
[Route("api/security")]
public class SecurityController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    public SecurityController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.EmailOrUserName))
            return BadRequest(new { error = "email or username is required" });

        var user = await _db.Users.FirstOrDefaultAsync(x => x.Email == request.EmailOrUserName || x.UserName == request.EmailOrUserName, ct);
        if (user is null)
        {
            return Ok(new { ok = true, message = "If the account exists, a reset link has been prepared." });
        }

        var rawToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var tokenHash = HashValue(rawToken);
        var now = DateTime.UtcNow;
        var requestIp = HttpContext.Connection.RemoteIpAddress?.ToString();

        var existingTokens = await _db.PasswordResetTokens.Where(x => x.UserId == user.Id && x.Purpose == "PasswordReset").ToListAsync(ct);
        _db.PasswordResetTokens.RemoveRange(existingTokens);

        _db.PasswordResetTokens.Add(new PasswordResetToken
        {
            UserId = user.Id,
            TokenHash = tokenHash,
            Purpose = "PasswordReset",
            RequestedByIp = requestIp,
            CreatedAt = now,
            ExpiresAt = now.AddMinutes(30)
        });

        await _db.SaveChangesAsync(ct);
        await LogAuditAsync("PasswordResetRequested", "UserAccount", user.Id, "Password reset requested", user.Id, null, null, requestIp, Request.Headers.UserAgent.ToString(), ct);

        return Ok(new
        {
            ok = true,
            message = "If the account exists, a reset link has been prepared.",
            debugToken = _env.IsDevelopment() ? rawToken : null
        });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Token) || string.IsNullOrWhiteSpace(request.NewPassword))
            return BadRequest(new { error = "token and new password are required" });

        if (request.NewPassword.Length < 8)
            return BadRequest(new { error = "password must be at least 8 characters long" });

        var tokenHash = HashValue(request.Token);
        var token = await _db.PasswordResetTokens
            .FirstOrDefaultAsync(x => x.TokenHash == tokenHash && x.Purpose == "PasswordReset" && x.UsedAt == null && x.ExpiresAt > DateTime.UtcNow, ct);

        if (token is null)
            return BadRequest(new { error = "reset token is invalid or expired" });

        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == token.UserId, ct);
        if (user is null)
            return NotFound(new { error = "user not found for this reset token" });

        user.PasswordHash = HashValue(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        user.MustChangePassword = false;

        token.UsedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        await LogAuditAsync("PasswordResetCompleted", "UserAccount", user.Id, "Password reset completed", user.Id, null, null, HttpContext.Connection.RemoteIpAddress?.ToString(), Request.Headers.UserAgent.ToString(), ct);

        return Ok(new { ok = true, message = "Password has been updated successfully." });
    }

    [HttpPost("admin/reset-password/{userId}")]
    public async Task<IActionResult> AdminResetPassword(string userId, [FromBody] AdminResetPasswordRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.NewPassword))
            return BadRequest(new { error = "new password is required" });

        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == userId, ct);
        if (user is null)
            return NotFound(new { error = "user not found" });

        user.PasswordHash = HashValue(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        user.MustChangePassword = true;

        await _db.SaveChangesAsync(ct);
        await LogAuditAsync("AdminPasswordReset", "UserAccount", user.Id, request.Reason ?? "Admin password reset", user.Id, null, null, HttpContext.Connection.RemoteIpAddress?.ToString(), Request.Headers.UserAgent.ToString(), ct);

        return Ok(new { ok = true, message = "Password reset by administrator completed." });
    }

    [HttpPost("autosave")]
    public async Task<IActionResult> SaveDraft([FromBody] AutoSaveDraftRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.RecordType) || string.IsNullOrWhiteSpace(request.RecordId))
            return BadRequest(new { error = "record type and record id are required" });

        var now = DateTime.UtcNow;
        var draft = await _db.AutoSaveDrafts.FirstOrDefaultAsync(x => x.RecordType == request.RecordType && x.RecordId == request.RecordId, ct);
        if (draft is null)
        {
            draft = new AutoSaveDraft
            {
                Id = Guid.NewGuid().ToString("N"),
                RecordType = request.RecordType,
                RecordId = request.RecordId,
                OwnerUserId = request.OwnerUserId,
                Status = "draft",
                IsLatest = true,
                DraftJson = request.DraftJson ?? "{}",
                LastSavedAt = now
            };
            _db.AutoSaveDrafts.Add(draft);
        }
        else
        {
            draft.OwnerUserId = request.OwnerUserId;
            draft.DraftJson = request.DraftJson ?? "{}";
            draft.LastSavedAt = now;
            draft.Status = "draft";
            draft.IsLatest = true;
        }

        await _db.SaveChangesAsync(ct);
        await LogAuditAsync("AutoSave", "AutoSaveDraft", draft.Id, $"Auto-save for {request.RecordType}:{request.RecordId}", request.OwnerUserId, null, null, HttpContext.Connection.RemoteIpAddress?.ToString(), Request.Headers.UserAgent.ToString(), ct);

        return Ok(new { ok = true, savedAt = now });
    }

    [HttpGet("autosave/{recordType}/{recordId}")]
    public async Task<IActionResult> GetDraft(string recordType, string recordId, CancellationToken ct)
    {
        var draft = await _db.AutoSaveDrafts.FirstOrDefaultAsync(x => x.RecordType == recordType && x.RecordId == recordId, ct);
        if (draft is null)
            return NotFound(new { error = "no draft found" });

        return Ok(new
        {
            id = draft.Id,
            recordType = draft.RecordType,
            recordId = draft.RecordId,
            ownerUserId = draft.OwnerUserId,
            draftJson = draft.DraftJson,
            lastSavedAt = draft.LastSavedAt,
            status = draft.Status,
            isLatest = draft.IsLatest
        });
    }

    [HttpGet("audit")]
    public async Task<IActionResult> GetAuditLogs(CancellationToken ct)
    {
        var logs = await _db.AuditLogs
            .OrderByDescending(x => x.CreatedAt)
            .Take(100)
            .ToListAsync(ct);

        return Ok(logs.Select(x => new
        {
            id = x.Id,
            userId = x.UserId,
            action = x.Action,
            entityType = x.EntityType,
            entityId = x.EntityId,
            details = x.Details,
            createdAt = x.CreatedAt,
            ipAddress = x.IpAddress
        }));
    }

    private static string HashValue(string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value.Trim()));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private async Task LogAuditAsync(string action, string entityType, string? entityId, string? details, string? userId, string? oldValue, string? newValue, string? ipAddress, string? userAgent, CancellationToken ct)
    {
        _db.AuditLogs.Add(new AuditLogEntry
        {
            UserId = userId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Details = details,
            OldValue = oldValue,
            NewValue = newValue,
            IpAddress = ipAddress,
            UserAgent = userAgent
        });

        await _db.SaveChangesAsync(ct);
    }

    public sealed class ForgotPasswordRequest
    {
        public string? EmailOrUserName { get; set; }
    }

    public sealed class ResetPasswordRequest
    {
        public string? Token { get; set; }
        public string? NewPassword { get; set; }
    }

    public sealed class AdminResetPasswordRequest
    {
        public string? NewPassword { get; set; }
        public string? Reason { get; set; }
    }

    public sealed class AutoSaveDraftRequest
    {
        public string? RecordType { get; set; }
        public string? RecordId { get; set; }
        public string? OwnerUserId { get; set; }
        public string? DraftJson { get; set; }
    }
}