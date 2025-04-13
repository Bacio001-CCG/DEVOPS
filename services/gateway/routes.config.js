export default [
  // Auth routes
  {
    path: "/api/auth/register",
    target: "http://auth:" + process.env.AUTH_PORT + "/register",
    auth: false,
    health: "http://auth:" + process.env.AUTH_PORT + "/health",
  },
  {
    path: "/api/auth/login",
    target: "http://auth:" + process.env.AUTH_PORT + "/login",
    auth: false,
    health: "http://auth:" + process.env.AUTH_PORT + "/health",
  },
  
  // Register routes
  {
    path: "/api/register",
    target: "http://register:" + process.env.REGISTER_PORT,
    auth: true,
    authOrg: true,
    health: "http://register:" + process.env.REGISTER_PORT + "/health",
  },  
  {
    path: "/api/register/target/:target/results",
    target: "http://register:" + process.env.REGISTER_PORT + "/target/:target/results",
    auth: true,
    authOrg: true,
    health: "http://register:" + process.env.REGISTER_PORT + "/health",
  },  
  {
    path: "/api/register/target/:target",
    target: "http://register:" + process.env.REGISTER_PORT + "/target/:target/photo/:photoId",
    auth: true,
    authOrg: true,
    health: "http://register:" + process.env.REGISTER_PORT + "/health",
  },
  {
    path: "/api/register/target/:target/photo/:photoId",
    target: "http://register:" + process.env.REGISTER_PORT + "/target/:target/photo/:photoId",
    auth: true,
    authOrg: true,
    health: "http://register:" + process.env.REGISTER_PORT + "/health",
  },

  // Target routes
  {
    path: "/api/target/:target/photo",
    target: "http://target:" + process.env.TARGET_PORT + "/:target/photo",
    auth: true,
    health: "http://target:" + process.env.TARGET_PORT + "/health",
  },
  {
    path: "/api/target/:target/my-scores",
    target: "http://target:" + process.env.TARGET_PORT + "/:target/my-scores",
    auth: true,
    health: "http://target:" + process.env.TARGET_PORT + "/health",
  },
  {
    path: "/api/target/photo/:photoId",
    target: "http://target:" + process.env.TARGET_PORT + "/photo/:photoId",
    auth: true,
    health: "http://target:" + process.env.TARGET_PORT + "/health",
  },

  // Read routes  
  {
    path: "/api/read/active-targets",
    target: "http://read:" + process.env.READ_PORT + "/active-targets",
    auth: false,
    health: "http://read:" + process.env.READ_PORT + "/health",
  },
  {
    path: "/api/read/ended-targets",
    target: "http://read:" + process.env.READ_PORT + "/ended-targets",
    auth: false,
    health: "http://read:" + process.env.READ_PORT + "/health",
  },
];
