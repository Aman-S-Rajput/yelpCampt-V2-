const mongoose = require("mongoose");
const Campground = require("../models/campground");
const cities = require("./cities");
const descip = require("./seedHelpers");
const { title } = require("process");
mongoose
  .connect("mongodb://localhost:27017/yelp-camp")
  .then(() => {
    console.log("MongoDB database connected");
  })
  .catch((err) => {
    console.error("Connection error in mongoose:", err);
  });

const seedDB = async () => {
  await Campground.deleteMany({});
  for (let i = 0; i < 50; i++) {
    const c = new Campground({
      location: `${cities[i].city}, ${cities[i].state}`,
      title: descip[i].title,
      image: "https://picsum.photos/400?random=${Math.random()}`,",
      description: "I Love this place",
      price: 15,
    });
    await c.save();
  }
};
seedDB();
