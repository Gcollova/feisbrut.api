const express = require("express");
const { MongoClient } = require("mongodb");
const fs = require("fs");
const router = express.Router();
const config = require("../config");

const dbURI = `mongodb+srv://Canstopme0:${config.uriKey}@fesibrut-api.dkfxl.mongodb.net/posts?retryWrites=true&w=majority`;
const mongoClient = new MongoClient(dbURI);
const dbURI2 = `mongodb+srv://Canstopme0:${config.uriKey}@fesibrut-api.dkfxl.mongodb.net/users?retryWrites=true&w=majority`;
const mongoClient2 = new MongoClient(dbURI2);

let feisbrutDB, postsCollection;
let feisbrutDB2, usersCollection;






 /* -----------------------------------------------------GLOBAL POST GET---------------------------------------------------------------------- */
router.get("/posts", async (req, res) => {
  let data = [];
  const cursor = postsCollection.find({});
  await cursor.forEach((post) => {
    post = {
      id:post.id,
      authorId:post.authorId,
      text:post.text,
      date:post.date,
      likes:post.likes,
      comments:post.comments,
      url:post.url
    }
    data.push(post);
  });
  res.send(data);
});

  /* -----------------------------------------------------/GLOBAL POST GET---------------------------------------------------------------------- */


  /* -----------------------------------------------------POSTS POST---------------------------------------------------------------------- */
router.post("/posts", async (req, res) => {
  const newPostId = Date.now().toString();
  newReq = req.body;
  let newObject = { id: newPostId, ...newReq };
  const ris = await postsCollection.insertOne(newObject);

  if (ris.acknowledged) {
    res.status(200).send(newPostId);
  }
});
  /* -----------------------------------------------------/POSTS POST---------------------------------------------------------------------- */


  /* -----------------------------------------------------GET SINGLE POST---------------------------------------------------------------------- */
 router.get("/posts/:id", async (req, res) => {
   let newReq = req.body
 const postId = req.params["id"];
 let post = await postsCollection.findOne({ id: postId });
  
 let users = [];
 const cursorUsers = usersCollection.find();
  await cursorUsers.forEach((user) => {
    users.push(user);
  });
  const utenti = users.filter((user) => user.id === post.authorId);
 let finalPost ={
   ...post,
   _id:"*****",
   db_id:"*****",
   authorName : utenti[0].name,
   authorSurname : utenti[0].surname,
   authorAlias : utenti[0].bio.alias,
   authorPhoto : utenti[0].photo,
   comments: post.comments.map((comment) => {
    const newUser = users.filter((user) => comment.authorId === user.id);
    comment = {
      ...comment,
      authorName: newUser[0].name,
      authorSurname: newUser[0].surname,
      authorPhoto: newUser[0].photo,
      authorAlias : newUser[0].bio.alias,
    };
    return comment;
  }),
  likes: post.likes.map((like) => {
    const newUser = users.filter((user) => like === user.id);
    newLike = {
      authorId: like,
      authorName: newUser[0].name,
      authorSurname: newUser[0].surname,
      authorPhoto: newUser[0].photo,
      authorAlias : newUser[0].bio.alias,
    };
    return newLike;
  }),
 }
 
 res.send(finalPost);

 });
  /* -----------------------------------------------------/GET SINGLE POST---------------------------------------------------------------------- */


  /* -----------------------------------------------------SINGLE POST PATCH---------------------------------------------------------------------- */
router.patch("/posts/:id", async (req, res) => {
  let newReq = req.body
  const postId = req.params["id"];
  let post = await postsCollection.findOne({ id: postId });
  if(post.db_id === newReq.db_id){

  const update = { $set: req.body };
  const filter = { id: postId };
  const ris = await postsCollection.updateOne(filter, update);

  res.send([{response:`post aggiornato con successo`}]);
  } else {res.send({response:"non sei autorizzato"})}
});
  /* -----------------------------------------------------/SINGLE POST PATCH---------------------------------------------------------------------- */



  /* -----------------------------------------------------SINGLE POST DELETE---------------------------------------------------------------------- */
router.delete("/posts/:id", async (req, res) => {
  let newReq = req.body
  const postId = req.params["id"];
  let post = await postsCollection.findOne({ id: postId });
  if(post.db_id === newReq.db_id){
  const ris = await postsCollection.deleteOne({ id: postId });
  res.status(200).send([{response:`post eliminato con successo`}]);
  } else {res.send({response:"non sei autorizzato"})}
});
  /* -----------------------------------------------------/SINGLE POST DELETE---------------------------------------------------------------------- */


  /* -----------------------------------------------------GET MY POST---------------------------------------------------------------------- */
