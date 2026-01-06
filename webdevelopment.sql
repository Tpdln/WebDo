-- Eğer eski veritabanı varsa sil (Çakışma olmasın)
DROP DATABASE IF EXISTS school_db;

-- 1. Yeni veritabanını oluştur
CREATE DATABASE school_db;

-- 2. Bu veritabanını seç
USE school_db;

-- 3. Users Tablosu (Öğrenci Bilgileri)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    student_no VARCHAR(20)grades
);

-- 4. Grades Tablosu (Notlar)
CREATE TABLE grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    lesson_name VARCHAR(100),
    midterm INT,
    final_exam INT,
    letter_grade VARCHAR(5),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Attendance Tablosu (Devamsızlık)
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    date VARCHAR(20),
    lesson_name VARCHAR(100),
    status VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. TEST VERİLERİ (Login denemesi için)
-- Öğrenci: Cem Berke (Şifre: 123123)
INSERT INTO users (email, password, full_name, department, student_no) 
VALUES ('admin@gmail.com', '123123', 'Cem Berke Tepedelen', 'Computer Engineering', '2025001');

-- Notlar
INSERT INTO grades (user_id, lesson_name, midterm, final_exam, letter_grade) VALUES 
(1, 'Data Structures', 60, 85, 'BB'),
(1, 'Web Programming', 90, 95, 'AA'),
(1, 'Operating Systems', 45, 60, 'DD');

-- Devamsızlık
INSERT INTO attendance (user_id, date, lesson_name, status) VALUES 
(1, '10.12.2025', 'Calculus II', 'Absent'),
(1, '12.12.2025', 'Data Structures', 'Excused');

USE school_db;

USE school_db; -- <--- İŞTE BU SATIR EKSİKTİ

-- 1. Tabloya 'role' sütunu ekle
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'student';

-- 2. Admin kullanıcısını 'admin' yap
UPDATE users SET role = 'admin' WHERE email = 'admin@gmail.com';

-- 3. Kontrol et
SELECT * FROM users;


USE school_db;

-- 1. Dersler Tablosu
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    credit INT
);

-- 2. Ders Seçim Tablosu (Öğrenci hangi dersi seçti?)
CREATE TABLE course_selections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    course_id INT,
    is_approved BOOLEAN DEFAULT FALSE, -- Advisor onayladı mı?
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- 3. Users tablosuna 'advisor_id' ekle (Öğrencinin danışmanı kim?)
ALTER TABLE users ADD COLUMN advisor_id INT DEFAULT NULL;

USE school_db;

-- 1. ADIM: Eskileri Sil (Sıralama Önemli!)
-- Önce 'course_selections' silinmeli çünkü o 'courses' tablosuna muhtaç.
DROP TABLE IF EXISTS course_selections;
DROP TABLE IF EXISTS courses;

-- 2. ADIM: Courses (Dersler) Tablosunu Yeniden Oluştur
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    credit INT NOT NULL
);

-- 3. ADIM: Course Selections (Seçimler) Tablosunu Yeniden Oluştur
CREATE TABLE course_selections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE, -- Başlangıçta onaysız olsun
    
    -- İlişkileri Kuralım (Foreign Keys)
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- 4. ADIM: Dersleri İçine Doldur
INSERT INTO courses (name, credit) VALUES 
('Introduction to Programming', 6),
('Calculus I', 5),
('Physics I', 4),
('Academic English', 3),
('Digital Logic Design', 6),
('Linear Algebra', 5),
('Chemistry', 4),
('Data Structures', 6),
('Web Development', 5),
('Database Management', 5);


USE school_db;

-- Güvenlik kilidini geçici olarak kaldır (Hata 1175 çözümü)
SET SQL_SAFE_UPDATES = 0;

-- 1. ADIM: Eskileri Temizle (Sıralama Önemli)
DROP TABLE IF EXISTS course_selections;
DROP TABLE IF EXISTS courses;
-- Not: Grades tablosunu da temizleyelim ki test verilerini yeniden girelim
DELETE FROM grades; 

-- 2. ADIM: Courses (Dersler) Tablosunu YENİ HALİYLE Kur
-- (prerequisite_id sütununu en baştan ekliyoruz)
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    credit INT NOT NULL,
    prerequisite_id INT DEFAULT NULL -- Ön şart sütunu
);

-- 3. ADIM: Course Selections (Seçimler) Tablosunu Kur
CREATE TABLE course_selections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- 4. ADIM: Dersleri Ekle (Ön Şartlarıyla Birlikte)
INSERT INTO courses (name, credit, prerequisite_id) VALUES 
('Introduction to Programming', 6, NULL), -- ID: 1
('Calculus I', 5, NULL),                  -- ID: 2
('Physics I', 4, NULL),                   -- ID: 3
('Academic English', 3, NULL),            -- ID: 4
('Data Structures', 6, 1),                -- ID: 5 (Şartı: Intro Prog [ID:1])
('Calculus II', 5, 2),                    -- ID: 6 (Şartı: Calculus I [ID:2])
('Physics II', 4, 3),                     -- ID: 7 (Şartı: Physics I [ID:3])
('Web Development', 5, 1);                -- ID: 8 (Şartı: Intro Prog [ID:1])

-- 5. ADIM: Test Notlarını Gir
-- Buraya kendi User ID'ni yazabilirsin, ben genelde 1 (admin) varsayıyorum.
-- Calculus I'i geçmiş yapalım (Calculus II açılmalı)
-- Physics I'den kalmış yapalım (Physics II kilitlenmeli)
INSERT INTO grades (user_id, lesson_name, midterm, final_exam, letter_grade) VALUES
(1, 'Calculus I', 80, 90, 'AA'),
(1, 'Physics I', 20, 30, 'FF'),
(1, 'Introduction to Programming', 75, 80, 'BB');

-- 6. Güvenlik kilidini geri aç (İyi alışkanlık)
SET SQL_SAFE_UPDATES = 1;

-- Sonuçları Göster
SELECT * FROM courses;













