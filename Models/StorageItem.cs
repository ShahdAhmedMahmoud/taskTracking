namespace TenderDashboard.Api.Models;

public class StorageItem
{
    public int Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public bool Shared { get; set; } = true;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
