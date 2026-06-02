-- CreateEnum
CREATE TYPE "FrequencyType" AS ENUM ('DAYS', 'TIMES_PER_DAY');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "union_id" TEXT,
    "open_id" TEXT,
    "phone" TEXT,
    "nickname" TEXT,
    "avatar" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plants" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "frequency" DECIMAL(65,30) NOT NULL,
    "frequencyType" "FrequencyType" NOT NULL,
    "image" TEXT,
    "last_watered" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "water_logs" (
    "id" TEXT NOT NULL,
    "plant_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "watered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "water_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_union_id_key" ON "users"("union_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_union_id_idx" ON "users"("union_id");

-- CreateIndex
CREATE INDEX "users_open_id_idx" ON "users"("open_id");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "plants_user_id_idx" ON "plants"("user_id");

-- CreateIndex
CREATE INDEX "plants_created_at_idx" ON "plants"("created_at");

-- CreateIndex
CREATE INDEX "water_logs_plant_id_idx" ON "water_logs"("plant_id");

-- CreateIndex
CREATE INDEX "water_logs_user_id_idx" ON "water_logs"("user_id");

-- CreateIndex
CREATE INDEX "water_logs_watered_at_idx" ON "water_logs"("watered_at");

-- CreateIndex
CREATE INDEX "water_logs_plant_id_watered_at_idx" ON "water_logs"("plant_id", "watered_at");

-- AddForeignKey
ALTER TABLE "plants" ADD CONSTRAINT "plants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "water_logs" ADD CONSTRAINT "water_logs_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
