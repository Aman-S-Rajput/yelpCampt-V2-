const express = require("express");
const router = express.Router({ mergeParams: true });
const Campground = require("../models/campground");
const catchAsync = require("../utils/catchAsync");
const Review = require("../models/reviews");
router.delete(
  "/:reviewId",
  catchAsync(async (req, res) => {
    // console.log(req.params);
    const { id, reviewId } = req.params;

    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });

    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Successfully deleted the review!");
    res.redirect(`/campground/${id}`);
  })
);
router.post(
  "/",
  catchAsync(async (req, res) => {
    const { id } = req.params;

    const newReview = new Review(req.body.review);
    await newReview.save();

    const camp = await Campground.findById(id);
    camp.reviews.push(newReview._id);
    await camp.save();

    const reviews = await Review.find({ _id: { $in: camp.reviews } });
    req.flash("success", "Successfully created a new review!");
    res.redirect("campground/show", { camp, reviews });
  })
);

module.exports = router;
