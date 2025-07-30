const express = require('express');
const cors = require('cors');
const errorHandler = require("./middleware/error");
const routes = require("./routes/index.route");
const path = require("path");
const connectDB = require("../config/database");
const bodyparser = require('body-parser');
const app = express();
const http = require('http');
const server = http.createServer(app);
// Load environment variables
require('dotenv').config();

// Connect to the database
connectDB()
    .then(() => console.log('Database connected successfully'))
    .catch((err) => console.error('Database connection failed:', err));

// Middleware
app.use(cors());

app.use(bodyparser.json({ limit: "50mb" }));
app.use(bodyparser.urlencoded({ extended: true, limit: "50mb" }));
// Serve the assetlinks.json
app.use('/.well-known', express.static(path.join(__dirname, 'public/.well-known')));
app.use(express.static(path.join(process.cwd(), 'public')))
//app.use(express.static(path.join(__dirname, "../public")));
app.enable("trust proxy");



// Routes
app.use("/", routes);
app.use(errorHandler);



// Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


