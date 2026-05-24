import React, { useState, useEffect } from 'react';
import { 
  getTeacherProfileByUserId,
  getTeacherDashboardData,
  getTeacherGroups,
  getTeacherSubjectsForGroup,
  getStudentsInGroup,
  getGradesForStudentAndSubject,
  createGrade,
  deleteGrade,
  subscribeToDb,
  ExtendedGrade
} from '../db/localDb';
import { ApplicationUser, Group, Subject, Student } from '../db/schema';
import { 
  BookOpen, PlusCircle, Calendar, User, LogOut, 
  Users, TrendingUp, ShieldAlert, Check, Trash2, HelpCircle,
  MapPin
} from 'lucide-react';

interface TeacherPortalProps {
  user: ApplicationUser;
  onLogout: () => void;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dash' | 'grades' | 'schedule' | 'profile'>('dash');

  // Teacher Profile info
  const [teacherInfo, setTeacherInfo] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Form selections for Grade management
  const [groups, setGroups] = useState<Group[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentGrades, setStudentGrades] = useState<ExtendedGrade[]>([]);

  const [selectedGroupId, setSelectedGroupId] = useState<number | ''>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | ''>('');
  const [selectedStudentId, setSelectedStudentId] = useState<number | ''>('');

  // New Grade values
  const [newGradeValue, setNewGradeValue] = useState<number>(80);
  const [newGradeComment, setNewGradeComment] = useState<string>('');

  const loadProfileAndStats = () => {
    const teacher = getTeacherProfileByUserId(user.id);
    if (!teacher) return;
    setTeacherInfo(teacher);

    const stats = getTeacherDashboardData(teacher.id);
    setDashboardData(stats);

    const teacherGrps = getTeacherGroups(teacher.id);
    setGroups(teacherGrps);
  };

  // Re-read DB changes reactively
  useEffect(() => {
    loadProfileAndStats();
    const unsubscribe = subscribeToDb(() => {
      loadProfileAndStats();
    });
    return () => unsubscribe();
  }, [user.id]);

  // Load subjects when group changes
  useEffect(() => {
    if (teacherInfo && selectedGroupId !== '') {
      const subs = getTeacherSubjectsForGroup(teacherInfo.id, Number(selectedGroupId));
      setSubjects(subs);
      setSelectedSubjectId('');
      setSelectedStudentId('');
      setStudents([]);
      setStudentGrades([]);
    }
  }, [selectedGroupId, teacherInfo]);

  // Load students when subject changes
  useEffect(() => {
    if (selectedGroupId !== '' && selectedSubjectId !== '') {
      const stds = getStudentsInGroup(Number(selectedGroupId));
      setStudents(stds);
      setSelectedStudentId('');
      setStudentGrades([]);
    }
  }, [selectedSubjectId, selectedGroupId]);

  // Load student grades when student changes
  useEffect(() => {
    if (selectedStudentId !== '' && selectedSubjectId !== '') {
      const grds = getGradesForStudentAndSubject(Number(selectedStudentId), Number(selectedSubjectId));
      setStudentGrades(grds);
    } else {
      setStudentGrades([]);
    }
  }, [selectedStudentId, selectedSubjectId]);

