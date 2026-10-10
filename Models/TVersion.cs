namespace TenderDashboard.Api.Models;

public class TVersion
{
    public long Id { get; set; }
    public string RoundId { get; set; } = string.Empty;
    public int VersionNumber { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string StorageReference { get; set; } = string.Empty;
    public string? UploadedBy { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public string? Notes { get; set; }
    public bool IsCurrentVersion { get; set; } = true;
    public string Status { get; set; } = "active";
    public TRound Round { get; set; } = null!;
}
