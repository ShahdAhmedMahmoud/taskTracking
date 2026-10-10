namespace TenderDashboard.Api.Models;

public class FieldDefinition
{
    public int Id { get; set; }
    public string Scope { get; set; } = string.Empty;
    public string FieldKey { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsRequired { get; set; }
    public bool IsActive { get; set; } = true;
}
