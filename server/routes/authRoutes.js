const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { createUser, findUserbyEmail } = require('../models/userModel')
const { authenticate, authorize } = require('../middleware/authMiddleware')

const router = express.Router();

//Register Route
router.post('/register', async (req, res) => {
    console.log('BODY', req.body);
    const { email, password_hash, role } = req.body;

    try {
        const existingUser = await findUserbyEmail(email);
        if (existingUser) {
            return res.status(400).json({message: 'User already exists'})
    }

    const hashedPassword = await bcrypt.hash(password_hash, 10);

    const user = await createUser(email, hashedPassword, role || 'customer');

    res.status(201).json({ message: 'User created', user });
    } catch (err) {
    res.status(500).json({ error: err.message });
    }
});

//Login Route
router.post('/login', async (req, res) => {
    const { email, password_hash } = req.body;

    try {
        const user = await findUserbyEmail(email);
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials'});
        }
        
        const isMatch = await bcrypt.compare(password_hash, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials'});
        } 
        
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.cookie('token', token, { httpOnly: true });

        res.json({ message: 'Logged in'});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Logout Route
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ mesage: 'Logged out' });
});

//Protected Route
router.get('/profile', authenticate, (req, res) => {
    res.json({ message: 'Profile date', user: req.user });
});

module.exports = router;