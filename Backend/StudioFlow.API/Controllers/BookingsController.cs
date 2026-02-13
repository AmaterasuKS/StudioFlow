using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudioFlow.API.Models;
using StudioFlow.API.Models.DTOs;
using StudioFlow.API.Services;

namespace StudioFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BookingsController : ControllerBase
{
    private readonly BookingService _bookingService;

    public BookingsController(BookingService bookingService)
    {
        _bookingService = bookingService;
    }

    [HttpGet]
    [Authorize(Roles = "User,Manager,Admin")]
    public async Task<IActionResult> GetUserBookings()
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(ApiResponse<object>.Fail("Invalid user token.", StatusCodes.Status401Unauthorized));
        }

        var bookings = await _bookingService.GetUserBookingsAsync(userId);
        return Ok(ApiResponse<List<BookingDto>>.Ok(bookings));
    }

    [HttpGet("{id:int}")]
    [Authorize]
    public async Task<IActionResult> GetById(int id)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(ApiResponse<object>.Fail("Invalid user token.", StatusCodes.Status401Unauthorized));
        }

        var isElevated = User.IsInRole(UserRole.Manager.ToString()) || User.IsInRole(UserRole.Admin.ToString());
        BookingDto? booking;

        if (isElevated)
        {
            booking = await _bookingService.GetBookingByIdAsync(id);
        }
        else
        {
            booking = (await _bookingService.GetUserBookingsAsync(userId)).FirstOrDefault(b => b.Id == id);
        }

        if (booking is null)
        {
            return NotFound(ApiResponse<object>.Fail("Booking not found.", StatusCodes.Status404NotFound));
        }

        return Ok(ApiResponse<BookingDto>.Ok(booking));
    }

    [HttpPost]
    [Authorize(Roles = "User,Manager,Admin")]
    public async Task<IActionResult> Create([FromBody] CreateBookingRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid request payload.", StatusCodes.Status400BadRequest));
        }

        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(ApiResponse<object>.Fail("Invalid user token.", StatusCodes.Status401Unauthorized));
        }

        try
        {
            var booking = await _bookingService.CreateBookingAsync(userId, request);
            return StatusCode(StatusCodes.Status201Created, ApiResponse<BookingDto>.Ok(booking, StatusCodes.Status201Created));
        }
        catch (Exception ex) when (ex is InvalidOperationException || ex is KeyNotFoundException)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message, StatusCodes.Status400BadRequest));
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateBookingStatusRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid request payload.", StatusCodes.Status400BadRequest));
        }

        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(ApiResponse<object>.Fail("Invalid user token.", StatusCodes.Status401Unauthorized));
        }

        try
        {
            var updated = await _bookingService.UpdateBookingStatusAsync(id, request.Status, userId);
            return Ok(ApiResponse<BookingDto>.Ok(updated));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message, StatusCodes.Status404NotFound));
        }
        catch (Exception ex) when (ex is UnauthorizedAccessException || ex is InvalidOperationException || ex is ArgumentOutOfRangeException)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message, StatusCodes.Status400BadRequest));
        }
    }

    [HttpDelete("{id:int}")]
    [Authorize]
    public async Task<IActionResult> Cancel(int id)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(ApiResponse<object>.Fail("Invalid user token.", StatusCodes.Status401Unauthorized));
        }

        try
        {
            await _bookingService.CancelBookingAsync(id, userId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message, StatusCodes.Status404NotFound));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ApiResponse<object>.Fail(ex.Message, StatusCodes.Status401Unauthorized));
        }
    }

    private bool TryGetUserId(out int userId)
    {
        userId = 0;
        var subClaim = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        return int.TryParse(subClaim, out userId);
    }
}
