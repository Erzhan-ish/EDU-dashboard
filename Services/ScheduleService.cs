using AcademicPerformanceDashboard.Data;
using AcademicPerformanceDashboard.Models;
using Microsoft.EntityFrameworkCore;

namespace AcademicPerformanceDashboard.Services;

public class ScheduleService(ApplicationDbContext context)
{
    public async Task<List<ScheduleItem>> GetWeeklyScheduleAsync(int groupId)
    {
        var items = await context.ScheduleItems
            .Include(s => s.Subject)
            .Include(s => s.Teacher)
            .Where(s => s.GroupId == groupId)
            .ToListAsync();

        return items.OrderBy(s => s.DayOfWeek).ThenBy(s => s.StartTime).ToList();
    }

    public async Task<List<ScheduleItem>> GetTodayScheduleAsync(int groupId)
    {
        var today = DateTime.Now.DayOfWeek;
        
        var items = await context.ScheduleItems
            .Include(s => s.Subject)
            .Include(s => s.Teacher)
            .Where(s => s.GroupId == groupId && s.DayOfWeek == today)
            .ToListAsync();

        return items.OrderBy(s => s.StartTime).ToList();
    }
}
