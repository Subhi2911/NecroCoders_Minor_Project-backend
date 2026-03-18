const express = require("express");
const router = express.Router();
const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

router.post("/send-sms", async (req, res) => {
  const { phone, message } = req.body;
  console.log('hhh');
  console.log(phone);

  try {
    const response = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE, // Twilio number
      to: `+91${phone}` // India number format
    });

    res.json({ success: true, sid: response.sid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

module.exports = router;