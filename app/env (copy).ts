function getEnvVariable(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  AUTH0_DOMAIN: getEnvVariable('dev-ybbg2zog6lrpmyqw.us.auth0.com'),
  AUTH0_CLIENT_ID: getEnvVariable('Qk5z2GdkhvUwPK8LihXxy3WMK1F2Hjis'),
  AUTH0_CLIENT_SECRET: getEnvVariable('RzKSW4jywHnJPiU8qlVIYsLhEEwPDr4vaelHdyyuftBGjHhrKaLc-KegdQB9N-ds'),
  AUTH0_AUDIENCE: getEnvVariable('https://dev-ybbg2zog6lrpmyqw.us.auth0.com/api/v2/'),
};