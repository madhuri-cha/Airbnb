
exports.getLogin=(req, res, next)=>{
    res.render('auth/login', {
        pageTitle:'login',
        currentPage:'login',
        isLoggedIn:false})
}; 

exports.postLogin=(req, res, next)=>{

    console.log(req.body);
    // req.isLoggedIn=true;
    //req.cookie('isLoggedIn', true);
    req.session.isLoggedIn=true; // Set the session variable
    res.redirect('/');
//res.render('store/host-list', {pageTile:'edit home', editing:false, isLoggedIn:req.isLoggedIn})
};
exports.postLogout=(req, res, next)=>{
    //res.clearCookie('isLoggedIn'); // Clear the cookie
    //res.cookie('isLoggedIn', false); // Clear the session variable
    req.session.destroy(()=>{
        res.redirect('/login'); // Redirect to login page after destroying the session
    }); // Destroy the session
   
}
exports.getSignup=(req,res,next)=>{
    res.render('auth/signup', {
        pageTitle:'signup',
        currentPage:'signup',
        isLoggedIn:false,
        errors:[],
        oldInput:{
            username:'',
            email:'',
            password:'',
            userType:'',
            confirmPassword:''
        }
    })
}

exports.postSignup=[
    
    check("username")
    .trim()
    .notEmpty()
    .isLength({ min: 5})
    .withMessage("Username should be at least 5 characters long")
    .mathces(/^[a-zA-Z\s]+$/)
    .withMessage("Username should be contain only letters")
    ,
   
    check("email")
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail()
    ,

    check("password")
    .isLength({min:8})
    .withMessage("Password should be 8 characters Long")
    .matches(/[A-Z]/)
    .withMessage("Password should contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password should contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password should contain at least one number")
    .matches(/[!@#$%^&*]/)
    .withMessage("Password should contain at least one special character")
    .trim()
    ,

    check("confirmPassword")
    .trim()
    .custom((value, {req})=>{
        if(value !== req.body.password)
        {
            throw new Error("password and confirm password should be same")
        }
        return true;
    })
    ,
    check('userType')
    .notEmpty()
    .withMessage("Please select a userType")
    .isIn(['host', 'guest'])
    .withMessage("Please select a valid userType")
     ,
     check('terms')
     .notEmpty()
     .withMessage("Please accept the terms and conditions")
     .custom((value, {req})=>{
        if(value !== 'on')
        {
            throw new Error("Please accept the terms and conditions")
        }
        return true;
     }),

    (req, res, next)=>{
        const errors=validationResult(req);
        if(!errors.isEmpty())
        {
            return res.status(422).renser('auth/signup',
                {
                    pageTitle: 'signup',
                    currentPage: 'signup',
                    isLoggedIn: false,
                    errorMessages: errors.array().map((err)=> err.msg),
                    oldInput:
                    {
                      username, email, password, userType
                    }
                });
        }
        res.redirect('/login')
    }

    ]
