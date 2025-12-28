
import React from "react";
import ReactMarkdown from "react-markdown";
import { NavLink } from "react-router";
import Navbar from "../components/Navbar";

export function meta() {
  return [
    { title: "Perkuat Kolaborasi, Kemendikdasmen - Eye Exam" },
    { name: "description", content: "Kemendikdasmen memberikan apresiasi kepada para penggerak dan inovator pendidikan nasional dalam Malam Tasyakuran Hari Pendidikan Nasional 2025" },
  ];
}

export default function Artikel() {
  const markdown = `
# Perkuat Kolaborasi, Kemendikdasmen Berikan Apresiasi kepada Para Penggerak dan Inovator Pendidikan Nasional


<!-- Tempat Gambar -->
<p align="center">
  <img src="https://gurudikdas.dikdasmen.go.id/storage/users/379/2025/250527%20Perkuat%20Kolaborasi/1.webp" alt="Foto Kegiatan Hardiknas 2025" style="max-width: 100%; height: auto;">
</p>

**Jakarta, 26 Mei 2025** – Upaya membangun pendidikan yang bermutu tidak hanya bergantung pada kebijakan pemerintah, tetapi juga pada kontribusi nyata dari berbagai pihak yang terlibat langsung. Untuk itu, Kementerian Pendidikan Dasar dan Menengah (Kemendikdasmen) menyelenggarakan **Malam Tasyakuran Hari Pendidikan Nasional (Hardiknas) 2025** sebagai bentuk penghormatan dan apresiasi kepada para pemangku kepentingan yang telah menunjukkan komitmen dalam memajukan pendidikan Indonesia.

Acara ini merupakan bagian dari rangkaian peringatan Hardiknas 2025 yang mengusung tema **“Partisipasi Semesta Mewujudkan Pendidikan Bermutu untuk Semua”**. Dalam kegiatan ini, Kemendikdasmen menganugerahkan penghargaan kepada para insan pendidikan, pemerintah daerah, serta mitra pembangunan yang dinilai berperan aktif dalam menciptakan ekosistem pendidikan yang inklusif, berkeadilan, dan berkelanjutan.

Menteri Pendidikan Dasar dan Menengah (Mendikdasmen), **Abdul Mu’ti**, menyampaikan apresiasi kepada seluruh pihak yang telah memberikan dukungan dan bekerja sama dalam membangun sumber daya manusia unggul, mengembangkan sains dan teknologi, dan menjadikan Indonesia sebagai bangsa yang berprestasi.

> “Kami tentu merasa dukungan Bapak dan Ibu sekalian, baik yang diselenggarakan secara institusi maupun personal, memiliki makna yang sangat penting dalam program pendidikan kita. Kita telah meletakkan landasan yang kokoh untuk membangun pendidikan Indonesia untuk masa yang akan datang.”  
> — *Mendikdasmen di Plasa Insan Berprestasi, Jakarta, Senin (26/5)*

Lebih lanjut, Mendikdasmen juga menyampaikan bahwa selama Bulan Pendidikan, Kemendikdasmen telah menyelenggarakan berbagai kegiatan dan peluncuran program strategis, dalam rangka mengajak seluruh elemen masyarakat untuk turut serta dalam transformasi pendidikan.

Salah satu tonggak utama dalam rangkaian ini adalah peluncuran **Program Revitalisasi Sekolah dan Digitalisasi Pembelajaran**, yang dilakukan secara nasional oleh **Presiden Republik Indonesia, Prabowo Subianto**, pada 2 Mei 2025 di Bogor. Program ini bertujuan untuk menciptakan lingkungan belajar yang aman, nyaman, dan adaptif terhadap perkembangan teknologi, agar seluruh anak Indonesia dapat menikmati pendidikan yang berkualitas.

Sekretaris Jenderal Kemendikdasmen, **Suharti**, menegaskan bahwa Malam Tasyakuran Hardiknas ini bukan sekadar ajang seremonial, melainkan menjadi ruang reflektif bagi seluruh pemangku kepentingan untuk memperkuat kolaborasi demi kemajuan pendidikan Indonesia.

> “Ini merupakan momen reflektif dan silaturahmi seluruh pemangku kepentingan pendidikan, bahwa di tengah berbagai tantangan, kita masih diberi kekuatan untuk terus berikhtiar dan berkolaborasi demi kemajuan pendidikan Indonesia.”  
> — *Suharti*

Tak hanya itu, acara ini juga merupakan bentuk penguatan sinergi antara pemerintah pusat dan daerah dalam mewujudkan pendidikan yang inklusif dan berkelanjutan.

> “Malam tasyakuran ini diharapkan dapat menginspirasi masyarakat luas untuk ikut aktif berkontribusi dalam pembangunan pendidikan, serta meningkatkan kesadaran akan pentingnya peran bersama dalam transformasi pendidikan.”  
> — *Suharti melanjutkan*

Pada Malam Tasyakuran Hardiknas 2025, diserahkan sebanyak **115 penghargaan dan bentuk apresiasi**, yang mencakup berbagai kategori baik individu maupun institusi. Selain itu, juga diberikan sejumlah apresiasi kepada pemerintah daerah, mitra strategis, media dan jurnalis, serta tokoh pendidikan.

Lebih dari **200 peserta undangan** hadir dalam acara ini, yang terdiri dari perwakilan pemerintah pusat dan daerah, organisasi mitra, komunitas pendidikan, serta tokoh-tokoh yang selama ini aktif dalam mendukung peningkatan mutu pendidikan di Indonesia.

Kemendikdasmen berharap semangat kolaborasi dan gotong royong yang tercermin dalam kegiatan ini dapat terus tumbuh, menjadi inspirasi bagi seluruh elemen bangsa, dan mendorong terwujudnya pendidikan bermutu untuk semua, sebagaimana menjadi cita-cita konstitusional dan visi besar kemajuan Indonesia.
  `;

  return (
    <div className="prose">
        <ReactMarkdown>
            {markdown}
        </ReactMarkdown>
    </div>
  );
}
