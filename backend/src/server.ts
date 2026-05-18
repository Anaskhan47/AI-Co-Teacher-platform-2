import app from './app';

const PORT = process.env.PORT || 5000;

// CRITICAL: Environment Validation
const REQUIRED_ENV = ['JWT_SECRET', 'DATABASE_URL'];
const missingEnv = REQUIRED_ENV.filter(key => !process.env[key]);

if (missingEnv.length > 0) {
    console.error(`\n❌ [CRITICAL] Missing required environment variables: ${missingEnv.join(', ')}`);
    console.error("❌ [CRITICAL] System cannot initialize. Terminating process.\n");
    process.exit(1);
}

app.listen(PORT, () => {
    console.log(`\n✅ AI CO-TEACHER PLATFORM`);
    console.log(`✅ [NODE_ENV] ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ [PORT] ${PORT}`);
    console.log(`✅ Institutional Nexus Backend is live and resilient.\n`);
});
