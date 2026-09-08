import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",
});

/*
|--------------------------------------------------------------------------
| Request Interceptor
|--------------------------------------------------------------------------
*/

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(
        "recruitx_token"
      );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  }
);

/*
|--------------------------------------------------------------------------
| Response Interceptor
|--------------------------------------------------------------------------
*/

let redirectingToLogin = false;

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status =
      error.response?.status;

    const requestUrl =
      error.config?.url || "";

    const token =
      localStorage.getItem(
        "recruitx_token"
      );

    /*
    |--------------------------------------------------------------------------
    | Invalid / Expired Authenticated Session
    |--------------------------------------------------------------------------
    |
    | Do not treat a normal wrong-password response from /auth/login
    | as an expired session.
    |
    */

    if (
      status === 401 &&
      token &&
      !requestUrl.includes(
        "/auth/login"
      )
    ) {
      localStorage.removeItem(
        "recruitx_token"
      );

      localStorage.removeItem(
        "recruitx_user"
      );

      if (!redirectingToLogin) {
        redirectingToLogin = true;

        window.location.replace(
          "/login?reason=session-expired"
        );
      }
    }

    return Promise.reject(error);
  }
);

export default api;