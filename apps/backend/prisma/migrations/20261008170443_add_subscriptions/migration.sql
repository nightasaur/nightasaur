-- CreateTable
CREATE TABLE "user_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "amountTwd" INTEGER NOT NULL,
    "cardKey" TEXT NOT NULL,
    "cardToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "nextBillingAt" TIMESTAMP(3) NOT NULL,
    "lastBilledAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_transactions" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "tappayRecTradeId" TEXT,
    "amountTwd" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "errorMsg" TEXT,
    "isFirstCharge" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subscription_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_subscriptions_userId_key" ON "user_subscriptions"("userId");
CREATE INDEX "user_subscriptions_status_nextBillingAt_idx" ON "user_subscriptions"("status", "nextBillingAt");
CREATE INDEX "subscription_transactions_subscriptionId_createdAt_idx" ON "subscription_transactions"("subscriptionId", "createdAt");

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subscription_transactions" ADD CONSTRAINT "subscription_transactions_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "user_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
