const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const Joi = require("joi");
const Campground = require("./models/campground");
const Review = require("./models/reviews");

const catchAsync = require("./utils/catchAsync");
const ExpressError = require("./utils/expressError");
const { campgroundSchema } = require("./schemas.js");

const validateCampground = (req, res, next) => {
  campgroundSchema.validate();
  const result = campgroundSchema.validate(req.body);
  if (result.error) {
    const message = result.error.details.map((el) => el.message).join(",");
    throw new ExpressError(message, 400);
  } else {
    next();
  }
};

mongoose
  .connect("mongodb://localhost:27017/yelp-camp")
  .then(() => {
    console.log("MongoDB database connected");
  })
  .catch((err) => {
    console.error("Connection error in mongoose:", err);
  });

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Home
app.get("/", (req, res) => {
  res.render("home");
});

// INDEX
app.get(
  "/campground",
  catchAsync(async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render("campground/campground", { campgrounds });
  })
);

// NEW
app.get("/campground/new", (req, res) => {
  res.render("campground/new");
});

app.post(
  "/campground/:id/reviews",
  catchAsync(async (req, res) => {
    const { id } = req.params;

    const newReview = new Review(req.body.review);
    await newReview.save();

    const camp = await Campground.findById(id);
    camp.reviews.push(newReview._id);
    await camp.save();

    const reviews = await Review.find({ _id: { $in: camp.reviews } });

    res.render("campground/show", { camp, reviews });
  })
);

app.delete(
  "/campground/:id/review/:reviewId",
  catchAsync(async (req, res) => {
    const { id, reviewId } = req.params;

    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });

    await Review.findByIdAndDelete(reviewId);

    res.redirect(`/campground/${id}`);
  })
);

// CREATE
app.post(
  "/campground",
  validateCampground,
  catchAsync(async (req, res) => {
    const newCamp = new Campground(req.body.camp);
    await newCamp.save();
    res.redirect(`/campground/${newCamp._id}`);
  })
);

// SHOW
app.get(
  "/campground/:id",
  catchAsync(async (req, res) => {
    const camp = await Campground.findById(req.params.id).populate("reviews");
    res.render("campground/show", { camp, reviews: camp.reviews });
  })
);

// EDIT
app.get(
  "/campground/:id/edit",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const camp = await Campground.findById(id);
    if (!camp) throw new ExpressError("Campground not found", 404);
    res.render("campground/edit", { camp });
  })
);

// UPDATE
app.put(
  "/campground/:id",
  validateCampground,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const cmp = await Campground.findByIdAndUpdate(
      id,
      { ...req.body.camp },
      { runValidators: true, new: true }
    );
    if (!cmp) throw new ExpressError("Campground not found", 404);
    res.redirect(`/campground/${cmp._id}`);
  })
);

// DELETE
app.delete(
  "/campground/:id",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const deleted = await Campground.findByIdAndDelete(id);
    if (!deleted) throw new ExpressError("Campground not found", 404);
    res.redirect("/campground");
  })
);

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
