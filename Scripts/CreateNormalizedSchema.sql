/*
  TenderDashboard — Normalized SQL Server schema
  Business data is stored in relational tables. JSON is used only as HTTP API
  transport; StorageItems is legacy-only and is not used by runtime APIs.
*/

USE master;
GO
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
IF DB_ID(N'TenderDashboard') IS NULL CREATE DATABASE TenderDashboard;
GO
USE TenderDashboard;
GO

IF OBJECT_ID(N'dbo.Teams', N'U') IS NULL CREATE TABLE dbo.Teams (
    Id NVARCHAR(50) NOT NULL PRIMARY KEY,
    ManagerName NVARCHAR(200) NOT NULL,
    Color NVARCHAR(20) NULL,
    Division NVARCHAR(50) NOT NULL,
    Type NVARCHAR(50) NOT NULL,
    Label NVARCHAR(100) NULL
);

IF OBJECT_ID(N'dbo.Engineers', N'U') IS NULL CREATE TABLE dbo.Engineers (
    Id NVARCHAR(50) NOT NULL PRIMARY KEY,
    TeamId NVARCHAR(50) NOT NULL REFERENCES dbo.Teams(Id) ON DELETE CASCADE,
    Name NVARCHAR(200) NOT NULL,
    CompanyEmail NVARCHAR(200) NOT NULL DEFAULT N'',
    PhoneNumber NVARCHAR(50) NOT NULL DEFAULT N'',
    EmployeeCode NVARCHAR(100) NOT NULL DEFAULT N'',
    PhotoData NVARCHAR(MAX) NULL
);

IF COL_LENGTH(N'dbo.Engineers', N'CompanyEmail') IS NULL
    ALTER TABLE dbo.Engineers ADD CompanyEmail NVARCHAR(200) NOT NULL CONSTRAINT DF_Engineers_CompanyEmail DEFAULT N'';
IF COL_LENGTH(N'dbo.Engineers', N'PhoneNumber') IS NULL
    ALTER TABLE dbo.Engineers ADD PhoneNumber NVARCHAR(50) NOT NULL CONSTRAINT DF_Engineers_PhoneNumber DEFAULT N'';
IF COL_LENGTH(N'dbo.Engineers', N'EmployeeCode') IS NULL
    ALTER TABLE dbo.Engineers ADD EmployeeCode NVARCHAR(100) NOT NULL CONSTRAINT DF_Engineers_EmployeeCode DEFAULT N'';
IF COL_LENGTH(N'dbo.Engineers', N'PhotoData') IS NULL
    ALTER TABLE dbo.Engineers ADD PhotoData NVARCHAR(MAX) NULL;

IF OBJECT_ID(N'dbo.StandardTasks', N'U') IS NULL CREATE TABLE dbo.StandardTasks (
    Id INT NOT NULL PRIMARY KEY,
    Title NVARCHAR(500) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    DefaultApplicable BIT NOT NULL DEFAULT 1
);

IF OBJECT_ID(N'dbo.Projects', N'U') IS NULL CREATE TABLE dbo.Projects (
    Id NVARCHAR(50) NOT NULL PRIMARY KEY,
    EngineerId NVARCHAR(50) NOT NULL REFERENCES dbo.Engineers(Id) ON DELETE CASCADE,
    Name NVARCHAR(500) NOT NULL,
    DeliveryDate DATE NULL,
    InquiryDate DATE NULL,
    Finished BIT NOT NULL DEFAULT 0,
    Outcome NVARCHAR(50) NULL,
    HasrSynced BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL,
    LastSaved DATETIME2 NOT NULL
);

