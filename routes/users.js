const express = require("express");
const { MongoClient } = require("mongodb");
const fs = require("fs");
const router = express.Router();
const config = require("../config");
const { response } = require("express");
const { Z_ASCII } = require("zlib");

const dbURI = `mongodb+srv://Canstopme0:${config.uriKey}@fesibrut-api.dkfxl.mongodb.net/users?retryWrites=true&w=majority`;
const mongoClient = new MongoClient(dbURI);







let feisbrutDB, usersCollection;

router.post("/login", async (req, res) => {
  let newReq = req.body;
  let data = [];
  const cursor = usersCollection.find({});
  await cursor.forEach((user) => data.push(user));
  let result = data.filter(
    (user) =>
      user.email === newReq.email &&
      user.password === newReq.password &&
      user.confirmed
  );
  if (result.length > 0) {
  let newUser = await usersCollection.findOne({ email: newReq.email });


  function randomString(length, chars) {
    let mask = '';
    if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
    if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (chars.indexOf('#') > -1) mask += '0123456789';  
    let result = '';
    for (let i = length; i > 0; --i) result += mask[Math.floor(Math.random() * mask.length)];
    return result;
  }
  
  /* console.log(randomString(16, 'aA'));
  console.log(randomString(32, '#aA')); */


  let token= randomString(32, '#aA')
  let timeNow =  Date.now()
  const update = { $set: {login_time:timeNow,user_token:token,checkSession:true,logged:true }};
  const filter = { email: newReq.email };
  const ris = await usersCollection.updateOne(filter, update);

  let finalUser = await usersCollection.findOne({ email: newReq.email });
  



  let notifyId = newUser.notify.map((not) => not.who);
  let friendsNot = [];
  notifyId.forEach((element) =>
    data.map((friend) => {
      if (friend.id === element) {
        let newFriend = {
          name: friend.name,
          surname: friend.surname,
          photo: friend.photo,
          id: friend.id,
        };
        friendsNot.push(newFriend);
      }
    })
  );
  const ids = friendsNot.map((o) => o.id);
  const filtered = friendsNot.filter(
    ({ id }, index) => !ids.includes(id, index + 1)
  );

  let finalResult =  result.map((user ) => {


    let myFriends = [];
    let iteration = [...user.friends].map((friendsId) =>
      [...data].filter((friend) => friend.id === friendsId)
    );
    iteration.map( (user) => {
      user.map((friend) => myFriends.push(friend));
    });
    let myFinalFriends = myFriends.map((friend) => {
      return (friend = {
        name: friend.name,
        surname: friend.surname,
        photo: friend.photo,
        id: friend.id,
      });
    });
    let myFriendsReq = [];
    let iteration2 = [...user.friendreq].map((friendsId) =>
      [...data].filter((friend) => friend.id === friendsId)
    );
    iteration2.map((user) => {
      user.map((friend) => myFriendsReq.push(friend));
    });
    let myFinalFriendsReq = myFriendsReq.map((friend) => {
      return (friend = {
        name: friend.name,
        surname: friend.surname,
        photo: friend.photo,
        id: friend.id,
      });
    });
    let myFriendsRec = [];
    let iteration3 = [...user.friendrec].map((friendsId) =>
      [...data].filter((friend) => friend.id === friendsId)
    );
    iteration3.map((user) => {
      user.map((friend) => myFriendsRec.push(friend));
    });
    let myFinalFriendsRec = myFriendsRec.map((friend) => {
      return (friend = {
        name: friend.name,
        surname: friend.surname,
        photo: friend.photo,
        id: friend.id,
      });
    });
    let myNotify = [];
    let iteration4 = [...user.notify].map((not) => myNotify.push(not));
    let finalNotify = myNotify.map((not) => {
      return (newNot = {
        ...not,
        user: filtered.filter((friend) => friend.id === not.who),
      });
    });

    ////////// QUELLO CHE HO AGGIUNTO O MODIFICATO IO ////////////////////
    let newMessages = {};
    Object.keys(user.messages).forEach((single) => {
      const friendFinder = data.filter((friend) => friend.id === single);
      newMessages = {
        ...newMessages,
        [single]: {
          discussion: user.messages[single],
          user: {
            name: friendFinder[0].name,
            surname: friendFinder[0].surname,
            photo: friendFinder[0].photo,
            id: friendFinder[0].id,
          },
        },
      };
    });

    return  (user = {
      id: user.id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      photo: user.photo,
      friends: [...myFinalFriends],
      bio: user.bio,
      friendreq: [...myFinalFriendsReq],
      friendrec: [...myFinalFriendsRec],
      messages: newMessages,
      confirmed: user.confirmed,
      notify: [...finalNotify],
      login_time:  finalUser.login_time,
      user_token: finalUser.user_token,
      logged:finalUser.logged,
      checkSession:finalUser.checkSession
    });
  });

  
    res.send(finalResult);
  } else {
    res.send([{ response: "Utente non trovato" }]);
  }
});


