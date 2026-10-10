namespace TenderDashboard.Api.Models;

public class ProjectTaskState
{
    public string ProjectId { get; set; } = string.Empty;
    public int TaskId { get; set; }
    public bool Status { get; set; }
    public bool Review { get; set; }
    public bool Applicable { get; set; }
    public DateTime? DueDate { get; set; }
    public string? Department { get; set; }
    public string? Notes { get; set; }
    public Project Project { get; set; } = null!;
    public StandardTask Task { get; set; } = null!;
}
