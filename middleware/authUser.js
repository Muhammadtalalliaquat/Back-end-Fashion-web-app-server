import jwt from "jsonwebtoken";
import User from "../models/user.js";
import sendResponse from "../helpers/Response.js";

// async function autheUser(req, res, next) {
//     try {
//         // console.log(`req.headers =>`, req.headers);

//         const bearer = req?.headers?.authorization;

//         if (!bearer || !bearer.startsWith("Bearer ")) {
//             return sendResponse(res, 403, null, true, 'Token not provided or invalid format.');
//         }

//         const token = bearer.split(" ")[1];

//         const decode = jwt.verify(token, process.env.AUTH_SECRET);

//         if (decode) {
//             const user = await User.findById(decode._id);

//             if (user) {
//                 req.user = user;
//                 next();
//             } else {
//                 return sendResponse(res, 403, null, true, "User not found.");
//             }
//         } else {
//             return sendResponse(res, 403, null, true, "Invalid token.");
//         }
//     } catch (error) {
//         console.error("Authentication Error:", error.message);
//         return sendResponse(res, 401, null, true, "Unauthorized. Invalid token.");
//     }
// }

export const autheUser = async (req, res, next) => {
  try {
    const bearer = req.headers.authorization;
    console.log("Decoded Token:", bearer);

    if (!bearer || !bearer.startsWith("Bearer ")) {
      return sendResponse(
        res,
        403,
        null,
        true,
        "Token not provided or invalid format."
      );
    }

    const token = bearer.split(" ")[1];
    const decode = jwt.verify(token, process.env.AUTH_SECRET);

    // console.log("Decoded Token:", decode);

    if (!decode?.id) {
      return sendResponse(res, 403, null, true, "Invalid token payload.");
    }

    const user = await User.findById(decode.id);
    if (!user) {
      console.log("User not found in DB");
      return sendResponse(res, 403, null, true, "User not found.");
    }

    req.user = user;

    // console.log("Authenticated User:", req.user);
    next();
  } catch (error) {
    console.error("Authentication Error:", error.message);
    return sendResponse(res, 401, null, true, "Unauthorized. Invalid token.");
  }
};



export const isAdminCheck = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return sendResponse(res, 401, null, true, "Unauthorized access");
    }

    const user = await User.findById(req.user.id);

    // console.log("Decoded Token:", req.user);
    console.log("Database User:", user);

    if (!user || user.isAdmin !== true) {
      return sendResponse(res, 403, null, true, "Access denied. Admins only");
    }

    next();
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
};
