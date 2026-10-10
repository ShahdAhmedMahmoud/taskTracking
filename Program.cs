using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TenderDashboard.Api.Data;
using TenderDashboard.Api.Models;
using TenderDashboard.Api.Services;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();

builder.Services.Configure<EmailNotificationSettings>(builder.Configuration.GetSection("EmailNotification"));
builder.Services.AddScoped<IEmailNotificationService, EmailNotificationService>();

var attachmentsDirectory = Path.Combine(builder.Environment.ContentRootPath, "App_Data", "Attachments");
Directory.CreateDirectory(attachmentsDirectory);

var connStr = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=tender.db";
var useSqlite = connStr.EndsWith(".db", StringComparison.OrdinalIgnoreCase)
                || connStr.Contains("Data Source=tender.db", StringComparison.OrdinalIgnoreCase)
                || (connStr.Contains(".db", StringComparison.OrdinalIgnoreCase)
                    && !connStr.Contains("Initial Catalog", StringComparison.OrdinalIgnoreCase)
                    && !connStr.Contains("Database=", StringComparison.OrdinalIgnoreCase)
                    && !connStr.Contains("Integrated Security", StringComparison.OrdinalIgnoreCase));

if (useSqlite) builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlite(connStr));
else builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlServer(connStr));

builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        if (!useSqlite)
        {
            CleanupLegacySqlServerTables(db);
        }

        db.Database.EnsureCreated();
        EnsureFoundationSchema(db, useSqlite);
        EnsureNormalizedSchema(db, useSqlite);
        EnsureProjectFeatureSchema(db, useSqlite);
        EnsureContactSchema(db, useSqlite);
        MigrateLegacyRoster(db);
        SeedDefaultRoster(db);
        SeedDefaultStandardTasks(db);
        MigrateLegacyTasks(db);
        MigrateLegacyDashboardData(db);
        Console.WriteLine("Database schema is ready. Business data is stored in normalized tables; StorageItems is legacy-only.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database initialization warning: {ex.Message}");
        Console.WriteLine(ex.ToString());
    }
}

app.UseCors();
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapControllers();
app.MapFallbackToFile("index.html");
app.Run();

static void CleanupLegacySqlServerTables(AppDbContext db)
{
    db.Database.ExecuteSqlRaw(@"
IF OBJECT_ID(N'dbo.projects', N'U') IS NOT NULL
BEGIN
    IF EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'dbo'
          AND TABLE_NAME = 'projects'
          AND COLUMN_NAME = 'id'
          AND DATA_TYPE <> 'nvarchar'
    )
    BEGIN
        IF OBJECT_ID(N'dbo.LegacyProjects', N'U') IS NULL
            EXEC sp_rename N'dbo.projects', N'LegacyProjects';
    END;
END;

IF OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
BEGIN
    IF EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'dbo'
          AND TABLE_NAME = 'users'
          AND COLUMN_NAME = 'id'
          AND DATA_TYPE <> 'nvarchar'
    )
    BEGIN
        IF OBJECT_ID(N'dbo.LegacyUsers', N'U') IS NULL
            EXEC sp_rename N'dbo.users', N'LegacyUsers';
    END;
END;

IF OBJECT_ID(N'dbo.ProjectTaskStates', N'U') IS NOT NULL
BEGIN
    IF EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'dbo'
          AND TABLE_NAME = 'ProjectTaskStates'
          AND COLUMN_NAME = 'ProjectId'
          AND DATA_TYPE <> 'nvarchar'
    )
    BEGIN
        IF OBJECT_ID(N'dbo.LegacyProjectTaskStates', N'U') IS NULL
            EXEC sp_rename N'dbo.ProjectTaskStates', N'LegacyProjectTaskStates';
    END;
END;
");
}

