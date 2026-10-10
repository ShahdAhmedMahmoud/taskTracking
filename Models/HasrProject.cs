namespace TenderDashboard.Api.Models;

public class HasrProject
{
    public string Id { get; set; } = string.Empty;
    public string TeamId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DateTime? DeliveryDate { get; set; }
    public bool? HasWork { get; set; }
    public DateTime? HasrDueDate { get; set; }
    public bool HasrDone { get; set; }
    public string? HasrNotes { get; set; }
    public string? AddedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Team Team { get; set; } = null!;
}
