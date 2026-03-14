import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {

  let token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: "Not authorized" });
  }

  token = token.split(" ")[1];

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  req.user = await User.findById(decoded.id).select("-password");

  next();
};

export default protect;