-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('doctora', 'recepcionista');

-- CreateEnum
CREATE TYPE "EstadoCita" AS ENUM ('programada', 'completada', 'cancelada', 'no_asistio');

-- CreateTable
CREATE TABLE "staff" (
    "id"         TEXT         NOT NULL,
    "email"      TEXT         NOT NULL,
    "nombre"     TEXT         NOT NULL,
    "password"   TEXT         NOT NULL,
    "rol"        "Rol"        NOT NULL DEFAULT 'recepcionista',
    "activo"     BOOLEAN      NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id"         TEXT         NOT NULL,
    "nombre"     TEXT         NOT NULL,
    "cedula"     TEXT,
    "telefono"   TEXT,
    "correo"     TEXT,
    "notas"      TEXT,
    "activo"     BOOLEAN      NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicios" (
    "id"          TEXT         NOT NULL,
    "nombre"      TEXT         NOT NULL,
    "descripcion" TEXT,
    "precio"      INTEGER      NOT NULL DEFAULT 0,
    "duracion"    INTEGER      NOT NULL DEFAULT 60,
    "activo"      BOOLEAN      NOT NULL DEFAULT true,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "servicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citas" (
    "id"          TEXT          NOT NULL,
    "cliente_id"  TEXT          NOT NULL,
    "servicio_id" TEXT          NOT NULL,
    "fecha"       DATE          NOT NULL,
    "hora"        TEXT          NOT NULL,
    "estado"      "EstadoCita"  NOT NULL DEFAULT 'programada',
    "notas"       TEXT,
    "precio"      INTEGER,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_email_key" ON "staff"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cedula_key" ON "clientes"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "servicios_nombre_key" ON "servicios"("nombre");

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_cliente_id_fkey"
    FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_servicio_id_fkey"
    FOREIGN KEY ("servicio_id") REFERENCES "servicios"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
