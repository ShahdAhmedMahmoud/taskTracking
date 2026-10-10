using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TenderDashboard.Api.Data;
using TenderDashboard.Api.Models;

namespace TenderDashboard.Api.Controllers;

[ApiController]
[Route("api/fields")]
public class FieldDefinitionsController : ControllerBase
{
    private readonly AppDbContext _db;

    public FieldDefinitionsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var rows = await _db.FieldDefinitions
            .AsNoTracking()
            .OrderBy(x => x.Scope)
            .ThenBy(x => x.SortOrder)
            .ThenBy(x => x.FieldKey)
            .Select(x => new FieldDefinitionDto
            {
                Scope = x.Scope,
                Id = x.FieldKey,
                Label = x.Label,
                Type = x.Type,
                SortOrder = x.SortOrder,
                IsRequired = x.IsRequired,
                IsActive = x.IsActive
            })
            .ToListAsync(ct);

        return Ok(new
        {
            fields = rows,
            task = rows.Where(x => x.Scope == "task").ToList(),
            customTask = rows.Where(x => x.Scope == "customTask").ToList(),
            hasr = rows.Where(x => x.Scope == "hasr").ToList()
        });
    }

    [HttpPut]
    public async Task<IActionResult> Upsert([FromBody] List<FieldDefinitionDto> payload, CancellationToken ct)
    {
        if (payload == null)
            return BadRequest(new { error = "payload is required" });

        var items = payload
            .Where(x => !string.IsNullOrWhiteSpace(x.Scope)
                && !string.IsNullOrWhiteSpace(x.Id)
                && !string.IsNullOrWhiteSpace(x.Label)
                && !string.IsNullOrWhiteSpace(x.Type))
            .ToList();

        if (items.Count == 0)
            return BadRequest(new { error = "at least one valid field is required" });

        foreach (var dto in items)
        {
            var scope = dto.Scope.Trim();
            var key = dto.Id.Trim();

            var entity = await _db.FieldDefinitions
                .FirstOrDefaultAsync(x => x.Scope == scope && x.FieldKey == key, ct);

            if (entity == null)
            {
                entity = new FieldDefinition
                {
                    Scope = scope,
                    FieldKey = key
                };
                _db.FieldDefinitions.Add(entity);
            }

            entity.Label = dto.Label.Trim();
            entity.Type = dto.Type.Trim();
            entity.SortOrder = dto.SortOrder;
            entity.IsRequired = dto.IsRequired;
            entity.IsActive = dto.IsActive;
        }

        await _db.SaveChangesAsync(ct);

        return Ok(new
        {
            ok = true,
            count = items.Count
        });
    }

    [HttpDelete("{scope}/{fieldKey}")]
    public async Task<IActionResult> Delete(string scope, string fieldKey, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(scope) || string.IsNullOrWhiteSpace(fieldKey))
            return BadRequest(new { error = "scope and fieldKey are required" });

        var entity = await _db.FieldDefinitions
            .FirstOrDefaultAsync(x => x.Scope == scope && x.FieldKey == fieldKey, ct);

        if (entity == null)
            return NotFound(new { error = "field not found" });

        _db.FieldDefinitions.Remove(entity);
        await _db.SaveChangesAsync(ct);

        return Ok(new { ok = true });
    }

    public sealed class FieldDefinitionDto
    {
        public string Scope { get; set; } = string.Empty;
        public string Id { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public int SortOrder { get; set; }
        public bool IsRequired { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
