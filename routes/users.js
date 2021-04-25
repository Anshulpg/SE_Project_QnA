const express = require('express');
const router =express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');

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
                    const newUser = new User({
                        name,
                        email,
                        password
                    });
                    const { Auth, LoginCredentials } = require("two-step-auth");

                    async function login(email) {
                    try {
                        const res = await Auth(email, "Help and Forum");
                        console.log(res);
                        console.log(res.mail);
                        console.log(res.OTP);
                        console.log(res.success);
                    } catch (error) {
                        console.log(error);
                    }
                    }

                    // This should have less secure apps enabled
                    LoginCredentials.mailID = "helpandforum@gmail.com";

                    // You can store them in your env variables and
                    // access them, it will work fine
                    LoginCredentials.password = "thisishelp";
                    LoginCredentials.use = true;

                    // Pass in the mail ID you need to verify
                    login("verificationEmail@anyDomain.com");



                    //Hash password
                    bcrypt.genSalt(10, function(err, salt){
                        bcrypt.hash(newUser.password, salt, function(err, hash){
                            if (err) throw (err);

                            //Set password as hashed
                            newUser.password = hash;
                            //Save user
                            newUser.save()
                                .then(function(user){
                                    req.flash('success_msg', 'You are now registered and can log in');
                                    res.redirect('/users/login');
                                })
                                .catch(function(err){
                                    console.log(err);
                                });
                        })
                    })
                };
            });
    }
});

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