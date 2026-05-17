-- CreateTable sub_servicios
CREATE TABLE "sub_servicios" (
    "id"          TEXT         NOT NULL,
    "nombre"      TEXT         NOT NULL,
    "servicio_id" TEXT         NOT NULL,
    "activo"      BOOLEAN      NOT NULL DEFAULT true,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sub_servicios_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey sub_servicios -> servicios
ALTER TABLE "sub_servicios" ADD CONSTRAINT "sub_servicios_servicio_id_fkey"
    FOREIGN KEY ("servicio_id") REFERENCES "servicios"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable citas: add hora_fin and sub_servicio_id
ALTER TABLE "citas" ADD COLUMN "hora_fin"       TEXT;
ALTER TABLE "citas" ADD COLUMN "sub_servicio_id" TEXT;

-- AddForeignKey citas -> sub_servicios
ALTER TABLE "citas" ADD CONSTRAINT "citas_sub_servicio_id_fkey"
    FOREIGN KEY ("sub_servicio_id") REFERENCES "sub_servicios"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
