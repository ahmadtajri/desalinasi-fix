# Dokumentasi Proyek IoT Desalinasi

## 📋 Daftar Isi
1. [Overview & Arsitektur](#1-overview--arsitektur)
2. [Panduan Backend](#2-panduan-backend)
3. [Panduan Integrasi Database](#3-panduan-integrasi-database)
4. [Panduan Integrasi Frontend](#4-panduan-integrasi-frontend)
5. [Panduan Postman & API Testing](#5-panduan-postman--api-testing)
6. [Analisis Database & Troubleshooting](#6-analisis-database--troubleshooting)
7. [Changelog](#7-changelog)

---

## 1. Overview & Arsitektur

**IoT Desalinasi Monitoring System v15** adalah aplikasi untuk memantau proses desalinasi secara real-time dari 6 compartment.

**Fitur Utama:**
*   Monitoring Real-time (Suhu Udara, Kelembapan, Suhu Air)
*   Data Logger Terpusat (MySQL Database)
*   User-controlled Data Management (Hapus per Interval/Compartment)
*   Background Logging System (Data terekam meski browser tutup)
*   Visualisasi Grafik & Tabel Report

---

## 2. Panduan Backend

Backend dibangun menggunakan **Node.js** dan **Express**. Mendukung dua mode:
1.  **Mock Data Mode**: Aktif otomatis jika database tidak terhubung. Menggunakan data simulasi di RAM.
2.  **Database Mode**: Menyimpan data permanen di MySQL.

**Struktur Penting:**
*   `backend/src/server.js`: Entry point, setup database connection.
*   `backend/src/controllers/SensorController.js`: Logika utama API (CRUD + Mock fallback).
*   `backend/src/controllers/LoggerController.js`: Mengontrol background logging process.

**Endpoint Utama:**
*   `GET /api/sensors`: Ambil data.
*   `POST /api/sensors`: Simpan data (dari ESP32).
*   `DELETE /api/sensors`: Hapus data.
*   `POST /api/logger/start`: Mulai logging background.

*Selengkapnya lihat `docs/backend/BACKEND_DOCUMENTATION.md`*

---

## 3. Panduan Integrasi Database

**Hardware:** ESP32 + DHT22 (Udara) + DS18B20 (Air).
**Database:** MySQL (via XAMPP).

**Langkah Setup Singkat:**
1.  Install XAMPP & Jalankan MySQL.
2.  Buat Database `iot_desalinasi`.
3.  Konfigurasi `.env` di backend.
4.  Hubungkan ESP32 ke WiFi dan arahkan ke IP servver.

**Analisis Penyimpanan:**
Database menggunakan metode *Append Only*. Data **tidak diapus otomatis** oleh backend, melainkan tersimpan permanen hingga user menghapusnya secara manual lewat fitur "Delete" di frontend atau API.

*Selengkapnya lihat `docs/ESP32_MYSQL_INTEGRATION_TUTORIAL.md` dan `docs/DATABASE_SETUP_TUTORIAL.md`*

---

## 4. Panduan Integrasi Frontend

Frontend dibangun dengan **React + Vite**.

**Fitur:**
*   **Dashboard**: Menampilkan gauge dan grafik real-time (data disimpan di RAM browser untuk performa).
*   **Report**: Menampilkan data historis dari database MySQL.
*   **Logger Control**: Tombol untuk memulai/menghentikan background logger.

**Integrasi API:**
Menggunakan `Axios` di `frontend/src/services/api.js`. Base URL diatur lewat `.env` (`VITE_API_URL`).

---

## 5. Panduan Postman & API Testing

Testing API bisa dilakukan tanpa frontend menggunakan Postman.

**Penting:**
*   Collection File: `docs/postman/ESP32_IoT_API.postman_collection.json`
*   Gunakan environment local untuk testing (`localhost:3000`).

*Selengkapnya lihat `docs/postman/POSTMAN_GUIDE.md`*

---

## 6. Analisis Database & Troubleshooting

**Masalah Umum:**
*   **Data tidak tersimpan:** Cek koneksi backend ke MySQL. Pastikan `USE_MOCK_DATA = false`.
*   **ESP32 gagal kirim:** Cek koneksi WiFi dan IP Address server (harus satu network).
*   **Export CSV Kosong:** Fitur export sudah diperbaiki untuk memvalidasi data sebelum download (lihat Changelog).

**Troubleshooting:**
Jika data tidak muncul di Report tetapi muncul di Dashboard, pastikan Background Logger sudah dinyalakan (`POST /api/logger/start`).

*Selengkapnya lihat `docs/DATABASE_TROUBLESHOOTING.md` dan `docs/DATABASE_BEHAVIOR_ANALYSIS.md`*

---

## 7. Changelog

**[2025-12-06] Perbaikan Export CSV**
*   Menambah validasi data kosong saat export.
*   Memberikan notifikasi jelas jika interval filter tidak memiliki data.
*   Code refactoring di `Report.jsx` dan `sensorService.js`.

**[2025-12-05] Background Logger**
*   Implementasi logger berjalan di sisi server (backend), bukan browser.
*   Data tetap terekam meski tab browser ditutup.

---
*Dokumentasi ini digabung dari berbagai file panduan sebelumnya untuk mempermudah navigasi.*
