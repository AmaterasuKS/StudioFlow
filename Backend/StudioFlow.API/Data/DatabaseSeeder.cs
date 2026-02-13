using Microsoft.EntityFrameworkCore;
using StudioFlow.API.Models;

namespace StudioFlow.API.Data;

public static class DatabaseSeeder
{
    private const string DefaultPassword = "password123";

    public static async Task SeedAsync(AppDbContext dbContext)
    {
        await EnsureUserAsync(
            dbContext,
            email: "admin@studioflow.com",
            firstName: "System",
            lastName: "Admin",
            role: UserRole.Admin);

        await EnsureUserAsync(
            dbContext,
            email: "manager@studioflow.com",
            firstName: "System",
            lastName: "Manager",
            role: UserRole.Manager);
    }

    private static async Task EnsureUserAsync(
        AppDbContext dbContext,
        string email,
        string firstName,
        string lastName,
        UserRole role)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var now = DateTime.UtcNow;

        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);
        if (user is null)
        {
            dbContext.Users.Add(new User
            {
                Email = normalizedEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(DefaultPassword, workFactor: 10),
                FirstName = firstName,
                LastName = lastName,
                Role = role,
                CreatedAt = now,
                UpdatedAt = now
            });

            await dbContext.SaveChangesAsync();
            return;
        }

        var shouldUpdate = false;

        if (!string.Equals(user.FirstName, firstName, StringComparison.Ordinal))
        {
            user.FirstName = firstName;
            shouldUpdate = true;
        }

        if (!string.Equals(user.LastName, lastName, StringComparison.Ordinal))
        {
            user.LastName = lastName;
            shouldUpdate = true;
        }

        if (user.Role != role)
        {
            user.Role = role;
            shouldUpdate = true;
        }

        if (!BCrypt.Net.BCrypt.Verify(DefaultPassword, user.PasswordHash))
        {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(DefaultPassword, workFactor: 10);
            shouldUpdate = true;
        }

        if (shouldUpdate)
        {
            user.UpdatedAt = now;
            await dbContext.SaveChangesAsync();
        }
    }
}
