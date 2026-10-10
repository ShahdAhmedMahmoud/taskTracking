namespace TenderDashboard.Api.Models;

public class Project
{
    public string Id { get; set; } = string.Empty;
    public string EngineerId { get; set; } = string.Empty;
    public string? ProjectCode { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Department { get; set; }
    public string? Status { get; set; }
    public string? Priority { get; set; }
    public string? ProjectType { get; set; }
    public DateTime? DeliveryDate { get; set; }
    public DateTime? InquiryDate { get; set; }
    public bool Finished { get; set; }
    public string? Outcome { get; set; }
    public bool HasrSynced { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastSaved { get; set; } = DateTime.UtcNow;
    public Engineer Engineer { get; set; } = null!;
    public ICollection<ProjectTaskState> TaskStates { get; set; } = new List<ProjectTaskState>();
    public ICollection<CustomTask> CustomTasks { get; set; } = new List<CustomTask>();
    public ICollection<ProjectAttachment> Attachments { get; set; } = new List<ProjectAttachment>();
    public ICollection<TFile> TFiles { get; set; } = new List<TFile>();
}
