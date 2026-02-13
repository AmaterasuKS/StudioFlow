using Microsoft.EntityFrameworkCore;
using StudioFlow.API.Models;

namespace StudioFlow.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Studio> Studios => Set<Studio>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Booking>()
            .HasOne(b => b.User)
            .WithMany(u => u.Bookings)
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Booking>()
            .HasOne(b => b.Studio)
            .WithMany(s => s.Bookings)
            .HasForeignKey(b => b.StudioId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Booking>()
            .Property(b => b.TotalPrice)
            .HasPrecision(18, 2);

        var seedDate = new DateTime(2026, 2, 13, 12, 0, 0, DateTimeKind.Utc);

        modelBuilder.Entity<Studio>().HasData(
            new Studio
            {
                Id = 1,
                Name = "Red Studio",
                Description = "Compact recording room for solo and duo sessions.",
                HourlyRate = 45.00m,
                MaxCapacity = 3,
                Location = "Floor 1, Room A",
                CreatedAt = seedDate
            },
            new Studio
            {
                Id = 2,
                Name = "Blue Studio",
                Description = "Mid-size room for podcasts and vocal groups.",
                HourlyRate = 65.00m,
                MaxCapacity = 6,
                Location = "Floor 2, Room B",
                CreatedAt = seedDate
            },
            new Studio
            {
                Id = 3,
                Name = "Green Studio",
                Description = "Large multipurpose studio with isolation booth.",
                HourlyRate = 90.00m,
                MaxCapacity = 10,
                Location = "Floor 3, Room C",
                CreatedAt = seedDate
            });

        modelBuilder.Entity<User>().HasData(
            new User
            {
                Id = 1,
                Email = "manager@studioflow.local",
                PasswordHash = "$2a$11$SpRXyX1x1UB2Pwc6w9Qv/.jICpr2vR8M8h9Gw0L7N1Y1wD4xM7RLW",
                FirstName = "Test",
                LastName = "Manager",
                Role = UserRole.Manager,
                CreatedAt = seedDate,
                UpdatedAt = seedDate
            },
            new User
            {
                Id = 2,
                Email = "admin@studioflow.local",
                PasswordHash = "$2a$11$2fS8lktQm7f9m8Yx1Bdr9eV1LwxlHriB/9MUk8DJm9DB4UED9f9Hi",
                FirstName = "Test",
                LastName = "Admin",
                Role = UserRole.Admin,
                CreatedAt = seedDate,
                UpdatedAt = seedDate
            });
    }
}
