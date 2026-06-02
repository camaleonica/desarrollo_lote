export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
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

export function validateRegisterStep1({ nombre, apellido, numero_documento }) {
  const errors = {};
  if (validateRequired(nombre, 'El nombre')) errors.nombre = validateRequired(nombre, 'El nombre');
  if (validateRequired(apellido, 'El apellido')) errors.apellido = validateRequired(apellido, 'El apellido');
  if (validateRequired(numero_documento, 'El documento')) {
    errors.numero_documento = validateRequired(numero_documento, 'El documento');
  } else if (String(numero_documento).trim().length < 6) {
    errors.numero_documento = 'El documento debe tener al menos 6 caracteres';
  }
  return errors;
}

export function validateRegisterStep2({ email, password, confirmPassword }) {
  const errors = {};
  if (validateRequired(email, 'El email')) errors.email = validateRequired(email, 'El email');
  else if (!validateEmail(email)) errors.email = 'El email no es válido';

  if (validateRequired(password, 'La contraseña')) errors.password = validateRequired(password, 'La contraseña');
  else if (String(password).length < 6) errors.password = 'La contraseña debe tener al menos 6 caracteres';

  if (password !== confirmPassword) errors.confirmPassword = 'Las contraseñas no coinciden';
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
