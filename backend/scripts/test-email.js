/**
 * Prueba el envío de email con la config SMTP de .env
 *
 * Uso:
 *   node scripts/test-email.js
 *   node scripts/test-email.js otro@email.com
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { sendMail } = require('../src/services/emailService');

async function main() {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  const to = process.argv[2] || SMTP_USER;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error('❌  Completá SMTP_HOST, SMTP_USER y SMTP_PASS en backend/.env');
    console.error('    Ver instrucciones en backend/.env.example o README.md');
    process.exit(1);
  }

  if (!to) {
    console.error('❌  Indicá un destinatario: node scripts/test-email.js tu@email.com');
    process.exit(1);
  }

  console.log(`📧  Enviando prueba a ${to} vía ${SMTP_HOST}...`);

  const result = await sendMail({
    to,
    subject: 'Loté — Prueba de email',
    text:
      'Si leés esto, SMTP está configurado correctamente.\n\n' +
      'Podés probar "Olvidé mi contraseña" en la app mobile.',
    html:
      '<p>Si leés esto, <strong>SMTP está configurado correctamente</strong>.</p>' +
      '<p>Podés probar <em>Olvidé mi contraseña</em> en la app mobile.</p>',
  });

  if (result.mocked) {
    console.error('❌  El email se simuló en consola (faltan variables SMTP).');
    process.exit(1);
  }

  console.log('✅  Email enviado. Revisá la bandeja de entrada (y spam).');
}

main().catch((err) => {
  console.error('❌  Error SMTP:', err.message);
  if (err.message.includes('Invalid login')) {
    console.error('    → En Gmail usá una "Contraseña de aplicación", no tu clave normal.');
  }
  process.exit(1);
});
