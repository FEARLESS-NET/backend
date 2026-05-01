import express from 'express'
import productsRouter from '../routes/productsRouter.js';
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000


const allowedOrigins = [
    "http://localhost:5173", 
    "https://qrcode-7c3v.vercel.app" 
]

app.use(cors({
    origin: function (origin, callback) {
        // origin mavjud bo'lmasa (masalan, Postman'da), ruxsat berish
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('CORS xatoligi: Bu manzilga ruxsat berilmagan'))
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true 
}))

app.use(express.json())

// Routerlar
app.use('/api/v1', productsRouter)

app.listen(PORT, () => {
    console.log(`Server running on: http://localhost:${PORT}`)
})