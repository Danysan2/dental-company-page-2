-- Seed: Servicios (categorías generales de Dental Company CO)
INSERT INTO "servicios" ("id","nombre","descripcion","precio","duracion","activo","created_at")
SELECT gen_random_uuid(),'Rehabilitación Oral y Estética Dental','Restauramos y diseñamos sonrisas con materiales de última generación, logrando resultados naturales, armónicos y duraderos.',0,60,true,NOW()
WHERE NOT EXISTS (SELECT 1 FROM "servicios" WHERE "nombre"='Rehabilitación Oral y Estética Dental');

INSERT INTO "servicios" ("id","nombre","descripcion","precio","duracion","activo","created_at")
SELECT gen_random_uuid(),'Manejo de la Articulación Temporomandibular (ATM)','Diagnóstico y tratamiento especializado del dolor orofacial y trastornos de la ATM.',0,60,true,NOW()
WHERE NOT EXISTS (SELECT 1 FROM "servicios" WHERE "nombre"='Manejo de la Articulación Temporomandibular (ATM)');

INSERT INTO "servicios" ("id","nombre","descripcion","precio","duracion","activo","created_at")
SELECT gen_random_uuid(),'Endodoncia','Tratamientos enfocados en la conservación dental y alivio del dolor.',0,90,true,NOW()
WHERE NOT EXISTS (SELECT 1 FROM "servicios" WHERE "nombre"='Endodoncia');

INSERT INTO "servicios" ("id","nombre","descripcion","precio","duracion","activo","created_at")
SELECT gen_random_uuid(),'Periodoncia','Salud y mantenimiento de los tejidos de soporte dental.',0,60,true,NOW()
WHERE NOT EXISTS (SELECT 1 FROM "servicios" WHERE "nombre"='Periodoncia');

INSERT INTO "servicios" ("id","nombre","descripcion","precio","duracion","activo","created_at")
SELECT gen_random_uuid(),'Ortodoncia','Soluciones modernas para la alineación dental y estética de la sonrisa.',0,60,true,NOW()
WHERE NOT EXISTS (SELECT 1 FROM "servicios" WHERE "nombre"='Ortodoncia');

INSERT INTO "servicios" ("id","nombre","descripcion","precio","duracion","activo","created_at")
SELECT gen_random_uuid(),'Odontología General','Prevención y restauración con enfoque estético.',0,45,true,NOW()
WHERE NOT EXISTS (SELECT 1 FROM "servicios" WHERE "nombre"='Odontología General');

-- Seed: SubServicios — Rehabilitación Oral y Estética Dental
INSERT INTO "sub_servicios" ("id","nombre","servicio_id","activo","created_at")
SELECT gen_random_uuid(),'Diseños de sonrisa en cerámica (carillas cerámicas y lentes cerámicos)',s.id,true,NOW()
FROM "servicios" s WHERE s.nombre='Rehabilitación Oral y Estética Dental'
AND NOT EXISTS (SELECT 1 FROM "sub_servicios" WHERE "nombre"='Diseños de sonrisa en cerámica (carillas cerámicas y lentes cerámicos)');

INSERT INTO "sub_servicios" ("id","nombre","servicio_id","activo","created_at")
SELECT gen_random_uuid(),'Diseños de sonrisa en resina de alta estética',s.id,true,NOW()
FROM "servicios" s WHERE s.nombre='Rehabilitación Oral y Estética Dental'
AND NOT EXISTS (SELECT 1 FROM "sub_servicios" WHERE "nombre"='Diseños de sonrisa en resina de alta estética');

INSERT INTO "sub_servicios" ("id","nombre","servicio_id","activo","created_at")
SELECT gen_random_uuid(),'Carillas directas e indirectas',s.id,true,NOW()
FROM "servicios" s WHERE s.nombre='Rehabilitación Oral y Estética Dental'
AND NOT EXISTS (SELECT 1 FROM "sub_servicios" WHERE "nombre"='Carillas directas e indirectas');

INSERT INTO "sub_servicios" ("id","nombre","servicio_id","activo","created_at")
SELECT gen_random_uuid(),'Incrustaciones (inlays/onlays)',s.id,true,NOW()
FROM "servicios" s WHERE s.nombre='Rehabilitación Oral y Estética Dental'
AND NOT EXISTS (SELECT 1 FROM "sub_servicios" WHERE "nombre"='Incrustaciones (inlays/onlays)');

