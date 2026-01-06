import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, CssBaseline, AppBar, Toolbar, Typography, Drawer, List, 
  ListItem, ListItemButton, ListItemIcon, ListItemText, 
  Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, IconButton, Checkbox, Button, Alert, Grid 
} from '@mui/material';
import { 
  School, Logout, Description, 
  EventBusy, DateRange, Home, ChevronRight, LibraryBooks, Article 
} from '@mui/icons-material';

const drawerWidth = 280; 

export default function Dashboard() {
  const navigate = useNavigate();
  const [seciliMenu, setSeciliMenu] = useState('Anasayfa');
  
  // Öğrenci Bilgileri
  const [ogrenci, setOgrenci] = useState({ ad: '', bolum: '' });

  // Veriler
  const [notlar, setNotlar] = useState([]);
  const [devamsizlik, setDevamsizlik] = useState([]);
  const [transkript, setTranskript] = useState([]); // YENİ: Transkript verisi
  const [gpa, setGpa] = useState("0.00"); // YENİ: Ortalama
  
  // --- DERS SEÇİMİ İÇİN STATE'LER ---
  const [tumDersler, setTumDersler] = useState([]);
  const [secilenDersIDleri, setSecilenDersIDleri] = useState([]);
  const [onayDurumu, setOnayDurumu] = useState(false); 

  // Sayfa Yüklendiğinde Çalışır
  useEffect(() => {
    const id = localStorage.getItem('ogrenciId');
    const ad = localStorage.getItem('ogrenciAd');
    const bolum = localStorage.getItem('ogrenciBolum');

    if (!id) {
      navigate('/');
    } else {
      setOgrenci({ ad, bolum });
      verileriGetir(id);
    }
  }, []);

  // --- GPA HESAPLAMA FONKSİYONU (YENİ) ---
  const calculateGPA = (data) => {
    const letterToPoint = {
      'AA': 4.0, 'BA': 3.5, 'BB': 3.0, 'CB': 2.5,
      'CC': 2.0, 'DC': 1.5, 'DD': 1.0, 'FD': 0.5, 'FF': 0.0
    };

    let totalPoints = 0;
    let totalCredits = 0;

    data.forEach(item => {
      const credit = item.credit || 3; // Kredi yoksa varsayılan 3
      const point = letterToPoint[item.letter_grade] || 0;
      
      // Sadece notu girilmiş dersleri hesaba kat
      if(item.letter_grade) {
          totalPoints += point * credit;
          totalCredits += credit;
      }
    });

    const calculated = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";
    setGpa(calculated);
  };

  const verileriGetir = async (id) => {
    try {
      // 1. Notları Çek (Mevcut Dönem)
      const notCevap = await axios.get(`http://127.0.0.1:3001/grades/${id}`);
      setNotlar(notCevap.data);

      // 2. Transkript Çek (Tüm Geçmiş - YENİ)
      // Not: Backend'de /transcript endpoint'inin grades ve courses tablolarını joinlemesi gerekir.
      const transkriptCevap = await axios.get(`http://127.0.0.1:3001/transcript/${id}`);
      setTranskript(transkriptCevap.data);
      calculateGPA(transkriptCevap.data); // GPA Hesapla

      // 3. Devamsızlığı Çek
      const devamsizlikCevap = await axios.get(`http://127.0.0.1:3001/attendance/${id}`);
      setDevamsizlik(devamsizlikCevap.data);

      // 4. Tüm Dersleri Çek (Seçim ekranı için)
      const derslerCevap = await axios.get('http://127.0.0.1:3001/courses');
      setTumDersler(derslerCevap.data);

      // 5. Öğrencinin Zaten Seçtiği Dersleri Çek
      const secimCevap = await axios.get(`http://127.0.0.1:3001/my-courses/${id}`);
      const seciliIDler = secimCevap.data.map(d => d.id);
      setSecilenDersIDleri(seciliIDler);

      if(secimCevap.data.length > 0 && secimCevap.data[0].is_approved) {
        setOnayDurumu(true);
      }

    } catch (error) {
      console.error("Veri çekme hatası:", error);
    }
  };

  // --- DERS SEÇİM MANTIĞI ---
  const handleDersSecim = (id) => {
    if (onayDurumu) return; 

    if (secilenDersIDleri.includes(id)) {
        setSecilenDersIDleri(secilenDersIDleri.filter(item => item !== id));
    } else {
        setSecilenDersIDleri([...secilenDersIDleri, id]);
    }
  };

  const danismanaGonder = async () => {
    const toplamKredi = tumDersler
        .filter(d => secilenDersIDleri.includes(d.id))
        .reduce((toplam, ders) => toplam + ders.credit, 0);
    
    if(toplamKredi > 30) {
        alert(`Hata! Kredi limiti (30) aşıldı. Mevcut seçiminiz: ${toplamKredi}`);
        return;
    }

    try {
        const ogrId = localStorage.getItem('ogrenciId');
        await axios.post('http://127.0.0.1:3001/select-courses', { 
            studentId: ogrId, 
            courseIds: secilenDersIDleri 
        });
        alert("Ders seçiminiz başarıyla kaydedildi ve Danışmanınıza gönderildi!");
    } catch (error) {
        alert("Kaydedilirken hata oluştu.");
    }
  };

  const handleLogout = () => {
    localStorage.clear(); 
    navigate('/');
  };

  // Harf notu renklendirme
  const getGradeStyle = (grade) => {
    if (['AA', 'BA', 'BB'].includes(grade)) return { bg: '#e8f5e9', color: '#2e7d32' }; // Yeşil
    if (['CB', 'CC'].includes(grade)) return { bg: '#e3f2fd', color: '#1565c0' }; // Mavi
    if (['DC', 'DD'].includes(grade)) return { bg: '#fff3e0', color: '#ef6c00' }; // Turuncu
    return { bg: '#ffebee', color: '#c62828' }; // Kırmızı (FF)
  };

  // --- ÖN ŞART KONTROLÜ ---
  const checkPrerequisite = (ders) => {
    if (!ders.prerequisite_id) return { allowed: true, msg: '' };
    const preReqDers = tumDersler.find(d => d.id === ders.prerequisite_id);
    if (!preReqDers) return { allowed: true, msg: '' };
    
    // Transkript içinde geçmiş mi diye bakmak daha doğru (Notlar sadece bu dönemi tutuyorsa)
    const gecmisNot = transkript.find(n => n.lesson_name === preReqDers.name);

    if (!gecmisNot) return { allowed: false, msg: `Önşart: ${preReqDers.name} (Alınmadı)` };
    if (['FF', 'FD', 'NA'].includes(gecmisNot.letter_grade)) {
        return { allowed: false, msg: `Önşart: ${preReqDers.name} (Kaldınız)` };
    }
    return { allowed: true, msg: '' };
  };

  const menuElemanlari = [
    { text: 'Ana Sayfa', icon: <Home />, id: 'Anasayfa' },
    { text: 'Transkript', icon: <Article />, id: 'Transkript' }, // YENİ
    { text: 'Not Listesi', icon: <Description />, id: 'Notlar' },
    { text: 'Devamsızlık', icon: <EventBusy />, id: 'Devamsızlık' },
    { text: 'Ders Seçimi', icon: <LibraryBooks />, id: 'DersSecimi' },
    { text: 'Ders Programı', icon: <DateRange />, id: 'Program' },
  ];

  return (
    <Box sx={{ display: 'flex', bgcolor: '#f4f6f8', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* ÜST BAR */}
      <AppBar position="fixed" elevation={0} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: '#fff', color: '#333', borderBottom: '1px solid #e0e0e0' }}>
        <Toolbar>
          <Box sx={{ p: 1, bgcolor: '#e3f2fd', borderRadius: 2, mr: 2 }}>
             <School sx={{ color: '#1976d2' }} />
          </Box>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'bold', color: '#1565c0' }}>
            IUS Bilgi Sistemi
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
             <Typography variant="body2" sx={{ fontWeight: 500 }}>{ogrenci.ad}</Typography>
             <IconButton onClick={handleLogout} sx={{ color: '#d32f2f', bgcolor: '#ffebee' }}>
                <Logout fontSize="small" />
             </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* SOL MENÜ */}
      <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', bgcolor: '#fff', borderRight: '1px solid #f0f0f0' } }}>
        <Toolbar /> 
        <Box sx={{ overflow: 'auto', p: 2 }}>
          <Typography variant="caption" sx={{ pl: 1, color: '#999', fontWeight: 'bold', letterSpacing: 1 }}>MENÜ</Typography>
          <List sx={{ mt: 1 }}>
            {menuElemanlari.map((item) => (
              <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                <ListItemButton 
                  selected={seciliMenu === item.id}
                  onClick={() => setSeciliMenu(item.id)}
                  sx={{ borderRadius: 3, transition: 'all 0.3s', '&.Mui-selected': { bgcolor: '#e3f2fd', color: '#1976d2', fontWeight: 'bold' } }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: seciliMenu === item.id ? '#1976d2' : '#757575' }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                  {seciliMenu === item.id && <ChevronRight fontSize="small" />}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* İÇERİK ALANI */}
      <Box component="main" sx={{ flexGrow: 1, p: 4 }}>
        <Toolbar />

        {seciliMenu === 'Anasayfa' && (
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, bgcolor: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Typography variant="h5" gutterBottom sx={{ color: '#2c3e50', fontWeight: 'bold' }}>Hoşgeldiniz, {ogrenci.ad} 👋</Typography>
            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} md={4}>
                    <Box sx={{ p: 3, bgcolor: '#e3f2fd', borderRadius: 3 }}>
                        <Typography variant="subtitle2" color="textSecondary">Genel Ortalama (GPA)</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#1565c0' }}>{gpa}</Typography>
                    </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                     <Box sx={{ p: 3, bgcolor: '#ffebee', borderRadius: 3 }}>
                        <Typography variant="subtitle2" color="textSecondary">Devamsızlık</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#c62828' }}>{devamsizlik.length}</Typography>
                    </Box>
                </Grid>
            </Grid>
          </Paper>
        )}

        {/* --- YENİ EKLENEN TRANSKRİPT SEKMESİ --- */}
        {seciliMenu === 'Transkript' && (
             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                
                {/* GPA KARTI */}
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)', color: '#fff' }}>
                    <Box>
                        <Typography variant="h5" fontWeight="bold">Resmi Transkript</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>2025-2026 Eğitim Yılı</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                         <Typography variant="overline" sx={{ opacity: 0.8, letterSpacing: 1 }}>AGNO</Typography>
                         <Typography variant="h3" fontWeight="bold">{gpa}</Typography>
                    </Box>
                </Paper>

                {/* NOT TABLOSU */}
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: '#fafafa' }}>
                                <TableRow>
                                    <TableCell><b>Ders Kodu / Adı</b></TableCell>
                                    <TableCell align="center"><b>Kredi</b></TableCell>
                                    <TableCell align="center"><b>Vize</b></TableCell>
                                    <TableCell align="center"><b>Final</b></TableCell>
                                    <TableCell align="center"><b>Harf Notu</b></TableCell>
                                    <TableCell align="center"><b>Durum</b></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {transkript.map((row, index) => {
                                    const style = getGradeStyle(row.letter_grade);
                                    return (
                                        <TableRow key={index} hover>
                                            <TableCell sx={{ fontWeight: 500 }}>{row.lesson_name}</TableCell>
                                            <TableCell align="center">{row.credit || '-'}</TableCell>
                                            <TableCell align="center">{row.midterm}</TableCell>
                                            <TableCell align="center">{row.final_exam}</TableCell>
                                            <TableCell align="center">
                                                <Chip 
                                                    label={row.letter_grade} 
                                                    sx={{ bgcolor: style.bg, color: style.color, fontWeight: 'bold', minWidth: 40 }} 
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                {row.letter_grade === 'FF' ? 
                                                    <span style={{color: '#d32f2f', fontWeight: 'bold'}}>Kaldı</span> : 
                                                    <span style={{color: '#2e7d32', fontWeight: 'bold'}}>Geçti</span>
                                                }
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {transkript.length === 0 && (
                        <Typography sx={{ textAlign: 'center', p: 4, color: '#999' }}>Henüz not girişi bulunmuyor.</Typography>
                    )}
                </Paper>
             </Box>
        )}

        {seciliMenu === 'Notlar' && (
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
             <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#1565c0' }}>Dönem Notları</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#999', fontWeight: 'bold' }}>DERS</TableCell>
                    <TableCell sx={{ color: '#999', fontWeight: 'bold' }}>VİZE</TableCell>
                    <TableCell sx={{ color: '#999', fontWeight: 'bold' }}>FİNAL</TableCell>
                    <TableCell sx={{ color: '#999', fontWeight: 'bold' }}>HARF</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {notlar.map((row, idx) => (
                      <TableRow key={idx}>
                          <TableCell>{row.lesson_name}</TableCell>
                          <TableCell>{row.midterm}</TableCell>
                          <TableCell>{row.final_exam}</TableCell>
                          <TableCell>
                             <Chip label={row.letter_grade} size="small" sx={getGradeStyle(row.letter_grade)} />
                          </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {seciliMenu === 'Devamsızlık' && (
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#c0392b', fontWeight: 'bold' }}>Devamsızlık Kayıtları</Typography>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#ffebee' }}>
                  <TableRow>
                    <TableCell><b>Tarih</b></TableCell>
                    <TableCell><b>Ders</b></TableCell>
                    <TableCell><b>Durum</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {devamsizlik.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.lesson_name}</TableCell>
                      <TableCell sx={{ color: 'red', fontWeight: 'bold' }}>{row.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* --- DERS SEÇİMİ --- */}
        {seciliMenu === 'DersSecimi' && (
           <Paper elevation={0} sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
             <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#1565c0' }}>Ders Kayıt Ekranı</Typography>
             
             {onayDurumu && (
                 <Alert severity="success" sx={{ mb: 3 }}>
                     Ders seçiminiz Danışmanınız tarafından <b>ONAYLANDI</b>. Artık değişiklik yapamazsınız.
                 </Alert>
             )}

             <TableContainer sx={{ border: '1px solid #eee', borderRadius: 2 }}>
               <Table>
                 <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                     <TableRow>
                         <TableCell>Seç</TableCell>
                         <TableCell>Ders Adı</TableCell>
                         <TableCell>Kredi</TableCell>
                     </TableRow>
                 </TableHead>
                 <TableBody>
                   {tumDersler.map(ders => {
                     const status = checkPrerequisite(ders); 
                     return (
                       <TableRow key={ders.id} hover sx={{ bgcolor: !status.allowed ? '#fce4ec' : 'inherit' }}>
                         <TableCell>
                           <Checkbox 
                             checked={secilenDersIDleri.includes(ders.id)} 
                             onChange={() => handleDersSecim(ders.id)}
                             disabled={onayDurumu || !status.allowed} 
                             color="primary"
                           />
                         </TableCell>
                         <TableCell sx={{ fontWeight: 'bold' }}>
                           {ders.name}
                           {!status.allowed && (
                             <Typography variant="caption" display="block" color="error">
                                ⚠️ {status.msg}
                             </Typography>
                           )}
                         </TableCell>
                         <TableCell>
                             <Chip label={ders.credit + " Kredi"} size="small" variant="outlined" />
                         </TableCell>
                       </TableRow>
                     );
                   })}
                 </TableBody>
               </Table>
             </TableContainer>
             
             <Box sx={{ mt: 3, p: 2, bgcolor: '#e3f2fd', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <Box>
                    <Typography variant="subtitle1">
                        Toplam Seçilen Kredi: 
                        <b style={{ marginLeft: 8, fontSize: '1.2rem', color: '#1565c0' }}>
                            {tumDersler.filter(d => secilenDersIDleri.includes(d.id)).reduce((a, b) => a + b.credit, 0)}
                        </b> 
                        <span style={{ color: '#666' }}> / 30</span>
                    </Typography>
                 </Box>
                 <Button 
                   variant="contained" 
                   size="large"
                   onClick={danismanaGonder} 
                   disabled={onayDurumu}
                   sx={{ fontWeight: 'bold' }}
                 >
                     {onayDurumu ? 'Liste Kilitli' : 'Seçimi Kaydet ve Gönder'}
                 </Button>
             </Box>
           </Paper>
        )}

      </Box>
    </Box>
  );
}