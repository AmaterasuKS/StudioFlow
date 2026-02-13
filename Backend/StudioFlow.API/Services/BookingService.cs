using Microsoft.EntityFrameworkCore;
using StudioFlow.API.Data;
using StudioFlow.API.Models;
using StudioFlow.API.Models.DTOs;

namespace StudioFlow.API.Services;

public class BookingService
{
    private readonly AppDbContext _dbContext;

    public BookingService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<BookingDto>> GetUserBookingsAsync(int userId)
    {
        return await _dbContext.Bookings
            .AsNoTracking()
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.BookingDate)
            .ThenByDescending(b => b.StartTime)
            .Select(MapBookingDtoExpression())
            .ToListAsync();
    }

    public async Task<BookingDto?> GetBookingByIdAsync(int bookingId)
    {
        var booking = await _dbContext.Bookings
            .AsNoTracking()
            .Include(b => b.User)
            .Include(b => b.Studio)
            .FirstOrDefaultAsync(b => b.Id == bookingId);

        return booking is null ? null : MapBookingDto(booking);
    }

    public async Task<BookingDto> CreateBookingAsync(int userId, CreateBookingRequestDto request)
    {
        var studio = await _dbContext.Studios.FirstOrDefaultAsync(s => s.Id == request.StudioId);
        if (studio is null)
        {
            throw new KeyNotFoundException("Studio not found.");
        }

        if (request.EndTime <= request.StartTime)
        {
            throw new InvalidOperationException("EndTime must be greater than StartTime.");
        }

        var hasConflict = await _dbContext.Bookings.AnyAsync(b =>
            b.StudioId == request.StudioId &&
            b.BookingDate.Date == request.BookingDate.Date &&
            b.Status != BookingStatus.Cancelled &&
            request.StartTime < b.EndTime &&
            request.EndTime > b.StartTime);

        if (hasConflict)
        {
            throw new InvalidOperationException("Selected time overlaps with another booking.");
        }

        var durationHours = (decimal)(request.EndTime - request.StartTime).TotalHours;
        var totalPrice = decimal.Round(durationHours * studio.HourlyRate, 2, MidpointRounding.AwayFromZero);

        var booking = new Booking
        {
            UserId = userId,
            StudioId = request.StudioId,
            BookingDate = request.BookingDate.Date,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Status = BookingStatus.Pending,
            TotalPrice = totalPrice,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.Bookings.Add(booking);
        await _dbContext.SaveChangesAsync();

        return MapBookingDto(booking);
    }

    public async Task<BookingDto> UpdateBookingStatusAsync(int bookingId, int status, int userId)
    {
        var booking = await _dbContext.Bookings.FirstOrDefaultAsync(b => b.Id == bookingId)
            ?? throw new KeyNotFoundException("Booking not found.");
        var actor = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new UnauthorizedAccessException("Actor user not found.");

        if (!Enum.IsDefined(typeof(BookingStatus), status))
        {
            throw new ArgumentOutOfRangeException(nameof(status), "Invalid booking status.");
        }

        var newStatus = (BookingStatus)status;
        var isOwner = booking.UserId == userId;
        var canConfirm = actor.Role is UserRole.Manager or UserRole.Admin;

        var isAllowed =
            (isOwner && newStatus == BookingStatus.Cancelled) ||
            (canConfirm && newStatus == BookingStatus.Confirmed);

        if (!isAllowed)
        {
            throw new UnauthorizedAccessException("You do not have permission to change booking status.");
        }

        booking.Status = newStatus;
        booking.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return MapBookingDto(booking);
    }

    public async Task<BookingDto> CancelBookingAsync(int bookingId, int userId)
    {
        var booking = await _dbContext.Bookings.FirstOrDefaultAsync(b => b.Id == bookingId)
            ?? throw new KeyNotFoundException("Booking not found.");
        var actor = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new UnauthorizedAccessException("Actor user not found.");

        var canCancel = booking.UserId == userId || actor.Role is UserRole.Manager or UserRole.Admin;
        if (!canCancel)
        {
            throw new UnauthorizedAccessException("You do not have permission to cancel this booking.");
        }

        booking.Status = BookingStatus.Cancelled;
        booking.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return MapBookingDto(booking);
    }

    private static BookingDto MapBookingDto(Booking booking)
    {
        return new BookingDto
        {
            Id = booking.Id,
            StudioId = booking.StudioId,
            BookingDate = booking.BookingDate,
            StartTime = booking.StartTime,
            EndTime = booking.EndTime,
            Status = booking.Status,
            TotalPrice = booking.TotalPrice
        };
    }

    private static System.Linq.Expressions.Expression<Func<Booking, BookingDto>> MapBookingDtoExpression()
    {
        return booking => new BookingDto
        {
            Id = booking.Id,
            StudioId = booking.StudioId,
            BookingDate = booking.BookingDate,
            StartTime = booking.StartTime,
            EndTime = booking.EndTime,
            Status = booking.Status,
            TotalPrice = booking.TotalPrice
        };
    }
}
