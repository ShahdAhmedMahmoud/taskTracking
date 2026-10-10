namespace TenderDashboard.Api.Models;

public class TFile
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string ProjectId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = "active";
    public string? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Project Project { get; set; } = null!;
    public ICollection<TRound> Rounds { get; set; } = new List<TRound>();
}
