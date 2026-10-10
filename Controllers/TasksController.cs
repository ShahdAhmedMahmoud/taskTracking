using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TenderDashboard.Api.Data;

namespace TenderDashboard.Api.Controllers;

[ApiController]
[Route("api/tasks")]
public class TasksController : ControllerBase
{
    private readonly AppDbContext _db;

    public TasksController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var tasks = await _db.StandardTasks
            .AsNoTracking()
            .OrderBy(x => x.Id)
            .Select(x => new
            {
                id = x.Id,
                title = x.Title,
                desc = x.Description,
                applicable = x.DefaultApplicable
            })
            .ToListAsync();

        return Ok(new { tasks });
    }
}