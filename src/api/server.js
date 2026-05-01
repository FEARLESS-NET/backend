import express from 'express'
import productsRouter from '../routes/productsRouter.js';
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000


const allowedOrigins = [
    "http://localhost:5173", 
    "https://qrcode-7c3v.vercel.app",
    "https://qrcode-7c3v-o1ctmk9yf-leorics-projects-e9b8f6c0.vercel.app" // Xatoda chiqqan manzil
];

// server.js ichida CORS qismini shunday almashtiring:

app.use(cors({
    origin: '*', // Hamma manzillarga ruxsat berish
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true 
}));

app.use(express.json())

// Routerlar
app.use('/api/v1', productsRouter)

app.listen(PORT, () => {
    console.log(`Server running on: http://localhost:${PORT}`)
})