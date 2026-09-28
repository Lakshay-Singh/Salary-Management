-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "countries" (
    "code" VARCHAR(2) NOT NULL,
    "name" TEXT NOT NULL,
    "currency_code" VARCHAR(3) NOT NULL,
    "currency_symbol" TEXT NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" SERIAL NOT NULL,
    "full_name" TEXT NOT NULL,
    "job_title" TEXT NOT NULL,
    "country_code" VARCHAR(2) NOT NULL,
    "salary" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employees_full_name_idx" ON "employees"("full_name");

-- CreateIndex
CREATE INDEX "employees_country_code_idx" ON "employees"("country_code");

-- CreateIndex
CREATE INDEX "employees_job_title_idx" ON "employees"("job_title");

-- CreateIndex
CREATE INDEX "employees_country_code_job_title_idx" ON "employees"("country_code", "job_title");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_country_code_fkey" FOREIGN KEY ("country_code") REFERENCES "countries"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
