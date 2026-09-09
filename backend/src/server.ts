import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./config/prisma";
import authRoutes from "./routes/auth.routes";
import vacancyRoutes from "./routes/vacancy.routes";
import candidateRoutes from "./routes/candidate.routes";
import applicationRoutes from "./routes/application.routes";
import interviewRoutes from "./routes/interview.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import documentRoutes from "./routes/document.routes";
import userRoutes from "./routes/user.routes";
import {errorHandler,notFoundHandler,} from "./middleware/error.middleware";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

const frontendUrl =
  process.env.FRONTEND_URL ||
  "http://localhost:5173";

app.use(
  cors({
    origin: frontendUrl,
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);
app.use(
  express.json({
    limit: "1mb",
  })
);
app.use("/api/auth", authRoutes);
app.use("/api/vacancies", vacancyRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/documents",documentRoutes);
app.use("/api/users",userRoutes);

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

/*
|--------------------------------------------------------------------------
| 404 + Global Errors
|--------------------------------------------------------------------------
*/

app.use(notFoundHandler);

app.use(errorHandler);

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `RecruitX server is running on port ${PORT}`
    );
  }
);