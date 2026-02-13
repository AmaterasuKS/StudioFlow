using Microsoft.EntityFrameworkCore;

namespace StudioFlow.API.Data;

public class StudioFlowDbContext : DbContext
{
    public StudioFlowDbContext(DbContextOptions<StudioFlowDbContext> options) : base(options)
    {
    }
}
