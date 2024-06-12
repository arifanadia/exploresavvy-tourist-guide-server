const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cors = require('cors');
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://exploresavvy-tourist-guide.web.app",
        "https://exploresavvy-tourist-guide.firebaseapp.com",
    ],
}));
app.use(express.json());

//  custom middleware
const verifyToken = (req, res, next) => {
    console.log('inside verify token:', req.headers);
    if (!req.headers.authorization) {
        return res.status(401).send({ message: "not authorized" });
    }
    const token = req.headers.authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: "not authorized" });
        }
        console.log('value in the token', decoded);
        req.user = decoded;
        next();
    });
};



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.taokb31.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const packagesCollection = client.db('exploreSavvyDb').collection('packages');
        const tourGuideCollection = client.db('exploreSavvyDb').collection('tourGuides');
        const bookingCollection = client.db('exploreSavvyDb').collection('bookings');
        const touristStoriesCollection = client.db('exploreSavvyDb').collection('touristStories');
        const wishListCollection = client.db('exploreSavvyDb').collection('wishlist');
        const blogsCollection = client.db('exploreSavvyDb').collection('blogs');
        const usersCollection = client.db('exploreSavvyDb').collection('users'); // Declare usersCollection here

        app.post("/jwt", async (req, res) => {
            const user = req.body;
            console.log("user for token", user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
            res.send({ token });
        });

        // User API
        app.put('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user?.email };

            try {
                const isExists = await usersCollection.findOne(query);

                if (isExists) {
                    if (user.status === 'Requested') {
                        const result = await usersCollection.updateOne(query, {
                            $set: { status: user?.status }
                        });
                        return res.send(result);
                    }
                } else {
                    const options = { upsert: true };
                    const updateDoc = {
                        $set: {
                            ...user,
                            timeStamp: Date.now()
                        }
                    };
                    const result = await usersCollection.updateOne(query, updateDoc, options);
                    return res.send(result);
                }
            } catch (error) {
                console.error('Error updating user:', error);
                return res.status(500).send({ message: 'Internal server error' });
            }

            return res.status(400).send({ message: 'User not found or invalid status' });
        });

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const result = await usersCollection.findOne(query);
            res.send(result);
        });

        app.get('/users/role/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);

            if (!user) {
                return res.status(404).send({ message: 'User not found' });
            }


            if (user.role === 'admin') {
                role = 'admin';
            } else if (user.role === 'tourist') {
                role = 'tourist';
            } else if (user.role === 'tour guide') {
                role = 'tour guide';
            }

            res.send({ role });
        });

        app.patch('/users/role/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const { status, role } = req.body; // Extract role from request body

                if (!role || (role !== 'admin' && role !== 'tour guide')) {
                    return res.status(400).send({ message: 'Invalid role' });
                }
                if (!status || (status !== 'Approved' && status !== 'Verified' && status !== 'Requested')) {
                    return res.status(400).send({ message: 'Invalid status' });
                }

                const filter = { _id: new ObjectId(id) };
                const updateDoc = { $set: { role, status } }; // Define updateDoc before the if statement

                const result = await usersCollection.updateOne(filter, updateDoc);
                res.send(result);
            } catch (error) {
                console.error('Error updating user role:', error);
                res.status(500).send({ message: 'Internal server error' });
            }
        });

        const verifyAdmin = async (req, res, next) => {
            const user = req.user;
            const query = { email: user?.email };
            const result = await usersCollection.findOne(query);
            if (!result || result?.role !== "admin") {
                return res.status(401).send({ message: "not authorized" });
            }
            next();
        };

        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        });

        // app.put('/users/update/:email', async (req, res) => {
        //     const email = req.params.email;
        //     const user = req.body;
        //     const query = { email };
        //     const updateDoc = {
        //         $set: {
        //             ...user,
        //             timeStamp: Date.now()
        //         }
        //     };
        //     const result = await usersCollection.updateOne(query, updateDoc);
        //     return res.send(result);
        // });

        // Packages API
        app.get('/packages', async (req, res) => {
            const result = await packagesCollection.find().toArray();
            res.send(result);
        });

        app.post('/packages', async (req, res) => {
            const package = req.body;
            const result = await packagesCollection.insertOne(package);
            res.send(result);
        });

        app.get('/packages-details/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await packagesCollection.findOne(query);
            res.send(result);
        });

        // Tour Guide API
        app.get('/tourGuides', async (req, res) => {
            const result = await tourGuideCollection.find().toArray();
            res.send(result);
        });

        app.get('/tour-guide-details/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: new ObjectId(id) };
            const result = await tourGuideCollection.findOne(query);
            res.send(result);
        });

        // Tourist Booking Data API
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        });
        app.get('/bookings', async (req, res) => {
            const result = await bookingCollection.find().toArray();
            res.send(result);
        });
        app.get("/my-bookings/:email", async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const result = await bookingCollection.find(query).toArray();
            res.send(result)
        });
        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bookingCollection.deleteOne(query);
            res.send(result)
        });
        app.patch('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const {status} = req.body
            const query = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                   status
                }
            };
            const result = await bookingCollection.updateOne(query, updateDoc);
            res.send(result)

        });


        // wishList api
        app.post('/wishlist', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const result = await wishListCollection.insertOne(booking);
            res.send(result);
        });

        app.get("/my-wishlist/:email", async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const result = await wishListCollection.find(query).toArray();
            res.send(result)
        });
        app.delete('/wishlist/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await wishListCollection.deleteOne(query);
            res.send(result)
        });

        // touristStories api

        app.get('/tourist-stories', async (req, res) => {
            const result = await touristStoriesCollection.find().toArray();
            res.send(result);
        });
        app.get('/tourist-stories-details/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await touristStoriesCollection.findOne(query);
            res.send(result)
        });
        // blogs api

        app.get('/blogs', async (req, res) => {
            const result = await blogsCollection.find().toArray();
            res.send(result);
        });
        app.get('/blog-details/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await blogsCollection.findOne(query);
            res.send(result)
        });



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('exploreSavvy are now exploring');
});

app.listen(port, (req, res) => {
    console.log(`exploreSavvy are exploring on port : ${port}`);
});