router.post('/checksession',async (req,res) =>{

  function randomString(length, chars) {
    let mask = '';
    if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
    if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (chars.indexOf('#') > -1) mask += '0123456789';  
    let result = '';
    for (let i = length; i > 0; --i) result += mask[Math.floor(Math.random() * mask.length)];
    return result;
  }
  
  /* console.log(randomString(16, 'aA'));
  console.log(randomString(32, '#aA')); */


  newReq = req.body;
  let user = await usersCollection.findOne({ id: newReq.userId });
  let now = (Date.now() / 60000) ;
  let lastLogin = ( newReq.login_time /60000)
   if(newReq.logged && now-lastLogin < 20 && newReq.user_token === user.user_token )   {
    let token= randomString(32, '#aA')
    let timeNow =  Date.now()
    const update = { $set: {login_time:timeNow,user_token:token,logged:true }};
    const filter = { id: newReq.userId };
    const ris = await usersCollection.updateOne(filter, update);
     
    res.send([{resp:"Utente Confermato",verified:true}])
  } else if(newReq.user_token === user.user_token && !user.checkSession){

    let token= randomString(32, '#aA')
    let timeNow =  Date.now()
    const update = { $set: {login_time:timeNow,user_token:token,logged:true }};
    const filter = { id: newReq.userId };
    const ris = await usersCollection.updateOne(filter, update);

  } else{
    res.send([{resp:"Utente Non Confermato",verified:false}])
  }
   
   
                                                                                                                                                                                                                                                                                                                                                                                                           
})

router.get("/users", async (req, res) => {
  let data = [];
  const cursor = usersCollection.find({});
  await cursor.forEach((user) => {
    user = {
      id: user.id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      photo: user.photo,
      friends: user.friends,
      bio: user.bio,
      confirmed: user.confirmed,
    };
    data.push(user);
  });
  res.send(data);
});
router.get("/users/:id", async (req, res) => {
  let data = [];
  const cursor = usersCollection.find({});
  await cursor.forEach((user) => {
    data.push(user);
  });

  const userId = req.params["id"];
  let user = await usersCollection.findOne({ id: userId });

  let myFriends = [];
  let iteration = [...user.friends].map((friendsId) =>
    [...data].filter((friend) => friend.id === friendsId)
  );
  iteration.map((user) => {
    user.map((friend) => myFriends.push(friend));
  });
  let myFinalFriends = myFriends.map((friend) => {
    return (friend = {
      name: friend.name,
      surname: friend.surname,
      photo: friend.photo,
      id: friend.id,
    });
  });

  user = {
    id: user.id,
    name: user.name,
    surname: user.surname,
    email: user.email,
    photo: user.photo,
    friends: [...myFinalFriends],
    bio: user.bio,
    confirmed: user.confirmed,
  };
  res.send(user);
});
router.post("/users", async (req, res) => {
  const newUserId = Date.now().toString();
  newReq = req.body;
  let newObject = { id: newUserId, ...newReq };
  const ris = await usersCollection.insertOne(newObject);

  if (ris.acknowledged) {
    res.status(200).send(newUserId);
  }
});

router.patch("/users/:id", async (req, res) => {
  const userId = req.params["id"];
  const update = { $set: req.body };
  const filter = { id: userId };
  const ris = await usersCollection.updateOne(filter, update);
  res.send([{ response_: `user id:${userId} updated` }]);
});
router.delete("/users/:id", async (req, res) => {
  const userId = req.params["id"];
  const ris = await usersCollection.deleteOne({ id: userId });
  res.status(200).send([{ response_: `user id:${userId} removed` }]);
});

