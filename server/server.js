const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const invitationRoutes = require('./routes/invitationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Load env vars
dotenv.config({ path: './.env' });

// Connect to database
connectDB();

const app = express();

// Enable CORS for all routes (adjust for production)
app.use(cors());

// Body parser
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: false })); // For parsing application/x-www-form-urlencoded

// --- Temporary test route ---
app.get('/', (req, res) => {
    res.send('Home HealthHR Backend API is running!');
});
// ------------------------------------

// Define Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/documents', require('./routes/documentRoutes')); 
app.use('/api/notifications', notificationRoutes); 
app.use('/api/events', require('./routes/eventRoutes')); 
app.use('/api/renewals', require('./routes/renewalRoutes')); 
app.use('/api/subscriptions', require('./routes/subscriptionRoutes')); 
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/invitations', invitationRoutes); 

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});