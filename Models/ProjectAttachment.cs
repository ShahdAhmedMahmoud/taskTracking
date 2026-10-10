namespace TenderDashboard.Api.Models;

public class ProjectAttachment
{
    public long Id { get; set; }
    public string ProjectId { get; set; } = string.Empty;
    public string AttachmentName { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string StorageReference { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public int Version { get; set; } = 1;
    public string? UploadedBy { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public string? Notes { get; set; }
    public string Status { get; set; } = "active";
    public Project Project { get; set; } = null!;
}
