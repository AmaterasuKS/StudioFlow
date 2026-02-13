using System.ComponentModel.DataAnnotations;

namespace StudioFlow.API.Models.DTOs;

public class StudioDto
{
    [Required]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Range(0, 9999999)]
    public decimal HourlyRate { get; set; }

    [Range(1, 1000)]
    public int MaxCapacity { get; set; }

    [MaxLength(300)]
    public string? Location { get; set; }
}
