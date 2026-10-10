namespace TenderDashboard.Api.Models;

public class CustomTask
{
    public string Id { get; set; } = string.Empty;
    public string ProjectId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool Status { get; set; }
    public bool Review { get; set; }
    public bool Applicable { get; set; } = true;
    public DateTime? DueDate { get; set; }
    public string? Department { get; set; }
    public string? Notes { get; set; }
    public Project Project { get; set; } = null!;
}
