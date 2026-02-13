using System.ComponentModel.DataAnnotations;
using StudioFlow.API.Models;

namespace StudioFlow.API.Models.DTOs;

public class UserDto
{
    [Required]
    public int Id { get; set; }

    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? FirstName { get; set; }

    [MaxLength(100)]
    public string? LastName { get; set; }

    [Required]
    public UserRole Role { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; }
}
