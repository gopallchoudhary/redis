import express from "express";
import Redis from "ioredis";

const app = express();
app.use(express.json());
const redis = new Redis();

function otpKey(phone) {
	return `otp:${phone}`;
}

app.post("/otp", async (req, res) => {
    const { phone } = req.body;
	const otp = Math.floor(100000 + Math.random() * 900000).toString();
	await redis.set(otpKey(phone), otp, "EX", 30); // valid for 30 seconds
	res.status(400).json({ message: "OTP sent", otp });
});

app.post("/otp/verify", async (req, res) => {
	const { phone, otp } = req.body;

	const savedOtp = await redis.get(otpKey(phone));
	if (!savedOtp) {
		return res.status(400).json({ message: "OTP expired or not found" });
	}

	if (savedOtp !== otp) {
		return res.status(400).json({ message: "OTP invalid" });
	}

	await redis.del(otpKey(phone));
	res.status(200).json({ message: "OTP verified" });
});

app.get("/otp/:phone/ttl", async (req, res) => {
	const ttl = await redis.ttl(otpKey(req.params.phone));
	res.status(200).json({ message: "OTP TTL", ttl });
});


app.listen(3000, () => {
	console.log("Server is running on port http://localhost:3000");
});