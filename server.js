const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable absolute cross-origin sharing loops across mobile devices and laptops
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup safe binary document uploads framework directories
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// UNIVERSAL ROUTING CURE: Force the server to read index.html dynamically from root or public folder
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, 'public')));

// Configure Multer to intercept and write image or PDF attachments cleanly onto local server drives
const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'uploads/'); },
    filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });

// Define Cloud Schema Core Specifications
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

// REST API Endpoints: Public Verified Data Streams
app.get('/api/topics', async (req, res) => {
    try {
        const approvedTopics = await Topic.find({ approved: true }).sort({ createdAt: -1 });
        res.json(approvedTopics);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// REST API Endpoints: Public Ingestion Queue Handler
app.post('/api/topics/submit', upload.single('attachment'), async (req, res) => {
    try {
        const { subject, semester, title, content } = req.body;
        const filePath = req.file ? `/uploads/${req.file.filename}` : null;
        const fileName = req.file ? req.file.originalname : null;

        const newTopic = new Topic({ subject, semester, title, content, filePath, fileName });
        await newTopic.save();
        res.json({ success: true, message: 'Submitted successfully! Content safely queued for Admin Sandbox Verification.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// REST API Endpoints: Admin Identity Verification Portal Node
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'shivam' && password === 'project11') {
        res.json({ success: true, token: 'secure_session_token_shivam' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid Admin credentials' });
    }
});

// REST API Endpoints: Admin Sandbox Pending Items Dataset
app.get('/api/admin/pending', async (req, res) => {
    try {
        const pendingTopics = await Topic.find({ approved: false }).sort({ createdAt: -1 });
        res.json(pendingTopics);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// REST API Endpoints: Sync modifications globally across platforms upon approval
app.post('/api/admin/approve/:id', async (req, res) => {
    try {
        await Topic.findByIdAndUpdate(req.params.id, { approved: true });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// REST API Endpoints: Purge Rejected Content Blocks Completely
app.delete('/api/admin/reject/:id', async (req, res) => {
    try {
        await Topic.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Catch-all route to serve index.html directly if a user navigates to the root path
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'), (err) => {
        if (err) {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        }
    });
});

// Initialize Cloud Database Cluster Loop and Ignite Express Server
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        app.listen(PORT, () => console.log(`[SUCCESS] Backend Database Core active on port ${PORT}`));
    })
    .catch(err => console.error('Database connection error:', err));
