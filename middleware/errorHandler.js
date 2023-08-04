
const errorHandler = (err, req, res, next) => {
  console.error(err); // Log the error for debugging purposes

  if (res.statusCode === 500) {
    res.status(500).render('server500', { error: err }); // server500.ejs for 500 errors
  } else if (res.statusCode === 404) {
    res.status(404).render('server404'); // server404.ejs for 404 errors
  } else {
    res.status(res.statusCode).json({ error: err.message }); // Sending JSON response with error message for other status codes
  }
};

module.exports = {
  errorHandler,
};
