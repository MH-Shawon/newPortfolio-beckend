const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const config = require("./config");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// Mongoose Project Schema and Model
const projectSchema = new mongoose.Schema({
  id: String,
  title: String,
  description: String,
  longDescription: String,
  image: String,
  tags: [String],
  demoLink: String,
  codeLink: String,
  featured: Boolean,
  challenges: String,
  solutions: String,
  createdAt: { type: Date, default: Date.now },
});

const Project = mongoose.model("Project", projectSchema);

// --- API Routes ---
// Get all projects
app.get("/api/projects", async (req, res) => {
  try {
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

// Add a new project
app.post("/api/projects", async (req, res) => {
  try {
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
    const { id } = req.params;
    const updatedProject = await Project.findByIdAndUpdate(id, req.body, {
      new: true,
    });
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
    const { id } = req.params;
    const deletedProject = await Project.findByIdAndDelete(id);
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
