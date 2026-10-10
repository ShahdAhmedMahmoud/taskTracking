namespace TenderDashboard.Api.Models;

public class Team
{
    public string Id { get; set; } = string.Empty;
    public string ManagerName { get; set; } = string.Empty;
    public string? Color { get; set; }
    public string Division { get; set; } = "main";
    public string Type { get; set; } = "standard";
    public string? Label { get; set; }
    public ICollection<Engineer> Engineers { get; set; } = new List<Engineer>();
}