const express = require('express');
const router = express.Router();
const serviceRoute = require("./service.route")

router.use('/api', serviceRoute);

router.use('*', async (req, res, next) => {
    return res
        .status(405)
        .json({
            statusCode: 405,
            message: "Invalid Request"
        });
});

module.exports = router;