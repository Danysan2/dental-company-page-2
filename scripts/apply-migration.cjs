const { Client } = require('pg')
require('dotenv').config({ path: '.env.local' })

const sql = `
-- CreateTable sub_servicios
CREATE TABLE IF NOT EXISTS "sub_servicios" (
    "id"          TEXT         NOT NULL,
    "nombre"      TEXT         NOT NULL,
    "servicio_id" TEXT         NOT NULL,
    "activo"      BOOLEAN      NOT NULL DEFAULT true,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sub_servicios_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey (ignore if exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sub_servicios_servicio_id_fkey'
  ) THEN
    ALTER TABLE "sub_servicios" ADD CONSTRAINT "sub_servicios_servicio_id_fkey"
      FOREIGN KEY ("servicio_id") REFERENCES "servicios"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- Add hora_fin column if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'citas' AND column_name = 'hora_fin'
  ) THEN
    ALTER TABLE "citas" ADD COLUMN "hora_fin" TEXT;
  END IF;
END $$;

-- Add sub_servicio_id column if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'citas' AND column_name = 'sub_servicio_id'
  ) THEN
    ALTER TABLE "citas" ADD COLUMN "sub_servicio_id" TEXT;
  END IF;
END $$;

-- AddForeignKey citas -> sub_servicios (ignore if exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'citas_sub_servicio_id_fkey'
  ) THEN
    ALTER TABLE "citas" ADD CONSTRAINT "citas_sub_servicio_id_fkey"
      FOREIGN KEY ("sub_servicio_id") REFERENCES "sub_servicios"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
`

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  console.log('Conectado a la base de datos.')
  await client.query(sql)
  console.log('✅ Migración aplicada correctamente.')
  await client.end()
}

main().catch(e => { console.error('❌ Error:', e.message); process.exit(1) })
