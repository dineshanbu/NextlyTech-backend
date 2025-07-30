module.exports = (req, res, next) => {
    const { page = 1, limit = 0 } = req.body; // Defaults: page = 1, limit = 0 (fetch all)

    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 0;

    req.pagination = {
        skip: parsedLimit > 0 ? (parsedPage - 1) * parsedLimit : 0, // No skip if no limit
        limit: parsedLimit, // 0 means no limit
        page: parsedPage,
    };

    next();
};
