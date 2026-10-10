using Microsoft.EntityFrameworkCore;
using TenderDashboard.Api.Models;

namespace TenderDashboard.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // Legacy table: kept only for one-time migration compatibility. Runtime business APIs do not use it.
    public DbSet<StorageItem> StorageItems => Set<StorageItem>();
    public DbSet<Team> Teams => Set<Team>();
    public DbSet<Engineer> Engineers => Set<Engineer>();
    public DbSet<StandardTask> StandardTasks => Set<StandardTask>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectTaskState> ProjectTaskStates => Set<ProjectTaskState>();
    public DbSet<CustomTask> CustomTasks => Set<CustomTask>();
    public DbSet<HasrProject> HasrProjects => Set<HasrProject>();
    public DbSet<AuthHash> AuthHashes => Set<AuthHash>();
    public DbSet<DashboardSetting> DashboardSettings => Set<DashboardSetting>();
    public DbSet<ProjectOutcomeOption> ProjectOutcomeOptions => Set<ProjectOutcomeOption>();
    public DbSet<TeamPaletteOption> TeamPaletteOptions => Set<TeamPaletteOption>();
    public DbSet<FieldDefinition> FieldDefinitions => Set<FieldDefinition>();
    public DbSet<UserAccount> Users => Set<UserAccount>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<AuditLogEntry> AuditLogs => Set<AuditLogEntry>();
    public DbSet<AutoSaveDraft> AutoSaveDrafts => Set<AutoSaveDraft>();
    public DbSet<ProjectArchive> ProjectArchives => Set<ProjectArchive>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<ProjectAttachment> ProjectAttachments => Set<ProjectAttachment>();
    public DbSet<TFile> TFiles => Set<TFile>();
    public DbSet<TRound> TRounds => Set<TRound>();
    public DbSet<TVersion> TVersions => Set<TVersion>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<StorageItem>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.Key, x.Shared }).IsUnique();
            e.Property(x => x.Key).HasMaxLength(256).IsRequired();
            e.Property(x => x.Value).IsRequired();
        });

        modelBuilder.Entity<Team>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasMaxLength(50);
            e.Property(x => x.ManagerName).HasMaxLength(200).IsRequired();
            e.Property(x => x.Color).HasMaxLength(20);
            e.Property(x => x.Division).HasMaxLength(50).IsRequired();
            e.Property(x => x.Type).HasMaxLength(50).IsRequired();
            e.Property(x => x.Label).HasMaxLength(100);
        });

        modelBuilder.Entity<Engineer>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasMaxLength(50);
            e.Property(x => x.TeamId).HasMaxLength(50).IsRequired();
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.CompanyEmail).HasMaxLength(200).IsRequired();
            e.Property(x => x.PhoneNumber).HasMaxLength(50).IsRequired();
            e.Property(x => x.EmployeeCode).HasMaxLength(100).IsRequired();
            e.Property(x => x.PhotoData);
            e.HasOne(x => x.Team).WithMany(x => x.Engineers).HasForeignKey(x => x.TeamId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<StandardTask>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Title).HasMaxLength(500).IsRequired();
            e.Property(x => x.Description);
        });

        modelBuilder.Entity<Project>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasMaxLength(100);
            e.Property(x => x.EngineerId).HasMaxLength(50).IsRequired();
            e.Property(x => x.Name).HasMaxLength(500).IsRequired();
            e.Property(x => x.ProjectCode).HasMaxLength(100);
            e.Property(x => x.Department).HasMaxLength(200);
            e.Property(x => x.Status).HasMaxLength(50);
            e.Property(x => x.Priority).HasMaxLength(50);
            e.Property(x => x.ProjectType).HasMaxLength(100);
            e.Property(x => x.Outcome).HasMaxLength(50);
            e.HasIndex(x => x.EngineerId);
            e.HasOne(x => x.Engineer).WithMany().HasForeignKey(x => x.EngineerId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProjectAttachment>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.ProjectId).HasMaxLength(100).IsRequired();
            e.Property(x => x.AttachmentName).HasMaxLength(500).IsRequired();
            e.Property(x => x.OriginalFileName).HasMaxLength(500).IsRequired();
            e.Property(x => x.StorageReference).HasMaxLength(1000).IsRequired();
            e.Property(x => x.FileType).HasMaxLength(100).IsRequired();
            e.Property(x => x.UploadedBy).HasMaxLength(200);
            e.Property(x => x.Notes).HasMaxLength(2000);
            e.Property(x => x.Status).HasMaxLength(50).IsRequired();
            e.HasIndex(x => x.ProjectId);
            e.HasOne(x => x.Project).WithMany(x => x.Attachments).HasForeignKey(x => x.ProjectId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TFile>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasMaxLength(100);
            e.Property(x => x.ProjectId).HasMaxLength(100).IsRequired();
            e.Property(x => x.Name).HasMaxLength(500).IsRequired();
            e.Property(x => x.Description).HasMaxLength(2000);
            e.Property(x => x.Status).HasMaxLength(50).IsRequired();
            e.Property(x => x.CreatedBy).HasMaxLength(200);
            e.HasIndex(x => x.ProjectId);
            e.HasOne(x => x.Project).WithMany(x => x.TFiles).HasForeignKey(x => x.ProjectId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TRound>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasMaxLength(100);
            e.Property(x => x.ProjectId).HasMaxLength(100).IsRequired();
            e.Property(x => x.TFileId).HasMaxLength(100).IsRequired();
            e.Property(x => x.Name).HasMaxLength(500).IsRequired();
            e.Property(x => x.Description).HasMaxLength(2000);
            e.Property(x => x.CreatedBy).HasMaxLength(200);
            e.Property(x => x.Status).HasMaxLength(50).IsRequired();
            e.HasIndex(x => new { x.TFileId, x.RoundNumber }).IsUnique();
            e.HasOne(x => x.TFile).WithMany(x => x.Rounds).HasForeignKey(x => x.TFileId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TVersion>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.RoundId).HasMaxLength(100).IsRequired();
            e.Property(x => x.FileName).HasMaxLength(500).IsRequired();
            e.Property(x => x.OriginalFileName).HasMaxLength(500).IsRequired();
            e.Property(x => x.FileType).HasMaxLength(100).IsRequired();
            e.Property(x => x.StorageReference).HasMaxLength(1000).IsRequired();
            e.Property(x => x.UploadedBy).HasMaxLength(200);
            e.Property(x => x.Notes).HasMaxLength(2000);
            e.Property(x => x.Status).HasMaxLength(50).IsRequired();
            e.HasIndex(x => new { x.RoundId, x.VersionNumber }).IsUnique();
            e.HasOne(x => x.Round).WithMany(x => x.Versions).HasForeignKey(x => x.RoundId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProjectTaskState>(e =>
        {
            e.HasKey(x => new { x.ProjectId, x.TaskId });
            e.Property(x => x.ProjectId).HasMaxLength(100);
            e.Property(x => x.Department).HasMaxLength(200);
            e.HasOne(x => x.Project).WithMany(x => x.TaskStates).HasForeignKey(x => x.ProjectId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Task).WithMany().HasForeignKey(x => x.TaskId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CustomTask>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasMaxLength(100);
            e.Property(x => x.ProjectId).HasMaxLength(100).IsRequired();
            e.Property(x => x.Title).HasMaxLength(500).IsRequired();
            e.Property(x => x.Description);
            e.Property(x => x.Department).HasMaxLength(200);
            e.HasIndex(x => x.ProjectId);
            e.HasOne(x => x.Project).WithMany(x => x.CustomTasks).HasForeignKey(x => x.ProjectId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<HasrProject>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasMaxLength(100);
            e.Property(x => x.TeamId).HasMaxLength(50).IsRequired();
            e.Property(x => x.Name).HasMaxLength(500).IsRequired();
            e.Property(x => x.AddedBy).HasMaxLength(200);
            e.Property(x => x.HasrNotes);
            e.HasIndex(x => x.TeamId);
            e.HasOne(x => x.Team).WithMany().HasForeignKey(x => x.TeamId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AuthHash>(e =>
        {
            e.HasKey(x => new { x.Role, x.EntityId });
            e.Property(x => x.Role).HasMaxLength(30);
            e.Property(x => x.EntityId).HasMaxLength(100);
            e.Property(x => x.PasswordHash).HasMaxLength(256).IsRequired();
        });

        modelBuilder.Entity<DashboardSetting>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.DeptManager).HasMaxLength(200).IsRequired();
            e.Property(x => x.DefaultProjectName).HasMaxLength(500).IsRequired();
            e.Property(x => x.SmtpHost).HasMaxLength(200);
            e.Property(x => x.SmtpFrom).HasMaxLength(200);
            e.Property(x => x.SmtpUserName).HasMaxLength(200);
            e.Property(x => x.SmtpPassword).HasMaxLength(200);
        });

        modelBuilder.Entity<ProjectOutcomeOption>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasMaxLength(50);
            e.Property(x => x.Label).HasMaxLength(200).IsRequired();
        });

        modelBuilder.Entity<TeamPaletteOption>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasMaxLength(50);
            e.Property(x => x.Value).HasMaxLength(30).IsRequired();
        });

        modelBuilder.Entity<FieldDefinition>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.Scope, x.FieldKey }).IsUnique();
            e.Property(x => x.Scope).HasMaxLength(50).IsRequired();
            e.Property(x => x.FieldKey).HasMaxLength(100).IsRequired();
            e.Property(x => x.Label).HasMaxLength(200).IsRequired();
            e.Property(x => x.Type).HasMaxLength(50).IsRequired();
        });

        modelBuilder.Entity<UserAccount>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasMaxLength(100);
            e.Property(x => x.UserName).HasMaxLength(100).IsRequired();
            e.Property(x => x.EngineerId).HasMaxLength(50);
            e.Property(x => x.Email).HasMaxLength(200).IsRequired();
            e.Property(x => x.PhoneNumber).HasMaxLength(50).IsRequired();
            e.Property(x => x.EmployeeCode).HasMaxLength(100).IsRequired();
            e.Property(x => x.FullName).HasMaxLength(200);
            e.Property(x => x.PasswordHash).HasMaxLength(256).IsRequired();
            e.HasIndex(x => x.UserName).IsUnique();
            e.HasIndex(x => x.Email).IsUnique();
            e.HasIndex(x => x.EngineerId).IsUnique().HasFilter("[EngineerId] IS NOT NULL");
            e.HasOne<Engineer>().WithMany().HasForeignKey(x => x.EngineerId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<RolePermission>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.RoleName).HasMaxLength(100).IsRequired();
            e.Property(x => x.Permission).HasMaxLength(200).IsRequired();
            e.Property(x => x.Scope).HasMaxLength(100).IsRequired();
            e.HasIndex(x => new { x.RoleName, x.Permission, x.Scope }).IsUnique();
        });

        modelBuilder.Entity<PasswordResetToken>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasMaxLength(100);
            e.Property(x => x.UserId).HasMaxLength(100).IsRequired();
            e.Property(x => x.TokenHash).HasMaxLength(256).IsRequired();
            e.Property(x => x.Purpose).HasMaxLength(100).IsRequired();
            e.Property(x => x.RequestedByIp).HasMaxLength(100);
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.TokenHash).IsUnique();
        });

        modelBuilder.Entity<AuditLogEntry>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.UserId).HasMaxLength(100);
            e.Property(x => x.Action).HasMaxLength(200).IsRequired();
            e.Property(x => x.EntityType).HasMaxLength(200).IsRequired();
            e.Property(x => x.EntityId).HasMaxLength(200);
            e.Property(x => x.Details).HasMaxLength(2000);
            e.Property(x => x.OldValue).HasMaxLength(4000);
            e.Property(x => x.NewValue).HasMaxLength(4000);
            e.Property(x => x.IpAddress).HasMaxLength(100);
            e.Property(x => x.UserAgent).HasMaxLength(500);
            e.HasIndex(x => x.CreatedAt);
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.Action);
        });

        modelBuilder.Entity<AutoSaveDraft>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasMaxLength(100);
            e.Property(x => x.RecordType).HasMaxLength(100).IsRequired();
            e.Property(x => x.RecordId).HasMaxLength(200).IsRequired();
            e.Property(x => x.OwnerUserId).HasMaxLength(100);
            e.Property(x => x.Status).HasMaxLength(50).IsRequired();
            e.HasIndex(x => new { x.RecordType, x.RecordId }).IsUnique();
            e.HasIndex(x => x.OwnerUserId);
        });

        modelBuilder.Entity<ProjectArchive>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.ProjectId).HasMaxLength(100).IsRequired();
            e.Property(x => x.EngineerId).HasMaxLength(50).IsRequired();
            e.Property(x => x.EngineerName).HasMaxLength(200).IsRequired();
            e.Property(x => x.ProjectName).HasMaxLength(500).IsRequired();
            e.Property(x => x.Outcome).HasMaxLength(50);
            e.Property(x => x.SnapshotJson).IsRequired();
            e.Property(x => x.ArchivedBy).HasMaxLength(200).IsRequired();
            e.Property(x => x.Reason).HasMaxLength(1000);
            e.HasIndex(x => x.ProjectId);
            e.HasIndex(x => x.ArchivedAt);
        });

        modelBuilder.Entity<Notification>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.UserId).HasMaxLength(100);
            e.Property(x => x.RecipientEngineerId).HasMaxLength(50);
            e.Property(x => x.Type).HasMaxLength(50).IsRequired();
            e.Property(x => x.Title).HasMaxLength(300).IsRequired();
            e.Property(x => x.Message).HasMaxLength(2000).IsRequired();
            e.Property(x => x.EntityType).HasMaxLength(100);
            e.Property(x => x.EntityId).HasMaxLength(200);
            e.Property(x => x.ProjectId).HasMaxLength(100);
            e.Property(x => x.ProjectName).HasMaxLength(500);
            e.Property(x => x.CreatedBy).HasMaxLength(100);
            e.HasIndex(x => new { x.RecipientEngineerId, x.CreatedAt });
        });
    }
}
