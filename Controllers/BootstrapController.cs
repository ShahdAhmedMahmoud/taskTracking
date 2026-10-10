using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TenderDashboard.Api.Data;

namespace TenderDashboard.Api.Controllers;

[ApiController]
[Route("api/bootstrap")]
public class BootstrapController : ControllerBase
{
    private readonly AppDbContext _db;
    public BootstrapController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var teams = await _db.Teams.AsNoTracking().Include(x => x.Engineers).OrderBy(x => x.Id)
            .Select(x => new { id=x.Id, manager=x.ManagerName, color=x.Color, division=x.Division, type=x.Type, label=x.Label,
                engineers=x.Engineers.OrderBy(e=>e.Id).Select(e=>new {id=e.Id,name=e.Name,companyEmail=e.CompanyEmail,phoneNumber=e.PhoneNumber,employeeCode=e.EmployeeCode,photoData=e.PhotoData}).ToList() }).ToListAsync(ct);
        var tasks = await _db.StandardTasks.AsNoTracking().OrderBy(x=>x.Id)
            .Select(x=>new { id=x.Id, title=x.Title, desc=x.Description, applicable=x.DefaultApplicable }).ToListAsync(ct);
        var setting = await _db.DashboardSettings.AsNoTracking().FirstOrDefaultAsync(x=>x.Id==1,ct);
        var outcomes = await _db.ProjectOutcomeOptions.AsNoTracking().Where(x=>x.IsActive).OrderBy(x=>x.SortOrder).Select(x=>new {id=x.Id,label=x.Label}).ToListAsync(ct);
        var palette = await _db.TeamPaletteOptions.AsNoTracking().Where(x=>x.IsActive).OrderBy(x=>x.SortOrder).Select(x=>new {id=x.Id,value=x.Value}).ToListAsync(ct);
        var fields = await _db.FieldDefinitions.AsNoTracking().Where(x=>x.IsActive).OrderBy(x=>x.Scope).ThenBy(x=>x.SortOrder)
            .Select(x=>new {scope=x.Scope,id=x.FieldKey,label=x.Label,type=x.Type,required=x.IsRequired}).ToListAsync(ct);
        return Ok(new {
            config = new {
                deptManager = setting?.DeptManager ?? "",
                projectDefaults = new { name=setting?.DefaultProjectName ?? "", deliveryDate=setting?.DefaultDeliveryDate?.ToString("yyyy-MM-dd") ?? "", inquiryDate=setting?.DefaultInquiryDate?.ToString("yyyy-MM-dd") ?? "" },
                outcomes, teamPalette=palette,
                taskFields=fields.Where(x=>x.scope=="task"), customTaskFields=fields.Where(x=>x.scope=="customTask"), hasrFields=fields.Where(x=>x.scope=="hasr")
            }, teams, tasks
        });
    }
}
