namespace AcademicPerformanceDashboard.Models;

public class Grade
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public Student Student { get; set; } = null!;
    public int SubjectId { get; set; }
    public Subject Subject { get; set; } = null!;
    public int TeacherId { get; set; }
    public Teacher Teacher { get; set; } = null!;
    
    // Value from 0 to 100
    public int Value { get; set; }
    public DateTime Date { get; set; }
    public string? Comment { get; set; }
}
