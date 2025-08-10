const express = require("express");
const router = express.Router();
const Campground = require("../models/campground");
const catchAsync = require("../utils/catchAsync");
const campgroundSchema = require("../schemas.js").campgroundSchema;
const ExpressError = require("../utils/expressError");

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

router.get(
  "/",
  catchAsync(async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render("campground/campground", { campgrounds });
  })
);

// NEW
router.get("/new", (req, res) => {
  res.render("campground/new");
});

// CREATE
router.post(
  "/",
  validateCampground,
  catchAsync(async (req, res) => {
    const newCamp = new Campground(req.body.camp);
    await newCamp.save();
    req.flash("success", "Successfully created a new campground!");
    res.redirect(`/campground/${newCamp._id}`);
  })
);

// SHOW

router.get(
  "/:id",
  catchAsync(async (req, res) => {
    const camp = await Campground.findById(req.params.id).populate("reviews");
    if (!camp) {
      req.flash("error", "Campground not found");
      return res.redirect("/campground");
    }
    res.render("campground/show", { camp, reviews: camp.reviews });
  })
);

// EDIT
router.get(
  "/:id/edit",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const camp = await Campground.findById(id);
    if (!camp) throw new ExpressError("Campground not found", 404);
    req.flash("success", "Successfully loaded the edit page!");
    res.render("campground/edit", { camp });
  })
);

// UPDATE
router.put(
  "/:id",
  validateCampground,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const cmp = await Campground.findByIdAndUpdate(
      id,
      { ...req.body.camp },
      { runValidators: true, new: true }
    );
    req.flash("success", "Successfully updated the campground!");
    if (!cmp) throw new ExpressError("Campground not found", 404);
    res.redirect(`/campground/${cmp._id}`);
  })
);

// DELETE
router.delete(
  "/:id",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const deleted = await Campground.findByIdAndDelete(id);
    if (!deleted) throw new ExpressError("Campground not found", 404);
    req.flash("success", "Successfully deleted the campground!");
    res.redirect("/campground");
  })
);
module.exports = router;
