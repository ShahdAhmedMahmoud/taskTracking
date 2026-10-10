namespace TenderDashboard.Api.Models;

public class Notification
{
    public long Id { get; set; }
    public string? UserId { get; set; }
    public string? RecipientEngineerId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? EntityType { get; set; }
    public string? EntityId { get; set; }
    public string? ProjectId { get; set; }
    public string? ProjectName { get; set; }
    public int? TaskId { get; set; }
    public long? AttachmentId { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReadAt { get; set; }
}