IF OBJECT_ID(N'dbo.ProjectTaskStates', N'U') IS NULL CREATE TABLE dbo.ProjectTaskStates (
    ProjectId NVARCHAR(50) NOT NULL REFERENCES dbo.Projects(Id) ON DELETE CASCADE,
    TaskId INT NOT NULL REFERENCES dbo.StandardTasks(Id) ON DELETE CASCADE,
    Status BIT NOT NULL DEFAULT 0,
    Review BIT NOT NULL DEFAULT 0,
    Applicable BIT NOT NULL DEFAULT 1,
    DueDate DATE NULL,
    Department NVARCHAR(200) NULL,
    Notes NVARCHAR(MAX) NULL,
    PRIMARY KEY(ProjectId, TaskId)
);

IF OBJECT_ID(N'dbo.CustomTasks', N'U') IS NULL CREATE TABLE dbo.CustomTasks (
    Id NVARCHAR(100) NOT NULL PRIMARY KEY,
    ProjectId NVARCHAR(50) NOT NULL REFERENCES dbo.Projects(Id) ON DELETE CASCADE,
    Title NVARCHAR(500) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    Status BIT NOT NULL DEFAULT 0,
    Review BIT NOT NULL DEFAULT 0,
    Applicable BIT NOT NULL DEFAULT 1,
    DueDate DATE NULL,
    Department NVARCHAR(200) NULL,
    Notes NVARCHAR(MAX) NULL
);

IF OBJECT_ID(N'dbo.HasrProjects', N'U') IS NULL CREATE TABLE dbo.HasrProjects (
    Id NVARCHAR(100) NOT NULL PRIMARY KEY,
    TeamId NVARCHAR(50) NOT NULL REFERENCES dbo.Teams(Id) ON DELETE CASCADE,
    Name NVARCHAR(500) NOT NULL,
    DeliveryDate DATE NULL,
    HasWork BIT NULL,
    HasrDueDate DATE NULL,
    HasrDone BIT NOT NULL DEFAULT 0,
    HasrNotes NVARCHAR(MAX) NULL,
    AddedBy NVARCHAR(200) NULL,
    CreatedAt DATETIME2 NOT NULL
);

IF OBJECT_ID(N'dbo.AuthHashes', N'U') IS NULL CREATE TABLE dbo.AuthHashes (
    Role NVARCHAR(30) NOT NULL,
    EntityId NVARCHAR(100) NOT NULL,
    PasswordHash NVARCHAR(256) NOT NULL,
    UpdatedAt DATETIME2 NOT NULL,
    PRIMARY KEY(Role, EntityId)
);

IF OBJECT_ID(N'dbo.DashboardSettings', N'U') IS NULL CREATE TABLE dbo.DashboardSettings (
    Id INT NOT NULL PRIMARY KEY,
    DeptManager NVARCHAR(200) NOT NULL,
    DefaultProjectName NVARCHAR(500) NOT NULL,
    DefaultDeliveryDate DATE NULL,
    DefaultInquiryDate DATE NULL
);

IF OBJECT_ID(N'dbo.ProjectOutcomeOptions', N'U') IS NULL CREATE TABLE dbo.ProjectOutcomeOptions (
    Id NVARCHAR(50) NOT NULL PRIMARY KEY,
    Label NVARCHAR(200) NOT NULL,
    SortOrder INT NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1
);

IF OBJECT_ID(N'dbo.TeamPaletteOptions', N'U') IS NULL CREATE TABLE dbo.TeamPaletteOptions (
    Id NVARCHAR(50) NOT NULL PRIMARY KEY,
    Value NVARCHAR(30) NOT NULL,
    SortOrder INT NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1
);

IF OBJECT_ID(N'dbo.FieldDefinitions', N'U') IS NULL CREATE TABLE dbo.FieldDefinitions (
    Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    Scope NVARCHAR(50) NOT NULL,
    FieldKey NVARCHAR(100) NOT NULL,
    Label NVARCHAR(200) NOT NULL,
    Type NVARCHAR(50) NOT NULL,
    SortOrder INT NOT NULL,
    IsRequired BIT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'UX_FieldDefinitions_Scope_FieldKey' AND object_id=OBJECT_ID(N'dbo.FieldDefinitions'))
    CREATE UNIQUE INDEX UX_FieldDefinitions_Scope_FieldKey ON dbo.FieldDefinitions(Scope, FieldKey);