router.post("/sendfriendrequest", async (req, res) => {
  let newReq = req.body;

  const myId = newReq.myId;
  const friendId = newReq.friendId;
  let me = await usersCollection.findOne({ id: myId });
  let friend = await usersCollection.findOne({ id: friendId });
  const updateMe = { $set: { friendreq: [...me.friendreq, friendId] } };
  const updateFriend = {
    $set: {
      friendrec: [...friend.friendrec, myId],
      notify: [
        ...friend.notify,
        {
          type: "friendrec",
          who: `${myId}`,
          date: new Date().toISOString(),
          read: false,
        },
      ],
    },
  };

  if (me.friendreq.includes(friendId) || me.friendrec.includes(friendId)) {
    res.send([{ response_: "Richiesta Già Inviata!" }]);
  } else if (me.friends.includes(friendId)) {
    res.send([{ response_: "Gli Utenti sono Già Amici!" }]);
  } else {
    const filterMe = { id: myId };
    const risMe = await usersCollection.updateOne(filterMe, updateMe);
    const filterFriend = { id: friendId };
    const risFriend = await usersCollection.updateOne(
      filterFriend,
      updateFriend
    );
    res.send([{ response_: "richiesta di amicizia inviata" }]);
  }
});
router.post("/confirmfriendrequest", async (req, res) => {
  let newReq = req.body;

  const myId = newReq.myId;
  const friendId = newReq.friendId;
  let me = await usersCollection.findOne({ id: myId });
  let friend = await usersCollection.findOne({ id: friendId });
  const updateMe = {
    $set: { friendrec: [...me.friendrec.filter((rec) => rec !== friendId)] },
  };
  const updateFriend = {
    $set: { friendreq: [...friend.friendreq.filter((requ) => requ !== myId)] },
  };
  const addFriendToMe = { $set: { friends: [...me.friends, friendId] } };
  const addMeToFriend = {
    $set: {
      friends: [...friend.friends, myId],
      notify: [
        ...friend.notify,
        {
          type: "friendConfirmed",
          who: `${myId}`,
          date: new Date().toISOString(),
          read: false,
        },
      ],
    },
  };

  async function clearReqRec() {
    const filterMe = { id: myId };
    const risMe = await usersCollection.updateOne(filterMe, updateMe);
    const filterFriend = { id: friendId };
    const risFriend = await usersCollection.updateOne(
      filterFriend,
      updateFriend
    );
  }

  switch (newReq.confirmed) {
    case true:
      clearReqRec();
      const risMe = await usersCollection.updateOne(
        { id: myId },
        addFriendToMe
      );
      const risFriend = await usersCollection.updateOne(
        { id: friendId },
        addMeToFriend
      );

      res.send([{ response: "accettato" }]);
      break;
    case false:
      clearReqRec();

      res.send([{ response: "rifiutato" }]);
      break;
  }
});
router.post("/getfriends", async (req, res) => {
  newReq = req.body;
  let data = [];
  const cursor = usersCollection.find({});
  await cursor.forEach((user) => {
    user = {
      id: user.id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      photo: user.photo,
      friends: user.friends,
      bio: user.bio,
      cover: user.cover,
    };
    data.push(user);
  });
  const result = data.filter((item) => [...newReq].includes(item.id));

  res.send(result);
});

router.post("/notificationmanager", async (req, res) => {
  newReq = req.body;

  if (newReq.type === "delete") {
    newReq.notification_id.map((not) =>
      usersCollection.updateOne(
        { id: newReq.userId },
        { $pull: { notify: { notify_id: not } } }
      )
    );
    const response = [{ response: "notifiche cancellate con successo" }];
    res.send(response);
  } else if (newReq.type === "patch") {
    const user = await usersCollection.findOne({ id: newReq.userId });
    let notifications = [];
    const iteration = newReq.notification_id.map((not) =>
      user.notify.filter((noti) => {
        noti.notify_id === not && notifications.push(noti) ;
      })
    );
    let final = [];
     notifications.forEach((notification) => {
      newNotification = {
        ...notification,
        read: true,
      };
      final.push(newNotification);
    });
    
    newReq.notification_id.map(async (not) =>
      await usersCollection.updateOne(
        { id: newReq.userId },
        { $pull: { notify: { notify_id: not } } }
      )
    );
    final.map(async (not) =>
      await usersCollection.updateOne(
        { id: newReq.userId },
        { $push: { notify: not } }
      )
    );

    console.log(final);
    const response = [{ response: "notifiche aggiornate con successo" }];
    res.send(response);
  }
});
router.post("/searchbar", async (req, res) => {
  newReq = req.body;
  let data = [];
  let query = newReq.text.replace(/\s/g, "");
  const cursor = usersCollection.find({});
  await cursor.forEach((user) => {
    user = {
      id: user.id,
      queryName: user.name + user.surname,
      name: user.name,
      surname: user.surname,
      photo: user.photo,
      friends: user.friends,
      bio: user.bio,
      cover: user.cover,
    };
    data.push(user);
  });

  const filtered = data.filter((user) => user.id !== newReq.author_id);
  const finalUser = [];
  filtered.filter(
    (user) =>
      user.queryName.toLocaleLowerCase().search(query.toLocaleLowerCase()) >
        -1 && finalUser.push(user)
  );

  console.log(finalUser);
  if (finalUser.length > 0) {
    res.send(finalUser);
  } else {
    res.send([{ response: "nessun utente trovato" }]);
  }
});

async function run() {
  await mongoClient.connect();
  console.log("siamo connessi con atlas Users!");

  feisbrutDB = mongoClient.db("feisbrut");
  usersCollection = feisbrutDB.collection("users");
}

run().catch((err) => console.log("Errore" + err));

module.exports = router;
