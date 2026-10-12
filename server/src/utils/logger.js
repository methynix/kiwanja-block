function write(level, event, data) {
  const line = JSON.stringify({ level, event, at: new Date().toISOString(), ...data });
  if (level === 'error') console.error(line);
  else console.log(line);
}

export const logger = {
  info: (event, data = {}) => write('info', event, data),
  error: (event, data = {}) => write('error', event, data),
  security: (event, data = {}) => write('security', event, data),
};

export function maskPhone(phone = '') {
  return phone.length > 6 ? `${phone.slice(0, 6)}***${phone.slice(-2)}` : '***';
}
