const express = require('express');
const router =express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const nodemailer = require('nodemailer');
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const jwt = require('jsonwebtoken');
const JWT_KEY = "jwtactive987";
const JWT_RESET_KEY = "jwtreset987";
//User Model
const User = require('../models/User');

//Login Page
router.get('/login', function(req,res){
    res.render("login");
})

//Register Page
router.get('/register', function(req,res){
    res.render("register");
})

//Register Handle
router.post('/register', function(req,res){
    const {name, email, password, password2} = req.body;
    let errors = [];

    //Check required fields
    if (!name || !email || !password || !password2){
        errors.push({msg: 'Please enter all fields'});
    }

    //Check passwords match
    if (password !== password2){
        errors.push({msg : 'Passwords do not match'});
    }

    //Check password length
    if (password.length < 6){
        errors.push({msg : 'Password must be at least 6 characters'});
    }

    if (errors.length > 0){
        res.render('register', {
            errors,
            name,
            email,
            password,
            password2
        });
    }else{
        //Validation passed
        User.findOne({email : email})
            .then(function(user){
                if (user){
                    //User exists
                    errors.push({msg : 'Email is already registered'});
                    res.render('register', {
                        errors,
                        name,
                        email,
                        password,
                        password2
                    });
                }else{
                    
                    const oauth2Client = new OAuth2(
                        "173872994719-pvsnau5mbj47h0c6ea6ojrl7gjqq1908.apps.googleusercontent.com", // ClientID
                        "OKXIYR14wBB_zumf30EC__iJ", // Client Secret
                        "https://developers.google.com/oauthplayground" // Redirect URL
                    );
    
                    oauth2Client.setCredentials({
                        refresh_token: "1//04T_nqlj9UVrVCgYIARAAGAQSNwF-L9IrGm-NOdEKBOakzMn1cbbCHgg2ivkad3Q_hMyBkSQen0b5ABfR8kPR18aOoqhRrSlPm9w"
                    });
                    const accessToken = oauth2Client.getAccessToken()
    
                    const token = jwt.sign({ name, email, password }, JWT_KEY, { expiresIn: '30m' });
                    const CLIENT_URL = 'http://' + req.headers.host;
    
                    const output = `
                    <h2>Please click on below link to activate your account</h2>
                    <p>${CLIENT_URL}/users/activate/${token}</p>
                    <p><b>NOTE: </b> The above activation link expires in 30 minutes.</p>
                    `;
    
                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            type: "OAuth2",
                            user: "goyal.14@iitj.ac.in",
                            clientId: "386662144086-pp8ac9jge3ieuvimirb9gpa2geum3jdk.apps.googleusercontent.com",
                            clientSecret: "4gxjOQtYQUPGqD6cBqjuS21R",
                            refreshToken: "1//04xL2BS5YkGegCgYIARAAGAQSNwF-L9IrEyOnv5l8AncZxHUEgqreBgN27NXQkrPiCJNHfDIFy9-XYVu7gh_1C2EopUKxBJ-1A0Y",
                            accessToken: accessToken
                        },
                    });
    
                    // send mail with defined transport object
                    const mailOptions = {
                        from: '"Auth Admin" <goyal.14@iitj.ac.in>', // sender address
                        to: email, // list of receivers
                        subject: "Account Verification: NodeJS Auth ✔", // Subject line
                        generateTextFromHTML: true,
                        html: output, // html body
                    };
    
                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            console.log(error);
                            req.flash(
                                'error_msg',
                                'Something went wrong on our end. Please register again.'
                            );
                            res.redirect('/users/login');
                        }
                        else {
                            console.log('Mail sent : %s', info.response);
                            req.flash(
                                'success_msg',
                                'Activation link sent to email ID. Please activate to log in.'
                            );
                            res.redirect('/users/login');
                        }
                    })  

                    //******************************************************************* */

                    // const newUser = new User({
                    //     name,
                    //     email,
                    //     password
                    // });
                    
                    // //Hash password
                    // bcrypt.genSalt(10, function(err, salt){
                    //     bcrypt.hash(newUser.password, salt, function(err, hash){
                    //         if (err) throw (err);

                    //         //Set password as hashed
                    //         newUser.password = hash;
                    //         //Save user
                    //         newUser.save()
                    //             .then(function(user){
                    //                 req.flash('success_msg', 'You are now registered and can log in');
                    //                 res.redirect('/users/login');
                    //             })
                    //             .catch(function(err){
                    //                 console.log(err);
                    //             });
                    //     })
                    // })
                    /********************************************* */
                };
            });
    }
});

router.get('/activate/:token',function (req,res) {
    const token = req.params.token;
    let errors = [];
    if (token) {
        jwt.verify(token, JWT_KEY, (err, decodedToken) => {
            if (err) {
                req.flash(
                    'error_msg',
                    'Incorrect or expired link! Please register again.'
                );
                res.redirect('/users/register');
            }
            else {
                const { name, email, password } = decodedToken;
                User.findOne({ email: email }).then(user => {
                    if (user) {
                        //------------ User already exists ------------//
                        req.flash(
                            'error_msg',
                            'Email ID already registered! Please log in.'
                        );
                        res.redirect('/users/login');
                    } else {
                        const newUser = new User({
                            name,
                            email,
                            password
                        });

                        bcrypt.genSalt(10, (err, salt) => {
                            bcrypt.hash(newUser.password, salt, (err, hash) => {
                                if (err) throw err;
                                newUser.password = hash;
                                newUser
                                    .save()
                                    .then(user => {
                                        req.flash(
                                            'success_msg',
                                            'Account activated. You can now log in.'
                                        );
                                        res.redirect('/users/login');
                                    })
                                    .catch(err => console.log(err));
                            });
                        });
                    }
                });
            }
        })
    }
    else {
        console.log("Account activation error!")
    }
})

//Login Handle
router.post('/login',function(req,res, next){
    passport.authenticate('local',{
        successRedirect : '/',
        failureRedirect : '/users/login',
        failureFlash : true
    }) (req,res,next);
});

//Logout Handle
router.get('/logout', function(req, res){
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');
})

module.exports = router;