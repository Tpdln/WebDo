import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, Paper, TextField, Button, Typography, Box, CssBaseline, Avatar, 
  InputAdornment, IconButton 
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material'; // <-- Göz ikonları

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // 1. Şifre görünürlüğünü kontrol eden State
  const [showPassword, setShowPassword] = useState(false);

  // 2. Tıklayınca tersine çeviren fonksiyon (Açıksa kapat, kapalıysa aç)
  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Backend isteği (localhost yerine 127.0.0.1 kullandık ki hızlı olsun)
      const response = await axios.post('http://127.0.0.1:3001/login', {
        email: email,
        password: password
      });

      if (response.data.Status === "Success") {
        console.log("Login Success", response.data.user);
        
        // Verileri kaydet
        localStorage.setItem('ogrenciId', response.data.user.id);
        localStorage.setItem('ogrenciAd', response.data.user.full_name);
        localStorage.setItem('ogrenciBolum', response.data.user.department);
        localStorage.setItem('rol', response.data.user.role);

        // Yönlendirme (Admin mi Öğrenci mi?)
        if (response.data.user.role === 'admin') {
            navigate('/admin');
        } else if (response.data.user.role === 'advisor') { // <--- YENİ
            navigate('/advisor');
        } else {
            navigate('/dashboard');
        }
      } else {
        alert(response.data.Message);
      }
    } catch (error) {
      console.error("Hata:", error);
      alert("Sunucuya bağlanılamadı! (Backend açık mı?)");
    }
  };

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundImage: 'url(https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop)',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'absolute',
        top: 0,
        left: 0
      }}
    >
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Paper elevation={10} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 3, backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
          <Avatar sx={{ m: 1, bgcolor: '#1976d2', width: 60, height: 60 }}>
             <Typography variant="h4">🎓</Typography> 
          </Avatar>
          <Typography component="h1" variant="h5" sx={{ mt: 1, fontWeight: 'bold' }}>
            LOGIN
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            
            {/* ŞİFRE ALANI (Göz ikonu eklendi) */}
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              // 3. showPassword true ise 'text' (görünür), false ise 'password' (yıldızlı) yap
              type={showPassword ? 'text' : 'password'} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="şifreyi göster"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {/* Duruma göre ikon değişir */}
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5, fontWeight: 'bold' }}
            >
              LOGIN
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}