  const handleAddGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentId === '' || selectedSubjectId === '' || !teacherInfo) return;

    createGrade({
      studentId: Number(selectedStudentId),
      subjectId: Number(selectedSubjectId),
      teacherId: teacherInfo.id,
      value: newGradeValue,
      comment: newGradeComment.trim() !== '' ? newGradeComment.trim() : undefined
    });

    // Reset grade values
    setNewGradeComment('');
    
    // Refresh student grades (retriggering useEffect or calling loadStudentGrades)
    const grds = getGradesForStudentAndSubject(Number(selectedStudentId), Number(selectedSubjectId));
    setStudentGrades(grds);
  };

  const handleDeleteGradeClick = (gradeId: number) => {
    if (window.confirm('Вы действительно хотите удалить эту оценку?')) {
      deleteGrade(gradeId);
      // Refresh
      if (selectedStudentId !== '' && selectedSubjectId !== '') {
        const grds = getGradesForStudentAndSubject(Number(selectedStudentId), Number(selectedSubjectId));
        setStudentGrades(grds);
      }
    }
  };

  if (!teacherInfo || !dashboardData) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Загрузка портала преподавателя...</p>
      </div>
    );
  }

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
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>ПОРТАЛ ПРЕПОДАВАТЕЛЯ</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem' }}>{teacherInfo.fullName}</h2>
        </div>
        <div className="role-badge teacher">Преподаватель</div>
      </div>

      {/* Main Content Scroll container */}
      <div className="scroll-y" style={{ flex: 1 }}>
        
        {/* ======================================================== */}
        {/* TAB: DASHBOARD */}
        {/* ======================================================== */}
        {activeTab === 'dash' && (
          <div className="animate-slide-up">
            
            {/* Scrollable Group Stats row */}
            <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
              Мои Учебные Группы
            </h3>
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '10px' }}>
              {dashboardData.groupStats.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Нет привязанных групп</p>
              ) : (
                dashboardData.groupStats.map((stat: any) => (
                  <div 
                    key={stat.groupId} 
                    className="glass-card" 
                    style={{ 
                      flex: '0 0 160px', 
                      marginBottom: 0, 
                      padding: '14px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      background: 'radial-gradient(circle at bottom right, rgba(144, 107, 249, 0.1), rgba(28, 33, 53, 0.7))'
                    }}
                  >
                    <span style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{stat.groupName}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Users size={12} /> {stat.studentCount} студентов
                    </span>
                    <span style={{ 
                      fontSize: '1.75rem', 
                      fontWeight: 800, 
                      color: stat.averageScore >= 60 ? 'var(--success)' : 'var(--danger)',
                      marginTop: '10px',
                      fontFamily: 'var(--font-display)'
                    }}>
                      {stat.averageScore}
                    </span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Ср. БАЛЛ ГРУППЫ
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Low Performers Alert center */}
            <div className="glass-card" style={{ borderLeft: '4px solid var(--danger)' }}>
              <h3 className="glass-card-title" style={{ color: 'var(--danger)', fontSize: '0.95rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldAlert size={18} />
                  <span>Проблемные Студенты (Ср. балл &lt; 60)</span>
                </div>
              </h3>
              {dashboardData.weakStudents.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Отлично! Проблемных студентов нет 🎉</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                  {dashboardData.weakStudents.slice(0, 4).map((weak: any) => (
                    <div 
                      key={weak.studentId} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        background: 'rgba(255, 82, 82, 0.03)',
                        border: '1px solid rgba(255, 82, 82, 0.08)',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        fontSize: '0.82rem'
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600, color: '#fff' }}>{weak.studentName}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block' }}>
                          Группа: {weak.groupName}
                        </span>
                      </div>
                      <span className="grade-badge low" style={{ fontSize: '0.8rem' }}>{weak.averageScore}</span>
                    </div>
                  ))}
                  {dashboardData.weakStudents.length > 4 && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right', display: 'block' }}>
                      и еще {dashboardData.weakStudents.length - 4} студентов...
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Today Schedule List */}
            <div className="glass-card">
              <h3 className="glass-card-title">Ваше Расписание (Ближайшие пары)</h3>
              {dashboardData.teacherSchedule.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '10px 0' }}>Расписание пусто</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {dashboardData.teacherSchedule.slice(0, 3).map((item: any) => (
                    <div key={item.id} className="schedule-item-card" style={{ borderLeftColor: 'var(--secondary)' }}>
                      <div className="schedule-time-col" style={{ minWidth: '70px' }}>
                        <span>{item.startTime}</span>
                        <span style={{ opacity: 0.6 }}>{item.endTime}</span>
                      </div>
                      <div className="schedule-info-col">
                        <div className="schedule-subject" style={{ fontSize: '0.85rem' }}>{item.subjectName}</div>
                        <div className="schedule-details" style={{ fontSize: '0.75rem' }}>
                          <span>Группа: <strong>{item.groupName}</strong></span>
                          <span>Каб. {item.classroom}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent grades given activity */}
            <div className="glass-card">
              <h3 className="glass-card-title">Последние выставленные оценки</h3>
              {dashboardData.recentGrades.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>История выставок пуста</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {dashboardData.recentGrades.slice(0, 5).map((g: any) => (
                    <div key={g.id} className="subject-item-row" style={{ padding: '10px 0' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{g.studentName}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          {g.subjectName} • {new Date(g.date).toLocaleDateString('ru-RU')}
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
        {/* TAB: MANAGE GRADES */}
        {/* ======================================================== */}
        {activeTab === 'grades' && (
          <div className="animate-slide-up">
            
            {/* Pickers Card */}
            <div className="glass-card">
              <h3 className="glass-card-title" style={{ color: 'var(--primary)', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp size={18} />
                  <span>Выбор студента</span>
                </div>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="input-label">Группа</label>
                  <select 
                    className="input-glass"
                    value={selectedGroupId}
                    onChange={e => setSelectedGroupId(e.target.value !== '' ? Number(e.target.value) : '')}
                  >
                    <option value="">Выберите группу</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="input-label">Предмет</label>
                  <select 
                    className="input-glass"
                    value={selectedSubjectId}
                    onChange={e => setSelectedSubjectId(e.target.value !== '' ? Number(e.target.value) : '')}
                    disabled={selectedGroupId === ''}
                  >
                    <option value="">Выберите предмет</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="input-label">Студент</label>
                  <select 
                    className="input-glass"
                    value={selectedStudentId}
                    onChange={e => setSelectedStudentId(e.target.value !== '' ? Number(e.target.value) : '')}
                    disabled={selectedSubjectId === ''}
                  >
                    <option value="">Выберите студента</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.fullName}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Input New Grade Form */}
            {selectedStudentId !== '' && selectedSubjectId !== '' && (
              <div className="glass-card animate-slide-up" style={{ background: 'radial-gradient(circle at top right, rgba(0, 230, 118, 0.05), rgba(28, 33, 53, 0.8))' }}>
                <h3 className="glass-card-title" style={{ color: 'var(--success)' }}>
                  <span>Выставить Оценку</span>
                </h3>

                <form onSubmit={handleAddGradeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Slider with number input */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label className="input-label" style={{ marginBottom: 0 }}>Балл (0-100)</label>
                      <span style={{ 
                        fontFamily: 'var(--font-display)', 
                        fontSize: '1.4rem', 
                        fontWeight: 800, 
                        color: newGradeValue >= 60 ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {newGradeValue}
                      </span>
                    </div>
                    
                    <input 
                      type="range" 
                      min="0" 
                      max="100"
                      value={newGradeValue}
                      onChange={e => setNewGradeValue(Number(e.target.value))}
                      style={{
                        width: '100%',
                        accentColor: newGradeValue >= 60 ? 'var(--success)' : 'var(--danger)',
                        background: 'rgba(255,255,255,0.08)',
                        height: '6px',
                        borderRadius: '3px',
                        outline: 'none'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      <span>0 (Неуд)</span>
                      <span>60 (Зачет)</span>
                      <span>100 (Отл)</span>
                    </div>
                  </div>

                  <div>
                    <label className="input-label">Комментарий (например: Лабораторная работа №3)</label>
                    <input 
                      type="text"
                      className="input-glass"
                      placeholder="Опциональный комментарий"
                      value={newGradeComment}
                      onChange={e => setNewGradeComment(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn-success" style={{ height: '44px', width: '100%', gap: '8px' }}>
                    <Check size={18} />
                    <span>Подтвердить и Выставить</span>
                  </button>
                </form>
              </div>
            )}

            {/* Student's Grade history */}
            {selectedStudentId !== '' && selectedSubjectId !== '' && (
              <div className="glass-card animate-slide-up">
                <h3 className="glass-card-title">История оценок по предмету</h3>
                {studentGrades.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '10px 0' }}>Оценок пока не выставлено</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {studentGrades.map(g => (
                      <div 
                        key={g.id}
                        style={{
                          background: 'rgba(255, 255, 255, 0.01)',
                          border: '1px solid var(--card-border)',
                          borderRadius: '12px',
                          padding: '10px 12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className={`grade-badge ${g.value >= 60 ? 'high' : 'low'}`} style={{ fontSize: '0.9rem', padding: '2px 8px' }}>
                              {g.value}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {new Date(g.date).toLocaleDateString('ru-RU')}
                            </span>
                          </div>
                          {g.comment && (
                            <div style={{ fontSize: '0.78rem', color: '#d1d5db', marginTop: '6px', fontStyle: 'italic' }}>
                              « {g.comment} »
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteGradeClick(g.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '8px',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-bg)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Fallback help message */}
            {selectedStudentId === '' && (
              <div className="glass-card" style={{ textAlign: 'center', padding: '40px 18px' }}>
                <HelpCircle size={38} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Выберите группу, предмет и конкретного студента для управления его успеваемостью.
                </p>
              </div>
            )}

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: SCHEDULE */}
        {/* ======================================================== */}
        {activeTab === 'schedule' && (
          <div className="animate-slide-up">
            <div className="glass-card">
              <h3 className="glass-card-title">Ваше расписание пар</h3>
              {dashboardData.teacherSchedule.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Calendar size={36} color="var(--text-muted)" style={{ margin: '0 auto 10px auto' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>В расписании нет пар</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {dashboardData.teacherSchedule.map((item: any) => {
                    const dayNames = ['', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
                    return (
                      <div key={item.id} className="schedule-item-card" style={{ borderLeftColor: 'var(--secondary)' }}>
                        <div className="schedule-time-col" style={{ minWidth: '75px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase', marginBottom: '3px' }}>
                            {dayNames[item.dayOfWeek]}
                          </span>
                          <span>{item.startTime}</span>
                          <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>до {item.endTime}</span>
                        </div>
                        <div className="schedule-info-col">
                          <div className="schedule-subject">{item.subjectName}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Группа: <strong>{item.groupName}</strong>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--secondary)', marginTop: '4px', fontWeight: 600 }}>
                            <MapPin size={12} />
                            <span>Кабинет {item.classroom}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: PROFILE */}
        {/* ======================================================== */}
        {activeTab === 'profile' && (
          <div className="animate-slide-up">
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 18px', textAlign: 'center' }}>
              <div style={{
                width: '74px',
                height: '74px',
                borderRadius: '50%',
                background: 'var(--secondary-gradient)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: '14px',
                boxShadow: '0 8px 20px rgba(144, 107, 249, 0.4)'
              }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
                  {teacherInfo.fullName.split(' ').map((n: string) => n[0]).join('')}
                </span>
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem' }}>
                {teacherInfo.fullName}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                Преподаватель вуза
              </p>

              <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '20px', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email-адрес</span>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>{user.email}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Должность</span>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>Старший преподаватель кафедры ИТ</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Групп на ведении</span>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>{groups.length} группы</div>
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
          <PlusCircle size={20} />
          <span>Оценки</span>
        </div>
        <div className={`nav-item ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>
          <Calendar size={20} />
          <span>Расписание</span>
        </div>
        <div className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <User size={20} />
          <span>Профиль</span>
        </div>
      </div>

    </div>
  );
};
