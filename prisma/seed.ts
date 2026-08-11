import { PrismaClient, Role } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// Setup Prisma 7 adapter for seeding
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // 1. PaymentCategory (Idempotent via upsert)
  await prisma.paymentCategory.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, code: 'KAS', fixed_amount: 8000, managed_by_role: Role.PJ_KAS },
  })
  await prisma.paymentCategory.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, code: 'DANASOS', fixed_amount: 2000, managed_by_role: Role.PJ_DANASOS },
  })
  await prisma.paymentCategory.upsert({
    where: { id: 3 },
    update: {},
    create: { id: 3, code: 'ARISAN', fixed_amount: 10000, managed_by_role: Role.PJ_ARISAN },
  })
  console.log('✅ Payment categories seeded')

  // 2. SystemAccount
  await prisma.systemAccount.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: { username: 'superadmin', role: Role.SUPER_ADMIN },
  })
  await prisma.systemAccount.upsert({
    where: { username: 'pjkas' },
    update: {},
    create: { username: 'pjkas', role: Role.PJ_KAS },
  })
  await prisma.systemAccount.upsert({
    where: { username: 'pjdanasos' },
    update: {},
    create: { username: 'pjdanasos', role: Role.PJ_DANASOS },
  })
  await prisma.systemAccount.upsert({
    where: { username: 'pjarisan' },
    update: {},
    create: { username: 'pjarisan', role: Role.PJ_ARISAN },
  })
  console.log('✅ System accounts seeded')

  // 3. Member
  const members = [
    { nickname: 'Budi Santoso', join_date: new Date('2026-01-01T00:00:00.000Z'), is_active: true },
    { nickname: 'Budi Setiawan', join_date: new Date('2026-02-15T00:00:00.000Z'), is_active: true },
    { nickname: 'Satria Perdana', join_date: new Date('2026-01-01T00:00:00.000Z'), is_active: true },
    { nickname: 'Satria Putra', join_date: new Date('2026-04-01T00:00:00.000Z'), is_active: true },
    { nickname: 'Siti Aminah', join_date: new Date('2025-12-01T00:00:00.000Z'), is_active: false },
  ]

  for (const m of members) {
    await prisma.member.upsert({
      where: { nickname: m.nickname },
      update: {},
      create: m,
    })
  }
  console.log('✅ Members seeded')

  console.log('Seeding completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
