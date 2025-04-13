export default [
  {
    path: "/api/auth/register",
    target: "http://auth:" + process.env.AUTH_PORT + "/register",
    auth: false,
    health: "http://auth:" + process.env.AUTH_PORT + "/health",
  },
  {
    path: "/api/register",
    target: "http://register:" + process.env.REGISTER_PORT,
    auth: true,
    authOrg: true,
    health: "http://register:" + process.env.REGISTER_PORT + "/health",
  },  
];
