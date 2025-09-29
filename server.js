const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const twilio = require("twilio");

// Twilio credentials
const accountSid = "AC50150ab41fafc05ded6da245396df4a5";
const authToken = "580a047f15532cac1214d35a655b373b";
const client = twilio(accountSid, authToken);
const twilioWhatsAppNumber = "whatsapp:+919330744875";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// AI API setup
const API_KEY = "AIzaSyC_UMp1JaCu9APPqKTfQGJXtXM3y_3f5NA";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
const prompt = "You are a public health AI assistant. Answer only health-related queries. Provide disease symptoms, preventive measures, vaccination schedules. Respond in the same language the user writes. If the question is not health-related, politely refuse.";

// WhatsApp webhook endpoint
app.post("/whatsapp", async (req, res) => {
  console.log("Incoming message:", req.body);

  const incomingMsg = req.body.Body;
  const from = req.body.From;

  if (!incomingMsg) {
    return res.sendStatus(400);
  }

  try {
    // Call AI API
    let botReply = "Sorry, I could not get an answer right now.";

    try {
      const response = await axios.post(API_URL, {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt + "\n" + incomingMsg }]
          }
        ]
      });

      botReply = response.data.candidates[0].content.parts[0].text;
    } catch (apiError) {
      console.error("AI API error:", apiError.response?.data || apiError.message);
      // Fallback response
      botReply = "Hello! I am your health assistant. Please ask a health-related question.";
    }

    // Send reply back to WhatsApp
    await client.messages.create({
      body: botReply,
      from: twilioWhatsAppNumber,
      to: from
    });

    res.sendStatus(200);
  } catch (error) {
    console.error("Twilio error:", error);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
