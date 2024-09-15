const express = require('express');
const { JWT_SECRET_KEY, JWT_EXP_TIME } = require('../config/jwt-config');
const { db } = require('../config/db-config');
const jwt = require('jsonwebtoken');

db.query('SELECT 1 + 1 AS solution', (err, result) => {
    if (err) {
        console.error('Test query failed:', err);
    } else {
        console.log('Test query result:', result);
    }
});

const router = express.Router();


router.post('/signup', (req, res) => {
    const { username, email, password, account_type } = req.body;

    if (!username || !email || !password || !account_type)  {
        return res.json({'message': 'All fields are required!'});
    }
    // Check if username or email already exists
    const chechQuery = 'SELECT * FROM user WHERE username = ? OR email = ?';
    db.query( chechQuery, [username, email], (err, result) => {
        if (err) {
            console.error('Error checking username/email:', err);
            return res.json({'message': 'server error. Please try again later.'});
        }
        // If username or email already exists
        if (result.length > 0) {
            if(result[0].username === username) {
                return res.json({'message': 'Username already exists. Please choose a different one.'});
            }
            if(result[0].email === email) {
                return res.json({'message': 'Email already registered. Please use a different email.'});
            }
        }
        //Insert new user since username and email are unique
        const insertQuery = 'INSERT INTO user (username, email, password, account_type) VALUES (?, ?, ?, ?)';
        db.query(insertQuery, [username, email, password, account_type], (err, result) => {
            if (err) {
                console.error('Signup error: ', err);
                return res.json({'message': 'Server error. Please try again later.'});
            }

            // Signup successful
            res.json({'message': 'Signup successful!'});
    });
    });
});

router.post('/login', (req, res) => {
    console.log('Request body:', req.body);

    const { username, password } = req.body;

    console.log('Username:', username, 'Password:', password);

    if (!username || !password) {
        return res.json({'message': 'Username and password required!'});
    }
    const query = 'select * from user where username = ?'
    db.query(query, [username], (err,result) => {
        if (err) {
            console.error('Login error: ', err);
            return res.send(err);
        }
        if ( !result || result.length === 0 || result[0].password !== password) {
           return res.json({"message": "Invalid username or password!"});
        }
        const user = result[0];
        const tokenPayload = {
            user_id: user.user_id,
            username: user.username,
        };
        const token = jwt.sign(tokenPayload, JWT_SECRET_KEY, {expiresIn: JWT_EXP_TIME});
        //res.json({access_token: token});
   
        
    // Check if the user has a workspace and if they are an admin
    const workspaceQuery = 'SELECT * FROM workspace WHERE user_id = ?';
    db.query(workspaceQuery, [user.user_id], (err, workspaceResult) => {
        if (err) {
            console.error('Workspace query error: ', err);
            return res.send(err);
        }
        console.log('Workspace result:', workspaceResult); // Debugging output to check the query result

        if (workspaceResult.length > 0) {
            const workspace = workspaceResult[0];

            console.log('Workspace found:', workspace); // Log the workspace details for debugging

            const message = workspace.is_admin
            ? 'Welcome to your workspace, you are an admin. You can manage users.'
            : 'Welcome to your workspace.';

            return res.json ({
                access_token: token,
                message: message,
                workspace_name: workspace.workspace_name,
                is_admin: workspace.is_admin
            });
        }    
        else {
            console.log('No workspace found for user:', user.user_id); // Log if no workspace found

            return res.json ({
                access_token: token,
                message: 'No workspace found. You can create a new workspace.'
        });
    }
});
    });
});




const blacklist = new Set();

router.get('/logout', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        const decoded = jwt.decode(token);
        blacklist.add(decoded.jti)        // Add the JWT ID to the blacklist
        res.json({ message: 'Successfully logged out' });
});
});

module.exports = router;
