import React, { useState, useEffect } from 'react';
import { 
  getGroupRanking,
  getStudentGroupRanking,
  getAllBindings,
  getAllUsers,
  getAllGroups,
  getAllSubjects,
  getAllTeachers,
  getAllScheduleItems,
  createUser,
  updateUser,
  deleteUser,
  createGroup,
  updateGroup,
  deleteGroup,
  createSubject,
  updateSubject,
  deleteSubject,
  createBinding,
  deleteBinding,
  createScheduleItem,
  deleteScheduleItem,
  subscribeToDb
} from '../db/localDb';
import { ApplicationUser, Group, Subject, Teacher } from '../db/schema';
import { 
  Users, Layers, BookOpen, Calendar, Shield, LogOut, 
  Trash2, Plus, Edit2, Check, X, Search, ChevronDown, 
  Award, ArrowUpRight 
} from 'lucide-react';

interface AdminPortalProps {
  user: ApplicationUser;
  onLogout: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'groups' | 'subjects' | 'schedule'>('analytics');

  // Reactivity State
  const [groupRankings, setGroupRankings] = useState<any[]>([]);
  const [selectedGroupIdForDetails, setSelectedGroupIdForDetails] = useState<number | null>(null);
  const [groupStudents, setGroupStudents] = useState<any[]>([]);
  const [groupBindings, setGroupBindings] = useState<any[]>([]);

  const [usersList, setUsersList] = useState<any[]>([]);
  const [groupsList, setGroupsList] = useState<Group[]>([]);
  const [subjectsList, setSubjectsList] = useState<Subject[]>([]);
  const [teachersList, setTeachersList] = useState<Teacher[]>([]);
  const [scheduleItems, setScheduleItems] = useState<any[]>([]);
  const [bindingsList, setBindingsList] = useState<any[]>([]);

  // Search/Filters
  const [userSearchText, setUserSearchText] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'All' | 'Student' | 'Teacher'>('All');

