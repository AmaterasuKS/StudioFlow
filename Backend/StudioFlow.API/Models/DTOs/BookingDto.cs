using System.ComponentModel.DataAnnotations;
using StudioFlow.API.Models;

namespace StudioFlow.API.Models.DTOs;

public class BookingDto
{
    [Required]
    public int Id { get; set; }

    [Required]
    public int StudioId { get; set; }

    [Required]
    public DateTime BookingDate { get; set; }

    [Required]
    public TimeSpan StartTime { get; set; }

    [Required]
    public TimeSpan EndTime { get; set; }

    [Required]
    public BookingStatus Status { get; set; }

    [Required]
    [Range(0, 99999999)]
    public decimal TotalPrice { get; set; }
}
