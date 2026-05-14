using AcademicPerformanceDashboard.Data;
using AcademicPerformanceDashboard.DTOs;
using Microsoft.EntityFrameworkCore;

namespace AcademicPerformanceDashboard.Services;

public class RankingService(ApplicationDbContext context)
{
    public async Task<List<StudentRankingDto>> GetStudentGroupRankingAsync(int groupId)
    {
        var groupStudents = await context.Students
            .Where(s => s.GroupId == groupId)
            .Include(s => s.Grades)
            .ToListAsync();

        var ranking = groupStudents.Select(s => new StudentRankingDto
        {
            StudentId = s.Id,
            FullName = s.FullName,
            AverageScore = s.Grades.Count > 0 ? Math.Round(s.Grades.Average(g => g.Value), 2) : 0,
            GradeCount = s.Grades.Count
        })
        .OrderByDescending(r => r.AverageScore)
        .ToList();

        for (int i = 0; i < ranking.Count; i++)
        {
            ranking[i].Position = i + 1;
        }

        return ranking;
    }

    public async Task<List<GroupRankingDto>> GetGroupRankingAsync()
    {
        var groups = await context.Groups
            .Include(g => g.Students)
            .ThenInclude(s => s.Grades)
            .ToListAsync();

        var ranking = groups.Select(g =>
        {
            var allGrades = g.Students.SelectMany(s => s.Grades).ToList();
            return new GroupRankingDto
            {
                GroupId = g.Id,
                GroupName = g.Name,
                Course = g.Course,
                StudentCount = g.Students.Count,
                AverageScore = allGrades.Count > 0 ? Math.Round(allGrades.Average(x => x.Value), 2) : 0
            };
        })
        .OrderByDescending(r => r.AverageScore)
        .ToList();

        for (int i = 0; i < ranking.Count; i++)
        {
            ranking[i].Position = i + 1;
        }

        return ranking;
    }
}
