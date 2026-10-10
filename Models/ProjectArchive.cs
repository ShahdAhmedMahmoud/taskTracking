namespace TenderDashboard.Api.Models;

public class ProjectArchive
{
    public long Id { get; set; }
    public string ProjectId { get; set; } = string.Empty;
    public string EngineerId { get; set; } = string.Empty;
    public string EngineerName { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public DateTime? DeliveryDate { get; set; }
    public DateTime? InquiryDate { get; set; }
    public bool Finished { get; set; }
    public string? Outcome { get; set; }
    public string SnapshotJson { get; set; } = "{}";
    public string ArchivedBy { get; set; } = string.Empty;
    public DateTime ArchivedAt { get; set; } = DateTime.UtcNow;
    public string? Reason { get; set; }
}
