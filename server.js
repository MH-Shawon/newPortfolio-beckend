const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const config = require("./config");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Set content-type header for all responses
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  next();
});

// MongoDB Connection
const connectDB = async () => {
  try {
    if (!config.mongoUri) {
      throw new Error("MONGODB_URI is not defined");
    }

    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    // Don't exit in production, let Vercel handle the error
    if (process.env.NODE_ENV !== "production") {
      process.exit(1);
    }
  }
};

// Connect to MongoDB
connectDB();

// Mongoose Project Schema and Model
const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  longDescription: String,
  image: { type: String, required: true },
  tags: [String],
  demoLink: String,
  codeLink: String,
  featured: { type: Boolean, default: false },
  challenges: String,
  solutions: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Project = mongoose.model("Project", projectSchema);

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Portfolio Backend API" });
});

// --- API Routes ---
// Get all projects
app.get("/api/projects", async (req, res) => {
  try {
    if (!mongoose.connection.readyState) {
      throw new Error("Database not connected");
    }
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// Get featured projects
app.get("/api/projects/featured", async (req, res) => {
  try {
    const featuredProjects = await Project.find({ featured: true }).sort({
      createdAt: -1,
    });
    res.json(featuredProjects);
  } catch (error) {
    console.error("Error fetching featured projects:", error);
    res.status(500).json({ error: "Failed to fetch featured projects" });
  }
});

// Get a single project by ID
app.get("/api/projects/:id", async (req, res) => {
  try {
    if (!mongoose.connection.readyState) {
      throw new Error("Database not connected");
    }

    const projectId = req.params.id;
    console.log("Fetching project with ID:", projectId);

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      console.log("Invalid project ID format:", projectId);
      return res.status(400).json({ message: "Invalid project ID format" });
    }

    const project = await Project.findById(projectId);
    console.log("Found project:", project ? "yes" : "no");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

// Add a new project
app.post("/api/projects", async (req, res) => {
  try {
    if (!mongoose.connection.readyState) {
      throw new Error("Database not connected");
    }
    const newProject = new Project(req.body);
    await newProject.save();
    res.status(201).json(newProject);
  } catch (error) {
    console.error("Error adding project:", error);
    res.status(500).json({ error: "Failed to add project" });
  }
});

// Update a project by ID
app.put("/api/projects/:id", async (req, res) => {
  try {
    if (!mongoose.connection.readyState) {
      throw new Error("Database not connected");
    }

    const projectId = req.params.id;
    console.log("Updating project with ID:", projectId);

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      console.log("Invalid project ID format:", projectId);
      return res.status(400).json({ message: "Invalid project ID format" });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
});

// Delete a project by ID
app.delete("/api/projects/:id", async (req, res) => {
  try {
    if (!mongoose.connection.readyState) {
      throw new Error("Database not connected");
    }

    const projectId = req.params.id;
    console.log("Deleting project with ID:", projectId);

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      console.log("Invalid project ID format:", projectId);
      return res.status(400).json({ message: "Invalid project ID format" });
    }

    const deletedProject = await Project.findByIdAndDelete(projectId);

    if (!deletedProject) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
    dbConnected: mongoose.connection.readyState === 1,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

// For local development
if (process.env.NODE_ENV !== "production") {
  app.listen(config.port, () => {
    console.log(
      `Server is running on port ${config.port} in ${config.nodeEnv} mode`
    );
  });
}

// Export the Express API
module.exports = app;
