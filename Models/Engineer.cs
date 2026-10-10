namespace TenderDashboard.Api.Models;

public class Engineer
{
    public string Id { get; set; } = string.Empty;
    public string TeamId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string CompanyEmail { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public string? PhotoData { get; set; }
    public Team Team { get; set; } = null!;
}