static void EnsureFoundationSchema(AppDbContext db, bool sqlite)
{
    if (sqlite)
    {
        db.Database.ExecuteSqlRaw(@"
CREATE TABLE IF NOT EXISTS Users (
    Id TEXT NOT NULL PRIMARY KEY,
    UserName TEXT NOT NULL UNIQUE,
    Email TEXT NOT NULL UNIQUE,
    FullName TEXT NULL,
    PasswordHash TEXT NOT NULL,
    IsActive INTEGER NOT NULL DEFAULT 1,
    MustChangePassword INTEGER NOT NULL DEFAULT 0,
    CreatedAt TEXT NOT NULL,
    UpdatedAt TEXT NOT NULL,
    LastLoginAt TEXT NULL,
    FailedLoginAttempts INTEGER NOT NULL DEFAULT 0,
    LockedUntil TEXT NULL
);

CREATE TABLE IF NOT EXISTS RolePermissions (
    Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    RoleName TEXT NOT NULL,
    Permission TEXT NOT NULL,
    Scope TEXT NOT NULL,
    CreatedAt TEXT NOT NULL,
    UNIQUE(RoleName, Permission, Scope)
);

CREATE TABLE IF NOT EXISTS PasswordResetTokens (
    Id TEXT NOT NULL PRIMARY KEY,
    UserId TEXT NOT NULL,
    TokenHash TEXT NOT NULL UNIQUE,
    Purpose TEXT NOT NULL,
    CreatedAt TEXT NOT NULL,
    ExpiresAt TEXT NOT NULL,
    UsedAt TEXT NULL,
    RequestedByIp TEXT NULL
);

CREATE TABLE IF NOT EXISTS StandardTasks (
    Id INTEGER NOT NULL PRIMARY KEY,
    Title TEXT NOT NULL,
    Description TEXT NULL,
    DefaultApplicable INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS IX_PasswordResetTokens_UserId ON PasswordResetTokens(UserId);

CREATE TABLE IF NOT EXISTS AuditLogs (
    Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    UserId TEXT NULL,
    Action TEXT NOT NULL,
    EntityType TEXT NOT NULL,
    EntityId TEXT NULL,
    Details TEXT NULL,
    OldValue TEXT NULL,
    NewValue TEXT NULL,
    IpAddress TEXT NULL,
    UserAgent TEXT NULL,
    CreatedAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS IX_AuditLogs_UserId ON AuditLogs(UserId);
CREATE INDEX IF NOT EXISTS IX_AuditLogs_Action ON AuditLogs(Action);
CREATE INDEX IF NOT EXISTS IX_AuditLogs_CreatedAt ON AuditLogs(CreatedAt);

CREATE TABLE IF NOT EXISTS AutoSaveDrafts (
    Id TEXT NOT NULL PRIMARY KEY,
    RecordType TEXT NOT NULL,
    RecordId TEXT NOT NULL,
    OwnerUserId TEXT NULL,
    DraftJson TEXT NOT NULL,
    LastSavedAt TEXT NOT NULL,
    Status TEXT NOT NULL DEFAULT 'draft',
    IsLatest INTEGER NOT NULL DEFAULT 1,
    UNIQUE(RecordType, RecordId)
);

CREATE INDEX IF NOT EXISTS IX_AutoSaveDrafts_OwnerUserId ON AutoSaveDrafts(OwnerUserId);

CREATE TABLE IF NOT EXISTS ProjectArchives (
    Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    ProjectId TEXT NOT NULL,
    EngineerId TEXT NOT NULL,
    EngineerName TEXT NOT NULL,
    ProjectName TEXT NOT NULL,
    DeliveryDate TEXT NULL,
    InquiryDate TEXT NULL,
    Finished INTEGER NOT NULL,
    Outcome TEXT NULL,
    SnapshotJson TEXT NOT NULL,
    ArchivedBy TEXT NOT NULL,
    ArchivedAt TEXT NOT NULL,
    Reason TEXT NULL
);
CREATE INDEX IF NOT EXISTS IX_ProjectArchives_ProjectId ON ProjectArchives(ProjectId);
CREATE INDEX IF NOT EXISTS IX_ProjectArchives_ArchivedAt ON ProjectArchives(ArchivedAt);
");
        return;
    }

    db.Database.ExecuteSqlRaw(@"
IF OBJECT_ID(N'dbo.Teams', N'U') IS NULL
CREATE TABLE dbo.Teams (
    Id NVARCHAR(50) NOT NULL PRIMARY KEY,
    ManagerName NVARCHAR(200) NOT NULL,
    Color NVARCHAR(20) NULL,
    Division NVARCHAR(50) NOT NULL,
    Type NVARCHAR(50) NOT NULL,
    Label NVARCHAR(100) NULL
);

IF OBJECT_ID(N'dbo.Engineers', N'U') IS NULL
CREATE TABLE dbo.Engineers (
    Id NVARCHAR(50) NOT NULL PRIMARY KEY,
    TeamId NVARCHAR(50) NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    CompanyEmail NVARCHAR(200) NOT NULL CONSTRAINT DF_Engineers_CompanyEmail DEFAULT N'',
    PhoneNumber NVARCHAR(50) NOT NULL CONSTRAINT DF_Engineers_PhoneNumber DEFAULT N'',
    EmployeeCode NVARCHAR(100) NOT NULL CONSTRAINT DF_Engineers_EmployeeCode DEFAULT N'',
    PhotoData NVARCHAR(MAX) NULL,
    CONSTRAINT FK_Engineers_Teams FOREIGN KEY (TeamId) REFERENCES dbo.Teams(Id) ON DELETE CASCADE
);

IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
CREATE TABLE dbo.Users (
    Id NVARCHAR(100) NOT NULL PRIMARY KEY,
    EngineerId NVARCHAR(50) NULL,
    UserName NVARCHAR(100) NOT NULL UNIQUE,
    Email NVARCHAR(200) NOT NULL UNIQUE,
    FullName NVARCHAR(200) NULL,
    PasswordHash NVARCHAR(256) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    MustChangePassword BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL,
    UpdatedAt DATETIME2 NOT NULL,
    LastLoginAt DATETIME2 NULL,
    FailedLoginAttempts INT NOT NULL DEFAULT 0,
    LockedUntil DATETIME2 NULL
);
IF COL_LENGTH(N'dbo.Users', N'EngineerId') IS NULL ALTER TABLE dbo.Users ADD EngineerId NVARCHAR(50) NULL;
IF COL_LENGTH(N'dbo.Users', N'PhoneNumber') IS NULL ALTER TABLE dbo.Users ADD PhoneNumber NVARCHAR(50) NOT NULL CONSTRAINT DF_Users_PhoneNumber DEFAULT N'';
ELSE IF NOT EXISTS (
    SELECT 1
    FROM sys.default_constraints dc
    JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE c.object_id = OBJECT_ID(N'dbo.Users')
      AND c.name = N'PhoneNumber'
)
    ALTER TABLE dbo.Users ADD CONSTRAINT DF_Users_PhoneNumber DEFAULT N'' FOR PhoneNumber;
IF COLUMNPROPERTY(OBJECT_ID(N'dbo.Users'), N'PhoneNumber', 'AllowsNull') = 1 ALTER TABLE dbo.Users ALTER COLUMN PhoneNumber NVARCHAR(50) NOT NULL;
IF COL_LENGTH(N'dbo.Users', N'EmployeeCode') IS NULL ALTER TABLE dbo.Users ADD EmployeeCode NVARCHAR(100) NOT NULL CONSTRAINT DF_Users_EmployeeCode DEFAULT N'';
ELSE IF NOT EXISTS (
    SELECT 1
    FROM sys.default_constraints dc
    JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE c.object_id = OBJECT_ID(N'dbo.Users')
      AND c.name = N'EmployeeCode'
)
    ALTER TABLE dbo.Users ADD CONSTRAINT DF_Users_EmployeeCode DEFAULT N'' FOR EmployeeCode;
IF COLUMNPROPERTY(OBJECT_ID(N'dbo.Users'), N'EmployeeCode', 'AllowsNull') = 1 ALTER TABLE dbo.Users ALTER COLUMN EmployeeCode NVARCHAR(100) NOT NULL;
IF COL_LENGTH(N'dbo.Engineers', N'CompanyEmail') IS NULL ALTER TABLE dbo.Engineers ADD CompanyEmail NVARCHAR(200) NOT NULL CONSTRAINT DF_Engineers_CompanyEmail DEFAULT N'';
ELSE IF NOT EXISTS (
    SELECT 1
    FROM sys.default_constraints dc
    JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE c.object_id = OBJECT_ID(N'dbo.Engineers')
      AND c.name = N'CompanyEmail'
)
    ALTER TABLE dbo.Engineers ADD CONSTRAINT DF_Engineers_CompanyEmail DEFAULT N'' FOR CompanyEmail;
IF COLUMNPROPERTY(OBJECT_ID(N'dbo.Engineers'), N'CompanyEmail', 'AllowsNull') = 1 ALTER TABLE dbo.Engineers ALTER COLUMN CompanyEmail NVARCHAR(200) NOT NULL;
IF COL_LENGTH(N'dbo.Engineers', N'PhoneNumber') IS NULL ALTER TABLE dbo.Engineers ADD PhoneNumber NVARCHAR(50) NOT NULL CONSTRAINT DF_Engineers_PhoneNumber DEFAULT N'';
ELSE IF NOT EXISTS (
    SELECT 1
    FROM sys.default_constraints dc
    JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE c.object_id = OBJECT_ID(N'dbo.Engineers')
      AND c.name = N'PhoneNumber'
)
    ALTER TABLE dbo.Engineers ADD CONSTRAINT DF_Engineers_PhoneNumber DEFAULT N'' FOR PhoneNumber;
IF COLUMNPROPERTY(OBJECT_ID(N'dbo.Engineers'), N'PhoneNumber', 'AllowsNull') = 1 ALTER TABLE dbo.Engineers ALTER COLUMN PhoneNumber NVARCHAR(50) NOT NULL;
IF COL_LENGTH(N'dbo.Engineers', N'EmployeeCode') IS NULL ALTER TABLE dbo.Engineers ADD EmployeeCode NVARCHAR(100) NOT NULL CONSTRAINT DF_Engineers_EmployeeCode DEFAULT N'';
ELSE IF NOT EXISTS (
    SELECT 1
    FROM sys.default_constraints dc
    JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE c.object_id = OBJECT_ID(N'dbo.Engineers')
      AND c.name = N'EmployeeCode'
)
    ALTER TABLE dbo.Engineers ADD CONSTRAINT DF_Engineers_EmployeeCode DEFAULT N'' FOR EmployeeCode;
IF COLUMNPROPERTY(OBJECT_ID(N'dbo.Engineers'), N'EmployeeCode', 'AllowsNull') = 1 ALTER TABLE dbo.Engineers ALTER COLUMN EmployeeCode NVARCHAR(100) NOT NULL;

IF OBJECT_ID(N'dbo.RolePermissions', N'U') IS NULL
CREATE TABLE dbo.RolePermissions (
    Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    RoleName NVARCHAR(100) NOT NULL,
    Permission NVARCHAR(200) NOT NULL,
    Scope NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL,
    CONSTRAINT UX_RolePermissions UNIQUE(RoleName, Permission, Scope)
);

IF OBJECT_ID(N'dbo.PasswordResetTokens', N'U') IS NULL
CREATE TABLE dbo.PasswordResetTokens (
    Id NVARCHAR(100) NOT NULL PRIMARY KEY,
    UserId NVARCHAR(100) NOT NULL,
    TokenHash NVARCHAR(256) NOT NULL UNIQUE,
    Purpose NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL,
    ExpiresAt DATETIME2 NOT NULL,
    UsedAt DATETIME2 NULL,
    RequestedByIp NVARCHAR(100) NULL
);

IF OBJECT_ID(N'dbo.StandardTasks', N'U') IS NULL
CREATE TABLE dbo.StandardTasks (
    Id INT NOT NULL PRIMARY KEY,
    Title NVARCHAR(500) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    DefaultApplicable BIT NOT NULL DEFAULT 1
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PasswordResetTokens_UserId' AND object_id = OBJECT_ID(N'dbo.PasswordResetTokens'))
CREATE INDEX IX_PasswordResetTokens_UserId ON dbo.PasswordResetTokens(UserId);

IF OBJECT_ID(N'dbo.AuditLogs', N'U') IS NULL
CREATE TABLE dbo.AuditLogs (
    Id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    UserId NVARCHAR(100) NULL,
    Action NVARCHAR(200) NOT NULL,
    EntityType NVARCHAR(200) NOT NULL,
    EntityId NVARCHAR(200) NULL,
    Details NVARCHAR(2000) NULL,
    OldValue NVARCHAR(4000) NULL,
    NewValue NVARCHAR(4000) NULL,
    IpAddress NVARCHAR(100) NULL,
    UserAgent NVARCHAR(500) NULL,
    CreatedAt DATETIME2 NOT NULL
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AuditLogs_UserId' AND object_id = OBJECT_ID(N'dbo.AuditLogs'))
CREATE INDEX IX_AuditLogs_UserId ON dbo.AuditLogs(UserId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AuditLogs_Action' AND object_id = OBJECT_ID(N'dbo.AuditLogs'))
CREATE INDEX IX_AuditLogs_Action ON dbo.AuditLogs(Action);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AuditLogs_CreatedAt' AND object_id = OBJECT_ID(N'dbo.AuditLogs'))
CREATE INDEX IX_AuditLogs_CreatedAt ON dbo.AuditLogs(CreatedAt);

IF OBJECT_ID(N'dbo.AutoSaveDrafts', N'U') IS NULL
CREATE TABLE dbo.AutoSaveDrafts (
    Id NVARCHAR(100) NOT NULL PRIMARY KEY,
    RecordType NVARCHAR(100) NOT NULL,
    RecordId NVARCHAR(200) NOT NULL,
    OwnerUserId NVARCHAR(100) NULL,
    DraftJson NVARCHAR(MAX) NOT NULL,
    LastSavedAt DATETIME2 NOT NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'draft',
    IsLatest BIT NOT NULL DEFAULT 1,
    CONSTRAINT UX_AutoSaveDrafts UNIQUE(RecordType, RecordId)
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AutoSaveDrafts_OwnerUserId' AND object_id = OBJECT_ID(N'dbo.AutoSaveDrafts'))
CREATE INDEX IX_AutoSaveDrafts_OwnerUserId ON dbo.AutoSaveDrafts(OwnerUserId);

IF OBJECT_ID(N'dbo.ProjectArchives', N'U') IS NULL
CREATE TABLE dbo.ProjectArchives (
    Id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    ProjectId NVARCHAR(100) NOT NULL,
    EngineerId NVARCHAR(50) NOT NULL,
    EngineerName NVARCHAR(200) NOT NULL,
    ProjectName NVARCHAR(500) NOT NULL,
    DeliveryDate DATE NULL,
    InquiryDate DATE NULL,
    Finished BIT NOT NULL,
    Outcome NVARCHAR(50) NULL,
    SnapshotJson NVARCHAR(MAX) NOT NULL,
    ArchivedBy NVARCHAR(200) NOT NULL,
    ArchivedAt DATETIME2 NOT NULL,
    Reason NVARCHAR(1000) NULL
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ProjectArchives_ProjectId' AND object_id = OBJECT_ID(N'dbo.ProjectArchives'))
CREATE INDEX IX_ProjectArchives_ProjectId ON dbo.ProjectArchives(ProjectId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ProjectArchives_ArchivedAt' AND object_id = OBJECT_ID(N'dbo.ProjectArchives'))
CREATE INDEX IX_ProjectArchives_ArchivedAt ON dbo.ProjectArchives(ArchivedAt);
");

    db.Database.ExecuteSqlRaw(@"
IF COL_LENGTH(N'dbo.Users', N'EngineerId') IS NOT NULL AND COL_LENGTH(N'dbo.Engineers', N'Id') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_Users_EngineerId' AND object_id = OBJECT_ID(N'dbo.Users'))
        CREATE UNIQUE INDEX UX_Users_EngineerId ON dbo.Users(EngineerId) WHERE EngineerId IS NOT NULL;
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Users_Engineers' AND parent_object_id = OBJECT_ID(N'dbo.Users'))
        ALTER TABLE dbo.Users ADD CONSTRAINT FK_Users_Engineers FOREIGN KEY (EngineerId) REFERENCES dbo.Engineers(Id) ON DELETE SET NULL;
END;
");
}

static void EnsureContactSchema(AppDbContext db, bool sqlite)
{
    if (sqlite)
    {
        var engineerColumns = db.Database.SqlQueryRaw<string>("SELECT name AS Value FROM pragma_table_info('Engineers')").ToHashSet(StringComparer.OrdinalIgnoreCase);
        if (!engineerColumns.Contains("CompanyEmail")) db.Database.ExecuteSqlRaw("ALTER TABLE Engineers ADD COLUMN CompanyEmail TEXT NOT NULL DEFAULT ''");
        if (!engineerColumns.Contains("PhoneNumber")) db.Database.ExecuteSqlRaw("ALTER TABLE Engineers ADD COLUMN PhoneNumber TEXT NOT NULL DEFAULT ''");
        if (!engineerColumns.Contains("EmployeeCode")) db.Database.ExecuteSqlRaw("ALTER TABLE Engineers ADD COLUMN EmployeeCode TEXT NOT NULL DEFAULT ''");
        if (!engineerColumns.Contains("PhotoData")) db.Database.ExecuteSqlRaw("ALTER TABLE Engineers ADD COLUMN PhotoData TEXT NULL");

        var userColumns = db.Database.SqlQueryRaw<string>("SELECT name AS Value FROM pragma_table_info('Users')").ToHashSet(StringComparer.OrdinalIgnoreCase);
        if (!userColumns.Contains("PhoneNumber")) db.Database.ExecuteSqlRaw("ALTER TABLE Users ADD COLUMN PhoneNumber TEXT NOT NULL DEFAULT ''");
        if (!userColumns.Contains("EmployeeCode")) db.Database.ExecuteSqlRaw("ALTER TABLE Users ADD COLUMN EmployeeCode TEXT NOT NULL DEFAULT ''");
        return;
    }

    db.Database.ExecuteSqlRaw(@"
IF COL_LENGTH(N'dbo.Users', N'PhoneNumber') IS NULL ALTER TABLE dbo.Users ADD PhoneNumber NVARCHAR(50) NOT NULL CONSTRAINT DF_Users_PhoneNumber DEFAULT N'';
ELSE IF NOT EXISTS (
    SELECT 1
    FROM sys.default_constraints dc
    JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE c.object_id = OBJECT_ID(N'dbo.Users')
      AND c.name = N'PhoneNumber'
)
    ALTER TABLE dbo.Users ADD CONSTRAINT DF_Users_PhoneNumber DEFAULT N'' FOR PhoneNumber;
IF COLUMNPROPERTY(OBJECT_ID(N'dbo.Users'), N'PhoneNumber', 'AllowsNull') = 1 ALTER TABLE dbo.Users ALTER COLUMN PhoneNumber NVARCHAR(50) NOT NULL;
IF COL_LENGTH(N'dbo.Users', N'EmployeeCode') IS NULL ALTER TABLE dbo.Users ADD EmployeeCode NVARCHAR(100) NOT NULL CONSTRAINT DF_Users_EmployeeCode DEFAULT N'';
ELSE IF NOT EXISTS (
    SELECT 1
    FROM sys.default_constraints dc
    JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE c.object_id = OBJECT_ID(N'dbo.Users')
      AND c.name = N'EmployeeCode'
)
    ALTER TABLE dbo.Users ADD CONSTRAINT DF_Users_EmployeeCode DEFAULT N'' FOR EmployeeCode;
IF COLUMNPROPERTY(OBJECT_ID(N'dbo.Users'), N'EmployeeCode', 'AllowsNull') = 1 ALTER TABLE dbo.Users ALTER COLUMN EmployeeCode NVARCHAR(100) NOT NULL;
IF COL_LENGTH(N'dbo.Engineers', N'CompanyEmail') IS NULL ALTER TABLE dbo.Engineers ADD CompanyEmail NVARCHAR(200) NOT NULL CONSTRAINT DF_Engineers_CompanyEmail DEFAULT N'';
ELSE IF NOT EXISTS (
    SELECT 1
    FROM sys.default_constraints dc
    JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE c.object_id = OBJECT_ID(N'dbo.Engineers')
      AND c.name = N'CompanyEmail'
)
    ALTER TABLE dbo.Engineers ADD CONSTRAINT DF_Engineers_CompanyEmail DEFAULT N'' FOR CompanyEmail;
IF COLUMNPROPERTY(OBJECT_ID(N'dbo.Engineers'), N'CompanyEmail', 'AllowsNull') = 1 ALTER TABLE dbo.Engineers ALTER COLUMN CompanyEmail NVARCHAR(200) NOT NULL;
IF COL_LENGTH(N'dbo.Engineers', N'PhoneNumber') IS NULL ALTER TABLE dbo.Engineers ADD PhoneNumber NVARCHAR(50) NOT NULL CONSTRAINT DF_Engineers_PhoneNumber DEFAULT N'';
ELSE IF NOT EXISTS (
    SELECT 1
    FROM sys.default_constraints dc
    JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE c.object_id = OBJECT_ID(N'dbo.Engineers')
      AND c.name = N'PhoneNumber'
)
    ALTER TABLE dbo.Engineers ADD CONSTRAINT DF_Engineers_PhoneNumber DEFAULT N'' FOR PhoneNumber;
IF COLUMNPROPERTY(OBJECT_ID(N'dbo.Engineers'), N'PhoneNumber', 'AllowsNull') = 1 ALTER TABLE dbo.Engineers ALTER COLUMN PhoneNumber NVARCHAR(50) NOT NULL;
IF COL_LENGTH(N'dbo.Engineers', N'EmployeeCode') IS NULL ALTER TABLE dbo.Engineers ADD EmployeeCode NVARCHAR(100) NOT NULL CONSTRAINT DF_Engineers_EmployeeCode DEFAULT N'';
ELSE IF NOT EXISTS (
    SELECT 1
    FROM sys.default_constraints dc
    JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE c.object_id = OBJECT_ID(N'dbo.Engineers')
      AND c.name = N'EmployeeCode'
)
    ALTER TABLE dbo.Engineers ADD CONSTRAINT DF_Engineers_EmployeeCode DEFAULT N'' FOR EmployeeCode;
IF COLUMNPROPERTY(OBJECT_ID(N'dbo.Engineers'), N'EmployeeCode', 'AllowsNull') = 1 ALTER TABLE dbo.Engineers ALTER COLUMN EmployeeCode NVARCHAR(100) NOT NULL;
IF COL_LENGTH(N'dbo.Engineers', N'PhotoData') IS NULL ALTER TABLE dbo.Engineers ADD PhotoData NVARCHAR(MAX) NULL;
");
}

static void EnsureNormalizedSchema(AppDbContext db, bool sqlite)
{
    if (sqlite)
    {
        db.Database.ExecuteSqlRaw(@"
CREATE TABLE IF NOT EXISTS Projects (Id TEXT NOT NULL PRIMARY KEY, EngineerId TEXT NOT NULL, Name TEXT NOT NULL, DeliveryDate TEXT NULL, InquiryDate TEXT NULL, Finished INTEGER NOT NULL DEFAULT 0, Outcome TEXT NULL, HasrSynced INTEGER NOT NULL DEFAULT 0, CreatedAt TEXT NOT NULL, LastSaved TEXT NOT NULL, FOREIGN KEY(EngineerId) REFERENCES Engineers(Id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS IX_Projects_EngineerId ON Projects(EngineerId);
CREATE TABLE IF NOT EXISTS ProjectTaskStates (ProjectId TEXT NOT NULL, TaskId INTEGER NOT NULL, Status INTEGER NOT NULL DEFAULT 0, Review INTEGER NOT NULL DEFAULT 0, Applicable INTEGER NOT NULL DEFAULT 1, DueDate TEXT NULL, Department TEXT NULL, Notes TEXT NULL, PRIMARY KEY(ProjectId, TaskId), FOREIGN KEY(ProjectId) REFERENCES Projects(Id) ON DELETE CASCADE, FOREIGN KEY(TaskId) REFERENCES StandardTasks(Id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS CustomTasks (Id TEXT NOT NULL PRIMARY KEY, ProjectId TEXT NOT NULL, Title TEXT NOT NULL, Description TEXT NULL, Status INTEGER NOT NULL DEFAULT 0, Review INTEGER NOT NULL DEFAULT 0, Applicable INTEGER NOT NULL DEFAULT 1, DueDate TEXT NULL, Department TEXT NULL, Notes TEXT NULL, FOREIGN KEY(ProjectId) REFERENCES Projects(Id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS IX_CustomTasks_ProjectId ON CustomTasks(ProjectId);
CREATE TABLE IF NOT EXISTS HasrProjects (Id TEXT NOT NULL PRIMARY KEY, TeamId TEXT NOT NULL, Name TEXT NOT NULL, DeliveryDate TEXT NULL, HasWork INTEGER NULL, HasrDueDate TEXT NULL, HasrDone INTEGER NOT NULL DEFAULT 0, HasrNotes TEXT NULL, AddedBy TEXT NULL, CreatedAt TEXT NOT NULL, FOREIGN KEY(TeamId) REFERENCES Teams(Id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS IX_HasrProjects_TeamId ON HasrProjects(TeamId);
CREATE TABLE IF NOT EXISTS AuthHashes (Role TEXT NOT NULL, EntityId TEXT NOT NULL, PasswordHash TEXT NOT NULL, UpdatedAt TEXT NOT NULL, PRIMARY KEY(Role, EntityId));
CREATE TABLE IF NOT EXISTS DashboardSettings (Id INTEGER NOT NULL PRIMARY KEY, DeptManager TEXT NOT NULL, DefaultProjectName TEXT NOT NULL, DefaultDeliveryDate TEXT NULL, DefaultInquiryDate TEXT NULL, EmailEnabled INTEGER NOT NULL DEFAULT 0, SmtpHost TEXT NULL, SmtpPort INTEGER NOT NULL DEFAULT 587, SmtpEnableSsl INTEGER NOT NULL DEFAULT 1, SmtpFrom TEXT NULL, SmtpUserName TEXT NULL, SmtpPassword TEXT NULL, IncludeProjectOwner INTEGER NOT NULL DEFAULT 1, IncludeTeamMembers INTEGER NOT NULL DEFAULT 1, DefaultRecipients TEXT NULL);
CREATE TABLE IF NOT EXISTS ProjectOutcomeOptions (Id TEXT NOT NULL PRIMARY KEY, Label TEXT NOT NULL, SortOrder INTEGER NOT NULL, IsActive INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS TeamPaletteOptions (Id TEXT NOT NULL PRIMARY KEY, Value TEXT NOT NULL, SortOrder INTEGER NOT NULL, IsActive INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS FieldDefinitions (Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, Scope TEXT NOT NULL, FieldKey TEXT NOT NULL, Label TEXT NOT NULL, Type TEXT NOT NULL, SortOrder INTEGER NOT NULL, IsRequired INTEGER NOT NULL DEFAULT 0, IsActive INTEGER NOT NULL DEFAULT 1);
CREATE UNIQUE INDEX IF NOT EXISTS IX_FieldDefinitions_Scope_FieldKey ON FieldDefinitions(Scope, FieldKey);
UPDATE DashboardSettings SET SmtpHost = IFNULL(SmtpHost, ''), SmtpFrom = IFNULL(SmtpFrom, ''), SmtpUserName = IFNULL(SmtpUserName, ''), SmtpPassword = IFNULL(SmtpPassword, ''), DefaultRecipients = IFNULL(DefaultRecipients, '') WHERE SmtpHost IS NULL OR SmtpFrom IS NULL OR SmtpUserName IS NULL OR SmtpPassword IS NULL OR DefaultRecipients IS NULL; ");
        return;
    }

    db.Database.ExecuteSqlRaw(@"
IF OBJECT_ID(N'dbo.Projects', N'U') IS NULL CREATE TABLE dbo.Projects (Id NVARCHAR(50) NOT NULL PRIMARY KEY, EngineerId NVARCHAR(50) NULL, Name NVARCHAR(500) NOT NULL, DeliveryDate DATE NULL, InquiryDate DATE NULL, Finished BIT NOT NULL DEFAULT 0, Outcome NVARCHAR(50) NULL, HasrSynced BIT NOT NULL DEFAULT 0, CreatedAt DATETIME2 NOT NULL, LastSaved DATETIME2 NOT NULL);
IF COL_LENGTH(N'dbo.Projects', N'EngineerId') IS NULL ALTER TABLE dbo.Projects ADD EngineerId NVARCHAR(50) NULL;
IF COL_LENGTH(N'dbo.Projects', N'EngineerId') IS NOT NULL AND COL_LENGTH(N'dbo.Engineers', N'Id') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Projects_EngineerId' AND object_id = OBJECT_ID(N'dbo.Projects')) CREATE INDEX IX_Projects_EngineerId ON dbo.Projects(EngineerId);
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Projects_Engineers' AND parent_object_id = OBJECT_ID(N'dbo.Projects'))
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM dbo.Projects p LEFT JOIN dbo.Engineers e ON e.Id = p.EngineerId WHERE p.EngineerId IS NOT NULL AND e.Id IS NULL)
            ALTER TABLE dbo.Projects ADD CONSTRAINT FK_Projects_Engineers FOREIGN KEY(EngineerId) REFERENCES dbo.Engineers(Id) ON DELETE CASCADE;
    END;
END;
IF OBJECT_ID(N'dbo.ProjectTaskStates', N'U') IS NULL CREATE TABLE dbo.ProjectTaskStates (ProjectId NVARCHAR(50) NOT NULL, TaskId INT NOT NULL, Status BIT NOT NULL DEFAULT 0, Review BIT NOT NULL DEFAULT 0, Applicable BIT NOT NULL DEFAULT 1, DueDate DATE NULL, Department NVARCHAR(200) NULL, Notes NVARCHAR(MAX) NULL, CONSTRAINT PK_ProjectTaskStates PRIMARY KEY(ProjectId,TaskId), CONSTRAINT FK_ProjectTaskStates_Projects FOREIGN KEY(ProjectId) REFERENCES dbo.Projects(Id) ON DELETE CASCADE, CONSTRAINT FK_ProjectTaskStates_StandardTasks FOREIGN KEY(TaskId) REFERENCES dbo.StandardTasks(Id) ON DELETE CASCADE);
IF OBJECT_ID(N'dbo.CustomTasks', N'U') IS NULL CREATE TABLE dbo.CustomTasks (Id NVARCHAR(100) NOT NULL PRIMARY KEY, ProjectId NVARCHAR(50) NOT NULL, Title NVARCHAR(500) NOT NULL, Description NVARCHAR(MAX) NULL, Status BIT NOT NULL DEFAULT 0, Review BIT NOT NULL DEFAULT 0, Applicable BIT NOT NULL DEFAULT 1, DueDate DATE NULL, Department NVARCHAR(200) NULL, Notes NVARCHAR(MAX) NULL, CONSTRAINT FK_CustomTasks_Projects FOREIGN KEY(ProjectId) REFERENCES dbo.Projects(Id) ON DELETE CASCADE);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_CustomTasks_ProjectId' AND object_id = OBJECT_ID(N'dbo.CustomTasks')) CREATE INDEX IX_CustomTasks_ProjectId ON dbo.CustomTasks(ProjectId);
IF OBJECT_ID(N'dbo.HasrProjects', N'U') IS NULL CREATE TABLE dbo.HasrProjects (Id NVARCHAR(100) NOT NULL PRIMARY KEY, TeamId NVARCHAR(50) NOT NULL, Name NVARCHAR(500) NOT NULL, DeliveryDate DATE NULL, HasWork BIT NULL, HasrDueDate DATE NULL, HasrDone BIT NOT NULL DEFAULT 0, HasrNotes NVARCHAR(MAX) NULL, AddedBy NVARCHAR(200) NULL, CreatedAt DATETIME2 NOT NULL, CONSTRAINT FK_HasrProjects_Teams FOREIGN KEY(TeamId) REFERENCES dbo.Teams(Id) ON DELETE CASCADE);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_HasrProjects_TeamId' AND object_id = OBJECT_ID(N'dbo.HasrProjects')) CREATE INDEX IX_HasrProjects_TeamId ON dbo.HasrProjects(TeamId);
IF OBJECT_ID(N'dbo.AuthHashes', N'U') IS NULL CREATE TABLE dbo.AuthHashes (Role NVARCHAR(30) NOT NULL, EntityId NVARCHAR(100) NOT NULL, PasswordHash NVARCHAR(256) NOT NULL, UpdatedAt DATETIME2 NOT NULL, CONSTRAINT PK_AuthHashes PRIMARY KEY(Role,EntityId));
IF OBJECT_ID(N'dbo.DashboardSettings', N'U') IS NULL CREATE TABLE dbo.DashboardSettings (Id INT NOT NULL PRIMARY KEY, DeptManager NVARCHAR(200) NOT NULL, DefaultProjectName NVARCHAR(500) NOT NULL, DefaultDeliveryDate DATE NULL, DefaultInquiryDate DATE NULL, EmailEnabled BIT NOT NULL DEFAULT 0, SmtpHost NVARCHAR(200) NULL, SmtpPort INT NOT NULL DEFAULT 587, SmtpEnableSsl BIT NOT NULL DEFAULT 1, SmtpFrom NVARCHAR(200) NULL, SmtpUserName NVARCHAR(200) NULL, SmtpPassword NVARCHAR(200) NULL, IncludeProjectOwner BIT NOT NULL DEFAULT 1, IncludeTeamMembers BIT NOT NULL DEFAULT 1, DefaultRecipients NVARCHAR(MAX) NULL);
IF COL_LENGTH(N'dbo.DashboardSettings', N'EmailEnabled') IS NULL ALTER TABLE dbo.DashboardSettings ADD EmailEnabled BIT NOT NULL DEFAULT 0;
IF COL_LENGTH(N'dbo.DashboardSettings', N'SmtpHost') IS NULL ALTER TABLE dbo.DashboardSettings ADD SmtpHost NVARCHAR(200) NULL;
IF COL_LENGTH(N'dbo.DashboardSettings', N'SmtpPort') IS NULL ALTER TABLE dbo.DashboardSettings ADD SmtpPort INT NOT NULL DEFAULT 587;
IF COL_LENGTH(N'dbo.DashboardSettings', N'SmtpEnableSsl') IS NULL ALTER TABLE dbo.DashboardSettings ADD SmtpEnableSsl BIT NOT NULL DEFAULT 1;
IF COL_LENGTH(N'dbo.DashboardSettings', N'SmtpFrom') IS NULL ALTER TABLE dbo.DashboardSettings ADD SmtpFrom NVARCHAR(200) NULL;
IF COL_LENGTH(N'dbo.DashboardSettings', N'SmtpUserName') IS NULL ALTER TABLE dbo.DashboardSettings ADD SmtpUserName NVARCHAR(200) NULL;
IF COL_LENGTH(N'dbo.DashboardSettings', N'SmtpPassword') IS NULL ALTER TABLE dbo.DashboardSettings ADD SmtpPassword NVARCHAR(200) NULL;
IF COL_LENGTH(N'dbo.DashboardSettings', N'IncludeProjectOwner') IS NULL ALTER TABLE dbo.DashboardSettings ADD IncludeProjectOwner BIT NOT NULL DEFAULT 1;
IF COL_LENGTH(N'dbo.DashboardSettings', N'IncludeTeamMembers') IS NULL ALTER TABLE dbo.DashboardSettings ADD IncludeTeamMembers BIT NOT NULL DEFAULT 1;
IF COL_LENGTH(N'dbo.DashboardSettings', N'DefaultRecipients') IS NULL ALTER TABLE dbo.DashboardSettings ADD DefaultRecipients NVARCHAR(MAX) NULL;
UPDATE dbo.DashboardSettings SET SmtpHost = ISNULL(SmtpHost, N''), SmtpFrom = ISNULL(SmtpFrom, N''), SmtpUserName = ISNULL(SmtpUserName, N''), SmtpPassword = ISNULL(SmtpPassword, N''), DefaultRecipients = ISNULL(DefaultRecipients, N'') WHERE SmtpHost IS NULL OR SmtpFrom IS NULL OR SmtpUserName IS NULL OR SmtpPassword IS NULL OR DefaultRecipients IS NULL;
IF OBJECT_ID(N'dbo.ProjectOutcomeOptions', N'U') IS NULL CREATE TABLE dbo.ProjectOutcomeOptions (Id NVARCHAR(50) NOT NULL PRIMARY KEY, Label NVARCHAR(200) NOT NULL, SortOrder INT NOT NULL, IsActive BIT NOT NULL DEFAULT 1);
IF OBJECT_ID(N'dbo.TeamPaletteOptions', N'U') IS NULL CREATE TABLE dbo.TeamPaletteOptions (Id NVARCHAR(50) NOT NULL PRIMARY KEY, Value NVARCHAR(30) NOT NULL, SortOrder INT NOT NULL, IsActive BIT NOT NULL DEFAULT 1);
IF OBJECT_ID(N'dbo.FieldDefinitions', N'U') IS NULL CREATE TABLE dbo.FieldDefinitions (Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY, Scope NVARCHAR(50) NOT NULL, FieldKey NVARCHAR(100) NOT NULL, Label NVARCHAR(200) NOT NULL, Type NVARCHAR(50) NOT NULL, SortOrder INT NOT NULL, IsRequired BIT NOT NULL DEFAULT 0, IsActive BIT NOT NULL DEFAULT 1);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_FieldDefinitions_Scope_FieldKey' AND object_id = OBJECT_ID(N'dbo.FieldDefinitions')) CREATE UNIQUE INDEX UX_FieldDefinitions_Scope_FieldKey ON dbo.FieldDefinitions(Scope, FieldKey);");
}

static void EnsureProjectFeatureSchema(AppDbContext db, bool sqlite)
{
    if (sqlite)
    {
        var projectColumns = db.Database.SqlQueryRaw<string>("SELECT name AS Value FROM pragma_table_info('Projects')").ToHashSet(StringComparer.OrdinalIgnoreCase);
        var columns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["ProjectCode"] = "TEXT NULL", ["Description"] = "TEXT NULL", ["Department"] = "TEXT NULL",
            ["Status"] = "TEXT NULL", ["Priority"] = "TEXT NULL", ["ProjectType"] = "TEXT NULL"
        };
        foreach (var column in columns)
            if (!projectColumns.Contains(column.Key)) db.Database.ExecuteSql($"ALTER TABLE Projects ADD COLUMN {column.Key} {column.Value}");

        db.Database.ExecuteSqlRaw(@"
CREATE TABLE IF NOT EXISTS Notifications (Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, UserId TEXT NULL, RecipientEngineerId TEXT NULL, Type TEXT NOT NULL, Title TEXT NOT NULL, Message TEXT NOT NULL, EntityType TEXT NULL, EntityId TEXT NULL, ProjectId TEXT NULL, ProjectName TEXT NULL, TaskId INTEGER NULL, AttachmentId INTEGER NULL, CreatedBy TEXT NULL, CreatedAt TEXT NOT NULL, ReadAt TEXT NULL);
CREATE INDEX IF NOT EXISTS IX_Notifications_RecipientEngineerId_CreatedAt ON Notifications(RecipientEngineerId, CreatedAt);
CREATE TABLE IF NOT EXISTS ProjectAttachments (Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, ProjectId TEXT NOT NULL, AttachmentName TEXT NOT NULL, OriginalFileName TEXT NOT NULL, StorageReference TEXT NOT NULL, FileType TEXT NOT NULL, FileSize INTEGER NOT NULL, Version INTEGER NOT NULL DEFAULT 1, UploadedBy TEXT NULL, UploadedAt TEXT NOT NULL, Notes TEXT NULL, Status TEXT NOT NULL DEFAULT 'active', FOREIGN KEY(ProjectId) REFERENCES Projects(Id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS IX_ProjectAttachments_ProjectId ON ProjectAttachments(ProjectId);
CREATE TABLE IF NOT EXISTS TFiles (Id TEXT NOT NULL PRIMARY KEY, ProjectId TEXT NOT NULL, Name TEXT NOT NULL, Description TEXT NULL, Status TEXT NOT NULL DEFAULT 'active', CreatedBy TEXT NULL, CreatedAt TEXT NOT NULL, FOREIGN KEY(ProjectId) REFERENCES Projects(Id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS IX_TFiles_ProjectId ON TFiles(ProjectId);
CREATE TABLE IF NOT EXISTS TRounds (Id TEXT NOT NULL PRIMARY KEY, ProjectId TEXT NOT NULL, TFileId TEXT NOT NULL, RoundNumber INTEGER NOT NULL, Name TEXT NOT NULL, Description TEXT NULL, CreatedBy TEXT NULL, CreatedAt TEXT NOT NULL, Status TEXT NOT NULL DEFAULT 'active', FOREIGN KEY(TFileId) REFERENCES TFiles(Id) ON DELETE CASCADE);
CREATE UNIQUE INDEX IF NOT EXISTS UX_TRounds_TFileId_RoundNumber ON TRounds(TFileId, RoundNumber);
CREATE TABLE IF NOT EXISTS TVersions (Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, RoundId TEXT NOT NULL, VersionNumber INTEGER NOT NULL, FileName TEXT NOT NULL, OriginalFileName TEXT NOT NULL, FileType TEXT NOT NULL, FileSize INTEGER NOT NULL, StorageReference TEXT NOT NULL, UploadedBy TEXT NULL, UploadedAt TEXT NOT NULL, Notes TEXT NULL, IsCurrentVersion INTEGER NOT NULL DEFAULT 1, Status TEXT NOT NULL DEFAULT 'active', FOREIGN KEY(RoundId) REFERENCES TRounds(Id) ON DELETE CASCADE);
CREATE UNIQUE INDEX IF NOT EXISTS UX_TVersions_RoundId_VersionNumber ON TVersions(RoundId, VersionNumber);");
        return;
    }

    db.Database.ExecuteSqlRaw(@"
IF COL_LENGTH(N'dbo.Projects', N'ProjectCode') IS NULL ALTER TABLE dbo.Projects ADD ProjectCode NVARCHAR(100) NULL;
IF COL_LENGTH(N'dbo.Projects', N'Description') IS NULL ALTER TABLE dbo.Projects ADD Description NVARCHAR(MAX) NULL;
IF COL_LENGTH(N'dbo.Projects', N'Department') IS NULL ALTER TABLE dbo.Projects ADD Department NVARCHAR(200) NULL;
IF COL_LENGTH(N'dbo.Projects', N'Status') IS NULL ALTER TABLE dbo.Projects ADD Status NVARCHAR(50) NULL;
IF COL_LENGTH(N'dbo.Projects', N'Priority') IS NULL ALTER TABLE dbo.Projects ADD Priority NVARCHAR(50) NULL;
IF COL_LENGTH(N'dbo.Projects', N'ProjectType') IS NULL ALTER TABLE dbo.Projects ADD ProjectType NVARCHAR(100) NULL;
IF OBJECT_ID(N'dbo.Notifications', N'U') IS NULL CREATE TABLE dbo.Notifications (Id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY, UserId NVARCHAR(100) NULL, RecipientEngineerId NVARCHAR(50) NULL, Type NVARCHAR(50) NOT NULL, Title NVARCHAR(300) NOT NULL, Message NVARCHAR(2000) NOT NULL, EntityType NVARCHAR(100) NULL, EntityId NVARCHAR(200) NULL, ProjectId NVARCHAR(100) NULL, ProjectName NVARCHAR(500) NULL, TaskId INT NULL, AttachmentId BIGINT NULL, CreatedBy NVARCHAR(100) NULL, CreatedAt DATETIME2 NOT NULL, ReadAt DATETIME2 NULL);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'IX_Notifications_RecipientEngineerId_CreatedAt' AND object_id=OBJECT_ID(N'dbo.Notifications')) CREATE INDEX IX_Notifications_RecipientEngineerId_CreatedAt ON dbo.Notifications(RecipientEngineerId, CreatedAt);
IF OBJECT_ID(N'dbo.ProjectAttachments', N'U') IS NULL CREATE TABLE dbo.ProjectAttachments (Id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY, ProjectId NVARCHAR(50) NOT NULL, AttachmentName NVARCHAR(500) NOT NULL, OriginalFileName NVARCHAR(500) NOT NULL, StorageReference NVARCHAR(1000) NOT NULL, FileType NVARCHAR(100) NOT NULL, FileSize BIGINT NOT NULL, Version INT NOT NULL DEFAULT 1, UploadedBy NVARCHAR(200) NULL, UploadedAt DATETIME2 NOT NULL, Notes NVARCHAR(2000) NULL, Status NVARCHAR(50) NOT NULL DEFAULT N'active', CONSTRAINT FK_ProjectAttachments_Projects FOREIGN KEY(ProjectId) REFERENCES dbo.Projects(Id) ON DELETE CASCADE);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'IX_ProjectAttachments_ProjectId' AND object_id=OBJECT_ID(N'dbo.ProjectAttachments')) CREATE INDEX IX_ProjectAttachments_ProjectId ON dbo.ProjectAttachments(ProjectId);
IF OBJECT_ID(N'dbo.TFiles', N'U') IS NULL CREATE TABLE dbo.TFiles (Id NVARCHAR(100) NOT NULL PRIMARY KEY, ProjectId NVARCHAR(50) NOT NULL, Name NVARCHAR(500) NOT NULL, Description NVARCHAR(2000) NULL, Status NVARCHAR(50) NOT NULL DEFAULT N'active', CreatedBy NVARCHAR(200) NULL, CreatedAt DATETIME2 NOT NULL, CONSTRAINT FK_TFiles_Projects FOREIGN KEY(ProjectId) REFERENCES dbo.Projects(Id) ON DELETE CASCADE);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'IX_TFiles_ProjectId' AND object_id=OBJECT_ID(N'dbo.TFiles')) CREATE INDEX IX_TFiles_ProjectId ON dbo.TFiles(ProjectId);
IF OBJECT_ID(N'dbo.TRounds', N'U') IS NULL CREATE TABLE dbo.TRounds (Id NVARCHAR(100) NOT NULL PRIMARY KEY, ProjectId NVARCHAR(50) NOT NULL, TFileId NVARCHAR(100) NOT NULL, RoundNumber INT NOT NULL, Name NVARCHAR(500) NOT NULL, Description NVARCHAR(2000) NULL, CreatedBy NVARCHAR(200) NULL, CreatedAt DATETIME2 NOT NULL, Status NVARCHAR(50) NOT NULL DEFAULT N'active', CONSTRAINT FK_TRounds_TFiles FOREIGN KEY(TFileId) REFERENCES dbo.TFiles(Id) ON DELETE CASCADE);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'UX_TRounds_TFileId_RoundNumber' AND object_id=OBJECT_ID(N'dbo.TRounds')) CREATE UNIQUE INDEX UX_TRounds_TFileId_RoundNumber ON dbo.TRounds(TFileId, RoundNumber);
IF OBJECT_ID(N'dbo.TVersions', N'U') IS NULL CREATE TABLE dbo.TVersions (Id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY, RoundId NVARCHAR(100) NOT NULL, VersionNumber INT NOT NULL, FileName NVARCHAR(500) NOT NULL, OriginalFileName NVARCHAR(500) NOT NULL, FileType NVARCHAR(100) NOT NULL, FileSize BIGINT NOT NULL, StorageReference NVARCHAR(1000) NOT NULL, UploadedBy NVARCHAR(200) NULL, UploadedAt DATETIME2 NOT NULL, Notes NVARCHAR(2000) NULL, IsCurrentVersion BIT NOT NULL DEFAULT 1, Status NVARCHAR(50) NOT NULL DEFAULT N'active', CONSTRAINT FK_TVersions_TRounds FOREIGN KEY(RoundId) REFERENCES dbo.TRounds(Id) ON DELETE CASCADE);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'UX_TVersions_RoundId_VersionNumber' AND object_id=OBJECT_ID(N'dbo.TVersions')) CREATE UNIQUE INDEX UX_TVersions_RoundId_VersionNumber ON dbo.TVersions(RoundId, VersionNumber);");
}

static void MigrateLegacyRoster(AppDbContext db)
{
    if (db.Teams.Any()) return;
    var item = db.StorageItems.AsNoTracking().SingleOrDefault(x => x.Key == "roster" && x.Shared);
    if (item == null || string.IsNullOrWhiteSpace(item.Value)) return;
    using var doc = JsonDocument.Parse(item.Value);
    if (!doc.RootElement.TryGetProperty("teams", out var teams)) return;
    foreach (var tj in teams.EnumerateArray())
    {
        var id = tj.TryGetProperty("id", out var idp) ? idp.GetString() : null;
        if (string.IsNullOrWhiteSpace(id)) continue;
        var team = new Team { Id = id!, ManagerName = GetString(tj, "manager") ?? "", Color = GetString(tj, "color"), Division = GetString(tj, "division") ?? "main", Type = GetString(tj, "type") ?? "standard", Label = GetString(tj, "label") };
        if (tj.TryGetProperty("engineers", out var es)) foreach (var ej in es.EnumerateArray())
        {
            var eid = GetString(ej, "id"); var ename = GetString(ej, "name");
            if (!string.IsNullOrWhiteSpace(eid) && !string.IsNullOrWhiteSpace(ename)) team.Engineers.Add(new Engineer { Id = eid!, Name = ename! });
        }
        db.Teams.Add(team);
    }
    db.SaveChanges(); db.StorageItems.Remove(item); db.SaveChanges(); Console.WriteLine("Legacy roster migrated to Teams/Engineers.");
}

static void SeedDefaultRoster(AppDbContext db)
{
    if (db.Teams.Any() || db.Engineers.Any()) return;

    var defaultTeams = new[]
    {
        new
        {
            Id = "t1",
            ManagerName = "السيد سالم",
            Color = "#ffbf00",
            Label = "1",
            Engineers = new[]
            {
                "اكرامي فاخر",
                "محمد علاء",
                "معتصم عيسى",
                "احمد زينر"
            }
        },
        new
        {
            Id = "t2",
            ManagerName = "كريم",
            Color = "#38bdf8",
            Label = "2",
            Engineers = new[]
            {
                "اسامة عبدالرازق",
                "احمد الشيمي",
                "محمد عزت"
            }
        },
        new
        {
            Id = "t3",
            ManagerName = "محمد السبع",
            Color = "#34d399",
            Label = "3",
            Engineers = new[]
            {
                "احمد النباصي",
                "احمد الشرنوبي",
                "عمر"
            }
        },
        new
        {
            Id = "t4",
            ManagerName = "محمد سلامة",
            Color = "#c084fc",
            Label = "4",
            Engineers = new[]
            {
                "ابراهيم احمد",
                "انس خليل",
                "محمود صلاح"
            }
        },
        new
        {
            Id = "t5",
            ManagerName = "محمد الطيب",
            Color = "#f97316",
            Label = "السعودية",
            Engineers = new[]
            {
                "خالد نعيمي"
            }
        }
    };

    foreach (var team in defaultTeams)
    {
        var teamEntity = new Team
        {
            Id = team.Id,
            ManagerName = team.ManagerName,
            Color = team.Color,
            Division = "main",
            Type = "standard",
            Label = team.Label
        };
        db.Teams.Add(teamEntity);

        for (var i = 0; i < team.Engineers.Length; i++)
        {
            var engineerName = team.Engineers[i];
            db.Engineers.Add(new Engineer
            {
                Id = $"{team.Id}-e{i + 1}",
                TeamId = team.Id,
                Team = teamEntity,
                Name = engineerName,
                CompanyEmail = string.Empty,
                PhoneNumber = string.Empty,
                EmployeeCode = string.Empty,
                PhotoData = null
            });
        }
    }

    var setting = db.DashboardSettings.FirstOrDefault(x => x.Id == 1);
    if (setting == null)
    {
        db.DashboardSettings.Add(new DashboardSetting
        {
            Id = 1,
            DeptManager = "مدير القسم",
            DefaultProjectName = "مشروع جديد",
            DefaultDeliveryDate = DateTime.Today.AddDays(14),
            DefaultInquiryDate = DateTime.Today.AddDays(7),
            EmailEnabled = false,
            SmtpHost = "",
            SmtpPort = 587,
            SmtpEnableSsl = true,
            SmtpFrom = "",
            SmtpUserName = "",
            SmtpPassword = "",
            IncludeProjectOwner = true,
            IncludeTeamMembers = true,
            DefaultRecipients = ""
        });
    }

    db.SaveChanges();
    Console.WriteLine("Seeded default roster and department settings from the approved team list.");
}

static void SeedDefaultStandardTasks(AppDbContext db)
{
    if (db.StandardTasks.Any()) return;

    var tasks = new[]
    {
        new StandardTask { Id = 1, Title = "شراء كراسة الشروط وإبلاغ العلاقات العامة (مشاريع حكومية)", Description = "التفاصيل", DefaultApplicable = true },
        new StandardTask { Id = 2, Title = "استلام الكراسة وعمل إسكان (مشاريع حكومية)", Description = "التفاصيل", DefaultApplicable = true },
        new StandardTask { Id = 3, Title = "وصف المشروع وانتظار رد مجلس الإدارة", Description = "التفاصيل", DefaultApplicable = true },
        new StandardTask { Id = 4, Title = "إرسال المشروع بالإيميل (New Project) والتأكيد من الوصول", Description = "التفاصيل", DefaultApplicable = true },
        new StandardTask { Id = 5, Title = "مراجعة المستندات ومعرفة النواقص", Description = "التفاصيل", DefaultApplicable = false },
        new StandardTask { Id = 6, Title = "زيارة الموقع وإعداد أجندة الزيارة", Description = "التفاصيل", DefaultApplicable = true },
        new StandardTask { Id = 7, Title = "طلب قيمة تأمين العطاء من الحسابات", Description = "التفاصيل", DefaultApplicable = true },
        new StandardTask { Id = 8, Title = "مراجعة كل لوحات المشروع (تنسيق BIM / QS)", Description = "التفاصيل", DefaultApplicable = true },
        new StandardTask { Id = 9, Title = "تحديد الأعمال خارج نطاق أعمالنا", Description = "التفاصيل", DefaultApplicable = true },
        new StandardTask { Id = 10, Title = "دراسة كراسة الشروط والـ BOQ والمواصفات وتقرير التربة", Description = "التفاصيل", DefaultApplicable = true },
        new StandardTask { Id = 11, Title = "عمل Check List للمظروف الفني للـ DC ومتابعته", Description = "التفاصيل", DefaultApplicable = true },
        new StandardTask { Id = 12, Title = "متابعة قسم الإلكتروميكانيكال والبنود المشتركة", Description = "التفاصيل", DefaultApplicable = false },
        new StandardTask { Id = 13, Title = "عمل الاستفسارات وإرسالها للمالك", Description = "التفاصيل", DefaultApplicable = true },
        new StandardTask { Id = 14, Title = "استلام ردود الاستفسارات", Description = "التفاصيل", DefaultApplicable = true },
        new StandardTask { Id = 15, Title = "استيفاء جميع ردود الاستفسارات", Description = "التفاصيل", DefaultApplicable = true },
        new StandardTask { Id = 16, Title = "عروض الأسعار: طلب ومقارنة عروض الموردين والمقاولين", Description = "التفاصيل", DefaultApplicable = true },
        new StandardTask { Id = 17, Title = "متابعة قسم QS للحصول على نسب التسليح وغيرها", Description = "التفاصيل", DefaultApplicable = true },
        new StandardTask { Id = 18, Title = "متابعة قسم BIM في مشاريع Lump Sum واستلام المقايسة", Description = "التفاصيل", DefaultApplicable = false },
        new StandardTask { Id = 19, Title = "متابعة قسم العقود واستلام ملاحظات التسعير", Description = "التفاصيل", DefaultApplicable = true },
        new StandardTask { Id = 20, Title = "متابعة BIM Requirements بعد استلام Commercial TIPS", Description = "التفاصيل", DefaultApplicable = true },
        new StandardTask { Id = 21, Title = "التواصل مع المعدات والصيانة لمعرفة الأسعار", Description = "التفاصيل", DefaultApplicable = true },
        new StandardTask { Id = 22, Title = "عمل تحليل الأسعار على برنامج Candy", Description = "التفاصيل", DefaultApplicable = true },
        new StandardTask { Id = 23, Title = "استلام التكلفة المباشرة من قسم الإلكتروميكانيكال", Description = "التفاصيل", DefaultApplicable = true },
        new StandardTask { Id = 24, Title = "عمل الـ Top Sheet", Description = "التفاصيل", DefaultApplicable = true },
        new StandardTask { Id = 25, Title = "متابعة قسم التخطيط واستلام الجدول الزمني و Cash Flow", Description = "التفاصيل", DefaultApplicable = false },
        new StandardTask { Id = 26, Title = "متابعة قسم السيفتي واستلام HSE", Description = "التفاصيل", DefaultApplicable = false },
        new StandardTask { Id = 27, Title = "استلام طلب قيمة تأمين العطاء من الحسابات", Description = "التفاصيل", DefaultApplicable = false },
        new StandardTask { Id = 28, Title = "إرسال T والـ Methodology وCash Flow لمهندس طه للاعتماد", Description = "التفاصيل", DefaultApplicable = false },
        new StandardTask { Id = 29, Title = "مراجعة المظروف الفني وإعداد النواقص بعد DC", Description = "التفاصيل", DefaultApplicable = true },
        new StandardTask { Id = 30, Title = "إرسال O.H للإلكتروميكانيكال لتقفيل المقايسات", Description = "التفاصيل", DefaultApplicable = true },
        new StandardTask { Id = 31, Title = "إخراج مقايسات البيع من Candy وتقفيل المقايسات", Description = "التفاصيل", DefaultApplicable = true },
        new StandardTask { Id = 32, Title = "تقفيل المظروف الفني والمالي واعتماده وإرساله للمالك", Description = "التفاصيل", DefaultApplicable = true },
        new StandardTask { Id = 33, Title = "تسليم العلاقات العامة مستندات العرض والمتابعة حتى التسليم", Description = "التفاصيل", DefaultApplicable = true },
        new StandardTask { Id = 34, Title = "متابعة الرد حتى مراحل Round 2&3 وحتى الترسية", Description = "التفاصيل", DefaultApplicable = true },
        new StandardTask { Id = 35, Title = "تجهيز الـ Presentation الخاص بالمشروع", Description = "التفاصيل", DefaultApplicable = false },
        new StandardTask { Id = 36, Title = "تسليم قسم التعاقدات: التكلفة والمستندات", Description = "التفاصيل", DefaultApplicable = false },
        new StandardTask { Id = 37, Title = "تسليم قسم التكاليف: التكلفة والمستندات", Description = "التفاصيل", DefaultApplicable = false },
        new StandardTask { Id = 38, Title = "تسليم HR الستاف طبقاً لآخر شيت معتمد", Description = "التفاصيل", DefaultApplicable = false },
        new StandardTask { Id = 39, Title = "تسليم قسم المشتريات قائمة الموردين والبنود", Description = "التفاصيل", DefaultApplicable = false },
        new StandardTask { Id = 40, Title = "عمل Kick Off Meeting الداخلي", Description = "التفاصيل", DefaultApplicable = false }
    };

    db.StandardTasks.AddRange(tasks);
    db.SaveChanges();
    Console.WriteLine("Seeded the approved task checklist (40 items).");
}

static void MigrateLegacyTasks(AppDbContext db)
{
    if (db.StandardTasks.Any()) return;
    var item = db.StorageItems.AsNoTracking().SingleOrDefault(x => x.Key == "config:standardTasks" && x.Shared);
    if (item == null || string.IsNullOrWhiteSpace(item.Value)) return;
    using var doc = JsonDocument.Parse(item.Value);
    foreach (var tj in doc.RootElement.EnumerateArray())
    {
        if (!tj.TryGetProperty("id", out var idp) || !idp.TryGetInt32(out var id)) continue;
        db.StandardTasks.Add(new StandardTask { Id = id, Title = GetString(tj, "title") ?? "", Description = GetString(tj, "desc"), DefaultApplicable = !tj.TryGetProperty("applicable", out var ap) || ap.GetBoolean() });
    }
    db.SaveChanges(); db.StorageItems.Remove(item); db.SaveChanges(); Console.WriteLine("Legacy standard tasks migrated.");
}

static void MigrateLegacyDashboardData(AppDbContext db)
{
    MigrateConfig(db);
    MigrateAuth(db);
    MigrateEngineerProjects(db);
    MigrateHasr(db);
    EnsureConfigurationRows(db);
}

static void MigrateConfig(AppDbContext db)
{
    if (db.DashboardSettings.Any() || db.StorageItems.Any(x => x.Key == "config:dashboard:v2" && x.Shared) == false && db.StorageItems.Any(x => x.Key == "config:deptManager" && x.Shared) == false) return;
    var setting = new DashboardSetting { Id = 1 };
    var configItem = db.StorageItems.AsNoTracking().SingleOrDefault(x => x.Key == "config:dashboard:v2" && x.Shared);
    if (configItem != null)
    {
        try
        {
            using var doc = JsonDocument.Parse(configItem.Value);
            if (doc.RootElement.TryGetProperty("projectDefaults", out var pd))
            {
                setting.DefaultProjectName = GetString(pd, "name") ?? "";
                setting.DefaultDeliveryDate = ParseDate(GetString(pd, "deliveryDate"));
                setting.DefaultInquiryDate = ParseDate(GetString(pd, "inquiryDate"));
            }
            if (doc.RootElement.TryGetProperty("outcomes", out var outcomes)) foreach (var o in outcomes.EnumerateArray())
            {
                var id = GetString(o, "id"); var label = GetString(o, "label"); if (!string.IsNullOrWhiteSpace(id) && !string.IsNullOrWhiteSpace(label)) db.ProjectOutcomeOptions.Add(new ProjectOutcomeOption { Id = id!, Label = label!, SortOrder = db.ProjectOutcomeOptions.Count() });
            }
            if (doc.RootElement.TryGetProperty("teamPalette", out var palette)) { var i = 0; foreach (var o in palette.EnumerateArray()) { var id = GetString(o, "id") ?? $"p{i+1}"; var value = GetString(o, "value"); if (!string.IsNullOrWhiteSpace(value)) db.TeamPaletteOptions.Add(new TeamPaletteOption { Id = id, Value = value!, SortOrder = i++ }); } }
            AddFieldsFromConfig(db, doc.RootElement, "taskFields", "task");
            AddFieldsFromConfig(db, doc.RootElement, "customTaskFields", "customTask");
            AddFieldsFromConfig(db, doc.RootElement, "hasrFields", "hasr");
            db.StorageItems.Remove(configItem);
        }
        catch { }
    }
    var managerItem = db.StorageItems.AsNoTracking().SingleOrDefault(x => x.Key == "config:deptManager" && x.Shared);
    if (managerItem != null) { setting.DeptManager = managerItem.Value ?? ""; db.StorageItems.Remove(managerItem); }
    if (!db.DashboardSettings.Any()) db.DashboardSettings.Add(setting);
    db.SaveChanges();
}

static void AddFieldsFromConfig(AppDbContext db, JsonElement root, string property, string scope)
{
    if (!root.TryGetProperty(property, out var list)) return;
    var order = 0;
    foreach (var f in list.EnumerateArray())
    {
        var key = GetString(f, "id"); var label = GetString(f, "label"); var type = GetString(f, "type");
        if (string.IsNullOrWhiteSpace(key) || string.IsNullOrWhiteSpace(label) || string.IsNullOrWhiteSpace(type)) continue;
        if (!db.FieldDefinitions.Any(x => x.Scope == scope && x.FieldKey == key)) db.FieldDefinitions.Add(new FieldDefinition { Scope = scope, FieldKey = key!, Label = label!, Type = type!, SortOrder = order++ });
    }
}

static void MigrateAuth(AppDbContext db)
{
    if (db.AuthHashes.Any()) return;
    var item = db.StorageItems.AsNoTracking().SingleOrDefault(x => x.Key == "auth_v1" && x.Shared);
    if (item == null || string.IsNullOrWhiteSpace(item.Value)) return;
    try
    {
        using var doc = JsonDocument.Parse(item.Value);
        var root = doc.RootElement;
        if (root.TryGetProperty("dept", out var dept) && dept.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(dept.GetString())) db.AuthHashes.Add(new AuthHash { Role = "dept", EntityId = "dept", PasswordHash = dept.GetString()! });
        foreach (var tuple in new[] { ("teams", "team"), ("engineers", "engineer") }) if (root.TryGetProperty(tuple.Item1, out var obj) && obj.ValueKind == JsonValueKind.Object) foreach (var prop in obj.EnumerateObject()) if (prop.Value.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(prop.Value.GetString())) db.AuthHashes.Add(new AuthHash { Role = tuple.Item2, EntityId = prop.Name, PasswordHash = prop.Value.GetString()! });
        db.SaveChanges(); db.StorageItems.Remove(item); db.SaveChanges();
    } catch { }
}

static void MigrateEngineerProjects(AppDbContext db)
{
    if (db.Projects.Any()) return;
    var items = db.StorageItems.AsNoTracking().Where(x => x.Key.StartsWith("eng:") && x.Shared).ToList();
    foreach (var item in items)
    {
        var engineerId = item.Key.Substring(4); if (string.IsNullOrWhiteSpace(engineerId) || !db.Engineers.Any(x => x.Id == engineerId)) continue;
        try
        {
            using var doc = JsonDocument.Parse(item.Value); var root = doc.RootElement;
            if (!root.TryGetProperty("projects", out var projects)) continue;
            foreach (var pj in projects.EnumerateArray()) ImportProject(db, engineerId, pj);
            db.SaveChanges(); db.StorageItems.Remove(item); db.SaveChanges();
        } catch { }
    }
}

static void ImportProject(AppDbContext db, string engineerId, JsonElement pj)
{
    var id = GetString(pj, "id"); if (string.IsNullOrWhiteSpace(id)) return;
    var p = new Project { Id = id!, EngineerId = engineerId, Name = GetString(pj, "name") ?? "", DeliveryDate = ParseDate(GetString(pj, "deliveryDate")), InquiryDate = ParseDate(GetString(pj, "inquiryDate")), Finished = GetBool(pj, "finished"), Outcome = GetString(pj, "outcome"), HasrSynced = GetBool(pj, "hasrSynced"), CreatedAt = DateTime.UtcNow, LastSaved = DateTime.UtcNow };
    db.Projects.Add(p);
    if (pj.TryGetProperty("tasks", out var tasks) && tasks.ValueKind == JsonValueKind.Object) foreach (var t in tasks.EnumerateObject()) if (int.TryParse(t.Name, out var tid)) db.ProjectTaskStates.Add(new ProjectTaskState { ProjectId = p.Id, TaskId = tid, Status = GetBool(t.Value,"status"), Review = GetBool(t.Value,"review"), Applicable = GetBool(t.Value,"applicable", true), DueDate = ParseDate(GetString(t.Value,"dueDate")), Department = GetString(t.Value,"department"), Notes = GetString(t.Value,"notes") });
    if (pj.TryGetProperty("customTasks", out var customs) && customs.ValueKind == JsonValueKind.Array) foreach (var c in customs.EnumerateArray()) { var cid = GetString(c,"id"); if (string.IsNullOrWhiteSpace(cid)) continue; db.CustomTasks.Add(new CustomTask { Id=cid!, ProjectId=p.Id, Title=GetString(c,"title") ?? "", Description=GetString(c,"desc"), Status=GetBool(c,"status"), Review=GetBool(c,"review"), Applicable=GetBool(c,"applicable",true), DueDate=ParseDate(GetString(c,"dueDate")), Department=GetString(c,"department"), Notes=GetString(c,"notes") }); }
}

static void MigrateHasr(AppDbContext db)
{
    if (db.HasrProjects.Any()) return;
    var items = db.StorageItems.AsNoTracking().Where(x => x.Key.StartsWith("hasr:") && x.Shared).ToList();
    foreach (var item in items)
    {
        var teamId = item.Key.Substring(5); if (string.IsNullOrWhiteSpace(teamId) || !db.Teams.Any(x=>x.Id==teamId)) continue;
        try { using var doc=JsonDocument.Parse(item.Value); var root=doc.RootElement; var array = root.ValueKind==JsonValueKind.Array ? root : (root.TryGetProperty("items", out var itemsNode) ? itemsNode : default); if (array.ValueKind != JsonValueKind.Array) continue; foreach (var x in array.EnumerateArray()) { var id=GetString(x,"id"); if (string.IsNullOrWhiteSpace(id)) continue; db.HasrProjects.Add(new HasrProject { Id=id!, TeamId=teamId, Name=GetString(x,"name")??"", DeliveryDate=ParseDate(GetString(x,"deliveryDate")), HasWork=GetNullableBool(x,"hasWork"), HasrDueDate=ParseDate(GetString(x,"hasrDueDate")), HasrDone=GetBool(x,"hasrDone"), HasrNotes=GetString(x,"hasrNotes"), AddedBy=GetString(x,"addedBy"), CreatedAt=DateTime.UtcNow }); } db.SaveChanges(); db.StorageItems.Remove(item); db.SaveChanges(); } catch { }
    }
}

static void EnsureConfigurationRows(AppDbContext db)
{
    db.SaveChanges();
}

static string? GetString(JsonElement element, string name) => element.TryGetProperty(name, out var p) && p.ValueKind == JsonValueKind.String ? p.GetString() : null;
static bool GetBool(JsonElement element, string name, bool fallback=false) => element.TryGetProperty(name, out var p) && (p.ValueKind == JsonValueKind.True || p.ValueKind == JsonValueKind.False) ? p.GetBoolean() : fallback;
static bool? GetNullableBool(JsonElement element, string name) => element.TryGetProperty(name, out var p) && p.ValueKind != JsonValueKind.Null && (p.ValueKind == JsonValueKind.True || p.ValueKind == JsonValueKind.False) ? p.GetBoolean() : null;
static DateTime? ParseDate(string? value) => DateTime.TryParse(value, out var d) ? d.Date : null;
