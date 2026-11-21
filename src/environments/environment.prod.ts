export const environment = {
  production: true,
  googleWebClientId: '794169073039-4jru6dvfq2crk7kvvdkbgp793sebeulc.apps.googleusercontent.com',
  // No public backend yet: skip the /auth/identity call. Set to false and fill in apiBaseUrl once the API is online.
  useMockApi: true,
  // DEMO ONLY: lets the hosted build be tried without a backend. Visible in the site's JavaScript, so set to null for real users.
  mockLogin: { email: 'hello@gmail.com', password: '12345' } as { email: string; password: string } | null,
  apiBaseUrl: 'https://api.example.com/api/v1', // TODO: set production API URL
};
