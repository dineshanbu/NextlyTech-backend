const express = require("express");
const router = express.Router();
const user = require('./user.route');
const techNews = require("./techNews.route")
const subcategories = require("./subcategories.route")
const staticPages = require('./staticPages.route')
const reviews = require('./reviews.route')
const comments = require('./comments.route')
const categories = require('./categories.route')
const auth = require('./auth.route')
const aiReview = require('./AI_Generator/aiReview.route')
const media = require('./media.routes')
const home = require('./home.route')
const comparsion = require('./comparsion.route')

router.use("/user", user);
router.use("/techNews", techNews);
router.use("/subcategories", subcategories);
router.use("/staticPages", staticPages);
router.use("/reviews", reviews);
router.use("/comments", comments);
router.use("/categories", categories);
router.use("/auth", auth);
router.use("/aiReview", aiReview);
router.use("/media", media);
router.use("/home", home);
router.use("/comparison", comparsion);

module.exports = router