IF OBJECT_ID(N'dbo.Users', N'U') IS NULL CREATE TABLE dbo.Users (
    Id NVARCHAR(100) NOT NULL PRIMARY KEY,
    EngineerId NVARCHAR(50) NULL REFERENCES dbo.Engineers(Id) ON DELETE SET NULL,
    UserName NVARCHAR(100) NOT NULL UNIQUE,
    Email NVARCHAR(200) NOT NULL UNIQUE,
    PhoneNumber NVARCHAR(50) NOT NULL DEFAULT N'',
    EmployeeCode NVARCHAR(100) NOT NULL DEFAULT N'',
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
IF COL_LENGTH(N'dbo.Users', N'PhoneNumber') IS NULL
    ALTER TABLE dbo.Users ADD PhoneNumber NVARCHAR(50) NOT NULL CONSTRAINT DF_Users_PhoneNumber DEFAULT N'';
IF COL_LENGTH(N'dbo.Users', N'EmployeeCode') IS NULL
    ALTER TABLE dbo.Users ADD EmployeeCode NVARCHAR(100) NOT NULL CONSTRAINT DF_Users_EmployeeCode DEFAULT N'';

GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'UX_Users_EngineerId' AND object_id=OBJECT_ID(N'dbo.Users'))
    CREATE UNIQUE INDEX UX_Users_EngineerId ON dbo.Users(EngineerId) WHERE EngineerId IS NOT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_Users_Engineers' AND parent_object_id=OBJECT_ID(N'dbo.Users'))
    ALTER TABLE dbo.Users ADD CONSTRAINT FK_Users_Engineers FOREIGN KEY (EngineerId) REFERENCES dbo.Engineers(Id) ON DELETE SET NULL;

IF OBJECT_ID(N'dbo.RolePermissions', N'U') IS NULL CREATE TABLE dbo.RolePermissions (
    Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    RoleName NVARCHAR(100) NOT NULL,
    Permission NVARCHAR(200) NOT NULL,
    Scope NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL,
    CONSTRAINT UX_RolePermissions UNIQUE(RoleName, Permission, Scope)
);

IF OBJECT_ID(N'dbo.PasswordResetTokens', N'U') IS NULL CREATE TABLE dbo.PasswordResetTokens (
    Id NVARCHAR(100) NOT NULL PRIMARY KEY,
    UserId NVARCHAR(100) NOT NULL,
    TokenHash NVARCHAR(256) NOT NULL UNIQUE,
    Purpose NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL,
    ExpiresAt DATETIME2 NOT NULL,
    UsedAt DATETIME2 NULL,
    RequestedByIp NVARCHAR(100) NULL
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'IX_PasswordResetTokens_UserId' AND object_id=OBJECT_ID(N'dbo.PasswordResetTokens'))
    CREATE INDEX IX_PasswordResetTokens_UserId ON dbo.PasswordResetTokens(UserId);

IF OBJECT_ID(N'dbo.AuditLogs', N'U') IS NULL CREATE TABLE dbo.AuditLogs (
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
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'IX_AuditLogs_UserId' AND object_id=OBJECT_ID(N'dbo.AuditLogs'))
    CREATE INDEX IX_AuditLogs_UserId ON dbo.AuditLogs(UserId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'IX_AuditLogs_Action' AND object_id=OBJECT_ID(N'dbo.AuditLogs'))
    CREATE INDEX IX_AuditLogs_Action ON dbo.AuditLogs(Action);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'IX_AuditLogs_CreatedAt' AND object_id=OBJECT_ID(N'dbo.AuditLogs'))
    CREATE INDEX IX_AuditLogs_CreatedAt ON dbo.AuditLogs(CreatedAt);

