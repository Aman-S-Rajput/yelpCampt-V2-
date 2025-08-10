const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const flash = require("connect-flash");
const ejsMate = require("ejs-mate");
const session = require("express-session");

const ExpressError = require("./utils/expressError");
const campgroundRoutes = require("./routes/campground");
const reviewRoutes = require("./routes/reviews");
mongoose
  .connect("mongodb://localhost:27017/yelp-camp")
  .then(() => {
    console.log("MongoDB database connected");
  })
  .catch((err) => {
    console.error("Connection error in mongoose:", err);
  });

const app = express();

app.use(flash());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const sessionconfig = {
  secret: "thisshouldbe a long secret",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  },
};

app.use(session(sessionconfig));

app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.use("/campground/:id/review", reviewRoutes);
app.use("/campground", campgroundRoutes);

// Home
app.get("/", (req, res) => {
  res.render("home");
});

// INDEX

// 404 handler
app.all(/(.*)/, (req, res, next) => {
  next(new ExpressError("Page not found", 404));
});

// Error handler
app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Something Went Wrong";
  res.status(statusCode).render("error", { err });
});

app.listen(3000, () => {
  console.log("Listening on Server 3000");
});