router.post("/getmypost", async (req, res) => {
  newReq = req.body;

  let data = [];
  let users = [];
  let finalResult = [];

  const cursor = postsCollection.find();
  await cursor.forEach((post) => {
    data.push(post);
  });
  let result = data
    .filter((item) => [...newReq].includes(item.authorId))
    .reverse();

    const cursorUsers = usersCollection.find();
    await cursorUsers.forEach((user) => {
      users.push(user);
    });
    result.map((post) => {
      const utenti = users.filter((user) => user.id === post.authorId);
      
      post = {
        ...post,
        authorName: utenti[0].name,
        authorSurname: utenti[0].surname,
        /* authorAlias: utenti[0].bio.alias, */
        authorPhoto: utenti[0].photo,
        comments: post.comments.map((comment) => {
          const newUser = users.filter((user) => comment.authorId === user.id);
          comment = {
            ...comment,
            authorName: newUser[0].name,
            authorSurname: newUser[0].surname,
            authorPhoto: newUser[0].photo,
            /* authorAlias:newUser[0].bio.alias */
            
          };
          return comment;
        }),
        likes: post.likes.map((like) => {
          const newUser = users.filter((user) => like === user.id);
          newLike = {
            authorId: like,
            authorName: newUser[0].name,
            authorSurname: newUser[0].surname,
            authorPhoto: newUser[0].photo,
            /* authorAlias:newUser[0].bio.alias */
          };
          return newLike;
        }),
      };
      finalResult.push(post);
    });
    console.log(finalResult) 
    
  res.send(finalResult);
});
  /* -----------------------------------------------------/GET MY POST---------------------------------------------------------------------- */



  /* -----------------------------------------------------POSTS LIKE---------------------------------------------------------------------- */
router.post("/like", async (req, res) => {  
  action = req.body;

  if (action.type === "like") {
    const postId = action.postId;
    let post = await postsCollection.findOne({ id: postId });
    let user = await usersCollection.findOne({ id: post.authorId });

    const updatePost = { $set: { likes: [...post.likes, action.userId] } };
    const filterPost = { id: postId };
    const filterUser = { id: user.id };
    const updateUser = {
      $set: {
        notify: [
          ...user.notify,
          {
            type: "like",
            who: `${action.userId}`,
            date: new Date().toISOString(),
            read: false,
            postID:postId,
            notify_id:Date.now().toString()
          },
        ],
      },
    };
    const ris = await postsCollection.updateOne(filterPost, updatePost);
    if(action.userId !== user.id ){

      const ris2 = usersCollection.updateOne(filterUser, updateUser);
  
      res.send([{response:`post id:${postId} updated and notification send`}]);
    } else {res.send([{response:`post id:${postId} updated and notification unsend`}]);}
  } else if (action.type === "dislike") {
    const postId = action.postId;
    let post = await postsCollection.findOne({ id: postId });
    let user = await usersCollection.findOne({ id: post.authorId });
    const dislike = post.likes.filter((like) => like !== action.userId);
    const update = { $set: { likes: [...dislike] } };
    const filter = { id: postId };
    const filterUser = { id: user.id };
    const updateUser = {
      $set: { notify: user.notify.filter((not) => not.who !== action.userId) },
    };
    const ris = await postsCollection.updateOne(filter, update);
    /* usersCollection.updateOne(filterUser, updateUser);  */

    res.send([{response:`post id:${postId} updated`}]);
  }
});



  /* -----------------------------------------------------/POSTS LIKE---------------------------------------------------------------------- */



  /* -----------------------------------------------------POSTS COMMENTS---------------------------------------------------------------------- */
router.post("/comments", async (req, res) => {
  action = req.body;
  postId = action.postId;
  let post = await postsCollection.findOne({ id: postId });
  let user = await usersCollection.findOne({ id: post.authorId });
  const filter = { id: postId };
  const update = {
    $set: {
      comments: [
        ...post.comments,
        {
          authorId: action.authorId,
          text: action.text,
          date: action.date
        },
      ],
    },
  };
  const filterUser = { id: user.id };
  const updateUser = {
    $set: {
      notify: [
        ...user.notify,
        {
          type: "comment",
          who: `${action.authorId}`,
          date: new Date().toISOString(),
          read: false,
          postID:postId,
          notify_id:Date.now().toString()
        },
      ],
    },
  };

  const ris = await postsCollection.updateOne(filter, update);
  if(action.authorId !== user.id  ){

    const ris2 = usersCollection.updateOne(filterUser, updateUser);

    res.send([{response:`post id:${postId} updated and notification send`}]);
  } else {res.send([{response:`post id:${postId} updated and notification unsend `}]);}
});

/* -----------------------------------------------------/POSTS COMMENTS---------------------------------------------------------------------- */





/* -----------------------------------------------------CONNECTIONS---------------------------------------------------------------------- */

async function run1() {
  await mongoClient.connect();
  console.log("siamo connessi con atlas Post!");

  feisbrutDB = mongoClient.db("feisbrut");
  postsCollection = feisbrutDB.collection("posts");
}
async function run2() {
  await mongoClient2.connect();
  console.log("siamo connessi con atlas users!");

  feisbrutDB2 = mongoClient2.db("feisbrut");
  usersCollection = feisbrutDB2.collection("users");
}

run1().catch((err) => console.log("Errore" + err));
run2().catch((err) => console.log("Errore" + err));

module.exports = router;
