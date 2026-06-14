import { NextResponse } from "next/server";
import { DUSUN, DESA_INFO } from "@/lib/dummy";

// Puskesmas → Fasilitas Kesehatan & Layanan Publik Desa
export async function GET() {
  const FASILITAS = [
    { nama: "Polindes Remau Bako Tuo", tipe: "Polindes", dusunIdx: 0, bed: 4,  dokter: 0, kondisi: "normal"   },
    { nama: "Posyandu Dusun Bako Tuo", tipe: "Posyandu", dusunIdx: 1, bed: 0,  dokter: 0, kondisi: "normal"   },
    { nama: "Posyandu Dusun Remau",    tipe: "Posyandu", dusunIdx: 0, bed: 0,  dokter: 0, kondisi: "normal"   },
    { nama: "Puskesmas Maro Sebo Ulu", tipe: "Puskesmas Induk", dusunIdx: 0, bed: 20, dokter: 2, kondisi: "normal" },
  ];

  const data = FASILITAS.map((fas, i) => ({
    id:             `FAS-${i + 1}`,
    nama:           fas.nama,
    kabupaten_kota: DESA_INFO.kabupaten,
    kecamatan:      DESA_INFO.kecamatan,
    tipe:           fas.tipe,
    lat:            DUSUN[fas.dusunIdx].lat + (Math.random() - 0.5) * 0.003,
    lng:            DUSUN[fas.dusunIdx].lng + (Math.random() - 0.5) * 0.003,
    status:         "aktif",
    kapasitas_bed:  fas.bed,
    tenaga_dokter:  fas.dokter,
    kondisi:        fas.kondisi,
  }));

  return NextResponse.json({ data, total: data.length });
}
