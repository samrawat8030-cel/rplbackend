const express = require("express");
require("dotenv").config();
const cors = require("cors");
app.use(cors({ origin: "https://rplleague.com" })); // frontend domain
const emailRoutes = require("./api/send-email");

const app = express();
app.use(express.json());

// Routes
app.use("/api", emailRoutes);

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
