require('dotenv').config({ path: '.env.local' });
const express = require("express");
const passport = require("passport");
const MicrosoftStrategy = require("passport-microsoft").Strategy;
const session = require("express-session");
const CLIENT_ID= process.env.CLIENT_ID;
const CLIENT_SECRET= process.env.CLIENT_SECRET;
const TENANT_ID= process.env.TENANT_ID;

const app = express();
console.log("Client ID:", CLIENT_ID);
console.log("Client Secret:", CLIENT_SECRET);

app.use(
  session({
    secret: "cleantrack-secret",
    resave: false,
    saveUninitialized: false
  })
);

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

app.listen(5000, () => console.log("Server running"));