  // Interactive Add Drawer modals states
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAddBinding, setShowAddBinding] = useState(false);
  const [showAddSchedule, setShowAddSchedule] = useState(false);

  // Forms State
  const [userFormEmail, setUserFormEmail] = useState('');
  const [userFormPass, setUserFormPass] = useState('');
  const [userFormName, setUserFormName] = useState('');
  const [userFormRole, setUserFormRole] = useState<'Student' | 'Teacher'>('Student');
  const [userFormGroupId, setUserFormGroupId] = useState<number>(1);
  const [userFormError, setUserFormError] = useState('');

  const [groupFormName, setGroupFormName] = useState('');
  const [groupFormCourse, setGroupFormCourse] = useState<number>(1);

  const [subjectFormName, setSubjectFormName] = useState('');

  const [bindFormTeacherId, setBindFormTeacherId] = useState<number | ''>('');
  const [bindFormSubjectId, setBindFormSubjectId] = useState<number | ''>('');
  const [bindFormGroupId, setBindFormGroupId] = useState<number | ''>('');
  const [bindFormError, setBindFormError] = useState('');

  const [schedFormGroupId, setSchedFormGroupId] = useState<number | ''>('');
  const [schedFormSubjectId, setSchedFormSubjectId] = useState<number | ''>('');
  const [schedFormTeacherId, setSchedFormTeacherId] = useState<number | ''>('');
  const [schedFormDay, setSchedFormDay] = useState<number>(1); // Mon
  const [schedFormStart, setSchedFormStart] = useState('08:00');
  const [schedFormEnd, setSchedFormEnd] = useState('09:30');
  const [schedFormRoom, setSchedFormRoom] = useState('');

  // Inline edit state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserFullName, setEditingUserFullName] = useState('');
  const [editingUserGroupId, setEditingUserGroupId] = useState<number>(1);

  const [selectedSubjectIdForRanking, setSelectedSubjectIdForRanking] = useState<number | ''>('');

  const loadAllAdminData = () => {
    const subs = getAllSubjects();
    setSubjectsList(subs);

    let initialSubId: number | '' = '';
    if (subs.length > 0) {
      initialSubId = subs[0].id;
      setSelectedSubjectIdForRanking(prev => prev === '' ? subs[0].id : prev);
    }

    const rankSubjectId = selectedSubjectIdForRanking !== '' ? Number(selectedSubjectIdForRanking) : (initialSubId !== '' ? initialSubId : undefined);
    setGroupRankings(getGroupRanking(rankSubjectId));
    setUsersList(getAllUsers());
    
    const grps = getAllGroups();
    setGroupsList(grps);
    
    setTeachersList(getAllTeachers());
    setScheduleItems(getAllScheduleItems());
    
    const binds = getAllBindings();
    setBindingsList(binds);

    if (selectedGroupIdForDetails !== null) {
      setGroupStudents(getStudentGroupRanking(selectedGroupIdForDetails, rankSubjectId));
      setGroupBindings(binds.filter(b => b.groupId === selectedGroupIdForDetails));
    }
  };

  // Setup reactivity
  useEffect(() => {
    loadAllAdminData();
    const unsubscribe = subscribeToDb(() => {
      loadAllAdminData();
    });
    return () => unsubscribe();
  }, [selectedGroupIdForDetails, selectedSubjectIdForRanking]);

  const handleGroupClick = (gId: number) => {
    if (selectedGroupIdForDetails === gId) {
      setSelectedGroupIdForDetails(null);
      setGroupStudents([]);
      setGroupBindings([]);
    } else {
      setSelectedGroupIdForDetails(gId);
    }
  };

  // Add User handler
  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError('');
    if (!userFormEmail || !userFormPass || !userFormName) {
      setUserFormError('Заполните обязательные поля!');
      return;
    }
    const res = createUser(userFormEmail, userFormPass, userFormName, userFormRole, userFormGroupId);
    if (typeof res === 'string') {
      setUserFormError(res);
    } else {
      // Success
      setShowAddUser(false);
      setUserFormEmail('');
      setUserFormPass('');
      setUserFormName('');
      setUserFormGroupId(1);
    }
  };

  // Add Group handler
  const handleAddGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupFormName) return;
    createGroup(groupFormName, groupFormCourse);
    setShowAddGroup(false);
    setGroupFormName('');
    setGroupFormCourse(1);
  };

  // Add Subject handler
  const handleAddSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectFormName) return;
    createSubject(subjectFormName);
    setShowAddSubject(false);
    setSubjectFormName('');
  };

  // Add Binding handler
  const handleAddBindingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBindFormError('');
    if (!bindFormTeacherId || !bindFormSubjectId || !bindFormGroupId) {
      setBindFormError('Заполните все связки!');
      return;
    }
    const res = createBinding(Number(bindFormTeacherId), Number(bindFormSubjectId), Number(bindFormGroupId));
    if (typeof res === 'string') {
      setBindFormError(res);
    } else {
      setShowAddBinding(false);
      setBindFormTeacherId('');
      setBindFormSubjectId('');
      setBindFormGroupId('');
    }
  };

  // Add Schedule handler
  const handleAddScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedFormGroupId || !schedFormSubjectId || !schedFormTeacherId || !schedFormRoom) return;

    createScheduleItem({
      groupId: Number(schedFormGroupId),
      subjectId: Number(schedFormSubjectId),
      teacherId: Number(schedFormTeacherId),
      dayOfWeek: Number(schedFormDay),
      startTime: schedFormStart,
      endTime: schedFormEnd,
      classroom: schedFormRoom.trim()
    });

    setShowAddSchedule(false);
    setSchedFormGroupId('');
    setSchedFormSubjectId('');
    setSchedFormTeacherId('');
    setSchedFormRoom('');
  };

  // Inline User Edit
  const startEditUser = (u: any) => {
    setEditingUserId(u.id);
    setEditingUserFullName(u.fullName);
    setEditingUserGroupId(u.groupId || 1);
  };

  const saveEditUser = () => {
    if (editingUserId) {
      updateUser(editingUserId, editingUserFullName, editingUserGroupId);
      setEditingUserId(null);
    }
  };

  // Delete handlers
  const handleDeleteUser = (id: string) => {
    if (window.confirm('Удалить пользователя? Все его оценки/привязки будут стерты!')) {
      deleteUser(id);
    }
  };

  const handleDeleteGroup = (id: number) => {
    if (window.confirm('Удалить эту группу? Все связанные студенты, привязки и расписание будут также удалены!')) {
      deleteGroup(id);
    }
  };

  const handleDeleteSubject = (id: number) => {
    if (window.confirm('Удалить этот предмет? Все привязки, оценки и расписание по нему сотрутся!')) {
      deleteSubject(id);
    }
  };

  const handleDeleteBindingClick = (id: number) => {
    if (window.confirm('Удалить эту привязку преподавателя?')) {
      deleteBinding(id);
    }
  };

  const handleDeleteScheduleItemClick = (id: number) => {
    if (window.confirm('Удалить эту пару из расписания?')) {
      deleteScheduleItem(id);
    }
  };

  // Filtered users list
  const filteredUsers = usersList.filter(u => {
    const matchesSearch = u.fullName.toLowerCase().includes(userSearchText.toLowerCase()) || 
                          u.email.toLowerCase().includes(userSearchText.toLowerCase());
    const matchesRole = userRoleFilter === 'All' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

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
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>ПАНЕЛЬ АДМИНИСТРАТОРА</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem' }}>Управление Бэкендом</h2>
        </div>
        <div className="role-badge admin">Администратор</div>
      </div>

      {/* Main Content Area */}
      <div className="scroll-y" style={{ flex: 1 }}>

        {/* ======================================================== */}
        {/* TAB: ANALYTICS & GROUP DETAIL */}
        {/* ======================================================== */}
        {activeTab === 'analytics' && (
          <div className="animate-slide-up">
            
            {/* Subject Selector Card */}
            <div className="glass-card" style={{ padding: '14px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Search size={16} color="var(--primary)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Выберите предмет рейтинга</span>
              </div>
              <select 
                className="input-glass"
                value={selectedSubjectIdForRanking}
                onChange={e => setSelectedSubjectIdForRanking(e.target.value !== '' ? Number(e.target.value) : '')}
              >
                {subjectsList.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>

            {/* Standings Group Leaderboard */}
            <div className="glass-card">
              <h3 className="glass-card-title">
                Успеваемость групп по предмету: <strong style={{ color: 'var(--primary)' }}>
                  {subjectsList.find(s => s.id === Number(selectedSubjectIdForRanking))?.name || 'Загрузка...'}
                </strong>
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '-8px', marginBottom: '14px' }}>
                Нажмите на группу, чтобы развернуть список студентов и привязки за выбранный предмет
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {groupRankings.map(g => {
                  const isExpanded = selectedGroupIdForDetails === g.groupId;
                  return (
                    <div key={g.groupId} style={{ display: 'flex', flexDirection: 'column' }}>
                      <div 
                        onClick={() => handleGroupClick(g.groupId)}
                        style={{
                          padding: '12px 14px',
                          background: isExpanded ? 'rgba(255, 183, 77, 0.06)' : 'rgba(255, 255, 255, 0.01)',
                          border: isExpanded ? '1px solid rgba(255, 183, 77, 0.2)' : '1px solid var(--card-border)',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ 
                            width: '26px', 
                            height: '26px', 
                            borderRadius: '50%', 
                            background: isExpanded ? 'var(--warning)' : 'rgba(255, 255, 255, 0.05)', 
                            color: isExpanded ? '#080a10' : 'var(--text-secondary)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            fontWeight: 700,
                            fontSize: '0.8rem'
                          }}>
                            {g.position}
                          </span>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{g.groupName}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
                              Курс {g.course} • {g.studentCount} студентов
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ 
                            fontFamily: 'var(--font-display)', 
                            fontSize: '1.1rem', 
                            fontWeight: 800, 
                            color: g.averageScore >= 60 ? 'var(--success)' : 'var(--danger)' 
                          }}>
                            {g.averageScore}
                          </span>
                          <ChevronDown size={16} style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                        </div>
                      </div>

                      {/* Expanded Sub list */}
                      {isExpanded && (
                        <div className="animate-slide-up" style={{ 
                          marginLeft: '12px', 
                          borderLeft: '2px solid rgba(255, 183, 77, 0.2)',
                          paddingLeft: '12px',
                          marginTop: '6px',
                          marginBottom: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}>
                          {/* Student roster */}
                          <div>
                            <h4 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Список Студентов</h4>
                            {groupStudents.map(std => (
                              <div key={std.studentId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                <span style={{ color: '#d1d5db' }}>{std.fullName}</span>
                                <span style={{ fontWeight: 600, color: std.averageScore >= 60 ? 'var(--success)' : 'var(--danger)' }}>{std.averageScore}</span>
                              </div>
                            ))}
                          </div>

                          {/* Group Bindings */}
                          <div>
                            <h4 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Закрепленные Предметы</h4>
                            {groupBindings.map(b => (
                              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{b.subjectName}</span>
                                <span style={{ color: 'var(--text-muted)' }}>{b.teacherName}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: USERS CRUD */}
        {/* ======================================================== */}
        {activeTab === 'users' && (
          <div className="animate-slide-up">
            
            {/* Search/Filters bar */}
            <div className="glass-card" style={{ padding: '14px' }}>
              <div style={{ position: 'relative', marginBottom: '10px' }}>
                <span style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }}>
                  <Search size={16} />
                </span>
                <input 
                  type="text" 
                  className="input-glass"
                  style={{ paddingLeft: '38px', height: '40px' }}
                  placeholder="Поиск по ФИО или Email..."
                  value={userSearchText}
                  onChange={e => setUserSearchText(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {(['All', 'Student', 'Teacher'] as const).map(role => (
                  <button
                    key={role}
                    type="button"
                    className={`btn-glass`}
                    style={{ 
                      flex: 1, 
                      fontSize: '0.75rem', 
                      padding: '8px',
                      background: userRoleFilter === role ? 'rgba(77, 169, 255, 0.1)' : 'transparent',
                      borderColor: userRoleFilter === role ? 'var(--primary)' : 'rgba(255,255,255,0.05)'
                    }}
                    onClick={() => setUserRoleFilter(role)}
                  >
                    {role === 'All' ? 'Все' : role === 'Student' ? 'Студенты' : 'Учителя'}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Roster List */}
            <div className="glass-card">
              <div className="glass-card-title">
                <span>Список Пользователей ({filteredUsers.length})</span>
                <button type="button" className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem', height: '30px' }} onClick={() => setShowAddUser(true)}>
                  <Plus size={14} />
                  <span>Создать</span>
                </button>
              </div>

              {/* Add User Drawer Overlay inside the card */}
              {showAddUser && (
                <form onSubmit={handleAddUserSubmit} className="animate-slide-up" style={{ 
                  background: 'rgba(15, 18, 29, 0.95)', 
                  border: '1px solid var(--primary-glow)',
                  borderRadius: '12px',
                  padding: '14px',
                  marginBottom: '14px'
                }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Новый пользователь</span>
                    <X size={16} style={{ cursor: 'pointer' }} onClick={() => setShowAddUser(false)} />
                  </h4>
                  {userFormError && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginBottom: '8px' }}>{userFormError}</p>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    <input type="text" className="input-glass" placeholder="ФИО Полное" value={userFormName} onChange={e => setUserFormName(e.target.value)} required />
                    <input type="email" className="input-glass" placeholder="Email" value={userFormEmail} onChange={e => setUserFormEmail(e.target.value)} required />
                    <input type="password" className="input-glass" placeholder="Пароль" value={userFormPass} onChange={e => setUserFormPass(e.target.value)} required />
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select className="input-glass" style={{ flex: 1 }} value={userFormRole} onChange={e => setUserFormRole(e.target.value as any)}>
                        <option value="Student">Студент</option>
                        <option value="Teacher">Преподаватель</option>
                      </select>
                      {userFormRole === 'Student' && (
                        <select className="input-glass" style={{ flex: 1 }} value={userFormGroupId} onChange={e => setUserFormGroupId(Number(e.target.value))}>
                          {groupsList.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                  <button type="submit" className="btn-primary" style={{ width: '100%', height: '36px' }}>Создать аккаунт</button>
                </form>
              )}

              {/* Roster entries */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredUsers.map(u => {
                  const isEditing = editingUserId === u.id;
                  return (
                    <div 
                      key={u.id}
                      style={{
                        padding: '10px 12px',
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      {isEditing ? (
                        /* Edit mode inputs */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <input 
                            type="text" 
                            className="input-glass"
                            value={editingUserFullName}
                            onChange={e => setEditingUserFullName(e.target.value)}
                          />
                          {u.role === 'Student' && (
                            <select 
                              className="input-glass"
                              value={editingUserGroupId}
                              onChange={e => setEditingUserGroupId(Number(e.target.value))}
                            >
                              {groupsList.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                              ))}
                            </select>
                          )}
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn-glass" onClick={() => setEditingUserId(null)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Отмена</button>
                            <button type="button" className="btn-primary" onClick={saveEditUser} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Сохранить</button>
                          </div>
                        </div>
                      ) : (
                        /* Read only details with control buttons */
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{u.fullName}</span>
                              <span className={`role-badge ${u.role.toLowerCase()}`} style={{ fontSize: '0.55rem', padding: '1px 4px' }}>
                                {u.role === 'Student' ? 'Студ' : u.role === 'Teacher' ? 'Преп' : 'Админ'}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{u.email}</span>
                            {u.role === 'Student' && (
                              <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--primary)', marginTop: '2px', fontWeight: 600 }}>
                                Группа: {u.groupName || 'ИС-21'}
                              </span>
                            )}
                          </div>
                          
                          {/* CRUD Buttons */}
                          {u.role !== 'Admin' && (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button 
                                type="button" 
                                className="btn-glass" 
                                style={{ padding: '6px', borderRadius: '8px' }} 
                                onClick={() => startEditUser(u)}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button 
                                type="button" 
                                className="btn-glass" 
                                style={{ padding: '6px', borderRadius: '8px', color: 'var(--danger)' }} 
                                onClick={() => handleDeleteUser(u.id)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: GROUPS CRUD */}
        {/* ======================================================== */}
        {activeTab === 'groups' && (
          <div className="animate-slide-up">
            <div className="glass-card">
              <div className="glass-card-title">
                <span>Управление Группами</span>
                <button type="button" className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem', height: '30px' }} onClick={() => setShowAddGroup(true)}>
                  <Plus size={14} />
                  <span>Создать</span>
                </button>
              </div>

              {/* Add Group inline Form */}
              {showAddGroup && (
                <form onSubmit={handleAddGroupSubmit} className="animate-slide-up" style={{ 
                  background: 'rgba(15, 18, 29, 0.95)', 
                  border: '1px solid var(--primary-glow)',
                  borderRadius: '12px',
                  padding: '14px',
                  marginBottom: '14px'
                }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Новая академическая группа</span>
                    <X size={16} style={{ cursor: 'pointer' }} onClick={() => setShowAddGroup(false)} />
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    <input type="text" className="input-glass" placeholder="Название (например: ИВТ-21)" value={groupFormName} onChange={e => setGroupFormName(e.target.value)} required />
                    <input type="number" min="1" max="6" className="input-glass" placeholder="Курс (1-6)" value={groupFormCourse} onChange={e => setGroupFormCourse(Number(e.target.value))} required />
                  </div>
                  <button type="submit" className="btn-primary" style={{ width: '100%', height: '36px' }}>Добавить</button>
                </form>
              )}

              {/* List Groups */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {groupsList.map(g => (
                  <div key={g.id} className="subject-item-row" style={{ padding: '10px 0' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{g.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>({g.course} курс)</span>
                    </div>
                    <button 
                      type="button" 
                      className="btn-glass" 
                      style={{ padding: '6px', borderRadius: '8px', color: 'var(--danger)' }}
                      onClick={() => handleDeleteGroup(g.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: SUBJECTS & BINDINGS */}
        {/* ======================================================== */}
        {activeTab === 'subjects' && (
          <div className="animate-slide-up">
            
            {/* Subjects list */}
            <div className="glass-card">
              <div className="glass-card-title">
                <span>Список Предметов</span>
                <button type="button" className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem', height: '30px' }} onClick={() => setShowAddSubject(true)}>
                  <Plus size={14} />
                  <span>Создать</span>
                </button>
              </div>

              {showAddSubject && (
                <form onSubmit={handleAddSubjectSubmit} className="animate-slide-up" style={{ 
                  background: 'rgba(15, 18, 29, 0.95)', 
                  border: '1px solid var(--primary-glow)',
                  borderRadius: '12px',
                  padding: '14px',
                  marginBottom: '14px'
                }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Новая дисциплина</span>
                    <X size={16} style={{ cursor: 'pointer' }} onClick={() => setShowAddSubject(false)} />
                  </h4>
                  <div style={{ marginBottom: '12px' }}>
                    <input type="text" className="input-glass" placeholder="Название (например: Алгебра)" value={subjectFormName} onChange={e => setSubjectFormName(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn-primary" style={{ width: '100%', height: '36px' }}>Добавить предмет</button>
                </form>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {subjectsList.map(s => (
                  <div key={s.id} className="subject-item-row" style={{ padding: '8px 0' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.name}</span>
                    <button 
                      type="button" 
                      className="btn-glass" 
                      style={{ padding: '6px', borderRadius: '8px', color: 'var(--danger)' }}
                      onClick={() => handleDeleteSubject(s.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Bindings Panel */}
            <div className="glass-card">
              <div className="glass-card-title">
                <span>Закрепление Учителей</span>
                <button type="button" className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem', height: '30px' }} onClick={() => setShowAddBinding(true)}>
                  <Plus size={14} />
                  <span>Добавить</span>
                </button>
              </div>

              {showAddBinding && (
                <form onSubmit={handleAddBindingSubmit} className="animate-slide-up" style={{ 
                  background: 'rgba(15, 18, 29, 0.95)', 
                  border: '1px solid var(--primary-glow)',
                  borderRadius: '12px',
                  padding: '14px',
                  marginBottom: '14px'
                }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Связать преподавателя</span>
                    <X size={16} style={{ cursor: 'pointer' }} onClick={() => setShowAddBinding(false)} />
                  </h4>
                  {bindFormError && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginBottom: '8px' }}>{bindFormError}</p>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    <select className="input-glass" value={bindFormTeacherId} onChange={e => setBindFormTeacherId(e.target.value !== '' ? Number(e.target.value) : '')}>
                      <option value="">Выберите Преподавателя</option>
                      {teachersList.map(t => (
                        <option key={t.id} value={t.id}>{t.fullName}</option>
                      ))}
                    </select>

                    <select className="input-glass" value={bindFormSubjectId} onChange={e => setBindFormSubjectId(e.target.value !== '' ? Number(e.target.value) : '')}>
                      <option value="">Выберите Предмет</option>
                      {subjectsList.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>

                    <select className="input-glass" value={bindFormGroupId} onChange={e => setBindFormGroupId(e.target.value !== '' ? Number(e.target.value) : '')}>
                      <option value="">Выберите Академ. Группу</option>
                      {groupsList.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="btn-primary" style={{ width: '100%', height: '36px' }}>Создать связку</button>
                </form>
              )}

              {/* Bindings list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {bindingsList.map(b => (
                  <div key={b.id} style={{ 
                    padding: '8px 10px', 
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--primary)' }}>{b.subjectName} • {b.groupName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{b.teacherName}</div>
                    </div>
                    <button 
                      type="button" 
                      className="btn-glass" 
                      style={{ padding: '6px', borderRadius: '8px', color: 'var(--danger)' }}
                      onClick={() => handleDeleteBindingClick(b.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: SCHEDULE CRUD */}
        {/* ======================================================== */}
        {activeTab === 'schedule' && (
          <div className="animate-slide-up">
            <div className="glass-card">
              <div className="glass-card-title">
                <span>Управление Расписанием</span>
                <button type="button" className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem', height: '30px' }} onClick={() => setShowAddSchedule(true)}>
                  <Plus size={14} />
                  <span>Добавить</span>
                </button>
              </div>

              {showAddSchedule && (
                <form onSubmit={handleAddScheduleSubmit} className="animate-slide-up" style={{ 
                  background: 'rgba(15, 18, 29, 0.95)', 
                  border: '1px solid var(--primary-glow)',
                  borderRadius: '12px',
                  padding: '14px',
                  marginBottom: '14px'
                }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Добавить пару</span>
                    <X size={16} style={{ cursor: 'pointer' }} onClick={() => setShowAddSchedule(false)} />
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    
                    <select className="input-glass" value={schedFormGroupId} onChange={e => setSchedFormGroupId(e.target.value !== '' ? Number(e.target.value) : '')} required>
                      <option value="">Академ. Группа</option>
                      {groupsList.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>

                    <select className="input-glass" value={schedFormSubjectId} onChange={e => setSchedFormSubjectId(e.target.value !== '' ? Number(e.target.value) : '')} required>
                      <option value="">Выберите Предмет</option>
                      {subjectsList.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>

                    <select className="input-glass" value={schedFormTeacherId} onChange={e => setSchedFormTeacherId(e.target.value !== '' ? Number(e.target.value) : '')} required>
                      <option value="">Выберите Преподавателя</option>
                      {teachersList.map(t => (
                        <option key={t.id} value={t.id}>{t.fullName}</option>
                      ))}
                    </select>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select className="input-glass" style={{ flex: 1 }} value={schedFormDay} onChange={e => setSchedFormDay(Number(e.target.value))}>
                        <option value="1">Понедельник</option>
                        <option value="2">Вторник</option>
                        <option value="3">Среда</option>
                        <option value="4">Четверг</option>
                        <option value="5">Пятница</option>
                        <option value="6">Суббота</option>
                      </select>
                      <input type="text" className="input-glass" style={{ flex: 1 }} placeholder="Аудитория (каб)" value={schedFormRoom} onChange={e => setSchedFormRoom(e.target.value)} required />
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Начало</span>
                        <input type="text" className="input-glass" placeholder="08:00" value={schedFormStart} onChange={e => setSchedFormStart(e.target.value)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Конец</span>
                        <input type="text" className="input-glass" placeholder="09:30" value={schedFormEnd} onChange={e => setSchedFormEnd(e.target.value)} />
                      </div>
                    </div>

                  </div>
                  <button type="submit" className="btn-primary" style={{ width: '100%', height: '36px' }}>Занести в сетку</button>
                </form>
              )}

              {/* Render Schedule items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {scheduleItems.map(item => {
                  const dayNames = ['', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
                  return (
                    <div key={item.id} style={{ 
                      padding: '10px 12px', 
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                          <span style={{ color: 'var(--secondary)', marginRight: '6px' }}>[{dayNames[item.dayOfWeek]}]</span>
                          {item.subjectName} • Гр: {item.groupName}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Преп: {item.teacherName} • Время: {item.startTime}-{item.endTime} • Каб: {item.classroom}
                        </div>
                      </div>
                      <button 
                        type="button" 
                        className="btn-glass" 
                        style={{ padding: '6px', borderRadius: '8px', color: 'var(--danger)' }}
                        onClick={() => handleDeleteScheduleItemClick(item.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        )}

        {/* Global Redundant settings view containing Logout */}
        <div className="glass-card" style={{ textAlign: 'center', padding: '16px' }}>
          <button type="button" className="btn-danger" style={{ width: '100%', gap: '6px' }} onClick={onLogout}>
            <LogOut size={16} />
            <span>Выйти из панели администратора</span>
          </button>
        </div>

      </div>

      {/* Springy Bottom Tab Bar */}
      <div className="bottom-nav">
        <div className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
          <Award size={20} />
          <span>Сводка</span>
        </div>
        <div className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <Users size={20} />
          <span>Юзеры</span>
        </div>
        <div className={`nav-item ${activeTab === 'groups' ? 'active' : ''}`} onClick={() => setActiveTab('groups')}>
          <Layers size={20} />
          <span>Группы</span>
        </div>
        <div className={`nav-item ${activeTab === 'subjects' ? 'active' : ''}`} onClick={() => setActiveTab('subjects')}>
          <BookOpen size={20} />
          <span>Предметы</span>
        </div>
        <div className={`nav-item ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>
          <Calendar size={20} />
          <span>Пары</span>
        </div>
      </div>

    </div>
  );
};
