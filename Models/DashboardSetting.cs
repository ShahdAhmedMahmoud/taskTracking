namespace TenderDashboard.Api.Models;

public class DashboardSetting
{
    public int Id { get; set; }
    public string DeptManager { get; set; } = string.Empty;
    public string DefaultProjectName { get; set; } = string.Empty;
    public DateTime? DefaultDeliveryDate { get; set; }
    public DateTime? DefaultInquiryDate { get; set; }

    public bool EmailEnabled { get; set; }
    public string? SmtpHost { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 587;
    public bool SmtpEnableSsl { get; set; } = true;
    public string? SmtpFrom { get; set; } = string.Empty;
    public string? SmtpUserName { get; set; } = string.Empty;
    public string? SmtpPassword { get; set; } = string.Empty;
    public bool IncludeProjectOwner { get; set; } = true;
    public bool IncludeTeamMembers { get; set; } = true;
    public string? DefaultRecipients { get; set; } = string.Empty;
}
