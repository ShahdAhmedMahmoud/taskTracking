namespace TenderDashboard.Api.Models;

public class TRound
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string ProjectId { get; set; } = string.Empty;
    public string TFileId { get; set; } = string.Empty;
    public int RoundNumber { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "active";
    public TFile TFile { get; set; } = null!;
    public ICollection<TVersion> Versions { get; set; } = new List<TVersion>();
}
