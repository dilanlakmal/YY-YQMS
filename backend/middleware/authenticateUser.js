import jwt from "jsonwebtoken";

const authenticateUser = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decodedToken.userId;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Authentication failed",
      error: error.message
    });
  }
};

export default authenticateUser;
