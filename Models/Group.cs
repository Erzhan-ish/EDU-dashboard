namespace AcademicPerformanceDashboard.Models;

public class Group
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Course { get; set; }

    public ICollection<Student> Students { get; set; } = new List<Student>();
    public ICollection<TeacherSubjectGroup> TeacherSubjectGroups { get; set; } = new List<TeacherSubjectGroup>();
    public ICollection<ScheduleItem> ScheduleItems { get; set; } = new List<ScheduleItem>();
}
