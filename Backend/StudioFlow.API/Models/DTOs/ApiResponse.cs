namespace StudioFlow.API.Models.DTOs;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public int StatusCode { get; set; }
    public string? Error { get; set; }
    public T? Data { get; set; }

    public static ApiResponse<T> Ok(T data, int statusCode = StatusCodes.Status200OK)
    {
        return new ApiResponse<T>
        {
            Success = true,
            StatusCode = statusCode,
            Data = data
        };
    }

    public static ApiResponse<T> Fail(string error, int statusCode)
    {
        return new ApiResponse<T>
        {
            Success = false,
            StatusCode = statusCode,
            Error = error
        };
    }
}
