using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using StudioFlow.API.Data;
using StudioFlow.API.Models;
using StudioFlow.API.Models.DTOs;

namespace StudioFlow.API.Services;

public class AuthService
{
    private readonly AppDbContext _dbContext;
    private readonly IConfiguration _configuration;

    public AuthService(AppDbContext dbContext, IConfiguration configuration)
    {
        _dbContext = dbContext;
        _configuration = configuration;
    }

    public async Task<UserDto> RegisterAsync(RegisterRequestDto request)
    {
        ValidateRegisterRequest(request);

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var exists = await _dbContext.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail);
        if (exists)
        {
            throw new InvalidOperationException("User with this email already exists.");
        }

        var user = new User
        {
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 10),
            FirstName = request.FirstName?.Trim(),
            LastName = request.LastName?.Trim(),
            Role = UserRole.User,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        return MapUserDto(user);
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request)
    {
        ValidateLoginRequest(request);

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        var token = GenerateJwtToken(user);

        return new LoginResponseDto
        {
            Token = token,
            UserId = user.Id,
            Email = user.Email,
            Role = user.Role
        };
    }

    private string GenerateJwtToken(User user)
    {
        var secretKey = _configuration["Jwt:SecretKey"]
            ?? throw new InvalidOperationException("JWT secret key is not configured.");
        var issuer = _configuration["Jwt:Issuer"] ?? "StudioFlow";
        var audience = _configuration["Jwt:Audience"] ?? "StudioFlow.Client";

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Role, user.Role.ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static void ValidateRegisterRequest(RegisterRequestDto request)
    {
        if (request is null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        var emailValidator = new EmailAddressAttribute();
        if (string.IsNullOrWhiteSpace(request.Email) || !emailValidator.IsValid(request.Email))
        {
            throw new ValidationException("Invalid email format.");
        }

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
        {
            throw new ValidationException("Password must be at least 6 characters.");
        }

        if (!string.Equals(request.Password, request.ConfirmPassword, StringComparison.Ordinal))
        {
            throw new ValidationException("Password and confirmation do not match.");
        }
    }

    private static void ValidateLoginRequest(LoginRequestDto request)
    {
        if (request is null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        var emailValidator = new EmailAddressAttribute();
        if (string.IsNullOrWhiteSpace(request.Email) || !emailValidator.IsValid(request.Email))
        {
            throw new ValidationException("Invalid email format.");
        }

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
        {
            throw new ValidationException("Password must be at least 6 characters.");
        }
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
