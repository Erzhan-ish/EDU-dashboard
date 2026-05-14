# Academic Performance Dashboard

Учебный веб-проект на C# (.NET 10) для анализа успеваемости студентов, рейтингов и расписания.

## Технологический стек
- **C#** / **.NET 10**
- **ASP.NET Core Blazor Web App** (Interactive Server)
- **Entity Framework Core** (SQLite)
- **ASP.NET Core Identity**
- **Radzen Blazor Components** (для графиков и таблиц)
- **Bootstrap 5**

## Особенности
- **Чистая архитектура**: Разделение на модели, сервисы, DTO и компоненты.
- **Аналитика**: Расчет среднего балла, выявление сильных/слабых предметов, динамика прогресса.
- **Рейтинги**: Рейтинг студентов в группе и общий рейтинг групп.
- **Расписание**: Отображение расписания на день и на неделю.

## Архитектура проекта

```mermaid
graph TD
    User([Пользователь]) -->|Браузер| Presentation[Презентационный уровень (Blazor Server)]
    
    subgraph "Страницы Blazor"
        Home[Главная / Редирект]
        StudentDash[Дашборд Студента]
        TeacherDash[Дашборд Преподавателя]
        AdminDash[Дашборд Админа]
    end
    
    Presentation -->|"SignalR (Интерактивность)"| "Страницы Blazor"
    
    subgraph "Сервисы"
        AnalyticsSvc[AnalyticsService]
        GradeSvc[GradeService]
        ScheduleSvc[ScheduleService]
    end
    
    "Страницы Blazor" --> Сервисы
    
    subgraph "Доступ к данным"
        DBContext[ApplicationDbContext]
        Identity[ASP.NET Core Identity]
    end
    
    Сервисы --> DBContext
    "Страницы Blazor" --> Identity
    
    subgraph "База данных"
        SQLite[(SQLite DB)]
    end
    
    DBContext --> SQLite
    Identity --> SQLite
```

## Тестовые пользователи

| Роль | Email | Пароль |
| --- | --- | --- |
| **Администратор** | `admin@example.com` | `Admin123!` |
| **Преподаватель** | `teacher@example.com` | `Teacher123!` |
| **Студент** | `student@example.com` | `Student123!` |

*Также созданы дополнительные преподаватели (teacher1-4) и студенты (student1-15) с паролями `Teacher123!` и `Student123!` соответственно.*

## Запуск проекта

1. Убедитесь, что у вас установлен .NET 10 SDK.
2. Склонируйте репозиторий (или перейдите в папку с проектом).
3. Выполните восстановление зависимостей:
   ```bash
   dotnet restore
   ```
4. Примените миграции для создания базы данных (база данных SQLite создастся автоматически при первом запуске, но можно сделать и вручную):
   ```bash
   dotnet ef database update
   ```
   *Примечание: В проекте настроен авто-вызов `Migrate()` при старте, поэтому база данных развернется сама.*
5. Запустите проект:
   ```bash
   dotnet run
   ```

Проект будет доступен по адресу, указанному в консоли (обычно `http://localhost:5000` или аналогичный).

## Структура проекта
- `Models/` — Сущности базы данных (Student, Teacher, Group, Grade и т.д.)
- `Data/` — Контекст БД (`ApplicationDbContext`) и `SeedData` для генерации тестовых данных.
- `Services/` — Бизнес-логика (аналитика, рейтинги, расписание).
- `DTOs/` — Объекты передачи данных для дашбордов.
- `Components/Pages/` — Страницы интерфейса, разделенные по ролям (Student, Teacher, Admin).