IF OBJECT_ID(N'dbo.AutoSaveDrafts', N'U') IS NULL CREATE TABLE dbo.AutoSaveDrafts (
    Id NVARCHAR(100) NOT NULL PRIMARY KEY,
    RecordType NVARCHAR(100) NOT NULL,
    RecordId NVARCHAR(200) NOT NULL,
    OwnerUserId NVARCHAR(100) NULL,
    DraftJson NVARCHAR(MAX) NOT NULL,
    LastSavedAt DATETIME2 NOT NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT N'draft',
    IsLatest BIT NOT NULL DEFAULT 1,
    CONSTRAINT UX_AutoSaveDrafts UNIQUE(RecordType, RecordId)
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'IX_AutoSaveDrafts_OwnerUserId' AND object_id=OBJECT_ID(N'dbo.AutoSaveDrafts'))
    CREATE INDEX IX_AutoSaveDrafts_OwnerUserId ON dbo.AutoSaveDrafts(OwnerUserId);

IF OBJECT_ID(N'dbo.ProjectArchives', N'U') IS NULL CREATE TABLE dbo.ProjectArchives (
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
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'IX_ProjectArchives_ProjectId' AND object_id=OBJECT_ID(N'dbo.ProjectArchives'))
    CREATE INDEX IX_ProjectArchives_ProjectId ON dbo.ProjectArchives(ProjectId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'IX_ProjectArchives_ArchivedAt' AND object_id=OBJECT_ID(N'dbo.ProjectArchives'))
    CREATE INDEX IX_ProjectArchives_ArchivedAt ON dbo.ProjectArchives(ArchivedAt);

IF COL_LENGTH(N'dbo.Projects', N'ProjectCode') IS NULL ALTER TABLE dbo.Projects ADD ProjectCode NVARCHAR(100) NULL;
IF COL_LENGTH(N'dbo.Projects', N'Description') IS NULL ALTER TABLE dbo.Projects ADD Description NVARCHAR(MAX) NULL;
IF COL_LENGTH(N'dbo.Projects', N'Department') IS NULL ALTER TABLE dbo.Projects ADD Department NVARCHAR(200) NULL;
IF COL_LENGTH(N'dbo.Projects', N'Status') IS NULL ALTER TABLE dbo.Projects ADD Status NVARCHAR(50) NULL;
IF COL_LENGTH(N'dbo.Projects', N'Priority') IS NULL ALTER TABLE dbo.Projects ADD Priority NVARCHAR(50) NULL;
IF COL_LENGTH(N'dbo.Projects', N'ProjectType') IS NULL ALTER TABLE dbo.Projects ADD ProjectType NVARCHAR(100) NULL;

IF OBJECT_ID(N'dbo.Notifications', N'U') IS NULL CREATE TABLE dbo.Notifications (
    Id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    UserId NVARCHAR(100) NULL,
    RecipientEngineerId NVARCHAR(50) NULL,
    Type NVARCHAR(50) NOT NULL,
    Title NVARCHAR(300) NOT NULL,
    Message NVARCHAR(2000) NOT NULL,
    EntityType NVARCHAR(100) NULL,
    EntityId NVARCHAR(200) NULL,
    ProjectId NVARCHAR(100) NULL,
    ProjectName NVARCHAR(500) NULL,
    TaskId INT NULL,
    AttachmentId BIGINT NULL,
    CreatedBy NVARCHAR(100) NULL,
    CreatedAt DATETIME2 NOT NULL,
    ReadAt DATETIME2 NULL
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'IX_Notifications_RecipientEngineerId_CreatedAt' AND object_id=OBJECT_ID(N'dbo.Notifications'))
    CREATE INDEX IX_Notifications_RecipientEngineerId_CreatedAt ON dbo.Notifications(RecipientEngineerId, CreatedAt);

