-- DropForeignKey
ALTER TABLE "sys_role_menu" DROP CONSTRAINT "sys_role_menu_role_id_fkey";
ALTER TABLE "sys_role_menu" DROP CONSTRAINT "sys_role_menu_menu_id_fkey";

-- DropTable
DROP TABLE "sys_role_menu";
DROP TABLE "sys_menu";

-- CreateTable
CREATE TABLE "sys_role_permission" (
    "id" BIGSERIAL NOT NULL,
    "role_id" BIGINT NOT NULL,
    "permission" VARCHAR(100) NOT NULL,
    "create_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_role_permission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sys_role_permission_role_id_idx" ON "sys_role_permission"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "sys_role_permission_role_id_permission_key" ON "sys_role_permission"("role_id", "permission");

-- AddForeignKey
ALTER TABLE "sys_role_permission" ADD CONSTRAINT "sys_role_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "sys_role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
