import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, CssBaseline, AppBar, Toolbar, Typography, Drawer, List, 
  ListItem, ListItemButton, ListItemIcon, ListItemText, 
  Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, IconButton, Button, TextField, Dialog, 
  DialogTitle, DialogContent, DialogActions, Chip, Tabs, Tab, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { 
  School, Logout, People, Edit, Add, Remove, Save, Delete, EventBusy 
} from '@mui/icons-material';

const drawerWidth = 280; 

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [adminName, setAdminName] = useState('Yönetici'); // Admin adı için state

  // Modal ve Veri State'leri
  const [open, setOpen] = useState(false);
  const [tabIndex, setTabIndex] = useState(0); // 0: Notlar, 1: Devamsızlık
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentGrades, setStudentGrades] = useState([]);
  const [studentAttendance, setStudentAttendance] = useState([]);

  // Yeni Devamsızlık Ekleme State'i
  const [newAtt, setNewAtt] = useState({ date: '', lesson: '', status: 'Gelmedi' });

  // Sayfa açılınca çalışır
  useEffect(() => {
    fetchStudents();
    // LocalStorage'dan admin adını çek
    const ad = localStorage.getItem('ogrenciAd');
    if (ad) setAdminName(ad);
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:3001/students');
      setStudents(res.data);
    } catch (err) { console.log(err); }
  };

  // Öğrenciye tıklayınca verileri çek
  const handleEditClick = async (student) => {
    setSelectedStudent(student);
    setTabIndex(0); // Her açılışta notlar sekmesi gelsin
    try {
      // 1. Notları Çek
      const resGrades = await axios.get(`http://127.0.0.1:3001/grades/${student.id}`);
      setStudentGrades(resGrades.data);
      
      // 2. Devamsızlığı Çek (YENİ)
      fetchAttendance(student.id);

      setOpen(true);
    } catch (err) { alert("Veriler alınamadı"); }
  };

  const fetchAttendance = async (id) => {
    try {
      const resAtt = await axios.get(`http://127.0.0.1:3001/attendance/${id}`);
      setStudentAttendance(resAtt.data);
    } catch (error) { console.error(error); }
  }

  // --- NOT İŞLEMLERİ ---
  const handleGradeChange = (index, field, value) => {
    const newGrades = [...studentGrades];
    let val = parseInt(value);
    if (isNaN(val)) val = 0;
    if (val > 100) val = 100;
    if (val < 0) val = 0;
    newGrades[index][field] = val;
    setStudentGrades(newGrades);
  };

  const saveGrades = async () => {
    try {
      for (const grade of studentGrades) {
        await axios.put('http://127.0.0.1:3001/update-grade', {
          gradeId: grade.id, midterm: grade.midterm, final_exam: grade.final_exam
        });
      }
      alert("Notlar güncellendi! ✅");
    } catch (err) { alert("Hata oluştu!"); }
  };

  // --- DEVAMSIZLIK İŞLEMLERİ (YENİ) ---
  
  // Ekle
  const addAttendance = async () => {
    if(!newAtt.date || !newAtt.lesson) return alert("Tarih ve Ders adı giriniz!");
    try {
      await axios.post('http://127.0.0.1:3001/add-attendance', {
        user_id: selectedStudent.id,
        date: newAtt.date,
        lesson_name: newAtt.lesson,
        status: newAtt.status
      });
      // Listeyi yenile ve inputları temizle
      fetchAttendance(selectedStudent.id);
      setNewAtt({ date: '', lesson: '', status: 'Gelmedi' });
    } catch (error) { alert("Eklenemedi"); }
  };

  // Sil
  const deleteAttendance = async (id) => {
    if(!window.confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
    try {
      await axios.delete(`http://127.0.0.1:3001/delete-attendance/${id}`);
      fetchAttendance(selectedStudent.id); // Listeyi yenile
    } catch (error) { alert("Silinemedi"); }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <Box sx={{ display: 'flex', bgcolor: '#f4f6f8', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* ÜST BAR */}
      <AppBar position="fixed" elevation={0} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: '#fff', color: '#333', borderBottom: '1px solid #e0e0e0' }}>
        <Toolbar>
          <Box sx={{ p: 1, bgcolor: '#ffebee', borderRadius: 2, mr: 2 }}>
             <School sx={{ color: '#c62828' }} />
          </Box>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'bold', color: '#c62828' }}>
            YÖNETİCİ PANELİ
          </Typography>
          
          {/* ADMİN ADI GÖSTERİMİ */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
             <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Sn. {adminName}</Typography>
             <Button color="error" onClick={handleLogout} startIcon={<Logout />}>Çıkış</Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* SOL MENÜ */}
      <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', bgcolor: '#fff' } }}>
        <Toolbar /> 
        <Box sx={{ overflow: 'auto', p: 2 }}>
          <List>
            <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemButton selected sx={{ borderRadius: 3, bgcolor: '#ffebee!important', color: '#c62828' }}>
                  <ListItemIcon sx={{ color: '#c62828' }}><People /></ListItemIcon>
                  <ListItemText primary="Öğrenci Yönetimi" />
                </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* İÇERİK */}
      <Box component="main" sx={{ flexGrow: 1, p: 4 }}>
        <Toolbar />
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>Kayıtlı Öğrenciler</Typography>
        
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#fafafa' }}>
              <TableRow>
                <TableCell><b>ID</b></TableCell>
                <TableCell><b>Name Surname</b></TableCell>
                <TableCell><b>Student No</b></TableCell>
                <TableCell><b>Faculty</b></TableCell>
                <TableCell align="right"><b>Actions</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id} hover>
                  <TableCell>{student.id}</TableCell>
                  <TableCell>{student.full_name}</TableCell>
                  <TableCell><Chip label={student.student_no} size="small" /></TableCell>
                  <TableCell>{student.department}</TableCell>
                  <TableCell align="right">
                    <Button variant="contained" size="small" startIcon={<Edit />} onClick={() => handleEditClick(student)} sx={{ bgcolor: '#2c3e50' }}>
                      Düzenle
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* --- DÜZENLEME PENCERESİ --- */}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ borderBottom: '1px solid #eee', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
            {selectedStudent?.full_name}
            <Chip label="Düzenleme Modu" color="error" size="small" variant="outlined"/>
          </DialogTitle>
          
          <DialogContent sx={{ p: 0 }}>
            {/* SEKMELER (TABS) */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabIndex} onChange={(e, val) => setTabIndex(val)} centered textColor="error" indicatorColor="error">
                <Tab label="Not İşlemleri" icon={<Edit />} iconPosition="start" />
                <Tab label="Devamsızlık" icon={<EventBusy />} iconPosition="start" />
              </Tabs>
            </Box>

            {/* SEKME 1: NOTLAR */}
            {tabIndex === 0 && (
              <Box sx={{ p: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Ders Adı</TableCell>
                      <TableCell align="center">Vize</TableCell>
                      <TableCell align="center">Final</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {studentGrades.map((grade, index) => (
                      <TableRow key={grade.id}>
                        <TableCell sx={{ fontWeight: 'bold' }}>{grade.lesson_name}</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <IconButton size="small" onClick={() => handleGradeChange(index, 'midterm', grade.midterm - 5)}><Remove fontSize="small"/></IconButton>
                            <TextField value={grade.midterm} size="small" sx={{ width: 60, textAlign: 'center' }} onChange={(e) => handleGradeChange(index, 'midterm', e.target.value)}/>
                            <IconButton size="small" onClick={() => handleGradeChange(index, 'midterm', grade.midterm + 5)}><Add fontSize="small"/></IconButton>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <IconButton size="small" onClick={() => handleGradeChange(index, 'final_exam', grade.final_exam - 5)}><Remove fontSize="small"/></IconButton>
                            <TextField value={grade.final_exam} size="small" sx={{ width: 60 }} onChange={(e) => handleGradeChange(index, 'final_exam', e.target.value)}/>
                            <IconButton size="small" onClick={() => handleGradeChange(index, 'final_exam', grade.final_exam + 5)}><Add fontSize="small"/></IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Box sx={{ mt: 2, textAlign: 'right' }}>
                  <Button onClick={saveGrades} variant="contained" color="success" startIcon={<Save />}>Notları Kaydet</Button>
                </Box>
              </Box>
            )}

            {/* SEKME 2: DEVAMSIZLIK (YENİ) */}
            {tabIndex === 1 && (
              <Box sx={{ p: 3 }}>
                {/* Ekleme Alanı */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3, p: 2, bgcolor: '#f9f9f9', borderRadius: 2 }}>
                   <TextField label="Tarih (örn: 10.12.2025)" size="small" value={newAtt.date} onChange={(e) => setNewAtt({...newAtt, date: e.target.value})} />
                   <TextField label="Ders Adı" size="small" value={newAtt.lesson} onChange={(e) => setNewAtt({...newAtt, lesson: e.target.value})} />
                   <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Durum</InputLabel>
                      <Select value={newAtt.status} label="Durum" onChange={(e) => setNewAtt({...newAtt, status: e.target.value})}>
                        <MenuItem value="Gelmedi">Gelmedi</MenuItem>
                        <MenuItem value="İzinli">İzinli</MenuItem>
                        <MenuItem value="Raporlu">Raporlu</MenuItem>
                      </Select>
                   </FormControl>
                   <Button variant="contained" onClick={addAttendance} startIcon={<Add />}>Ekle</Button>
                </Box>

                {/* Liste */}
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tarih</TableCell>
                      <TableCell>Ders</TableCell>
                      <TableCell>Durum</TableCell>
                      <TableCell align="right">Sil</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {studentAttendance.length === 0 ? (
                       <TableRow><TableCell colSpan={4} align="center">Kayıt bulunamadı.</TableCell></TableRow>
                    ) : (
                      studentAttendance.map((att) => (
                        <TableRow key={att.id}>
                          <TableCell>{att.date}</TableCell>
                          <TableCell>{att.lesson_name}</TableCell>
                          <TableCell><Chip label={att.status} size="small" color={att.status === 'Gelmedi' ? 'error' : 'warning'} variant="outlined" /></TableCell>
                          <TableCell align="right">
                            <IconButton color="error" size="small" onClick={() => deleteAttendance(att.id)}>
                              <Delete fontSize="small"/>
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Box>
            )}

          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
            <Button onClick={() => setOpen(false)} color="inherit">Kapat</Button>
          </DialogActions>
        </Dialog>

      </Box>
    </Box>
  );
}