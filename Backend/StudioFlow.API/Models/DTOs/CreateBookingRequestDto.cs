using System.ComponentModel.DataAnnotations;

namespace StudioFlow.API.Models.DTOs;

public class CreateBookingRequestDto
{
    [Required]
    public int StudioId { get; set; }

    [Required]
    public DateTime BookingDate { get; set; }

    [Required]
    public TimeSpan StartTime { get; set; }

    [Required]
    public TimeSpan EndTime { get; set; }
}
