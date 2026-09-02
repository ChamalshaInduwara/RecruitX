import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./config/prisma";
import authRoutes from "./routes/auth.routes";
import vacancyRoutes from "./routes/vacancy.routes";
import candidateRoutes from "./routes/candidate.routes";
import applicationRoutes from "./routes/application.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/vacancies", vacancyRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/applications", applicationRoutes);


app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "RecruitX API is running",
  });
});

app.get("/api/db-health", async (req, res) => {
  try {
    const userCount = await prisma.user.count();

    res.status(200).json({
      status: "ok",
      message: "RecruitX database is connected",
      userCount,
    });
  } catch (error) {
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