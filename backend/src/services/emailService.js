const crypto = require('crypto');

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER) {
    return null;
  }

  const nodemailer = require('nodemailer');
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

function resolveFromAddress() {
  const configured = process.env.EMAIL_FROM?.trim();
  if (configured && configured !== 'noreply@lote.app') {
    return configured;
  }
  return process.env.SMTP_USER || 'noreply@lote.app';
}

async function sendMail({ to, subject, text, html }) {
  const from = resolveFromAddress();
  const transport = await getTransporter();

  if (!transport) {
    console.log(`[email:mock] To: ${to}\nSubject: ${subject}\n${text}`);
    return { mocked: true };
  }

  await transport.sendMail({ from, to, subject, text, html });
  return { mocked: false };
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function sendProvisionalPasswordEmail(email, password) {
  return sendMail({
    to: email,
    subject: 'Loté — Contraseña provisoria',
    text:
      `Completá tu registro en Loté.\n\n` +
      `Tu contraseña provisoria es: ${password}\n\n` +
      `Ingresá a la app, reingresala y definí tu contraseña definitiva.`,
    html: `<p>Completá tu registro en <strong>Loté</strong>.</p>` +
      `<p>Tu contraseña provisoria es: <code>${password}</code></p>` +
      `<p>Ingresá a la app, reingresala y definí tu contraseña definitiva.</p>`,
  });
}

async function sendKycApprovedEmail(email, categoria) {
  return sendMail({
    to: email,
    subject: 'Loté — Registro aprobado',
    text: `Tu verificación fue aprobada. Categoría asignada: ${categoria}.`,
  });
}

async function sendPasswordResetEmail(email, token) {
  const base = process.env.APP_PUBLIC_URL || 'http://localhost:3006';
  const link = `${base}/reset/?token=${token}`;
  return sendMail({
    to: email,
    subject: 'Loté — Restablecer contraseña',
    text: `Usá este enlace para restablecer tu contraseña (válido 1 hora):\n${link}`,
    html: `<p>Usá este enlace para restablecer tu contraseña (válido 1 hora):</p><p><a href="${link}">${link}</a></p>`,
  });
}

module.exports = {
  sendMail,
  generateToken,
  sendProvisionalPasswordEmail,
  sendKycApprovedEmail,
  sendPasswordResetEmail,
};
