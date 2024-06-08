const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const cors = require('cors');
const port = process.env.PORT || 5000

// middleware
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://exploresavvy-tourist-guide.web.app",
        "https://exploresavvy-tourist-guide.firebaseapp.com",
    ],
  
}));
app.use(express.json());





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
        // await client.connect();

        const packagesCollection = client.db('exploreSavvyDb').collection('packages');
        const tourGuideCollection = client.db('exploreSavvyDb').collection('tourGuides');
        const bookingCollection = client.db('exploreSavvyDb').collection('bookings');
        const touristStoriesCollection = client.db('exploreSavvyDb').collection('touristStories');
        const usersCollection = client.db('exploreSavvyDb').collection('users');





        // user api
        app.put('/users', async (req, res) => {
            const user = req.body
            const query = { email: user?.email }
            const isExists = await usersCollection.findOne(query)
            if (isExists) {
                if (user.status === 'Requested') {
                    const result = await usersCollection.updateOne(query, {
                        $set: { status: user?.status }
                    })
                    return res.send(result)
                }
            } else {
                return res.send(isExists)
            }
            const options = { upsert: true }

            const updateDoc = {
                $set: {
                    ...user,
                    timeStamp: Date.now()
                },

            }
            const result = await usersCollection.updateOne(query, updateDoc, options)
            res.send(result)
        });



        app.get('/users', async(req,res) =>{
            const email = req.params.email
            const result = await usersCollection.findOne({email})
            res.send(result)
        })




        // packages api

        app.get('/packages', async (req, res) => {
            const result = await packagesCollection.find().toArray()
            res.send(result)
        })

        app.get('/packages-details/:id', async (req, res) => {
            const id = req.params.id
            console.log(id);
            const query = { _id: new ObjectId(id) }
            const result = await packagesCollection.findOne(query);
            res.send(result)
        })

        // tourGuide api

        app.get('/tourGuides', async (req, res) => {
            const result = await tourGuideCollection.find().toArray()
            res.send(result)
        })
        app.get('/tour-guide-details/:id', async (req, res) => {
            const id = req.params.id
            console.log(id);
            const query = { _id: new ObjectId(id) }
            const result = await tourGuideCollection.findOne(query)
            res.send(result)
        })







        // tourist booking data api
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const result = await bookingCollection.insertOne(booking);
            res.send(result)
        })


        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('exploreSavvy are now exploring')
})
app.listen(port, (req, res) => {
    console.log(`exploreSavvy are exploring on port : ${port}`);
})