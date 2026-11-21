// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // Public OAuth Web client ID (safe in client code). Never put the client secret here.
  googleWebClientId: '794169073039-4jru6dvfq2crk7kvvdkbgp793sebeulc.apps.googleusercontent.com',
  apiBaseUrl: 'http://localhost:8000/api/v1',
  // DEV ONLY: when true, skip the backend call and fake a session. Off now that the API is available.
  useMockApi: false,
  // DEV ONLY: temporary email/password login (independent of useMockApi). Null in production.
  mockLogin: { email: 'hello@gmail.com', password: '12345' } as { email: string; password: string } | null,
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
