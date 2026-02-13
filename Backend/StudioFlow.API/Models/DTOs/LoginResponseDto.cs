using System.ComponentModel.DataAnnotations;
using StudioFlow.API.Models;

namespace StudioFlow.API.Models.DTOs;

public class LoginResponseDto
{
    [Required]
    public string Token { get; set; } = string.Empty;

    [Required]
    public int UserId { get; set; }

    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public UserRole Role { get; set; }
}
