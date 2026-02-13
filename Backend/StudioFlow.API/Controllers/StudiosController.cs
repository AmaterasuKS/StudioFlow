using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudioFlow.API.Data;
using StudioFlow.API.Models.DTOs;

namespace StudioFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StudiosController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public StudiosController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var studios = await _dbContext.Studios
            .AsNoTracking()
            .OrderBy(s => s.Id)
            .Select(s => new StudioDto
            {
                Id = s.Id,
                Name = s.Name,
                Description = s.Description,
                HourlyRate = s.HourlyRate,
                MaxCapacity = s.MaxCapacity,
                Location = s.Location
            })
            .ToListAsync();

        return Ok(ApiResponse<List<StudioDto>>.Ok(studios));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var studio = await _dbContext.Studios
            .AsNoTracking()
            .Where(s => s.Id == id)
            .Select(s => new StudioDto
            {
                Id = s.Id,
                Name = s.Name,
                Description = s.Description,
                HourlyRate = s.HourlyRate,
                MaxCapacity = s.MaxCapacity,
                Location = s.Location
            })
            .FirstOrDefaultAsync();

        if (studio is null)
        {
            return NotFound(ApiResponse<object>.Fail("Studio not found.", StatusCodes.Status404NotFound));
        }

        return Ok(ApiResponse<StudioDto>.Ok(studio));
    }
}
