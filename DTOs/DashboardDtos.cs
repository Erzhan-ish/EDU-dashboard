namespace AcademicPerformanceDashboard.DTOs;

public class SubjectProgressDto
{
    public int SubjectId { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public double CurrentMonthAverage { get; set; }
    public double PreviousMonthAverage { get; set; }
    
    public double Difference => CurrentMonthAverage - PreviousMonthAverage;
    public string Status => Difference > 0 ? "Рост" : Difference < 0 ? "Падение" : "Без изменений";
}

public class StudentDashboardDto
{
    public double AverageScore { get; set; }
    public int PositionInGroup { get; set; }
    public int TotalStudentsInGroup { get; set; }
    public int SubjectCount { get; set; }
    public string BestSubject { get; set; } = "Нет";
    public string WeakestSubject { get; set; } = "Нет";

    public List<SubjectProgressDto> Progress { get; set; } = new List<SubjectProgressDto>();
}

public class StudentRankingDto
{
    public int StudentId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public double AverageScore { get; set; }
    public int Position { get; set; }
    public int GradeCount { get; set; }
}

public class GroupRankingDto
{
    public int GroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public int Course { get; set; }
    public double AverageScore { get; set; }
    public int StudentCount { get; set; }
    public int Position { get; set; }
}