INSERT INTO "sub_servicios" ("id","nombre","servicio_id","activo","created_at")
SELECT gen_random_uuid(),'Coronas totalmente cerámicas y metal-cerámica',s.id,true,NOW()
FROM "servicios" s WHERE s.nombre='Rehabilitación Oral y Estética Dental'
AND NOT EXISTS (SELECT 1 FROM "sub_servicios" WHERE "nombre"='Coronas totalmente cerámicas y metal-cerámica');

INSERT INTO "sub_servicios" ("id","nombre","servicio_id","activo","created_at")
SELECT gen_random_uuid(),'Prótesis fijas',s.id,true,NOW()
FROM "servicios" s WHERE s.nombre='Rehabilitación Oral y Estética Dental'
AND NOT EXISTS (SELECT 1 FROM "sub_servicios" WHERE "nombre"='Prótesis fijas');

INSERT INTO "sub_servicios" ("id","nombre","servicio_id","activo","created_at")
SELECT gen_random_uuid(),'Prótesis sobre implantes',s.id,true,NOW()
FROM "servicios" s WHERE s.nombre='Rehabilitación Oral y Estética Dental'
AND NOT EXISTS (SELECT 1 FROM "sub_servicios" WHERE "nombre"='Prótesis sobre implantes');

INSERT INTO "sub_servicios" ("id","nombre","servicio_id","activo","created_at")
SELECT gen_random_uuid(),'Prótesis totales',s.id,true,NOW()
FROM "servicios" s WHERE s.nombre='Rehabilitación Oral y Estética Dental'
AND NOT EXISTS (SELECT 1 FROM "sub_servicios" WHERE "nombre"='Prótesis totales');

INSERT INTO "sub_servicios" ("id","nombre","servicio_id","activo","created_at")
SELECT gen_random_uuid(),'Prótesis removibles',s.id,true,NOW()
FROM "servicios" s WHERE s.nombre='Rehabilitación Oral y Estética Dental'
AND NOT EXISTS (SELECT 1 FROM "sub_servicios" WHERE "nombre"='Prótesis removibles');

-- Seed: SubServicios — ATM
INSERT INTO "sub_servicios" ("id","nombre","servicio_id","activo","created_at")
SELECT gen_random_uuid(),'Trastornos de la ATM',s.id,true,NOW()
FROM "servicios" s WHERE s.nombre='Manejo de la Articulación Temporomandibular (ATM)'
AND NOT EXISTS (SELECT 1 FROM "sub_servicios" WHERE "nombre"='Trastornos de la ATM');

INSERT INTO "sub_servicios" ("id","nombre","servicio_id","activo","created_at")
SELECT gen_random_uuid(),'Placas neuromiorelajantes de alta precisión',s.id,true,NOW()
FROM "servicios" s WHERE s.nombre='Manejo de la Articulación Temporomandibular (ATM)'
AND NOT EXISTS (SELECT 1 FROM "sub_servicios" WHERE "nombre"='Placas neuromiorelajantes de alta precisión');

-- Seed: SubServicios — Endodoncia
INSERT INTO "sub_servicios" ("id","nombre","servicio_id","activo","created_at")
SELECT gen_random_uuid(),'Endodoncia en dientes unirradiculares y multirradiculares',s.id,true,NOW()
FROM "servicios" s WHERE s.nombre='Endodoncia'
AND NOT EXISTS (SELECT 1 FROM "sub_servicios" WHERE "nombre"='Endodoncia en dientes unirradiculares y multirradiculares');

INSERT INTO "sub_servicios" ("id","nombre","servicio_id","activo","created_at")
SELECT gen_random_uuid(),'Retratamientos endodónticos',s.id,true,NOW()
FROM "servicios" s WHERE s.nombre='Endodoncia'
AND NOT EXISTS (SELECT 1 FROM "sub_servicios" WHERE "nombre"='Retratamientos endodónticos');

INSERT INTO "sub_servicios" ("id","nombre","servicio_id","activo","created_at")
SELECT gen_random_uuid(),'Manejo de infecciones pulpares',s.id,true,NOW()
FROM "servicios" s WHERE s.nombre='Endodoncia'
AND NOT EXISTS (SELECT 1 FROM "sub_servicios" WHERE "nombre"='Manejo de infecciones pulpares');