IF OBJECT_ID(N'dbo.ProjectAttachments', N'U') IS NULL CREATE TABLE dbo.ProjectAttachments (
    Id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    ProjectId NVARCHAR(50) NOT NULL,
    AttachmentName NVARCHAR(500) NOT NULL,
    OriginalFileName NVARCHAR(500) NOT NULL,
    StorageReference NVARCHAR(1000) NOT NULL,
    FileType NVARCHAR(100) NOT NULL,
    FileSize BIGINT NOT NULL,
    Version INT NOT NULL DEFAULT 1,
    UploadedBy NVARCHAR(200) NULL,
    UploadedAt DATETIME2 NOT NULL,
    Notes NVARCHAR(2000) NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT N'active',
    CONSTRAINT FK_ProjectAttachments_Projects FOREIGN KEY(ProjectId) REFERENCES dbo.Projects(Id) ON DELETE CASCADE
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'IX_ProjectAttachments_ProjectId' AND object_id=OBJECT_ID(N'dbo.ProjectAttachments'))
    CREATE INDEX IX_ProjectAttachments_ProjectId ON dbo.ProjectAttachments(ProjectId);

IF OBJECT_ID(N'dbo.TFiles', N'U') IS NULL CREATE TABLE dbo.TFiles (
    Id NVARCHAR(100) NOT NULL PRIMARY KEY,
    ProjectId NVARCHAR(50) NOT NULL,
    Name NVARCHAR(500) NOT NULL,
    Description NVARCHAR(2000) NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT N'active',
    CreatedBy NVARCHAR(200) NULL,
    CreatedAt DATETIME2 NOT NULL,
    CONSTRAINT FK_TFiles_Projects FOREIGN KEY(ProjectId) REFERENCES dbo.Projects(Id) ON DELETE CASCADE
);
IF OBJECT_ID(N'dbo.TRounds', N'U') IS NULL CREATE TABLE dbo.TRounds (
    Id NVARCHAR(100) NOT NULL PRIMARY KEY,
    ProjectId NVARCHAR(50) NOT NULL,
    TFileId NVARCHAR(100) NOT NULL,
    RoundNumber INT NOT NULL,
    Name NVARCHAR(500) NOT NULL,
    Description NVARCHAR(2000) NULL,
    CreatedBy NVARCHAR(200) NULL,
    CreatedAt DATETIME2 NOT NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT N'active',
    CONSTRAINT FK_TRounds_TFiles FOREIGN KEY(TFileId) REFERENCES dbo.TFiles(Id) ON DELETE CASCADE
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'UX_TRounds_TFileId_RoundNumber' AND object_id=OBJECT_ID(N'dbo.TRounds'))
    CREATE UNIQUE INDEX UX_TRounds_TFileId_RoundNumber ON dbo.TRounds(TFileId, RoundNumber);

IF OBJECT_ID(N'dbo.TVersions', N'U') IS NULL CREATE TABLE dbo.TVersions (
    Id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    RoundId NVARCHAR(100) NOT NULL,
    VersionNumber INT NOT NULL,
    FileName NVARCHAR(500) NOT NULL,
    OriginalFileName NVARCHAR(500) NOT NULL,
    FileType NVARCHAR(100) NOT NULL,
    FileSize BIGINT NOT NULL,
    StorageReference NVARCHAR(1000) NOT NULL,
    UploadedBy NVARCHAR(200) NULL,
    UploadedAt DATETIME2 NOT NULL,
    Notes NVARCHAR(2000) NULL,
    IsCurrentVersion BIT NOT NULL DEFAULT 1,
    Status NVARCHAR(50) NOT NULL DEFAULT N'active',
    CONSTRAINT FK_TVersions_TRounds FOREIGN KEY(RoundId) REFERENCES dbo.TRounds(Id) ON DELETE CASCADE
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'UX_TVersions_RoundId_VersionNumber' AND object_id=OBJECT_ID(N'dbo.TVersions'))
    CREATE UNIQUE INDEX UX_TVersions_RoundId_VersionNumber ON dbo.TVersions(RoundId, VersionNumber);

GO
