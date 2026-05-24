import React, { useState, useEffect } from 'react';
import { 
  getStudentDashboardData, 
  getStudentSubjectAveragesTimeline, 
  getStudentGroupRanking, 
  getWeeklySchedule, 
  getTodaySchedule, 
  getGradesByStudent, 
  getStudentProfileByUserId,
  subscribeToDb,
  ExtendedScheduleItem,
  StudentRankingDto,
  getAllSubjects
} from '../db/localDb';
import { ApplicationUser, Grade, Subject } from '../db/schema';
import { 
  TrendingUp, Award, Calendar, BookOpen, User, 
  LogOut, ArrowUpRight, ArrowDownRight, Clock, MapPin, 
  ChevronRight, Filter, BookOpenCheck 
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface StudentPortalProps {
  user: ApplicationUser;
  onLogout: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dash' | 'grades' | 'schedule' | 'ranking' | 'profile'>('dash');
  
  // Data State
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<ExtendedScheduleItem[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<ExtendedScheduleItem[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [ranking, setRanking] = useState<StudentRankingDto[]>([]);
  
  const [allSubjectsList, setAllSubjectsList] = useState<Subject[]>([]);
  const [selectedRankingSubjectId, setSelectedRankingSubjectId] = useState<number | ''>('');
  
  // Grade filters
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  
  // Schedule filters
  const [selectedDayTab, setSelectedDayTab] = useState<number>(new Date().getDay() || 1); // 1 = Mon ...

  const loadData = () => {
    const student = getStudentProfileByUserId(user.id);
    if (!student) return;
    setStudentInfo(student);

    const dash = getStudentDashboardData(student.id);
    setDashboardData(dash);

    const timelineDict = getStudentSubjectAveragesTimeline(student.id);
    const formattedTimeline = Object.entries(timelineDict).map(([month, val]) => ({
      name: month,
      value: val
    }));
    setTimelineData(formattedTimeline);

    const recent = getGradesByStudent(student.id);
    setGrades(recent);

    const todaySched = getTodaySchedule(student.groupId);
    setTodaySchedule(todaySched);

    const weekSched = getWeeklySchedule(student.groupId);
    setWeeklySchedule(weekSched);

    const subs = getAllSubjects();
    setAllSubjectsList(subs);
    
    let initialSubId: number | '' = '';
    if (subs.length > 0) {
      initialSubId = subs[0].id;
      setSelectedRankingSubjectId(prev => prev === '' ? subs[0].id : prev);
    }

    const rank = getStudentGroupRanking(student.groupId, selectedRankingSubjectId !== '' ? Number(selectedRankingSubjectId) : (initialSubId !== '' ? initialSubId : undefined));
    setRanking(rank);
  };

  // Re-load data when DB changes (reactivity!)
  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDb(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [user.id]);

  useEffect(() => {
    if (studentInfo && selectedRankingSubjectId !== '') {
      const rank = getStudentGroupRanking(studentInfo.groupId, Number(selectedRankingSubjectId));
      setRanking(rank);
    }
  }, [selectedRankingSubjectId, studentInfo]);

  if (!studentInfo || !dashboardData) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Загрузка портала студента...</p>
      </div>
    );
  }

  // Get list of unique subjects student has grades for (for filtering)
  const uniqueSubjects = Array.from(new Set(grades.map(g => g.subjectName)));

  // Filter grades
  const filteredGrades = selectedSubjectFilter === 'all'
    ? grades
    : grades.filter(g => g.subjectName === selectedSubjectFilter);

  // Day Name Translation Helper
  const getDayNameRu = (dayNum: number): string => {
    const names = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return names[dayNum];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', position: 'relative' }}>
      
      {/* Screen Title Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 4px 14px 4px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        marginBottom: '14px'
      }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>ПОРТАЛ СТУДЕНТА</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem' }}>{studentInfo.fullName}</h2>
        </div>
        <div className="role-badge student">Студент</div>
      </div>

      {/* Main Content Area */}
      <div className="scroll-y" style={{ flex: 1 }}>
        
        {/* ======================================================== */}
        {/* TAB: DASHBOARD */}
        {/* ======================================================== */}
        {activeTab === 'dash' && (
          <div className="animate-slide-up">
            
            {/* Top Score Circular Gauge / Stats Card */}
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'radial-gradient(circle at bottom right, rgba(77, 169, 255, 0.15), rgba(28, 33, 53, 0.7))' }}>
              {/* Circular Gauge */}
              <div style={{ position: 'relative', width: '90px', height: '90px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <svg width="90" height="90" viewBox="0 0 36 36">
                  {/* Background Circle */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="3.5"
                  />
                  {/* Foreground Circle */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="url(#blueGrad)"
                    strokeWidth="3.5"
                    strokeDasharray={`${dashboardData.averageScore}, 100`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                  <defs>
                    <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00f2fe" />
                      <stop offset="100%" stopColor="#4da9ff" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                    {dashboardData.averageScore}
                  </span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Ср. балл
                  </span>
                </div>
              </div>

              {/* Quick info right side */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Место в группе:</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{dashboardData.positionInGroup} из {dashboardData.totalStudentsInGroup}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Предметы:</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{dashboardData.subjectCount}</span>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '6px', paddingTop: '6px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Лучший:</span>
                      <span style={{ color: 'var(--success)', fontWeight: 600 }}>{dashboardData.bestSubject}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '2px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Слабый:</span>
                      <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{dashboardData.weakestSubject}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recharts Timeline Graph Card */}
            <div className="glass-card">
              <h3 className="glass-card-title">Динамика среднего балла</h3>
              <div style={{ width: '100%', height: '140px', marginTop: '10px' }}>
                {timelineData.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', paddingTop: '40px' }}>Нет данных для графика</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timelineData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={10} domain={[40, 100]} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ background: '#1c2135', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff' }}
                        labelStyle={{ fontSize: '0.75rem', fontWeight: 600 }}
                        itemStyle={{ fontSize: '0.8rem', color: 'var(--primary)' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        name="Ср. балл" 
                        stroke="#00f2fe" 
                        strokeWidth={3} 
                        dot={{ fill: '#4da9ff', strokeWidth: 1 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Growth and Decline cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div className="glass-card" style={{ marginBottom: 0, padding: '14px' }}>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                  <TrendingUp size={16} />
                  <span>🚀 РОСТ</span>
                </h4>
                {dashboardData.progress.filter((p: any) => p.difference > 0).length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Нет роста</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {dashboardData.progress.filter((p: any) => p.difference > 0).slice(0, 2).map((p: any) => (
                      <div key={p.subjectId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75px' }}>{p.subjectName}</span>
                        <span className="grade-badge high" style={{ fontSize: '0.65rem', padding: '1px 4px' }}>+{p.difference}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass-card" style={{ marginBottom: 0, padding: '14px' }}>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                  <TrendingUp size={16} style={{ transform: 'rotate(90deg)' }} />
                  <span>⚠️ СПАД</span>
                </h4>
                {dashboardData.progress.filter((p: any) => p.difference < 0).length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Нет спадов</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {dashboardData.progress.filter((p: any) => p.difference < 0).slice(0, 2).map((p: any) => (
                      <div key={p.subjectId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75px' }}>{p.subjectName}</span>
                        <span className="grade-badge low" style={{ fontSize: '0.65rem', padding: '1px 4px' }}>{p.difference}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Today Schedule Snippet */}
            <div className="glass-card">
              <h3 className="glass-card-title">
                <span>Занятия сегодня</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {todaySchedule.length} пар(ы)
                </span>
              </h3>
              {todaySchedule.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '14px 0' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Сегодня нет пар. Отдыхаем! 🎉</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {todaySchedule.map(item => (
                    <div key={item.id} className="schedule-item-card" style={{ padding: '10px' }}>
                      <div className="schedule-time-col" style={{ minWidth: '65px' }}>
                        <span>{item.startTime}</span>
                        <span style={{ opacity: 0.6 }}>{item.endTime}</span>
                      </div>
                      <div className="schedule-info-col">
                        <div className="schedule-subject" style={{ fontSize: '0.85rem' }}>{item.subjectName}</div>
                        <div className="schedule-details" style={{ fontSize: '0.75rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <MapPin size={10} /> {item.classroom}
                          </span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>
                            {item.teacherName}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent grades snippet */}
            <div className="glass-card">
              <h3 className="glass-card-title">Последние оценки</h3>
              {grades.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>Оценок пока нет</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {grades.slice(0, 4).map((g: any) => (
                    <div key={g.id} className="subject-item-row" style={{ padding: '10px 0' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{g.subjectName}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {new Date(g.date).toLocaleDateString('ru-RU')} • {g.teacherName}
                        </div>
                      </div>
                      <div className={`grade-badge ${g.value >= 60 ? 'high' : 'low'}`}>
                        {g.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: GRADES */}
        {/* ======================================================== */}
        {activeTab === 'grades' && (
          <div className="animate-slide-up">
            {/* Filters panel */}
            <div className="glass-card" style={{ padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Filter size={16} color="var(--primary)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Фильтр по предметам</span>
              </div>
              <select 
                className="input-glass"
                style={{ appearance: 'none', backgroundPosition: 'right 16px center' }}
                value={selectedSubjectFilter}
                onChange={e => setSelectedSubjectFilter(e.target.value)}
              >
                <option value="all">Все предметы ({grades.length} оценок)</option>
                {uniqueSubjects.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            {/* Grades scroll list */}
            <div>
              {filteredGrades.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '30px' }}>
                  <BookOpenCheck size={36} color="var(--text-muted)" style={{ margin: '0 auto 10px auto' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Нет оценок по выбранному фильтру</p>
                </div>
              ) : (
                filteredGrades.map((g: any) => (
                  <div key={g.id} className="glass-card" style={{ borderLeft: `4px solid ${g.value >= 60 ? 'var(--success)' : 'var(--danger)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{g.subjectName}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {g.teacherName}
                        </span>
                      </div>
                      <div className={`grade-badge ${g.value >= 60 ? 'high' : 'low'}`} style={{ fontSize: '1rem', padding: '6px 12px' }}>
                        {g.value}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      Дата выставления: {new Date(g.date).toLocaleDateString('ru-RU')} {new Date(g.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {g.comment && (
                      <div style={{ 
                        background: 'rgba(255, 255, 255, 0.02)', 
                        border: '1px solid rgba(255, 255, 255, 0.04)', 
                        borderRadius: '8px', 
                        padding: '8px 10px', 
                        fontSize: '0.78rem',
                        color: '#d1d5db',
                        fontStyle: 'italic'
                      }}>
                        « {g.comment} »
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: WEEKLY SCHEDULE */}
        {/* ======================================================== */}
        {activeTab === 'schedule' && (
          <div className="animate-slide-up">
            
            {/* Horizontal Day Selector tabs */}
            <div className="calendar-days-row">
              {[1, 2, 3, 4, 5, 6].map(dayNum => {
                const isActive = selectedDayTab === dayNum;
                return (
                  <div 
                    key={dayNum} 
                    className={`calendar-day-tab ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedDayTab(dayNum)}
                  >
                    <span className="day-name">{getDayNameRu(dayNum)}</span>
                    <span className="day-num">{dayNum + 15 /* simulate generic dates */}</span>
                  </div>
                );
              })}
            </div>

            {/* List classes for selected day */}
            <div className="glass-card">
              <h3 className="glass-card-title" style={{ marginBottom: '14px' }}>
                <span>Расписание на {selectedDayTab === 1 ? 'Понедельник' : selectedDayTab === 2 ? 'Вторник' : selectedDayTab === 3 ? 'Среду' : selectedDayTab === 4 ? 'Четверг' : selectedDayTab === 5 ? 'Пятницу' : 'Субботу'}</span>
              </h3>
              
              {weeklySchedule.filter(s => s.dayOfWeek === selectedDayTab).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Calendar size={36} color="var(--text-muted)" style={{ margin: '0 auto 10px auto' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Нет занятий на этот день. Отдыхаем! 🥳</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {weeklySchedule.filter(s => s.dayOfWeek === selectedDayTab).map(item => (
                    <div key={item.id} className="schedule-item-card">
                      <div className="schedule-time-col">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={12} /> {item.startTime}
                        </span>
                        <span style={{ opacity: 0.5, fontSize: '0.75rem', marginTop: '2px' }}>до {item.endTime}</span>
                      </div>
                      <div className="schedule-info-col">
                        <div className="schedule-subject">{item.subjectName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Преподаватель: {item.teacherName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--primary)', marginTop: '4px', fontWeight: 600 }}>
                          <MapPin size={12} />
                          <span>Кабинет {item.classroom}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: GROUP RANKING */}
        {/* ======================================================== */}
        {activeTab === 'ranking' && (
          <div className="animate-slide-up">
            
            {/* Subject Selector Card */}
            <div className="glass-card" style={{ padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Filter size={16} color="var(--primary)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Выберите предмет рейтинга</span>
              </div>
              <select 
                className="input-glass"
                value={selectedRankingSubjectId}
                onChange={e => setSelectedRankingSubjectId(e.target.value !== '' ? Number(e.target.value) : '')}
              >
                {allSubjectsList.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>

            <div className="glass-card">
              <h3 className="glass-card-title">
                Рейтинг группы по предмету: <strong style={{ color: 'var(--primary)' }}>
                  {allSubjectsList.find(s => s.id === Number(selectedRankingSubjectId))?.name || 'Загрузка...'}
                </strong>
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '-8px', marginBottom: '14px' }}>
                Студенты отсортированы по среднему баллу за выбранную дисциплину
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ranking.map(item => {
                  const isCurrent = item.studentId === studentInfo.id;
                  let medal = '';
                  if (item.position === 1) medal = '🥇 ';
                  else if (item.position === 2) medal = '🥈 ';
                  else if (item.position === 3) medal = '🥉 ';

                  return (
                    <div 
                      key={item.studentId}
                      className="subject-item-row"
                      style={{
                        padding: '12px 14px',
                        background: isCurrent ? 'rgba(77, 169, 255, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                        border: isCurrent ? '1px solid var(--primary-glow)' : '1px solid var(--card-border)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ 
                          width: '26px', 
                          height: '26px', 
                          borderRadius: '50%', 
                          background: isCurrent ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)', 
                          color: isCurrent ? '#080a10' : 'var(--text-secondary)',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          fontWeight: 700,
                          fontSize: '0.8rem'
                        }}>
                          {item.position}
                        </span>
                        <div>
                          <span style={{ fontWeight: isCurrent ? 700 : 500, fontSize: '0.88rem' }}>
                            {medal}{item.fullName}
                          </span>
                          {isCurrent && (
                            <span style={{ fontSize: '0.65rem', color: 'var(--primary)', display: 'block', fontWeight: 600 }}>
                              ЭТО ВЫ
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: item.averageScore >= 60 ? 'var(--success)' : 'var(--danger)' }}>
                          {item.averageScore}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          {item.gradeCount} оц.
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: PROFILE & SETTINGS */}
        {/* ======================================================== */}
        {activeTab === 'profile' && (
          <div className="animate-slide-up">
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 18px', textAlign: 'center' }}>
              <div style={{
                width: '74px',
                height: '74px',
                borderRadius: '50%',
                background: 'var(--primary-gradient)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: '14px',
                boxShadow: '0 8px 20px var(--primary-glow)'
              }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#080a10' }}>
                  {studentInfo.fullName.split(' ').map((n: string) => n[0]).join('')}
                </span>
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem' }}>
                {studentInfo.fullName}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                Студент группы • {ranking.length > 0 ? 'ИС-21' /* Fallback or read group name */ : 'ИС-21'}
              </p>

              <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '20px', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email-адрес</span>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>{user.email}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Учебное заведение</span>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>Факультет информационных систем</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Курс обучения</span>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>2 курс</div>
                </div>
              </div>

              <button 
                type="button" 
                className="btn-danger" 
                style={{ width: '100%', marginTop: '28px', gap: '8px' }}
                onClick={onLogout}
              >
                <LogOut size={16} />
                <span>Выйти из аккаунта</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Springy Bottom Tab Bar */}
      <div className="bottom-nav">
        <div className={`nav-item ${activeTab === 'dash' ? 'active' : ''}`} onClick={() => setActiveTab('dash')}>
          <BookOpen size={20} />
          <span>Дашборд</span>
        </div>
        <div className={`nav-item ${activeTab === 'grades' ? 'active' : ''}`} onClick={() => setActiveTab('grades')}>
          <BookOpenCheck size={20} />
          <span>Оценки</span>
        </div>
        <div className={`nav-item ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>
          <Calendar size={20} />
          <span>Расписание</span>
        </div>
        <div className={`nav-item ${activeTab === 'ranking' ? 'active' : ''}`} onClick={() => setActiveTab('ranking')}>
          <Award size={20} />
          <span>Рейтинг</span>
        </div>
        <div className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <User size={20} />
          <span>Профиль</span>
        </div>
      </div>

    </div>
  );
};
