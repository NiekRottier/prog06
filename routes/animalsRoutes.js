let express = require('express');
let Animal = require('../models/animalModel');

let routes = function() {

    let animalRouter = express.Router();

    // Routes for animals collection resource (/api/animals)
    animalRouter.route('/animals')
        // GET request
        .get(function (req, res){
            console.log("GET on api/animals");

            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

            // Find all the animals
            Animal.find({}, function (err, animals) {
                if (err) {
                    res.status(500).send(err);
                }
                else if (!req.header('Accept').includes("application/json") && !req.header('Accept').includes("text/html")) {
                    res.status(422).send("422 - Unprocessable Entity");
                }
                else 
                {
                    // Math magic for pagination
                    let start;
                    let limit;

                    if (req.query.start && req.query.limit) {
                        start = parseInt(req.query.start);
                        limit = parseInt(req.query.limit);
                        console.log("Querystrings were given");
                    }
                    else
                    {
                        start = 1;
                        limit = animals.length
                        console.log("No querystrings were given");
                    }
                    
                    let totalItems = animals.length;
                    let totalPages = Math.ceil(animals.length / limit);
                    
                    let firstPage;
                    let lastPage;
                    let prevPage;
                    let nextPage;

                    let currentItems;
                    let currentPage;

                    // When there is only one page
                    if (totalPages == 1) {
                        firstPage = lastPage = prevPage = nextPage = currentPage = 1;
                        currentItems = animals.length;
                    }
                    else
                    {
                        currentPage = Math.ceil(start / limit);
                        console.log(currentPage);
                        // currentItems
                        if (currentPage == totalPages) { currentItems = totalItems - ((totalPages-1) * limit) } 
                            else { currentItems = limit }

                        firstPage = 1;
                        lastPage = (totalPages-1) * limit + 1;

                        // prevPage
                        if (currentPage == 1) { prevPage = 1 } 
                            else { prevPage = start - limit }
                        // nextPage
                        if (currentPage == totalPages) { nextPage = start }
                            else { nextPage = start + limit }
                        
                    }

                    // Create a variable to put the collection in
                    let animalsCollection = {
                        "items" : [],
                        "_links" : {
                            "self" : { "href" : `http://${req.headers.host}/api/animals` },
                            "collection" : { "href" : `http://${req.headers.host}/api/animals` }
                        },
                        "pagination": {
                            "currentPage" : currentPage,
                            "currentItems" : currentItems,
                            "totalPages" : totalPages,
                            "totalItems" : totalItems,
                            "_links" : {
                                "first" : {
                                    "page" : 1,
                                    "href" : `http://${req.headers.host}/api/animals?start=${firstPage}&limit=${limit}`
                                },
                                "last" : {
                                    "page" : 1,
                                    "href" : `http://${req.headers.host}/api/animals?start=${lastPage}&limit=${limit}`
                                },
                                "previous" : {
                                    "page" : 1,
                                    "href" : `http://${req.headers.host}/api/animals?start=${prevPage}&limit=${limit}`
                                },
                                "next" : {
                                    "page" : 1,
                                    "href" : `http://${req.headers.host}/api/animals?start=${nextPage}&limit=${limit}`
                                }
                            } 
                        }
                    }

                    let animalsOnPage = [];
                    if (totalPages == 1) {
                        animalsOnPage = animals
                    } 
                    else{
                        let startSlice = start - 1;
                        let endSlice = start + limit - 1;
                        animalsOnPage = animals.slice(startSlice, endSlice)
                        console.log("THIS ONE SHOULD BE EXECUTED");
                    }

                    for(let animal of animalsOnPage) {
                        // Translate to Json (so we can edit it)
                        let animalItem = animal.toJSON();

                        // Make a new thingy called _links in animalItem
                        animalItem._links = {
                            "self" : { "href" : `http://${req.headers.host}/api/animals/${animalItem._id}` },
                            "collection" : { "href" : `http://${req.headers.host}/api/animals` }
                        },

                        // Add animalItem to the collection 
                        animalsCollection.items.push(animalItem)
                    }

                    // Return the collection as Json
                    res.json(animalsCollection);
                }
            })
        })

        // POST request
        .post(function(req, res) {
            console.log("POST on api/animals");
            
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

            // Give Accept header to response
            res.header("Accept", "application/json, application/x-www-form-urlencoded");

            // Check if the request is json
            if (!req.is('application/json', 'application/x-www-form-urlencoded')) {
                res.status(406).send("406 - Not Acceptable");
            }
            else
            {
                let animal
                if (req.is('application/json')) {
                    console.log(req.body.item);
                    animal = new Animal(req.body.item);
                } else {
                    console.log(req.body);
                    animal = new Animal(req.body);
                }                

                animal.save(function (err) {
                    if (err) { 
                        res.status(400).send(err) 
                    }
                    else 
                    { 
                        res.status(201).json(animal) 
                    }
                });
            }
        })

        // OPTIONS request
        .options(function (req, res){
            console.log("OPTIONS on api/animals");  
            
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

            res.header("Allow", "GET,POST,OPTIONS");
            res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
            res.send();
        });

    // Routes for animals detail resource (/api/animals/:animalId)
    animalRouter.route('/animals/:animalId')
        // GET request
        .get(function(req, res) {
            console.log(`GET on api/animals/${req.params.animalId}`);   

            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

            // Find all the animals with the given id
            Animal.findById(req.params.animalId, function (err, animal) {
                if (err) {
                    res.status(400).send(err);
                }
                else 
                {
                    let animalDetails = {
                        "item" : animal,
                        "_links" : {
                            "self" : { "href" : `http://${req.headers.host}/api/animals/${animal._id}` },
                            "collection" : { "href" : `http://${req.headers.host}/api/animals` }
                        }
                    };

                    res.json(animalDetails);
                }
            }).orFail()
        })

        // PUT request
        .put(function(req, res) {
            console.log(`PUT on api/animals/${req.params.animalId}`);

            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            res.header("Accept", "application/json, application/x-www-form-urlencoded");
            
            // Find the animal with the given id
            Animal.findByIdAndUpdate(req.params.animalId, req.body.item, function (err, animal) {
                console.log("animal = " + animal);
                console.log(req.body.item);
                
                // Check if all the fields are filled
                if (!req.body.item.name & !req.body.item.age & !req.body.item.animal & !req.body.item.diet) {
                    console.log("A field is empty");
                    res.status(422).end();
                }
                else 
                {
                    animal.save(function (err) {
                        if (err) { 
                            res.status(400).send(err) 
                        }
                        else 
                        { 
                            res.status(200).json(animal) 
                        }
                    });
                }
            }).orFail();
        })

        // DELETE request
        .delete(function(req, res) {
            console.log(`DELETE on api/animals/${req.params.animalId}`);

            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

            Animal.findByIdAndDelete(req.params.animalId, function (err, animal) {
                if (err) {
                    res.status(400).send(err);
                }
                else
                {
                    res.status(204).json(animal);
                }
            }).orFail()
        })

        // OPTIONS request
        .options(function(req, res) {
            console.log(`OPTIONS on api/animals/${req.params.animalId}`);

            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            
            res.header("Allow", "GET,PUT,DELETE,OPTIONS");
            res.header("Access-Control-Allow-Methods", "GET,PUT,DELETE,OPTIONS");
            res.send();
        });


    return animalRouter;
};

module.exports = routes;