export default [
  {
    path: "/api/auth/register",
    target: "http://auth:" + process.env.AUTH_PORT + "/register",
    auth: false,
  },
  {
    path: "/api/register",
    target: "http://register:" + process.env.REGISTER_PORT,
    auth: true,
  },
];
