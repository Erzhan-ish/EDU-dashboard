using AcademicPerformanceDashboard.Data;
using AcademicPerformanceDashboard.DTOs;
using AcademicPerformanceDashboard.Models;
using Microsoft.EntityFrameworkCore;

namespace AcademicPerformanceDashboard.Services;

public class StudentAnalyticsService(ApplicationDbContext context)
{
    public async Task<StudentDashboardDto> GetStudentDashboardDataAsync(int studentId)
    {
        var student = await context.Students
            .Include(s => s.Group)
            .FirstOrDefaultAsync(s => s.Id == studentId);

        if (student == null) return new StudentDashboardDto();

        var allGrades = await context.Grades
            .Where(g => g.StudentId == studentId)
            .Include(g => g.Subject)
            .ToListAsync();

        var averageScore = allGrades.Count > 0 ? allGrades.Average(g => g.Value) : 0;
        
        var subjectGroups = allGrades.GroupBy(g => g.Subject.Name).ToList();
        var bestSubject = subjectGroups.OrderByDescending(g => g.Average(x => x.Value)).FirstOrDefault()?.Key ?? "Нет";
        var weakestSubject = subjectGroups.OrderBy(g => g.Average(x => x.Value)).FirstOrDefault()?.Key ?? "Нет";

        // Progress calculation
        var now = DateTime.Now;
        var lastMonthStart = now.AddDays(-30);
        var previousMonthStart = now.AddDays(-60);

        var progressList = new List<SubjectProgressDto>();
        var subjects = await context.TeacherSubjectGroups
            .Where(tsg => tsg.GroupId == student.GroupId)
            .Select(tsg => tsg.Subject)
            .Distinct()
            .ToListAsync();

        foreach (var sub in subjects)
        {
            var currentMonthGrades = allGrades.Where(g => g.SubjectId == sub.Id && g.Date >= lastMonthStart && g.Date <= now).ToList();
            var prevMonthGrades = allGrades.Where(g => g.SubjectId == sub.Id && g.Date >= previousMonthStart && g.Date < lastMonthStart).ToList();

            if (currentMonthGrades.Count > 0 || prevMonthGrades.Count > 0)
            {
                progressList.Add(new SubjectProgressDto
                {
                    SubjectId = sub.Id,
                    SubjectName = sub.Name,
                    CurrentMonthAverage = currentMonthGrades.Count > 0 ? currentMonthGrades.Average(x => x.Value) : 0,
                    PreviousMonthAverage = prevMonthGrades.Count > 0 ? prevMonthGrades.Average(x => x.Value) : 0
                });
            }
        }

        // Determine position in group
        var groupGrades = await context.Grades
            .Where(g => g.Student.GroupId == student.GroupId)
            .ToListAsync();

        var groupAverages = groupGrades.GroupBy(g => g.StudentId)
            .Select(g => new { StudentId = g.Key, Avg = g.Average(x => x.Value) })
            .OrderByDescending(x => x.Avg)
            .ToList();

        int position = groupAverages.FindIndex(x => x.StudentId == studentId) + 1;
        if (position == 0) position = groupAverages.Count + 1; // if no grades

        var studentCount = await context.Students.CountAsync(s => s.GroupId == student.GroupId);

        return new StudentDashboardDto
        {
            AverageScore = Math.Round(averageScore, 2),
            TotalStudentsInGroup = studentCount,
            PositionInGroup = position,
            SubjectCount = subjects.Count,
            BestSubject = bestSubject,
            WeakestSubject = weakestSubject,
            Progress = progressList
        };
    }

    public async Task<Dictionary<string, double>> GetSubjectAveragesTimelineAsync(int studentId)
    {
        // Monthly average overall
        var grades = await context.Grades
            .Where(g => g.StudentId == studentId)
            .ToListAsync();

        return grades.GroupBy(g => g.Date.ToString("MMM yyyy"))
            .ToDictionary(g => g.Key, g => Math.Round(g.Average(x => x.Value), 2));
    }
}
