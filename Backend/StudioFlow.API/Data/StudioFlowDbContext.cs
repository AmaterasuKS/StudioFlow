using Microsoft.EntityFrameworkCore;
using StudioFlow.API.Models;

namespace StudioFlow.API.Data;

public class StudioFlowDbContext : DbContext
{
    public StudioFlowDbContext(DbContextOptions<StudioFlowDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Studio> Studios => Set<Studio>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Booking>()
            .HasOne(b => b.User)
            .WithMany(u => u.Bookings)
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Booking>()
            .HasOne(b => b.Studio)
            .WithMany(s => s.Bookings)
            .HasForeignKey(b => b.StudioId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Studio>()
            .Property(s => s.HourlyRate)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Booking>()
            .Property(b => b.TotalPrice)
            .HasPrecision(18, 2);
    }
}
