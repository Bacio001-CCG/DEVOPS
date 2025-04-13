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
    path: "/api/photo/:target/photo",
    target: "http://photo:" + process.env.PHOTO_PORT + "/:target/photo",
    auth: true,
    health: "http://photo:" + process.env.PHOTO_PORT + "/health",
  },
  {
    path: "/api/photo/:target/myScores",
    target: "http://photo:" + process.env.PHOTO_PORT + "/:target/myScores",
    auth: true,
    health: "http://photo:" + process.env.PHOTO_PORT + "/health",
  },
  {
    path: "/api/photo/photo/:photoId",
    target: "http://photo:" + process.env.PHOTO_PORT + "/photo/:photoId",
    auth: true,
    health: "http://photo:" + process.env.PHOTO_PORT + "/health",
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
