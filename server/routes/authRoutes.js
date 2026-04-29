const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { createUser, findUserByEmail } = require('../models/userModel')
const { authenticate, authorize } = require('../middleware/authMiddleware')

const router = express.Router();

//Register Route
router.post('/register', async (req, res) => {
    const { email, password, role } = req.body;

    try {
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({message: 'User already exists'})
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await createUser(email, hashedPassword, role || 'customer');

    res.status(201).json({ message: 'User created', user });
    } catch (err) {
    res.status(500).json({ error: err.message });
    }
});