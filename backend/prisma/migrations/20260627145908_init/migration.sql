-- CreateTable
CREATE TABLE "sys_user" (
    "id" BIGSERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "nickname" VARCHAR(50),
    "avatar" VARCHAR(255),
    "email" VARCHAR(100),
    "phone" VARCHAR(20),
    "status" INTEGER NOT NULL DEFAULT 1,
    "dept_id" BIGINT,
    "create_by" BIGINT,
    "create_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_by" BIGINT,
    "update_time" TIMESTAMP(3),
    "deleted" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sys_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_role" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "description" VARCHAR(255),
    "status" INTEGER NOT NULL DEFAULT 1,
    "create_by" BIGINT,
    "create_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_by" BIGINT,
    "update_time" TIMESTAMP(3),
    "deleted" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sys_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_menu" (
    "id" BIGSERIAL NOT NULL,
    "parent_id" BIGINT NOT NULL DEFAULT 0,
    "path" VARCHAR(200),
    "name" VARCHAR(50) NOT NULL,
    "icon" VARCHAR(50),
    "component" VARCHAR(200),
    "component_name" VARCHAR(100),
    "redirect" VARCHAR(200),
    "sort" INTEGER NOT NULL DEFAULT 0,
    "type" INTEGER NOT NULL,
    "title" VARCHAR(50),
    "breadcrumb" INTEGER NOT NULL DEFAULT 1,
    "hidden" INTEGER NOT NULL DEFAULT 0,
    "keep_alive" INTEGER NOT NULL DEFAULT 1,
    "affix" INTEGER NOT NULL DEFAULT 0,
    "permission" VARCHAR(100),
    "status" INTEGER NOT NULL DEFAULT 1,
    "create_by" BIGINT,
    "create_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_by" BIGINT,
    "update_time" TIMESTAMP(3),
    "deleted" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sys_menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_user_role" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "role_id" BIGINT NOT NULL,
    "create_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_user_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_role_menu" (
    "id" BIGSERIAL NOT NULL,
    "role_id" BIGINT NOT NULL,
    "menu_id" BIGINT NOT NULL,
    "create_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_role_menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_log" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "username" VARCHAR(50),
    "module" VARCHAR(100),
    "action" VARCHAR(50),
    "method" VARCHAR(10),
    "url" VARCHAR(500),
    "ip" VARCHAR(50),
    "location" VARCHAR(255),
    "params" TEXT,
    "result" TEXT,
    "status" INTEGER,
    "error_msg" TEXT,
    "duration" INTEGER,
    "create_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_login_log" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "username" VARCHAR(50),
    "ip" VARCHAR(50),
    "location" VARCHAR(255),
    "device" VARCHAR(100),
    "browser" VARCHAR(100),
    "os" VARCHAR(100),
    "status" INTEGER,
    "msg" VARCHAR(255),
    "create_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_login_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sys_user_username_key" ON "sys_user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "sys_role_code_key" ON "sys_role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sys_user_role_user_id_role_id_key" ON "sys_user_role"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "sys_role_menu_role_id_menu_id_key" ON "sys_role_menu"("role_id", "menu_id");

-- AddForeignKey
ALTER TABLE "sys_user_role" ADD CONSTRAINT "sys_user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_user_role" ADD CONSTRAINT "sys_user_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "sys_role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_role_menu" ADD CONSTRAINT "sys_role_menu_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "sys_role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_role_menu" ADD CONSTRAINT "sys_role_menu_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "sys_menu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
