import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

async function testGroq() {
    const key = process.env.GROQ_API_KEY;
    console.log("Testing Groq with key:", key ? key.substring(0, 10) + "..." : "MISSING");
    
    if (!key || key === 'your_key_here') {
        console.error("GROQ_API_KEY is not configured correctly in .env");
        return;
    }

    const groq = new Groq({ apiKey: key });
    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: "hi" }],
            model: "llama-3.3-70b-versatile",
        });
        console.log("Groq Success:", completion.choices[0].message.content);
    } catch (err: any) {
        console.error("Groq Failed:", err.message);
        if (err.status) console.error("Status Code:", err.status);
    }
}

testGroq();
