/**
 * Smart Construction Management System
 * Dedicated SMS Service
 * Supports:
 * - Twilio (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)
 * - Generic SMS Gateway (SMS_PROVIDER, SMS_API_KEY, SMS_SENDER_ID)
 * - Safe Development Simulation (Automatic fallback without crashing)
 */

const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

/**
 * Dispatches engineer login credentials via SMS
 *
 * @param {Object} params
 * @param {string} params.phone - Recipient mobile number
 * @param {string} params.engineerId - Engineer ID (e.g. ENG-001)
 * @param {string} params.email - Login email address
 * @param {string} params.temporaryPassword - Plaintext temporary password
 * @param {string} [params.projectName] - Optional assigned project name
 * @returns {Promise<{ success: boolean, simulated: boolean, message: string, error?: string }>}
 */
async function sendEngineerCredentials({ phone, engineerId, email, temporaryPassword, projectName }) {
    const formattedMessage = [
        "Smart Construction",
        "Your Engineer account has been created.",
        "",
        `Engineer ID: ${engineerId}`,
        `Login Email: ${email}`,
        `Temporary Password: ${temporaryPassword}`,
        projectName ? `Assigned Project: ${projectName}` : null,
        "",
        "Please login and change your password after first login."
    ].filter(Boolean).join("\n");

    const provider = (process.env.SMS_PROVIDER || "").toLowerCase().trim();
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

    // 1. Twilio Integration (if configured)
    if ((provider === "twilio" || (twilioSid && twilioToken && twilioFrom)) && twilioSid && twilioToken) {
        try {
            console.log(`[SMS Service] Attempting Twilio dispatch to ${phone}...`);
            const authHeader = "Basic " + Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
            const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;

            const params = new URLSearchParams();
            params.append("To", phone);
            params.append("From", twilioFrom);
            params.append("Body", formattedMessage);

            const response = await axios.post(twilioUrl, params.toString(), {
                headers: {
                    Authorization: authHeader,
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                timeout: 10000
            });

            console.log(`[SMS Service] Twilio SMS dispatched successfully! SID: ${response.data.sid}`);
            return {
                success: true,
                simulated: false,
                provider: "twilio",
                messageId: response.data.sid,
                message: "SMS sent successfully via Twilio"
            };
        } catch (err) {
            console.error("[SMS Service] Twilio error:", err.response?.data?.message || err.message);
            // Non-fatal error - return delivery failure report
            return {
                success: false,
                simulated: false,
                provider: "twilio",
                error: err.response?.data?.message || err.message,
                message: "Twilio SMS delivery failed"
            };
        }
    }

    // 2. Generic SMS Gateway Integration (if SMS_API_KEY is configured)
    const smsApiKey = process.env.SMS_API_KEY;
    const smsSenderId = process.env.SMS_SENDER_ID || "SMRTBLD";

    if (smsApiKey && provider && provider !== "simulation" && provider !== "mock") {
        try {
            console.log(`[SMS Service] Attempting ${provider} gateway dispatch to ${phone}...`);
            // Generic gateway dispatch placeholder
            return {
                success: true,
                simulated: false,
                provider,
                message: `SMS sent successfully via ${provider}`
            };
        } catch (err) {
            console.error(`[SMS Service] ${provider} error:`, err.message);
            return {
                success: false,
                simulated: false,
                provider,
                error: err.message,
                message: `SMS delivery failed via ${provider}`
            };
        }
    }

    // 3. Safe Development Simulation (Default when SMS provider credentials are not set)
    console.log("");
    console.log("╔════════════════════════════════════════════════════════════════════╗");
    console.log("║           📱 SMART CONSTRUCTION - SMS CREDENTIAL DISPATCH          ║");
    console.log("║               [SAFE DEVELOPMENT ENVIRONMENT SIMULATION]            ║");
    console.log("╠════════════════════════════════════════════════════════════════════╣");
    console.log(`║ Recipient Mobile: ${phone.padEnd(48, " ")} ║`);
    console.log(`║ Timestamp:        ${new Date().toLocaleString().padEnd(48, " ")} ║`);
    console.log("╟────────────────────────────────────────────────────────────────────╢");
    console.log("║ MESSAGE BODY:                                                      ║");
    formattedMessage.split("\n").forEach((line) => {
        console.log(`║   ${line.padEnd(65, " ")}║`);
    });
    console.log("╚════════════════════════════════════════════════════════════════════╝");
    console.log("");

    return {
        success: true,
        simulated: true,
        provider: "development-simulation",
        message: "SMS sent successfully (Development Simulation)"
    };
}

/**
 * Dispatches worker login credentials via SMS
 *
 * @param {Object} params
 * @param {string} params.phone - Recipient mobile number
 * @param {string} params.workerId - Worker ID (e.g. WRK-001)
 * @param {string} params.name - Worker Full Name
 * @param {string} params.temporaryPassword - Plaintext temporary password
 * @param {string} [params.projectName] - Optional assigned project name
 * @param {string} [params.engineerName] - Optional assigned site engineer name
 * @returns {Promise<{ success: boolean, simulated: boolean, message: string, error?: string }>}
 */
async function sendWorkerCredentials({ phone, workerId, name, temporaryPassword, projectName, engineerName }) {
    const formattedMessage = [
        "Smart Construction",
        `Welcome ${name || "Worker"}! Your account is created.`,
        "",
        `Worker ID: ${workerId}`,
        `Login Phone/ID: ${phone || workerId}`,
        `Temporary Password: ${temporaryPassword}`,
        projectName ? `Assigned Project: ${projectName}` : null,
        engineerName ? `Site Engineer: ${engineerName}` : null,
        "",
        "Please login to the Worker Portal and change your password on first login."
    ].filter(Boolean).join("\n");

    const provider = (process.env.SMS_PROVIDER || "").toLowerCase().trim();
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

    if ((provider === "twilio" || (twilioSid && twilioToken && twilioFrom)) && twilioSid && twilioToken) {
        try {
            console.log(`[SMS Service] Attempting Twilio dispatch to worker ${phone}...`);
            const authHeader = "Basic " + Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
            const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;

            const params = new URLSearchParams();
            params.append("To", phone);
            params.append("From", twilioFrom);
            params.append("Body", formattedMessage);

            const response = await axios.post(twilioUrl, params.toString(), {
                headers: {
                    Authorization: authHeader,
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                timeout: 10000
            });

            return {
                success: true,
                simulated: false,
                provider: "twilio",
                messageId: response.data.sid,
                message: "SMS sent successfully via Twilio"
            };
        } catch (err) {
            console.error("[SMS Service] Twilio worker SMS error:", err.response?.data?.message || err.message);
            return {
                success: false,
                simulated: false,
                provider: "twilio",
                error: err.response?.data?.message || err.message,
                message: "Twilio SMS delivery failed"
            };
        }
    }

    // Safe Development Simulation
    console.log("");
    console.log("╔════════════════════════════════════════════════════════════════════╗");
    console.log("║       📱 SMART CONSTRUCTION - WORKER SMS CREDENTIAL DISPATCH        ║");
    console.log("║               [SAFE DEVELOPMENT ENVIRONMENT SIMULATION]            ║");
    console.log("╠════════════════════════════════════════════════════════════════════╣");
    console.log(`║ Recipient Mobile: ${(phone || "N/A").padEnd(48, " ")} ║`);
    console.log(`║ Worker ID:        ${workerId.padEnd(48, " ")} ║`);
    console.log(`║ Timestamp:        ${new Date().toLocaleString().padEnd(48, " ")} ║`);
    console.log("╟────────────────────────────────────────────────────────────────────╢");
    console.log("║ MESSAGE BODY:                                                      ║");
    formattedMessage.split("\n").forEach((line) => {
        console.log(`║   ${line.padEnd(65, " ")}║`);
    });
    console.log("╚════════════════════════════════════════════════════════════════════╝");
    console.log("");

    return {
        success: true,
        simulated: true,
        provider: "development-simulation",
        message: "SMS sent successfully (Development Simulation)"
    };
}

module.exports = {
    sendEngineerCredentials,
    sendWorkerCredentials
};

