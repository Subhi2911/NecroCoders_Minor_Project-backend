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
const User = require("./models/User");
const PORT = process.env.PORT || 5000;
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";


connectToMongo();

const app = express();

const cors = require("cors");

const allowedOrigins = [
  "http://localhost:3000",
  `${FRONTEND_URL}`
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

app.set("trust proxy", 1);

// app.use(
//   session({
//     secret: "cleantrack-secret",
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//       secure: process.env.NODE_ENV === "production",
//       sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
//     }
//   })
// );

const MongoStore = require("connect-mongo");

app.use(
  session({
    secret: "cleantrack-secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
  })
);



app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());


function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

//app.use(express.urlencoded({ extended: true }));
app.use('/api/alerts', ensureAuth, require('./routes/alerts'));
app.use('/api/bins', ensureAuth, require('./routes/bins'));
app.use('/api/sms', ensureAuth, require('./routes/sms'));
app.use('/api/staffs', ensureAuth, require('./routes/staffs'));
app.use('/api/zones', ensureAuth, require('./routes/zones'));




app.get("/api/auth/user", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }

  res.json({ success: true, user: req.user });
});

passport.serializeUser((user, done) => {
  done(null, user.id); // store MongoDB _id
});

app.get("/api/auth/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return res.status(500).json({ success: false, message: "Logout failed" });
    }

    req.session.destroy(() => {
      res.clearCookie("connect.sid"); // session cookie
      res.json({ success: true, message: "Logged out" });
    });
  });
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});


passport.use(
  new MicrosoftStrategy(
    {
      clientID: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      callbackURL: process.env.NODE_ENV === "production"
        ? `${BACKEND_URL}/auth/microsoft/callback`
        : "http://localhost:5000/auth/microsoft/callback",
      scope: ["user.read"],
      tenant: TENANT_ID
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        console.log("Microsoft profile:", profile);
        console.log("User", User);
        let user = await User.findOne({ microsoftId: profile.id });

        if (!user) {
          // Create new user
          user = await User.create({
            microsoftId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

app.get(
  "/auth/microsoft",
  passport.authenticate("microsoft")
);
console.log("ENV:", process.env.NODE_ENV, process.env.NODE_ENV === "production");

app.get(
  "/auth/microsoft/callback",
  passport.authenticate("microsoft", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect(
      process.env.NODE_ENV === "production"
        ? `${FRONTEND_URL}`
        : "http://localhost:3000"
    );
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

// THIS is the correct one
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));