-- Seed: SubServicios — Periodoncia
INSERT INTO "sub_servicios" ("id","nombre","servicio_id","activo","created_at")
SELECT gen_random_uuid(),'Tratamiento de enfermedad periodontal (gingivitis y periodontitis)',s.id,true,NOW()
FROM "servicios" s WHERE s.nombre='Periodoncia'
AND NOT EXISTS (SELECT 1 FROM "sub_servicios" WHERE "nombre"='Tratamiento de enfermedad periodontal (gingivitis y periodontitis)');

INSERT INTO "sub_servicios" ("id","nombre","servicio_id","activo","created_at")
SELECT gen_random_uuid(),'Frenilectomías',s.id,true,NOW()
FROM "servicios" s WHERE s.nombre='Periodoncia'
AND NOT EXISTS (SELECT 1 FROM "sub_servicios" WHERE "nombre"='Frenilectomías');

INSERT INTO "sub_servicios" ("id","nombre","servicio_id","activo","created_at")
SELECT gen_random_uuid(),'Terapias de mantenimiento periodontal',s.id,true,NOW()
FROM "servicios" s WHERE s.nombre='Periodoncia'
AND NOT EXISTS (SELECT 1 FROM "sub_servicios" WHERE "nombre"='Terapias de mantenimiento periodontal');

-- Seed: SubServicios — Ortodoncia
INSERT INTO "sub_servicios" ("id","nombre","servicio_id","activo","created_at")
SELECT gen_random_uuid(),'Ortodoncia convencional',s.id,true,NOW()
FROM "servicios" s WHERE s.nombre='Ortodoncia'
AND NOT EXISTS (SELECT 1 FROM "sub_servicios" WHERE "nombre"='Ortodoncia convencional');

INSERT INTO "sub_servicios" ("id","nombre","servicio_id","activo","created_at")
SELECT gen_random_uuid(),'Ortodoncia de autoligado',s.id,true,NOW()
FROM "servicios" s WHERE s.nombre='Ortodoncia'
AND NOT EXISTS (SELECT 1 FROM "sub_servicios" WHERE "nombre"='Ortodoncia de autoligado');

INSERT INTO "sub_servicios" ("id","nombre","servicio_id","activo","created_at")
SELECT gen_random_uuid(),'Ortodoncia estética (brackets de zafiro)',s.id,true,NOW()
FROM "servicios" s WHERE s.nombre='Ortodoncia'
AND NOT EXISTS (SELECT 1 FROM "sub_servicios" WHERE "nombre"='Ortodoncia estética (brackets de zafiro)');

INSERT INTO "sub_servicios" ("id","nombre","servicio_id","activo","created_at")
SELECT gen_random_uuid(),'Ortodoncia invisible (alineadores transparentes)',s.id,true,NOW()
FROM "servicios" s WHERE s.nombre='Ortodoncia'
AND NOT EXISTS (SELECT 1 FROM "sub_servicios" WHERE "nombre"='Ortodoncia invisible (alineadores transparentes)');

-- Seed: SubServicios — Odontología General
INSERT INTO "sub_servicios" ("id","nombre","servicio_id","activo","created_at")
SELECT gen_random_uuid(),'Restauraciones en resina de alta estética',s.id,true,NOW()
FROM "servicios" s WHERE s.nombre='Odontología General'
AND NOT EXISTS (SELECT 1 FROM "sub_servicios" WHERE "nombre"='Restauraciones en resina de alta estética');

INSERT INTO "sub_servicios" ("id","nombre","servicio_id","activo","created_at")
SELECT gen_random_uuid(),'Reemplazo de amalgamas por materiales estéticos',s.id,true,NOW()
FROM "servicios" s WHERE s.nombre='Odontología General'
AND NOT EXISTS (SELECT 1 FROM "sub_servicios" WHERE "nombre"='Reemplazo de amalgamas por materiales estéticos');

INSERT INTO "sub_servicios" ("id","nombre","servicio_id","activo","created_at")
SELECT gen_random_uuid(),'Tratamientos preventivos y de mantenimiento',s.id,true,NOW()
FROM "servicios" s WHERE s.nombre='Odontología General'
AND NOT EXISTS (SELECT 1 FROM "sub_servicios" WHERE "nombre"='Tratamientos preventivos y de mantenimiento');
