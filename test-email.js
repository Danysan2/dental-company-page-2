const https = require('https');

const data = {
  service_id: 'service_yiiu5b4',
  template_id: 'template_psvdfjl',
  user_id: 'gy0CS2AYZDivASJge',
  accessToken: 'md9n52ga61EBJ3oDswOID',
  template_params: {
    to_email: 'test@gmail.com',
    paciente_nombre: 'Test',
    servicio: 'Limpieza',
    fecha: '2026-05-20',
    hora: '10:00',
    precio: '$50.000',
    paciente_correo: 'test@gmail.com',
  },
};

const postData = JSON.stringify(data);
const options = {
  hostname: 'api.emailjs.com',
  port: 443,
  path: '/api/v1.0/email/send',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
};

console.log('Usando accessToken...\n');

const req = https.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => { responseData += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', responseData);
    process.exit(res.statusCode === 200 ? 0 : 1);
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
  process.exit(1);
});

req.write(postData);
req.end();
