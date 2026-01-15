const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const expressAsyncHandler = require("express-async-handler");
const { MongoClient, ServerApiVersion } = require("mongodb");

dotenv.config();

const app = express();

// =====================
// Middleware
// =====================
app.use(cors());
app.use(express.json());

// =====================
// Nodemailer setup
// =====================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// =====================
// Contact route
// =====================
app.post(
  "/contact",
  expressAsyncHandler(async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    await transporter.sendMail({
      from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL,
      replyTo: email,
      subject: `New Message from ${name}`,
      html: `<p>${message}</p>`,
    });

    res.status(200).json({ message: "Message sent successfully" });
  })
);

// =====================
// MongoDB (serverless-safe)
// =====================
const uri = `mongodb+srv://${process.env.NAME}:${process.env.PASSWORD}@cluster0.7hhptyu.mongodb.net/?appName=Cluster0`;

let client;
let db;

async function connectDB() {
  if (db) return db;

  client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();
  db = client.db("portfolio");
  console.log("✅ MongoDB connected");

  return db;
}

// =====================
// API routes
// =====================
app.get("/projects", async (req, res) => {
  const db = await connectDB();
  res.send(await db.collection("projects").find().toArray());
});

app.get("/experience", async (req, res) => {
  const db = await connectDB();
  res.send(await db.collection("experience").find().toArray());
});

app.get("/blogs", async (req, res) => {
  const db = await connectDB();
  res.send(await db.collection("blogs").find().toArray());
});

app.get("/", (req, res) => {
  res.send("API is running...");
});

// =====================
// Export for Vercel
// =====================
module.exports = app;
