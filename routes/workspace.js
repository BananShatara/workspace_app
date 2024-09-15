const express = require('express');
const { db } = require('../config/db-config');
const { authToken } = require('../middleware/middleware');

const worksRouter = express.Router();

worksRouter.post('/create_workspace', authToken,(req, res) => {
    const { workspace_name} = req.body;
    const { user } = req;

    if (!user || !user.user_id) {
        return res.status(400).json({ message: 'User not authenticated' });
    }

    //check if there are any workspace
    const chechQuery = 'SELECT * FROM workspace';
    db.query(chechQuery, (err, allworkspaces) => {
        if (err) return res.send(err);

        // if no workspace exist, allow this user to create the first workspace as admin
        if(allworkspaces.length === 0) {
            const insertQuery = 'INSERT INTO workspace (workspace_name, user_id) VALUES (?, ?)';
            db.query(insertQuery, [workspace_name, user.user_id], (err, result) => {
                if (err) return res.send(err);

                const workspace_id = result.insertId; 
                // insert the creator as admin in the relation table
                const inserRelQuery = 'INSERT INTO relation (workspace_id, user_id, is_admin) VALUES (?, ?, 1)';
                db.query(inserRelQuery, [workspace_id, user.user_id], (err, result) => {
                    if (err) return res.send(err);
                    res.json({'message': 'Workspace created successfully. You are the admin.'});
                }); 
            });
        }
        else {
            // if workspace exits, check if the current user is an admin
            const query = 'SELECT * FROM relation WHERE user_id = ? AND is_admin = 1';
            db.query(query, [user.user_id], (err, result) => {
                if (err) return res.send(err);
                if (result.length == 0) {
                    return res.json({'message': 'You are not an admin, cannot create workspace.'});
                }
                // Check if is_admin is specified in the request body
                //const isAdmin = is_admin === 1 || is_admin === "1" ? 1 : 0;

                // Insert new workspace
                const insertQuery = 'INSERT INTO workspace (workspace_name, user_id) VALUES (?, ?)';
                db.query(insertQuery, [workspace_name, user.user_id], (err, result) => {
                    if (err) {
                        console.error('Error inserting workspace: ', err);
                        return res.status(500).json({'message': 'Internal server error'});
                    }
                    const workspace_id = result.insertId;

                    //add the current user as an admin in the relation table
                    const inserRelQuery = 'INSERT INTO relation (workspace_id, user_id, is_admin) VALUES (?, ?, 1)';
                    db.query(inserRelQuery, [workspace_id, user.user_id], (err, result) => {
                        if (err) return res.status(500).json({'message': 'Internal server error'});
                        res.json({"message": "Workspace created successfully."});
                    });
                });
        }); }
    });
});

worksRouter.post('/add_user', authToken, (req, res) => {
    const { user_id, workspace_id } = req.body;
    const { user } = req;
    // check if the current user is an admin for this workspace
    const query = 'SELECT * FROM relation WHERE user_id = ? AND workspace_id = ? AND is_admin = 1';
    db.query(query, [user.user_id, workspace_id], (err, result) => {
        if (err) return res.json(err);
        if(result.length === 0) {
            return res.json({"message": "You are not an admin for this workspace."});
        }

        //check if the user is already in the workspace 
        const usercheckquery = 'SELECT * FROM relation where user_id = ? AND workspace_id = ?';
        db.query(usercheckquery, [user_id, workspace_id], (err, result) => {
            if (err) return res.json(err);
            if(result.length > 0) {
                return res.json({'message':'User is already in this workspace.'});
            }
        
        //Admin found, now add the new user
        const addQuery = 'INSERT INTO relation (workspace_id, user_id, is_admin) VALUES (?, ?, 0)';
        db.query(addQuery, [workspace_id, user_id], (err, result) => {
            if (err) return res.send(err);
            res.json({'message': 'User added to workspace.'});
        });
    });
});
});

worksRouter.post('/remove_user', authToken, (req, res) => {
    const { user_id, workspace_id } = req.body;
    const { user } = req;

    console.log(`Removing user_id: ${user_id} from workspace_id: ${workspace_id} by admin user_id: ${user.user_id}`);


    const query = 'SELECT * FROM relation WHERE user_id = ? AND workspace_id = ? AND is_admin = 1';
    db.query(query, [user.user_id, workspace_id], (err, result) => {
        if (err) return res.json(err);
        if(result.length === 0) {
            return res.json({"message": "You are not an admin for this workspace."});
        }
    //check if the user is already in the workspace 
    const usercheckquery = 'SELECT * FROM relation where user_id = ? AND workspace_id = ?';
    db.query(usercheckquery, [user_id, workspace_id], (err, result) => {
        if (err) return res.json(err);
        if(result.length === 0) {
            return res.json({'message':'User is not found in this workspace.'});
        }

    
    //Admin found, now remove the user
    const deleteQuery = 'DELETE FROM relation WHERE user_id = ? AND workspace_id = ?';
    db.query(deleteQuery, [user_id, workspace_id], (err, result) => {
        if (err) {
            console.error('Error executing DELETE query:', err);
            return res.send(err);
        }

        // Check if the deletion was successful
        if (result.affectedRows === 0) {
            return res.json({'message': 'No user was removed. The user or workspace may not exist.'});
        }
        res.json({'message': 'User removed from workspace.'});
    });
});
});
});


module.exports = worksRouter;