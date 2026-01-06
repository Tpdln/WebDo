import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, CssBaseline, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemButton, 
  ListItemIcon, ListItemText, Paper, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions, Checkbox, Chip, IconButton 
} from '@mui/material';
import { School, Logout, People, CheckCircle } from '@mui/icons-material';

const drawerWidth = 280;

export default function AdvisorDashboard() {
  const navigate = useNavigate();
  const [myStudents, setMyStudents] = useState([]);
  const [advisorName, setAdvisorName] = useState('');
  
  // Modal İşlemleri
  const [open, setOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [allCourses, setAllCourses] = useState([]);
  const [studentSelectionIds, setStudentSelectionIds] = useState([]);

  useEffect(() => {
    const advId = localStorage.getItem('ogrenciId'); // Advisor da aslında bir user ID'sine sahip
    const advName = localStorage.getItem('ogrenciAd');
    setAdvisorName(advName);

    // 1. Advisor'a bağlı öğrencileri çek
    axios.get(`http://127.0.0.1:3001/advisor-students/${advId}`).then(res => setMyStudents(res.data));
    
    // 2. Tüm ders listesini çek (Düzenleme yaparken lazım olacak)
    axios.get('http://127.0.0.1:3001/courses').then(res => setAllCourses(res.data));
  }, []);

  const handleReviewClick = async (student) => {
    setSelectedStudent(student);
    // Öğrencinin seçtiği dersleri getir
    const res = await axios.get(`http://127.0.0.1:3001/my-courses/${student.id}`);
    setStudentSelectionIds(res.data.map(d => d.id)); // Sadece ID'leri tutuyoruz
    setOpen(true);
  };

  const toggleCourse = (courseId) => {
    if (studentSelectionIds.includes(courseId)) {
      setStudentSelectionIds(studentSelectionIds.filter(id => id !== courseId)); // Çıkar
    } else {
      setStudentSelectionIds([...studentSelectionIds, courseId]); // Ekle
    }
  };

  const approveSelection = async () => {
    try {
        // 1. Güncel listeyi kaydet (Hoca ekleme/çıkarma yapmış olabilir)
        await axios.post('http://127.0.0.1:3001/select-courses', { 
            studentId: selectedStudent.id, 
            courseIds: studentSelectionIds 
        });

        // 2. Onay Bayrağını Çek (is_approved = true)
        await axios.put(`http://127.0.0.1:3001/approve-courses/${selectedStudent.id}`);
        
        alert("Course registration approved!");
        setOpen(false);
    } catch (err) { alert("Hata oluştu"); }
  };

  const handleLogout = () => { localStorage.clear(); navigate('/'); };

  return (
    <Box sx={{ display: 'flex', bgcolor: '#f4f6f8', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar position="fixed" elevation={0} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: '#fff', color: '#333', borderBottom: '1px solid #e0e0e0' }}>
        <Toolbar>
          <Box sx={{ p: 1, bgcolor: '#e8f5e9', borderRadius: 2, mr: 2 }}>
             <School sx={{ color: '#2e7d32' }} />
          </Box>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 'bold', color: '#2e7d32' }}>IUS Advisor Panel</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
             <Typography variant="body2">Mr/Mrs  {advisorName}</Typography>
             <Button color="error" onClick={handleLogout} startIcon={<Logout />}>EXIT</Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', bgcolor: '#fff' } }}>
        <Toolbar /> 
        <List sx={{ p: 2 }}>
            <ListItemButton selected sx={{ borderRadius: 3, bgcolor: '#e8f5e9!important', color: '#2e7d32' }}>
              <ListItemIcon sx={{ color: '#2e7d32' }}><People /></ListItemIcon>
              <ListItemText primary="Student Approval List" />
            </ListItemButton>
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 4 }}>
        <Toolbar />
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>Students Pending Approval</Typography>
        
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#fafafa' }}>
              <TableRow><TableCell>ID</TableCell><TableCell>Student Name</TableCell><TableCell>Faculty</TableCell><TableCell align="right">Action</TableCell></TableRow>
            </TableHead>
            <TableBody>
              {myStudents.map((st) => (
                <TableRow key={st.id}>
                  <TableCell>{st.id}</TableCell>
                  <TableCell>{st.full_name}</TableCell>
                  <TableCell>{st.department}</TableCell>
                  <TableCell align="right">
                    <Button variant="contained" color="success" size="small" onClick={() => handleReviewClick(st)}>
                        Review & Approve Courses
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* --- DERS ONAY PENCERESİ --- */}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
             {selectedStudent?.full_name} - Course Selection Approval
          </DialogTitle>
          <DialogContent>
             <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                The courses selected by the student are pre-marked. You can add or remove courses due to credit limits or curriculum requirements.
             </Typography>
             
             <Table size="small">
                <TableHead><TableRow><TableCell>Status</TableCell><TableCell>Course Name</TableCell><TableCell>Credit</TableCell></TableRow></TableHead>
                <TableBody>
                    {allCourses.map(course => (
                        <TableRow key={course.id} hover selected={studentSelectionIds.includes(course.id)}>
                            <TableCell>
                                <Checkbox 
                                    checked={studentSelectionIds.includes(course.id)} 
                                    onChange={() => toggleCourse(course.id)}
                                />
                            </TableCell>
                            <TableCell>{course.name}</TableCell>
                            <TableCell>{course.credit}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
             </Table>
             
             <Box sx={{ mt: 2, textAlign: 'right', fontWeight: 'bold' }}>
                Total Selected Credits: {allCourses.filter(c => studentSelectionIds.includes(c.id)).reduce((a,b)=>a+b.credit, 0)}
             </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>CANCEL</Button>
            <Button onClick={approveSelection} variant="contained" color="success" startIcon={<CheckCircle />}>
                Approve and Complete the List
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}