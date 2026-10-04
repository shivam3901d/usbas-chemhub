const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin requests so your frontend can communicate with your backend
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static('public'));

// Configure Disk Storage Engine for handling raw Images and PDFs of any size
const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'public/uploads/'); },
    filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });

// Define MongoDB Cloud Schema Layout
const TopicSchema = new mongoose.Schema({
    subject: String,
    semester: String,
    title: String,
    content: String,
    filePath: String,
    fileName: String,
    approved: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});
const Topic = mongoose.model('Topic', TopicSchema);

// API Endpoints: Fetch Globally Approved Records
app.get('/api/topics', async (req, res) => {
    try {
        const approvedTopics = await Topic.find({ approved: true }).sort({ createdAt: -1 });
        res.json(approvedTopics);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// API Endpoints: Public Ingestion Endpoint (Queues for verification)
app.post('/api/topics/submit', upload.single('attachment'), async (req, res) => {
    try {
        const { subject, semester, title, content } = req.body;
        const filePath = req.file ? `/uploads/${req.file.filename}` : null;
        const fileName = req.file ? req.file.originalname : null;

        const newTopic = new Topic({ subject, semester, title, content, filePath, fileName });
        await newTopic.save();
        res.json({ success: true, message: 'Submitted successfully! Content is safely queued for Admin Verification.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// API Endpoints: Administrative Authentication Gateway Validation
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'shivam' && password === 'project11') {
        res.json({ success: true, token: 'secure_session_token_shivam' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid Admin credentials' });
    }
});

// API Endpoints: Fetch Pending Items for Dashboard Moderation
app.get('/api/admin/pending', async (req, res) => {
    try {
        const pendingTopics = await Topic.find({ approved: false }).sort({ createdAt: -1 });
        res.json(pendingTopics);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// API Endpoints: Action endpoint to Approve and Publish Live globally
app.post('/api/admin/approve/:id', async (req, res) => {
    try {
        await Topic.findByIdAndUpdate(req.params.id, { approved: true });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// API Endpoints: Action endpoint to Reject and Purge Records
app.delete('/api/admin/reject/:id', async (req, res) => {
    try {
        await Topic.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Connect to MongoDB Database and Boot Server Instance
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chemhub')
    .then(() => {
        app.listen(PORT, () => console.log(`[SUCCESS] Backend Database Core active on port ${PORT}`));
    })
    .catch(err => console.error('Database connection error:', err));
