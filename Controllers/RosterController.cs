using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TenderDashboard.Api.Data;
using TenderDashboard.Api.Models;

namespace TenderDashboard.Api.Controllers;

[ApiController]
[Route("api/roster")]
public class RosterController : ControllerBase
{
    private readonly AppDbContext _db;

    public RosterController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var teams = await _db.Teams
            .AsNoTracking()
            .Include(x => x.Engineers)
            .OrderBy(x => x.Id)
            .Select(x => new
            {
                id = x.Id,
                manager = x.ManagerName,
                color = x.Color,
                division = x.Division,
                type = x.Type,
                label = x.Label,
                engineers = x.Engineers
                    .OrderBy(e => e.Id)
                    .Select(e => new { id = e.Id, name = e.Name, companyEmail = e.CompanyEmail, phoneNumber = e.PhoneNumber, employeeCode = e.EmployeeCode, photoData = e.PhotoData })
                    .ToList()
            })
            .ToListAsync();

        return Ok(new { teams });
    }

    [HttpPut]
    public async Task<IActionResult> Replace([FromBody] RosterRequest request)
    {
        if (request.Teams == null)
            return BadRequest(new { error = "teams is required" });

        var duplicateTeamIds = request.Teams
            .GroupBy(x => x.Id)
            .Where(x => string.IsNullOrWhiteSpace(x.Key) || x.Count() > 1)
            .Select(x => x.Key)
            .ToList();
        if (duplicateTeamIds.Count > 0)
            return BadRequest(new { error = "team ids must be unique and non-empty" });

        var engineers = request.Teams.SelectMany(x => x.Engineers ?? [])
            .ToList();
        if (engineers.Any(x => string.IsNullOrWhiteSpace(x.Id) || string.IsNullOrWhiteSpace(x.Name)) ||
            engineers.GroupBy(x => x.Id).Any(x => x.Count() > 1))
            return BadRequest(new { error = "engineer ids must be unique and non-empty" });

        // This endpoint used to delete and recreate every team on each save.  With SQL
        // foreign keys that also deleted engineers' projects and task history.  Apply a
        // differential update instead so the roster is truly backed by persistent data.
        var currentTeams = await _db.Teams.Include(x => x.Engineers).ToListAsync();
        var currentEngineers = currentTeams.SelectMany(x => x.Engineers).ToList();
        var requestedTeamIds = request.Teams.Select(x => x.Id).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var requestedEngineerIds = engineers.Select(x => x.Id).ToHashSet(StringComparer.OrdinalIgnoreCase);

        var deletedTeams = currentTeams.Where(x => !requestedTeamIds.Contains(x.Id)).Select(x => x.Id).ToList();
        var deletedEngineers = currentEngineers.Where(x => !requestedEngineerIds.Contains(x.Id)).Select(x => x.Id).ToList();
        if (deletedTeams.Count > 0 || deletedEngineers.Count > 0)
            return Conflict(new { error = "Roster deletion is not allowed through this endpoint because it would orphan project history. Archive records through a dedicated endpoint instead." });

        var teamsById = currentTeams.ToDictionary(x => x.Id, StringComparer.OrdinalIgnoreCase);
        var engineersById = currentEngineers.ToDictionary(x => x.Id, StringComparer.OrdinalIgnoreCase);
        foreach (var input in request.Teams)
        {
            if (!teamsById.TryGetValue(input.Id, out var team))
            {
                team = new Team { Id = input.Id };
                _db.Teams.Add(team);
                teamsById.Add(team.Id, team);
            }

            team.ManagerName = input.Manager ?? string.Empty;
            team.Color = input.Color;
            team.Division = input.Division ?? "main";
            team.Type = input.Type ?? "standard";
            team.Label = input.Label;

            foreach (var inputEngineer in input.Engineers ?? [])
            {
                if (!engineersById.TryGetValue(inputEngineer.Id, out var engineer))
                {
                    engineer = new Engineer { Id = inputEngineer.Id };
                    _db.Engineers.Add(engineer);
                    engineersById.Add(engineer.Id, engineer);
                }
                engineer.Name = inputEngineer.Name;
                engineer.CompanyEmail = inputEngineer.CompanyEmail ?? string.Empty;
                engineer.PhoneNumber = inputEngineer.PhoneNumber ?? string.Empty;
                engineer.EmployeeCode = inputEngineer.EmployeeCode ?? string.Empty;
                engineer.PhotoData = inputEngineer.PhotoData;
                engineer.TeamId = team.Id;
            }
        }

        await _db.SaveChangesAsync();
        return Ok(new { ok = true, teams = request.Teams.Count, engineers = engineers.Count });
    }

    [HttpPut("engineers/{engineerId}/photo")]
    public async Task<IActionResult> UpdatePhoto(string engineerId, [FromBody] PhotoRequest request, CancellationToken ct)
    {
        if (!string.Equals(Request.Headers["X-User-Role"].ToString(), "engineer", StringComparison.OrdinalIgnoreCase) ||
            !string.Equals(Request.Headers["X-Engineer-Id"].ToString(), engineerId, StringComparison.OrdinalIgnoreCase))
            return Forbid();

        var engineer = await _db.Engineers.SingleOrDefaultAsync(x => x.Id == engineerId, ct);
        if (engineer == null) return NotFound(new { error = "engineer not found" });

        if (!string.IsNullOrWhiteSpace(request.PhotoData))
        {
            if (request.PhotoData.Length > 2_800_000 ||
                !request.PhotoData.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { error = "photo must be an image smaller than 2 MB" });
        }

        engineer.PhotoData = string.IsNullOrWhiteSpace(request.PhotoData) ? null : request.PhotoData;
        await _db.SaveChangesAsync(ct);
        return Ok(new { ok = true, photoData = engineer.PhotoData });
    }

    public class RosterRequest
    {
        public List<TeamRequest> Teams { get; set; } = [];
    }

    public class TeamRequest
    {
        public string Id { get; set; } = string.Empty;
        public string? Manager { get; set; }
        public string? Color { get; set; }
        public string? Division { get; set; }
        public string? Type { get; set; }
        public string? Label { get; set; }
        public List<EngineerRequest>? Engineers { get; set; }
    }

    public class EngineerRequest
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? CompanyEmail { get; set; }
        public string? PhoneNumber { get; set; }
        public string? EmployeeCode { get; set; }
        public string? PhotoData { get; set; }
    }

    public class PhotoRequest
    {
        public string? PhotoData { get; set; }
    }

    [HttpPut("engineers/{engineerId}/profile")]
    public async Task<IActionResult> UpdateProfile(string engineerId, [FromBody] ProfileRequest request, CancellationToken ct)
    {
        if (!string.Equals(Request.Headers["X-User-Role"].ToString(), "engineer", StringComparison.OrdinalIgnoreCase) ||
            !string.Equals(Request.Headers["X-Engineer-Id"].ToString(), engineerId, StringComparison.OrdinalIgnoreCase))
            return Forbid();

        if (!string.IsNullOrWhiteSpace(request.CompanyEmail))
        {
            try { _ = new System.Net.Mail.MailAddress(request.CompanyEmail); }
            catch (FormatException) { return BadRequest(new { error = "company email is invalid" }); }
        }

        var engineer = await _db.Engineers.SingleOrDefaultAsync(x => x.Id == engineerId, ct);
        if (engineer == null) return NotFound(new { error = "engineer not found" });

        engineer.CompanyEmail = request.CompanyEmail?.Trim() ?? string.Empty;
        engineer.PhoneNumber = request.PhoneNumber?.Trim() ?? string.Empty;
        engineer.EmployeeCode = request.EmployeeCode?.Trim() ?? string.Empty;
        if (!string.IsNullOrWhiteSpace(request.PhotoData)) engineer.PhotoData = request.PhotoData;
        await _db.SaveChangesAsync(ct);

        return Ok(new { ok = true, profile = new { engineer.Id, engineer.Name, engineer.CompanyEmail, engineer.PhoneNumber, engineer.EmployeeCode, engineer.PhotoData } });
    }

    public class ProfileRequest
    {
        public string? CompanyEmail { get; set; }
        public string? PhoneNumber { get; set; }
        public string? EmployeeCode { get; set; }
        public string? PhotoData { get; set; }
    }
}
