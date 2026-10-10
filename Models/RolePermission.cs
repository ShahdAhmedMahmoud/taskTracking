namespace TenderDashboard.Api.Models;

public class RolePermission
{
    public int Id { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public string Permission { get; set; } = string.Empty;
    public string Scope { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}