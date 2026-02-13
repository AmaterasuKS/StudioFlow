using Microsoft.EntityFrameworkCore;
using StudioFlow.API.Data;
using StudioFlow.API.Models;
using StudioFlow.API.Models.DTOs;

namespace StudioFlow.API.Services;

public class UserService
{
    private readonly AppDbContext _dbContext;

    public UserService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<UserDto?> GetUserProfileAsync(int userId)
    {
        var user = await _dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId);

        return user is null ? null : MapUserDto(user);
    }

    public async Task<List<UserDto>> GetAllUsersAsync()
    {
        return await _dbContext.Users
            .AsNoTracking()
            .OrderBy(u => u.Id)
            .Select(u => new UserDto
            {
                Id = u.Id,
                Email = u.Email,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Role = u.Role,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<UserDto?> GetUserByIdAsync(int userId)
    {
        var user = await _dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId);

        return user is null ? null : MapUserDto(user);
    }

    public async Task<bool> DeleteUserAsync(int userId)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null)
        {
            return false;
        }

        var bookings = await _dbContext.Bookings.Where(b => b.UserId == userId).ToListAsync();
        if (bookings.Count > 0)
        {
            _dbContext.Bookings.RemoveRange(bookings);
        }

        _dbContext.Users.Remove(user);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    private static UserDto MapUserDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = user.Role,
            CreatedAt = user.CreatedAt
        };
    }
}
