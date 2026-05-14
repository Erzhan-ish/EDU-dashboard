using AcademicPerformanceDashboard.Data;

namespace AcademicPerformanceDashboard.Models;

public class Student
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public int GroupId { get; set; }
    public Group Group { get; set; } = null!;
    public string ApplicationUserId { get; set; } = string.Empty;
    public ApplicationUser ApplicationUser { get; set; } = null!;
    
    public ICollection<Grade> Grades { get; set; } = new List<Grade>();
}
