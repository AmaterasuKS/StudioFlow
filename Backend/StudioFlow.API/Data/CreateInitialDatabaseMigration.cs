namespace StudioFlow.API.Data;

public static class CreateInitialDatabaseMigration
{
    /*
    Windows PowerShell migration steps:

    1) Go to the API project folder:
       cd "c:\Users\sverb\OneDrive\Рабочий стол\IT\Для работы\Amaterasu Studio\StudioFlow\Backend\StudioFlow.API"

    2) (Optional) Restore packages:
       dotnet restore

    3) Create initial migration:
       dotnet ef migrations add InitialCreate

    4) Apply migration to SQLite database:
       dotnet ef database update

    5) Verify generated files:
       Get-ChildItem .\Migrations
    */
}
