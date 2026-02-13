using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using StudioFlow.API.Data;
using StudioFlow.API.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("LocalhostCors", policy =>
    {
        policy
            .SetIsOriginAllowed(origin =>
            {
                if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                {
                    return false;
                }

                return uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
                    && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
            })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var jwtSecretKey = builder.Configuration["Jwt:SecretKey"] ?? "your-secret-key-min-32-characters-long!!!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "StudioFlow";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "StudioFlow.Client";
var tokenExpirationSeconds = builder.Configuration.GetValue<int>("Jwt:ExpirationMinutes", 60) * 60;

// Security note:
// Real JWT secrets/tokens must never be committed to git.
// Use environment variables or a secret manager (e.g., dotnet user-secrets, Key Vault, AWS Secrets Manager).
if (string.Equals(jwtSecretKey, "your-secret-key-min-32-characters-long!!!", StringComparison.Ordinal))
{
    builder.Logging.AddConsole();
}

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            RequireExpirationTime = true,
            ClockSkew = TimeSpan.Zero,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey))
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("UserPolicy", policy => policy.RequireRole("User", "Manager", "Admin"));
    options.AddPolicy("ManagerPolicy", policy => policy.RequireRole("Manager", "Admin"));
    options.AddPolicy("AdminPolicy", policy => policy.RequireRole("Admin"));
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<BookingService>();
builder.Services.AddScoped<UserService>();

var app = builder.Build();

if (string.Equals(jwtSecretKey, "your-secret-key-min-32-characters-long!!!", StringComparison.Ordinal))
{
    app.Logger.LogWarning("Default JWT secret is in use. Configure Jwt__SecretKey via environment or secret manager.");
}

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();
app.UseCors("LocalhostCors");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok", tokenExpirationSeconds }));

app.Run();
