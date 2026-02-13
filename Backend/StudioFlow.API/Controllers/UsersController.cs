using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudioFlow.API.Models.DTOs;
using StudioFlow.API.Services;

namespace StudioFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly UserService _userService;

    public UsersController(UserService userService)
    {
        _userService = userService;
    }

    [HttpGet("profile")]
    [Authorize]
    public async Task<IActionResult> GetProfile()
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(ApiResponse<object>.Fail("Invalid user token.", StatusCodes.Status401Unauthorized));
        }

        var user = await _userService.GetUserProfileAsync(userId);
        if (user is null)
        {
            return NotFound(ApiResponse<object>.Fail("User not found.", StatusCodes.Status404NotFound));
        }

        return Ok(ApiResponse<UserDto>.Ok(user));
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll()
    {
        var users = await _userService.GetAllUsersAsync();
        return Ok(ApiResponse<List<UserDto>>.Ok(users));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _userService.DeleteUserAsync(id);
        if (!deleted)
        {
            return NotFound(ApiResponse<object>.Fail("User not found.", StatusCodes.Status404NotFound));
        }

        return NoContent();
    }

    private bool TryGetUserId(out int userId)
    {
        userId = 0;
        var subClaim = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        return int.TryParse(subClaim, out userId);
    }
}
