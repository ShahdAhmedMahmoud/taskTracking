namespace TenderDashboard.Api.Models;

public class TeamPaletteOption
{
    public string Id { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
