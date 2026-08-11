# Arsitektur Sistem & Skema Database

## 1. Tech Stack (Zero-Cost Deployment)
- **Framework:** Next.js (App Router, Server Actions)
- **Database & Auth:** Supabase (PostgreSQL, Supavisor Connection Pooling)
- **ORM:** Prisma ORM
- **Styling:** Tailwind CSS + shadcn/ui
- **Hosting:** Vercel (Hobby Tier)

## 2. Skema Database (Prisma Definition Reference)

Sistem menggunakan 5 tabel utama. AI wajib mematuhi skema relasional ini, khususnya `@@unique` constraint pada tabel `Transaction` untuk mencegah *spam-click/race condition*.

```prisma
model SystemAccount {
  id           String        @id @default(uuid()) // Linked to Supabase Auth UUID
  username     String        @unique
  role         Role          // Enum: SUPER_ADMIN, PJ_KAS, PJ_DANASOS, PJ_ARISAN
  transactions Transaction[]
  expenses     Expense[]
}

model Member {
  id           String        @id @default(uuid())
  nickname     String        @unique // Identifier unik (ex: Satria Perdana, Satria Putra)
  join_date    DateTime
  is_active    Boolean       @default(true)
  transactions Transaction[]
}

model PaymentCategory {
  id              Int           @id // 1=KAS, 2=DANASOS, 3=ARISAN
  code            String        @unique // KAS, DANASOS, ARISAN
  fixed_amount    Decimal
  managed_by_role Role
  transactions    Transaction[]
  expenses        Expense[]
}

model Transaction {
  id           String          @id @default(uuid())
  member_id    String
  category_id  Int
  period_month Int             // 1-12
  period_year  Int
  amount       Decimal         // Snapshot nominal saat dibayar
  recorded_by  String          // Relasi ke SystemAccount.id
  created_at   DateTime        @default(now())

  member       Member          @relation(fields: [member_id], references: [id])
  category     PaymentCategory @relation(fields: [category_id], references: [id])
  account      SystemAccount   @relation(fields: [recorded_by], references: [id])

  // CRITICAL: Mencegah duplikasi pembayaran untuk bulan yang sama akibat network lag
  @@unique([member_id, category_id, period_month, period_year])
}

model Expense {
  id           String          @id @default(uuid())
  category_id  Int             // Hanya boleh KAS atau DANASOS
  amount       Decimal
  description  String          // ex: "Beli keperluan 17 Agustus"
  expense_date DateTime
  recorded_by  String          // Relasi ke SystemAccount.id
  created_at   DateTime        @default(now())

  category     PaymentCategory @relation(fields: [category_id], references: [id])
  account      SystemAccount   @relation(fields: [recorded_by], references: [id])
}