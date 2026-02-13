using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StudioFlow.API.Models;

public class Studio
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    [Range(0, 9999999)]
    public decimal HourlyRate { get; set; }

    [Range(1, 1000)]
    public int MaxCapacity { get; set; }

    [MaxLength(300)]
    public string? Location { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<Booking> Bookings { get; set; } = new();
}
