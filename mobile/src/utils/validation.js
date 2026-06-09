export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

export function getEmailValidationError(email) {
  const trimmed = String(email || '').trim();
  if (!trimmed || validateEmail(trimmed)) return null;
  return 'El email no es válido';
}

export function validateRequired(value, fieldName) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return `${fieldName} es obligatorio`;
  return null;
}

export function validateLoginForm({ email, password }) {
  const errors = {};
  const emailError = validateRequired(email, 'El email');
  if (emailError) errors.email = emailError;
  else if (!validateEmail(email)) errors.email = 'El email no es válido';

  const passError = validateRequired(password, 'La contraseña');
  if (passError) errors.password = passError;

  return errors;
}

export function validateRegisterStep1({ nombre, apellido, domicilio, pais, dni_frente, dni_dorso }) {
  const errors = {};
  if (validateRequired(nombre, 'El nombre')) errors.nombre = validateRequired(nombre, 'El nombre');
  if (validateRequired(apellido, 'El apellido')) errors.apellido = validateRequired(apellido, 'El apellido');
  if (validateRequired(domicilio, 'El domicilio')) errors.domicilio = validateRequired(domicilio, 'El domicilio');
  if (validateRequired(pais, 'El país')) errors.pais = validateRequired(pais, 'El país');
  if (!dni_frente?.uri) errors.dni_frente = 'Subí la foto del frente del DNI';
  if (!dni_dorso?.uri) errors.dni_dorso = 'Subí la foto del dorso del DNI';
  return errors;
}

function validateNewPassword(password) {
  if (validateRequired(password, 'La contraseña')) return validateRequired(password, 'La contraseña');
  if (String(password).length < 8) return 'La contraseña debe tener al menos 8 caracteres';
  if (!/\d/.test(String(password))) return 'La contraseña debe contener al menos un número';
  return null;
}

export function validateRegisterStep2({
  email,
  provisionalPassword,
  provisionalInput,
  newPassword,
  confirmPassword,
}) {
  const errors = {};
  if (validateRequired(email, 'El email')) errors.email = validateRequired(email, 'El email');
  else if (getEmailValidationError(email)) errors.email = 'El email no es válido';
  else if (!provisionalPassword) {
    errors.email = 'Confirmá el email para generar tu contraseña provisoria';
  }

  if (validateRequired(provisionalInput, 'La contraseña provisoria')) {
    errors.provisionalPassword = validateRequired(provisionalInput, 'La contraseña provisoria');
  } else if (provisionalPassword && provisionalInput !== provisionalPassword) {
    errors.provisionalPassword = 'No coincide con la contraseña provisoria generada';
  }

  const newPasswordError = validateNewPassword(newPassword);
  if (newPasswordError) errors.newPassword = newPasswordError;
  else if (provisionalInput && newPassword === provisionalInput) {
    errors.newPassword = 'La nueva contraseña debe ser distinta a la provisoria';
  }

  if (newPassword !== confirmPassword) errors.confirmPassword = 'Las contraseñas no coinciden';
  return errors;
}

export function validateNewItem({ titulo, descripcion, categoria }) {
  const errors = {};
  if (validateRequired(titulo, 'El título')) errors.titulo = validateRequired(titulo, 'El título');
  if (validateRequired(descripcion, 'La descripción')) {
    errors.descripcion = validateRequired(descripcion, 'La descripción');
  } else if (String(descripcion).trim().length < 10) {
    errors.descripcion = 'La descripción debe tener al menos 10 caracteres';
  }
  if (validateRequired(categoria, 'La categoría')) errors.categoria = validateRequired(categoria, 'La categoría');
  return errors;
}

export function formatCurrency(value) {
  return `$${Number(value).toLocaleString('es-AR')}`;
}
