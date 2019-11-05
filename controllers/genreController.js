var Genre = require('../models/genre');
var Book = require('../models/book');
var async = require('async');
const validator = require('express-validator');
const { body,validationResult } = require('express-validator');
const { sanitizeBody } = require('express-validator');

// Display list of all Genre.
exports.genre_list = function(req, res) {
    Genre.find()
    .sort([['name',  'ascending']])
    .exec(function (err, list_genre) {
        if (err) {return next(err); }
        //Successful, so render
        res.render('genre_list', { title: 'Genre List', genre_list: list_genre });
    });

};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {

    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
              .exec(callback);
        },

        genre_books: function(callback) {
            Book.find({ 'genre': req.params.id })
              .exec(callback);
        },

    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre==null) { // No results.
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books } );
    });

};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res, next) {     
    res.render('genre_form', { title: 'Create Genre' });
  };

// Handle Genre create on POST.
exports.genre_create_post =  [
   
    // Validate that the name field is not empty.
    validator.body('name', 'Genre name required').isLength({ min: 1 }).trim(),
    
    // Sanitize (escape) the name field.
    validator.sanitizeBody('name').escape(),
  
    // Process request after validation and sanitization.
    (req, res, next) => {
  
      // Extract the validation errors from a request.
      const errors = validator.validationResult(req);
  
      // Create a genre object with escaped and trimmed data.
      var genre = new Genre(
        { name: req.body.name }
      );
  
  
      if (!errors.isEmpty()) {
        // There are errors. Render the form again with sanitized values/error messages.
        res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array()});
        return;
      }
      else {
        // Data from form is valid.
        // Check if Genre with same name already exists.
        Genre.findOne({ 'name': req.body.name })
          .exec( function(err, found_genre) {
             if (err) { return next(err); }
  
             if (found_genre) {
               // Genre exists, redirect to its detail page.
               res.redirect(found_genre.url);
             }
             else {
  
               genre.save(function (err) {
                 if (err) { return next(err); }
                 // Genre saved. Redirect to genre detail page.
                 res.redirect(genre.url);
               });
  
             }
  
           });
      }
    }
  ];

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res) {
    
    async.parallel({
        genre: function(callback) {
          Genre.findById(req.params.id).exec(callback)
      },
      book: function (callback) {
        Book.find({ 'genre': req.params.id }).exec(callback)
      }
    }, function(err,results) {
      if (err) { return next(err); }
      if (results.genre==null) // No results.
        res.redirect('/catalog/genres');
        // Successful, so render.
        res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, books: results.book } );
    });
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res) {

  async.parallel({
    genre: function(callback) {
        Genre.findById(req.params.id).exec(callback)
    },
    book: function (callback) {
        Book.find({ 'genre': req.params.id }).exec(callback)
    }
  }, function(err, results) {
        if (err) {return next(err); }
        if (results.book > 0) {
            // genre has books. render same was as get route
            res.rend('genre_delete', { title: 'Delete Genre', genre: results.genre, book: results.book } );
            return;
        }
        else {
            // genre has no books. delete object and redirect to the list of genres.
            Genre.findByIdAndDelete(req.body.genreid, function deleteGenre(err) {
                if (err) {return next(err); }
                //success - go to genre list
                res.redirect('/catalog/genres')
            });
        }
  })
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res) {
    
    // get current genre for form.
    Genre.findById(req.params.id)
    .exec( function (err, genre) {
        if (err) {return next(err); }
        // successful so render
        res.render('genre_form', {title : 'Update Genre', genre: genre });
    })
};

// Handle Genre update on POST.
exports.genre_update_post = [

    //validate field
    body('name', 'Name must not be empty.').isLength({ min: 1}).trim(),

    // sanitize fields
    sanitizeBody('name').escape(),

    //process request after validation and sanitization
    (req, res, next) => {
        //extract the validation errors from a request.
        const errors = validationResult(req);

        // create a genre with escaped/trimmed data and old id.
        var genre = new Genre(
            { name: req.body.name,
            _id: req.params.id // this is required or a new id will be assigned
        })
        if (!errors.isEmpty()) {
            // there are errors. render form again with sanitized values/error message
            res.render('genre_form', {title: 'Update Genre', genre: genre });
        }
        else {
            Genre.findByIdAndUpdate(req.params.id, genre, {}, function (err,thegenre) {
                if (err) {
                    return next(err);
                }
                // successful - redirect to genre page.
                res.redirect(thegenre.url);
            });
        }
    }
];