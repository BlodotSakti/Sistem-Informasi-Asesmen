import pandas as pd
import requests
import json
import time

# ==========================================
# KONFIGURASI
# ==========================================
# Ganti dengan nama file Excel Anda
FILE_EXCEL_INPUT = "data_ujian_lama.xlsx"
FILE_EXCEL_OUTPUT = "hasil_evaluasi_ai.xlsx"

# Sesuaikan dengan nama kolom yang ada di file Excel Anda
KOLOM_JAWABAN_SISWA = "jawaban_siswa"
KOLOM_KATA_KUNCI = "kata_kunci" # Jika kata kunci ada di file Excel
KOLOM_NILAI_GURU = "nilai_guru" # Untuk perbandingan (jika ada)

# URL API Anda di Railway
API_URL = "https://essay-grader-api-production.up.railway.app/grade"

# ==========================================
# SCRIPT EVALUASI
# ==========================================
def evaluate_essays():
    print(f"Membaca file {FILE_EXCEL_INPUT}...")
    try:
        df = pd.read_excel(FILE_EXCEL_INPUT)
    except Exception as e:
        print(f"Error membaca file: {e}")
        print("Pastikan file ada di folder yang sama dan nama file sudah benar.")
        return

    hasil_skor_ai = []
    hasil_detail = []

    print(f"Ditemukan {len(df)} baris data. Mulai memproses...")
    
    for index, row in df.iterrows():
        print(f"Memproses baris {index + 1}/{len(df)}...")
        
        # 1. Ambil data dari Excel
        # Gunakan try-except in case ada nilai kosong (NaN)
        jawaban = str(row.get(KOLOM_JAWABAN_SISWA, ""))
        
        # Jika kata kunci ada di Excel, pisahkan dengan titik koma atau koma (sesuai format Anda)
        kata_kunci_mentah = str(row.get(KOLOM_KATA_KUNCI, ""))
        # Pisahkan berdasarkan titik koma (;) atau newline, sesuaikan dengan format
        keywords = [k.strip() for k in kata_kunci_mentah.replace('\n', ';').split(';') if k.strip()]
        
        if not keywords:
            # Fallback jika kosong, agar API tidak error
            keywords = ["placeholder_keyword"] 
            
        payload = {
            "student_answer": jawaban,
            "keywords": keywords,
            "rule_weight": 0.5,
            "lsa_weight": 0.5
        }
        
        # 2. Tembak API
        try:
            response = requests.post(API_URL, json=payload, timeout=15)
            if response.status_code == 200:
                data = response.json()
                hasil_skor_ai.append(data.get('final_score', 0))
                hasil_detail.append(json.dumps(data, indent=2))
            else:
                print(f"  -> Error dari API: Status {response.status_code}")
                hasil_skor_ai.append(0)
                hasil_detail.append("ERROR")
        except Exception as e:
            print(f"  -> Gagal koneksi: {e}")
            hasil_skor_ai.append(0)
            hasil_detail.append("ERROR")
            
        # Jeda sedikit agar server tidak kewalahan (opsional)
        time.sleep(0.5)

    # 3. Masukkan hasil ke DataFrame
    df["skor_ai"] = hasil_skor_ai
    df["detail_ai"] = hasil_detail
    
    # Opsional: Jika Anda punya kolom nilai asli guru, kita bisa hitung selisihnya
    if KOLOM_NILAI_GURU in df.columns:
        # Asumsi nilai guru berada dalam skala 0 - 100, sedangkan AI 0 - 1.0
        # Sesuaikan dengan skala Anda. Di sini saya asumsikan AI kita jadikan skala 100
        df["skor_ai_skala_100"] = df["skor_ai"] * 100
        df["selisih"] = (df[KOLOM_NILAI_GURU] - df["skor_ai_skala_100"]).abs()

    # 4. Simpan ke file baru
    print(f"\nMenyimpan hasil ke {FILE_EXCEL_OUTPUT}...")
    df.to_excel(FILE_EXCEL_OUTPUT, index=False)
    print("Selesai! 🎉")

if __name__ == "__main__":
    evaluate_essays()
