import loginHandler from "../../models/auth/loginHandler.js";
import registerHandler from "../../models/auth/registerHandler.js";
import {
  loginSchema
} from "../../models/auth/validation/schemas.js";

export default async function authController(app) {
  app.post(
    "/login",
    {
      schema: {
        body: loginSchema,
      },
      config: { public: true },
    },
    loginHandler
  );

  app.post(
    "/register",
    { 
      config: { public: true },
    },
    registerHandler
  );
}