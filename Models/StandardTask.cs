namespace TenderDashboard.Api.Models;

public class StandardTask
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool DefaultApplicable { get; set; } = true;
}