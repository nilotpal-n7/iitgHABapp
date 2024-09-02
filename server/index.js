// server/index.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const testRoute = require('./modules/test/testRoute');
const itemRoute = require('./modules/item/itemRoute.js');
const userRoute = require('./modules/user/userRoute.js');
const complaintRoute = require('./modules/complaint/complaintRoute.js');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
 
// MongoDB connection
mongoose.connect(process.env.MONGODB_URI||"mongodb+srv://simonrema123:EjUpwxJIBMCceCN8@cluster0.upn97.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.log(err));

// Basic route
app.get('/', (req, res) => {
    res.send('Backend is running');
});

// hello route
app.get('/hello', (req, res) => {
    res.send('Hello from server');
});
//test route
app.use('/api/test', testRoute);

//item route
app.use('/api/items', itemRoute);

//user route
app.use('/api/users', userRoute);

//complaint route
app.use('/api/complaints', complaintRoute);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
