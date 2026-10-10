using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TenderDashboard.Api.Data;

namespace TenderDashboard.Api.Controllers;

[ApiController]
[Route("api/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly AppDbContext _db;

    public NotificationsController(AppDbContext db) => _db = db;

    [HttpGet("{engineerId}")]
    public async Task<IActionResult> Get(string engineerId, CancellationToken ct)
    {
        var notifications = await _db.Notifications.AsNoTracking()
            .Where(x => x.RecipientEngineerId == engineerId || x.UserId == engineerId)
            .OrderByDescending(x => x.CreatedAt)
            .Take(50)
            .Select(x => new
            {
                id = x.Id,
                type = x.Type,
                title = x.Title,
                message = x.Message,
                projectId = x.ProjectId,
                projectName = x.ProjectName,
                taskId = x.TaskId,
                createdAt = x.CreatedAt,
                readAt = x.ReadAt
            })
            .ToListAsync(ct);

        return Ok(new { unread = notifications.Count(x => x.readAt == null), items = notifications });
    }

    [HttpPost("{engineerId}/read")]
    public async Task<IActionResult> MarkRead(string engineerId, CancellationToken ct)
    {
        var rows = await _db.Notifications
            .Where(x => (x.RecipientEngineerId == engineerId || x.UserId == engineerId) && x.ReadAt == null)
            .ToListAsync(ct);
        var now = DateTime.UtcNow;
        foreach (var row in rows) row.ReadAt = now;
        await _db.SaveChangesAsync(ct);
        return Ok(new { ok = true, count = rows.Count });
    }

    [HttpPost("{engineerId}/read/{id:long}")]
    public async Task<IActionResult> MarkOneRead(string engineerId, long id, CancellationToken ct)
    {
        var row = await _db.Notifications.FirstOrDefaultAsync(x => x.Id == id && (x.RecipientEngineerId == engineerId || x.UserId == engineerId), ct);
        if (row is null) return NotFound();
        row.ReadAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return Ok(new { ok = true });
    }
}
