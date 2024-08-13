function getEnvVariable(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  AUTH0_DOMAIN: getEnvVariable('AUTH0_DOMAIN'),
  AUTH0_CLIENT_ID: getEnvVariable('AUTH0_CLIENT_ID'),
  AUTH0_CLIENT_SECRET: getEnvVariable('AUTH0_CLIENT_SECRET'),
  AUTH0_AUDIENCE: getEnvVariable('AUTH0_AUDIENCE'),
  SESSION_SECRET: getEnvVariable('SESSION_SECRET'),
  AUTH0_CALLBACK_URL: getEnvVariable('AUTH0_CALLBACK_URL'),
};