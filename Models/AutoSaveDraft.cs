namespace TenderDashboard.Api.Models;

public class AutoSaveDraft
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string RecordType { get; set; } = string.Empty;
    public string RecordId { get; set; } = string.Empty;
    public string? OwnerUserId { get; set; }
    public string DraftJson { get; set; } = "{}";
    public DateTime LastSavedAt { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "draft";
    public bool IsLatest { get; set; } = true;
}