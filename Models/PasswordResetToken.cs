namespace TenderDashboard.Api.Models;

public class PasswordResetToken
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string UserId { get; set; } = string.Empty;
    public string TokenHash { get; set; } = string.Empty;
    public string Purpose { get; set; } = "PasswordReset";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddMinutes(30);
    public DateTime? UsedAt { get; set; }
    public string? RequestedByIp { get; set; }
}