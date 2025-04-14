
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
