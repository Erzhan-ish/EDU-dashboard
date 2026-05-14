using AcademicPerformanceDashboard.Data;
using AcademicPerformanceDashboard.Models;
using Microsoft.EntityFrameworkCore;

namespace AcademicPerformanceDashboard.Services;

public class GradeService(ApplicationDbContext context)
{
    public async Task<List<Grade>> GetGradesByStudentAsync(int studentId, int? subjectId = null)
    {
        var query = context.Grades
            .Include(g => g.Subject)
            .Include(g => g.Teacher)
            .Where(g => g.StudentId == studentId);

        if (subjectId.HasValue)
        {
            query = query.Where(g => g.SubjectId == subjectId.Value);
        }

        return await query.OrderByDescending(g => g.Date).ToListAsync();
    }

    public async Task<Grade> CreateGradeAsync(Grade grade)
    {
        context.Grades.Add(grade);
        await context.SaveChangesAsync();
        return grade;
    }

    public async Task UpdateGradeAsync(Grade grade)
    {
        context.Grades.Update(grade);
        await context.SaveChangesAsync();
    }

    public async Task DeleteGradeAsync(int id)
    {
        var grade = await context.Grades.FindAsync(id);
        if (grade != null)
        {
            context.Grades.Remove(grade);
            await context.SaveChangesAsync();
        }
    }
}
