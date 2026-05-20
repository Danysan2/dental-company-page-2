INSERT INTO "servicios" ("id","nombre","descripcion","precio","duracion","activo","created_at")
SELECT gen_random_uuid(),'Consulta general - Valoración inicial','Primera valoración para pacientes nuevos. El valor se abona al tratamiento final si el paciente inicia un plan odontológico indicado en consulta.',80000,60,true,NOW()
WHERE NOT EXISTS (SELECT 1 FROM "servicios" WHERE "nombre"='Consulta general - Valoración inicial');
