import { prisma } from "@/lib/db"

const FREE_MONTHLY_LIMIT = 15

export async function checkAndIncrementUsage(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  let sub = await prisma.subscription.findUnique({ where: { userId } })

  if (!sub) {
    sub = await prisma.subscription.create({ data: { userId } })
  }

  // Reset monthly count if a month has passed
  const now = new Date()
  const monthsSinceReset =
    (now.getFullYear() - sub.usageResetAt.getFullYear()) * 12 +
    (now.getMonth() - sub.usageResetAt.getMonth())

  if (monthsSinceReset >= 1) {
    sub = await prisma.subscription.update({
      where: { userId },
      data: { monthlyUsageCount: 0, usageResetAt: now },
    })
  }

  // Pro users: unlimited
  if (sub.planTier === "pro" && sub.status === "active") {
    return { allowed: true, remaining: -1 }
  }

  // Free users: check limit
  if (sub.monthlyUsageCount >= FREE_MONTHLY_LIMIT) {
    return { allowed: false, remaining: 0 }
  }

  await prisma.subscription.update({
    where: { userId },
    data: { monthlyUsageCount: { increment: 1 } },
  })

  return { allowed: true, remaining: FREE_MONTHLY_LIMIT - sub.monthlyUsageCount - 1 }
}