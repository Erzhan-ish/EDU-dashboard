using AcademicPerformanceDashboard.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AcademicPerformanceDashboard.Data;

public static class SeedData
{
    public static async Task InitializeAsync(IServiceProvider serviceProvider)
    {
        using var context = new ApplicationDbContext(
            serviceProvider.GetRequiredService<DbContextOptions<ApplicationDbContext>>());

        if (context.Users.Any())
        {
            return;   // DB has been seeded
        }

        var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        
        // Roles are not strictly needed if we just check Student/Teacher tables, but we can just use the tables directly.
        // Let's create users
        var adminUser = new ApplicationUser { UserName = "admin@example.com", Email = "admin@example.com", EmailConfirmed = true, FullName = "System Administrator" };
        var teacherUser = new ApplicationUser { UserName = "teacher@example.com", Email = "teacher@example.com", EmailConfirmed = true, FullName = "Иван Иванов" };
        var studentUser = new ApplicationUser { UserName = "student@example.com", Email = "student@example.com", EmailConfirmed = true, FullName = "Петр Петров" };

        await userManager.CreateAsync(adminUser, "Admin123!");
        await userManager.CreateAsync(teacherUser, "Teacher123!");
        await userManager.CreateAsync(studentUser, "Student123!");

        // Add additional teachers and students
        var otherTeachers = new List<ApplicationUser>();
        for (int i = 1; i <= 4; i++)
        {
            var t = new ApplicationUser { UserName = $"teacher{i}@example.com", Email = $"teacher{i}@example.com", EmailConfirmed = true, FullName = $"Преподаватель {i}" };
            await userManager.CreateAsync(t, "Teacher123!");
            otherTeachers.Add(t);
        }

        // Groups
        var groups = new List<Group>
        {
            new Group { Name = "ИС-21", Course = 2 },
            new Group { Name = "ПИ-31", Course = 3 },
            new Group { Name = "ИВТ-22", Course = 2 }
        };
        context.Groups.AddRange(groups);
        await context.SaveChangesAsync();

        // Subjects
        var subjects = new List<Subject>
        {
            new Subject { Name = "Математика" },
            new Subject { Name = "Программирование" },
            new Subject { Name = "Базы данных" },
            new Subject { Name = "Английский язык" },
            new Subject { Name = "Сети" },
            new Subject { Name = "Алгоритмы" }
        };
        context.Subjects.AddRange(subjects);
        await context.SaveChangesAsync();

        // Teachers
        var mainTeacher = new Teacher { ApplicationUserId = teacherUser.Id, FullName = teacherUser.FullName };
        context.Teachers.Add(mainTeacher);
        var teacherList = new List<Teacher> { mainTeacher };
        foreach (var tUser in otherTeachers)
        {
            var t = new Teacher { ApplicationUserId = tUser.Id, FullName = tUser.FullName };
            context.Teachers.Add(t);
            teacherList.Add(t);
        }
        await context.SaveChangesAsync();

        // Students
        var mainStudent = new Student { ApplicationUserId = studentUser.Id, FullName = studentUser.FullName, GroupId = groups[0].Id };
        context.Students.Add(mainStudent);
        
        var studentList = new List<Student> { mainStudent };
        for (int i = 1; i <= 15; i++)
        {
            var sUser = new ApplicationUser { UserName = $"student{i}@example.com", Email = $"student{i}@example.com", EmailConfirmed = true, FullName = $"Студент {i}" };
            await userManager.CreateAsync(sUser, "Student123!");
            var s = new Student { ApplicationUserId = sUser.Id, FullName = sUser.FullName, GroupId = groups[i % 3].Id };
            context.Students.Add(s);
            studentList.Add(s);
        }
        await context.SaveChangesAsync();

        // TeacherSubjectGroup
        var rnd = new Random(42);
        var tsgList = new List<TeacherSubjectGroup>();
        foreach (var group in groups)
        {
            foreach (var subject in subjects)
            {
                var teacher = teacherList[rnd.Next(teacherList.Count)];
                var tsg = new TeacherSubjectGroup { GroupId = group.Id, SubjectId = subject.Id, TeacherId = teacher.Id };
                tsgList.Add(tsg);
            }
        }
        context.TeacherSubjectGroups.AddRange(tsgList);
        await context.SaveChangesAsync();

        // Schedule
        foreach (var tsg in tsgList)
        {
            context.ScheduleItems.Add(new ScheduleItem
            {
                GroupId = tsg.GroupId,
                SubjectId = tsg.SubjectId,
                TeacherId = tsg.TeacherId,
                DayOfWeek = (DayOfWeek)rnd.Next(1, 6),
                StartTime = new TimeSpan(8 + rnd.Next(0, 4) * 2, 0, 0),
                EndTime = new TimeSpan(9 + rnd.Next(0, 4) * 2, 30, 0),
                Classroom = $"Ауд. {rnd.Next(100, 500)}"
            });
        }
        await context.SaveChangesAsync();

        // Grades
        // Create grades for the past 2 months
        var now = DateTime.Now;
        var lastMonth = now.AddDays(-30);
        var twoMonthsAgo = now.AddDays(-60);

        foreach (var student in studentList)
        {
            foreach (var subject in subjects)
            {
                var teacher = tsgList.FirstOrDefault(t => t.GroupId == student.GroupId && t.SubjectId == subject.Id)?.TeacherId ?? teacherList[0].Id;
                
                // Simulate growth, decline, stable
                // Math: decline
                // Programming: growth
                // English: stable
                
                int baseScoreTwoMonthsAgo = rnd.Next(60, 80);
                int baseScoreLastMonth = baseScoreTwoMonthsAgo;
                int baseScoreThisMonth = baseScoreTwoMonthsAgo;

                if (subject.Name == "Математика")
                {
                    baseScoreLastMonth -= 5;
                    baseScoreThisMonth -= 15;
                }
                else if (subject.Name == "Программирование")
                {
                    baseScoreLastMonth += 10;
                    baseScoreThisMonth += 20;
                }

                // Add 2 grades per month
                context.Grades.Add(new Grade { StudentId = student.Id, SubjectId = subject.Id, TeacherId = teacher, Value = Math.Clamp(baseScoreTwoMonthsAgo + rnd.Next(-5, 5), 0, 100), Date = twoMonthsAgo.AddDays(rnd.Next(0, 15)) });
                context.Grades.Add(new Grade { StudentId = student.Id, SubjectId = subject.Id, TeacherId = teacher, Value = Math.Clamp(baseScoreTwoMonthsAgo + rnd.Next(-5, 5), 0, 100), Date = twoMonthsAgo.AddDays(rnd.Next(15, 30)) });
                
                context.Grades.Add(new Grade { StudentId = student.Id, SubjectId = subject.Id, TeacherId = teacher, Value = Math.Clamp(baseScoreLastMonth + rnd.Next(-5, 5), 0, 100), Date = lastMonth.AddDays(rnd.Next(0, 15)) });
                context.Grades.Add(new Grade { StudentId = student.Id, SubjectId = subject.Id, TeacherId = teacher, Value = Math.Clamp(baseScoreLastMonth + rnd.Next(-5, 5), 0, 100), Date = lastMonth.AddDays(rnd.Next(15, 30)) });
                
                context.Grades.Add(new Grade { StudentId = student.Id, SubjectId = subject.Id, TeacherId = teacher, Value = Math.Clamp(baseScoreThisMonth + rnd.Next(-5, 5), 0, 100), Date = now.AddDays(-rnd.Next(1, 15)) });
            }
        }
        await context.SaveChangesAsync();
    }
}
