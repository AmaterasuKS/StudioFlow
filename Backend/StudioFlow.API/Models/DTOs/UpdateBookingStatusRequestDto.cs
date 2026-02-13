using System.ComponentModel.DataAnnotations;

namespace StudioFlow.API.Models.DTOs;

public class UpdateBookingStatusRequestDto
{
    [Required]
    [Range(0, 2)]
    public int Status { get; set; }
}
