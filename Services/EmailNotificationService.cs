using System.Net;
using System.Net.Mail;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TenderDashboard.Api.Data;
using TenderDashboard.Api.Models;

namespace TenderDashboard.Api.Services;

public interface IEmailNotificationService
{
    Task SendProjectCreatedAsync(Project project, Engineer engineer, string? createdBy, IEnumerable<UserAccount>? additionalRecipients = null, EmailNotificationSettings? overrideSettings = null, CancellationToken cancellationToken = default);
    Task SendAsync(string subject, string body, IEnumerable<string> recipients, EmailNotificationSettings? overrideSettings = null, CancellationToken cancellationToken = default);
}

public sealed class EmailNotificationSettings
{
    public bool Enabled { get; set; }
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public bool EnableSsl { get; set; } = true;
    public string From { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public bool IncludeProjectOwner { get; set; } = true;
    public bool IncludeTeamMembers { get; set; } = true;
    public List<string> DefaultRecipients { get; set; } = [];
}

public sealed class EmailNotificationService : IEmailNotificationService
{
    private readonly AppDbContext _db;
    private readonly EmailNotificationSettings _settings;
    private readonly ILogger<EmailNotificationService> _logger;

    public EmailNotificationService(AppDbContext db, IOptions<EmailNotificationSettings> settings, ILogger<EmailNotificationService> logger)
    {
        _db = db;
        _settings = settings.Value;
        _logger = logger;
    }

    private async Task<EmailNotificationSettings> ResolveSettingsAsync(EmailNotificationSettings? overrideSettings, CancellationToken cancellationToken)
    {
        if (overrideSettings != null)
            return overrideSettings;

        var config = await _db.DashboardSettings.AsNoTracking().FirstOrDefaultAsync(x => x.Id == 1, cancellationToken);
        if (config == null)
            return _settings;

        if (string.IsNullOrWhiteSpace(config.SmtpHost) && string.IsNullOrWhiteSpace(config.SmtpFrom) && !config.EmailEnabled && !config.IncludeProjectOwner && !config.IncludeTeamMembers && string.IsNullOrWhiteSpace(config.DefaultRecipients))
            return _settings;

        return new EmailNotificationSettings
        {
            Enabled = config.EmailEnabled,
            Host = config.SmtpHost ?? string.Empty,
            Port = config.SmtpPort > 0 ? config.SmtpPort : _settings.Port,
            EnableSsl = config.SmtpEnableSsl,
            From = config.SmtpFrom ?? string.Empty,
            UserName = config.SmtpUserName ?? string.Empty,
            Password = config.SmtpPassword ?? string.Empty,
            IncludeProjectOwner = config.IncludeProjectOwner,
            IncludeTeamMembers = config.IncludeTeamMembers,
            DefaultRecipients = string.IsNullOrWhiteSpace(config.DefaultRecipients)
                ? _settings.DefaultRecipients
                : config.DefaultRecipients.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList()
        };
    }

    public async Task SendProjectCreatedAsync(Project project, Engineer engineer, string? createdBy, IEnumerable<UserAccount>? additionalRecipients = null, EmailNotificationSettings? overrideSettings = null, CancellationToken cancellationToken = default)
    {
        var settings = await ResolveSettingsAsync(overrideSettings, cancellationToken);
        if (!settings.Enabled)
        {
            _logger.LogInformation("Email notifications are disabled. Project {ProjectId} was not emailed.", project.Id);
            return;
        }

        if (string.IsNullOrWhiteSpace(settings.Host) || string.IsNullOrWhiteSpace(settings.From))
        {
            _logger.LogWarning("SMTP settings are incomplete. Email notifications for project {ProjectId} are skipped.", project.Id);
            return;
        }

        var recipients = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        if (settings.IncludeProjectOwner && !string.IsNullOrWhiteSpace(engineer.CompanyEmail))
            recipients.Add(engineer.CompanyEmail.Trim());

        if (settings.IncludeTeamMembers)
        {
            foreach (var item in additionalRecipients ?? Enumerable.Empty<UserAccount>())
            {
                if (!string.IsNullOrWhiteSpace(item.Email))
                    recipients.Add(item.Email.Trim());
            }
        }

        foreach (var email in settings.DefaultRecipients)
        {
            if (!string.IsNullOrWhiteSpace(email))
                recipients.Add(email.Trim());
        }

        if (recipients.Count == 0)
        {
            _logger.LogInformation("No email recipients found for new project {ProjectId}.", project.Id);
            return;
        }

        var subject = $"تمت إضافة مشروع جديد: {project.Name} ({project.ProjectCode ?? project.Id})";
        var body = $"""
تمت إضافة مشروع جديد في نظام متابعة العطاءات.

اسم المشروع: {project.Name}
الكود: {project.ProjectCode ?? project.Id}
القسم: {project.Department ?? "-"}
المهندس: {engineer.Name}
تمت الإضافة بواسطة: {createdBy ?? "النظام"}
تاريخ الإضافة: {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC

يمكنك الدخول إلى النظام لمتابعة المشروع.
""";

        await SendAsync(subject, body, recipients, settings, cancellationToken);
    }

    public async Task SendAsync(string subject, string body, IEnumerable<string> recipients, EmailNotificationSettings? overrideSettings = null, CancellationToken cancellationToken = default)
    {
        var settings = overrideSettings ?? await ResolveSettingsAsync(null, cancellationToken);
        var validRecipients = recipients
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (validRecipients.Count == 0 || !settings.Enabled)
            return;

        try
        {
            using var message = new MailMessage
            {
                From = new MailAddress(settings.From),
                Subject = subject,
                Body = body,
                IsBodyHtml = false
            };

            foreach (var recipient in validRecipients)
            {
                message.To.Add(recipient);
            }

            using var client = new SmtpClient(settings.Host, settings.Port)
            {
                EnableSsl = settings.EnableSsl,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false,
                Credentials = string.IsNullOrWhiteSpace(settings.UserName) || string.IsNullOrWhiteSpace(settings.Password)
                    ? CredentialCache.DefaultNetworkCredentials
                    : new NetworkCredential(settings.UserName, settings.Password)
            };

            await client.SendMailAsync(message, cancellationToken);
            _logger.LogInformation("Project email sent to {RecipientCount} recipients.", validRecipients.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email notification to {RecipientCount} recipients.", validRecipients.Count);
        }
    }
}
