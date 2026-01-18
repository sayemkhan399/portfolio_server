const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const expressAsyncHandler = require("express-async-handler");
const { MongoClient, ServerApiVersion } = require("mongodb");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

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
    try {
      const { name, email, message } = req.body;

      if (!name || !email || !message) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Mail
      const mailOptions = {
        from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
        to: process.env.RECEIVER_EMAIL,
        replyTo: email,
        subject: `New Message from ${name}`,
        html: `<p>${message}</p>`,
      };

      await transporter.sendMail(mailOptions);

      res.status(200).json({ message: "Message sent successfully" });
    } catch (err) {
      console.error("Contact route error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }),
);

// =====================
// MongoDB (unchanged)
// =====================
const uri = `mongodb+srv://${process.env.NAME}:${process.env.PASSWORD}@cluster0.7hhptyu.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  await client.connect();
  console.log("✅ MongoDB connected");

  const db = client.db("portfolio");

  app.get("/projects", async (req, res) => {
    res.send(await db.collection("projects").find().toArray());
  });

  app.get("/experience", async (req, res) => {
    res.send(await db.collection("experience").find().toArray());
  });

  app.get("/blogs", async (req, res) => {
    res.send(await db.collection("blogs").find().toArray());
  });
  app.get("/blogs/:id", async (req, res) => {
    const id = req.params.id;
    const blogs = await db.collection("blogs").find().toArray();
    const blog = blogs.find((b) => b.id === id);
    res.send(blog ? [blog] : []);
  });

  // await client.close();
}
run().catch(console.error);

app.get("/", (req, res) => {
  res.send("API is running...");
});

// =====================
// Start server (local only)
// =====================
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;