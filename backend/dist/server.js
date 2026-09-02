"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const prisma_1 = __importDefault(require("./config/prisma"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const vacancy_routes_1 = __importDefault(require("./routes/vacancy.routes"));
const candidate_routes_1 = __importDefault(require("./routes/candidate.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/api/auth", auth_routes_1.default);
app.use("/api/vacancies", vacancy_routes_1.default);
app.use("/api/candidates", candidate_routes_1.default);
app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        message: "RecruitX API is running",
    });
});
app.get("/api/db-health", async (req, res) => {
    try {
        const userCount = await prisma_1.default.user.count();
        res.status(200).json({
            status: "ok",
            message: "RecruitX database is connected",
            userCount,
        });
    }
    catch (error) {
        console.error("Database connection error:", error);
        res.status(500).json({
            status: "error",
            message: "Database connection failed",
        });
    }
});
app.listen(PORT, () => {
    console.log(`RecruitX server is running on port ${PORT}`);
});
