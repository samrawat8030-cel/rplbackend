const express = require("express");
require("dotenv").config();
const cors = require("cors");
const sendEmailHandler = require("./api/send-email");
const checkAadhaarHandler = require("./api/check-aadhaar");

const app = express();
app.use(cors({ origin: "https://rplleague.com" })); // frontend domain
app.use(express.json());

const apiRouter = express.Router();
apiRouter.post("/send-email", sendEmailHandler);
apiRouter.post("/check-aadhaar", checkAadhaarHandler);

app.use("/api", apiRouter);

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
