using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace StudioFlow.API.Models;

public enum UserRole
{
    User = 0,
    Manager = 1,
    Admin = 2
}

[Index(nameof(Email), IsUnique = true)]
public class User
{
    [Key]
    public int Id { get; set; }

    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(512)]
    public string PasswordHash { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? FirstName { get; set; }

    [MaxLength(100)]
    public string? LastName { get; set; }

    [Required]
    public UserRole Role { get; set; } = UserRole.User;

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<Booking> Bookings { get; set; } = new();
}
