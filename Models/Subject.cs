namespace AcademicPerformanceDashboard.Models;

public class Subject
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public ICollection<TeacherSubjectGroup> TeacherSubjectGroups { get; set; } = new List<TeacherSubjectGroup>();
    public ICollection<Grade> Grades { get; set; } = new List<Grade>();
}
