require('dotenv').config({ path: '.env.local' });
const express = require("express");
const passport = require("passport");
const MicrosoftStrategy = require("passport-microsoft").Strategy;
const session = require("express-session");
const mongoose = require("mongoose");
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const TENANT_ID = process.env.TENANT_ID;
const connectToMongo = require('./db');
const http = require("http");
const { Server } = require("socket.io");
const Bins = require('./models/Bins');


connectToMongo();

const app = express();

const cors = require("cors");

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// THIS is the correct one
server.listen(5000, () => console.log("🚀 Server running on port 5000"));

app.use(
  session({
    secret: "cleantrack-secret",
    resave: false,
    saveUninitialized: false
  })
);

app.use(express.json());
//app.use(express.urlencoded({ extended: true }));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/bins', require('./routes/bins'));
app.use('/api/sms', require('./routes/sms'));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(
  new MicrosoftStrategy(
    {
      clientID: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      callbackURL: "http://localhost:5000/auth/microsoft/callback",
      scope: ["user.read"],
      tenant: TENANT_ID
    },
    async (accessToken, refreshToken, profile, done) => {
      const user = {
        id: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value
      };
      return done(null, user);
    }
  )
);

app.get(
  "/auth/microsoft",
  passport.authenticate("microsoft")
);

app.get(
  "/auth/microsoft/callback",
  passport.authenticate("microsoft", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("http://localhost:3000/");
  }
);


app.post("/simulate-bin", async (req, res) => {
  try {
    const { binId, fillLevel } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(binId)) {
      return res.status(400).json({ success: false, message: "Invalid binId" });
    }

    // Find bin
    const bin = await Bins.findById(binId);
    if (!bin) {
      return res.status(404).json({ success: false, message: "Bin not found" });
    }

    // Update fill level
    bin.currentFillLevel = fillLevel;

    // Auto-calculate status
    const percentage = (fillLevel / bin.capacity) * 100;

    if (percentage === 0) {
      bin.status = "empty";
    } else if (percentage < 80) {
      bin.status = "half-full";
    } else {
      bin.status = "full";
    }

    await bin.save();

    const updatedBin = {
      _id: bin._id,
      currentFillLevel: bin.currentFillLevel,
      status: bin.status,
      updatedAt: bin.updatedAt
    };

    // Emit to all clients
    io.emit("binUpdated", updatedBin);

    res.json({ success: true, data: updatedBin });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

//socket.io connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
});

app.listen(5000, () => console.log("Server running"));