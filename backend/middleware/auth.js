const jwt = require("jsonwebtoken");
const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, "../.env")
});

const JWT_SECRET = process.env.JWT_SECRET || "smart_construction_super_secret_2026";

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.substring(7).trim()
        : null;

    if (!token) {
        return res.status(401).json({
            success: false,
            error: "Authentication required. No token provided."
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                error: "Invalid or expired token."
            });
        }

        req.user = user;
        next();
    });
}

module.exports = {
    authenticateToken,
    JWT_SECRET
};

