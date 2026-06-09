const crypto = require('crypto');

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

/**
 * Genera una contraseña provisoria legible (8 letras + 1 dígito).
 */
function generateProvisionalPassword() {
  let pwd = '';
  for (let i = 0; i < 8; i += 1) {
    pwd += CHARS[crypto.randomInt(0, CHARS.length)];
  }
  pwd += String(crypto.randomInt(0, 10));
  return pwd;
}

module.exports = { generateProvisionalPassword };
