namespace TenderDashboard.Api.Models;

public class AuthHash
{
    public string Role { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
